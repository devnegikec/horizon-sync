import * as React from 'react';

import axios, { AxiosError } from 'axios';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ExternalLink,
  Globe2,
  LockKeyhole,
  Mail,
  MapPin,
  PackageCheck,
  Phone,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';

import { environment } from '../../environments/environment';
import './PublicQRValidation.css';

const API_BASE_URL = environment.apiCoreUrl;

type VerificationStatus = 'authentic' | 'verification_required' | 'not_activated' | 'already_used' | 'invalid';

type QRType = 'dynamic' | 'dual' | 'one_time' | 'secure_code';
type QRChannel = 'overt' | 'covert';

interface VerificationResult {
  verification_status: VerificationStatus;
  authentic: boolean;
  message: string;
  requires_action: boolean;
  challenge_type: 'scan_covert' | 'secure_code' | null;
  product_name: string | null;
  generic_name: string | null;
  brand_name: string | null;
  sku_name: string | null;
  sku_code: string | null;
  variant_attributes: Record<string, string>;
  gtin: string | null;
  serial_number: string | null;
  qr_type: QRType | null;
  qr_channel: QRChannel | null;
  activation_method: string | null;
  industry: string | null;
  warranty_period_months: number | null;
  logo_url: string | null;
  product_image_url: string | null;
  banner_image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  scan_event_id?: string | null;
}

interface VerificationRequest {
  gtin: string;
  serial_number: string;
  timestamp: string;
  signature: string;
  qr_channel?: QRChannel;
  secure_code?: string;
}

function createScanEventId(): string {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

const STATUS_PRESENTATION: Record<VerificationStatus, { tone: string; eyebrow: string; title: string; icon: React.ReactNode }> = {
  authentic: {
    tone: 'success',
    eyebrow: 'Cryptographically verified',
    title: 'Authentic Product',
    icon: <CheckCircle2 aria-hidden="true" />,
  },
  verification_required: {
    tone: 'action',
    eyebrow: 'One more step',
    title: 'Complete Verification',
    icon: <ShieldCheck aria-hidden="true" />,
  },
  not_activated: {
    tone: 'warning',
    eyebrow: 'Genuine code detected',
    title: 'Product Not Activated',
    icon: <AlertTriangle aria-hidden="true" />,
  },
  already_used: {
    tone: 'warning',
    eyebrow: 'One-Time QR status',
    title: 'Code Already Used',
    icon: <AlertTriangle aria-hidden="true" />,
  },
  invalid: {
    tone: 'danger',
    eyebrow: 'Verification unsuccessful',
    title: 'Authentication Failed',
    icon: <XCircle aria-hidden="true" />,
  },
};

function safeWebUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

function errorMessage(error: unknown): string {
  const fallback = 'We could not reach the verification service. Please try again.';
  if (!axios.isAxiosError(error)) return fallback;
  const responseData = (error as AxiosError<{ detail?: unknown; message?: unknown }>).response?.data;
  if (!responseData) return fallback;
  if (typeof responseData.detail === 'string') return responseData.detail;
  if (typeof responseData.message === 'string') return responseData.message;
  if (Array.isArray(responseData.detail)) {
    const first = responseData.detail[0] as { msg?: unknown } | undefined;
    if (typeof first?.msg === 'string') return first.msg;
  }
  return fallback;
}

function formatQrType(value: QRType | null): string {
  const labels: Record<QRType, string> = {
    dynamic: 'Dynamic QR',
    dual: 'Dual-layer QR',
    one_time: 'One-Time QR',
    secure_code: 'Secure Code',
  };
  return value ? labels[value] : 'Secure QR';
}

function LoadingView() {
  return (
    <main className="qrv-page qrv-page--centered" aria-live="polite">
      <section className="qrv-loading-card">
        <div className="qrv-spinner" aria-hidden="true" />
        <ShieldCheck className="qrv-loading-shield" aria-hidden="true" />
        <h1>Verifying your product</h1>
        <p>Checking the encrypted product signature…</p>
      </section>
    </main>
  );
}

function NetworkErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <main className="qrv-page qrv-page--centered">
      <section className="qrv-loading-card qrv-loading-card--error" role="alert">
        <XCircle aria-hidden="true" />
        <h1>Unable to verify</h1>
        <p>{message}</p>
        <button className="qrv-button qrv-button--primary" type="button" onClick={onRetry}>
          <RefreshCw aria-hidden="true" /> Try again
        </button>
      </section>
    </main>
  );
}

function BrandHeader({ result }: { result: VerificationResult }) {
  return (
    <header className="qrv-brand-header">
      <div className="qrv-shell qrv-brand-header__inner">
        <div className="qrv-brand">
          {result.logo_url ? (
            <img src={result.logo_url} alt={`${result.brand_name || 'Product'} logo`} />
          ) : (
            <span className="qrv-brand__fallback" aria-hidden="true">
              <PackageCheck />
            </span>
          )}
          <div>
            <p className="qrv-brand__name">{result.brand_name || 'Product verification'}</p>
            <p className="qrv-brand__caption">Official product verification</p>
          </div>
        </div>
        <div className="qrv-secure-badge">
          <LockKeyhole aria-hidden="true" /> Secure verification
        </div>
      </div>
    </header>
  );
}

function SecureCodeForm({ submitting, invalid, onSubmit }: { submitting: boolean; invalid: boolean; onSubmit: (code: string) => void }) {
  const [code, setCode] = React.useState('');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = code.trim();
    if (normalized) onSubmit(normalized);
  };
  const codeInputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    id: 'secure-product-code',
    type: 'text',
    value: code,
    onChange: (event) => setCode(event.target.value.toUpperCase()),
    autoComplete: 'one-time-code',
    autoCapitalize: 'characters',
    spellCheck: false,
    maxLength: 50,
    placeholder: 'Enter protected code',
    'aria-invalid': invalid,
    required: true,
  };

  return (
    <form className="qrv-code-form" onSubmit={submit}>
      <label htmlFor="secure-product-code">Protected product code</label>
      <p>Reveal the code on the product label, then enter it below.</p>
      <div className="qrv-code-form__controls">
        <input {...codeInputProps} />
        <button className="qrv-button qrv-button--primary" type="submit" disabled={submitting || !code.trim()}>
          {submitting ? <RefreshCw className="qrv-spin" aria-hidden="true" /> : <Check aria-hidden="true" />}
          {submitting ? 'Checking…' : 'Verify code'}
        </button>
      </div>
    </form>
  );
}

function StatusPanel({
  result,
  submitting,
  onSecureCode,
}: {
  result: VerificationResult;
  submitting: boolean;
  onSecureCode: (code: string) => void;
}) {
  const presentation = STATUS_PRESENTATION[result.verification_status];
  const needsSecureCode = result.challenge_type === 'secure_code';

  return (
    <section className={`qrv-status qrv-status--${presentation.tone}`} aria-live="polite">
      <div className="qrv-status__icon">{presentation.icon}</div>
      <div className="qrv-status__body">
        <p className="qrv-eyebrow">{presentation.eyebrow}</p>
        <h1>{presentation.title}</h1>
        <p className="qrv-status__message">{result.message}</p>
        <div className="qrv-status__meta">
          <span>
            <ShieldCheck aria-hidden="true" /> {formatQrType(result.qr_type)}
          </span>
          {result.qr_channel && (
            <span>
              <ScanLine aria-hidden="true" /> {result.qr_channel} layer
            </span>
          )}
        </div>
        {result.challenge_type === 'scan_covert' && (
          <div className="qrv-instruction">
            <ScanLine aria-hidden="true" />
            <div>
              <strong>Scan the protected QR</strong>
              <span>Locate the concealed code on the product packaging and scan it with your camera.</span>
            </div>
          </div>
        )}
        {needsSecureCode && <SecureCodeForm submitting={submitting} invalid={result.verification_status === 'invalid'} onSubmit={onSecureCode} />}
      </div>
    </section>
  );
}

function LocationConsent({ scanEventId }: { scanEventId: string }) {
  const [state, setState] = React.useState<'idle' | 'requesting' | 'shared' | 'denied'>('idle');

  const shareLocation = () => {
    if (!navigator.geolocation) {
      setState('denied');
      return;
    }
    setState('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void axios
          .patch(`${API_BASE_URL}/api/v1/public/qr/scans/${scanEventId}/location`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy_meters: Math.round(position.coords.accuracy),
          })
          .then(() => setState('shared'))
          .catch(() => setState('denied'));
      },
      () => setState('denied'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  if (state === 'shared') {
    return (
      <p className="qrv-location-note">
        <MapPin aria-hidden="true" /> Approximate location shared.
      </p>
    );
  }
  return (
    <div className="qrv-location-consent">
      <div>
        <strong>Help protect genuine products</strong>
        <span>Optionally share approximate location to detect counterfeit distribution. Verification works without it.</span>
      </div>
      <button className="qrv-button" type="button" onClick={shareLocation} disabled={state === 'requesting'}>
        <MapPin aria-hidden="true" />
        {state === 'requesting' ? 'Requesting…' : 'Share location'}
      </button>
      {state === 'denied' && <small>Location was not shared. You can continue normally.</small>}
    </div>
  );
}

function ProductDetails({ result }: { result: VerificationResult }) {
  const rows = [
    ['Product', result.product_name],
    ['Variant', result.sku_name],
    ['SKU', result.sku_code],
    ['GTIN', result.gtin],
    ['Serial number', result.serial_number],
    ['Industry', result.industry],
    ['Warranty', result.warranty_period_months ? `${result.warranty_period_months} months` : null],
    ...Object.entries(result.variant_attributes || {}),
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
  if (!result.product_name && rows.length === 0) return null;

  return (
    <section className="qrv-card qrv-product-card">
      <div className="qrv-section-heading">
        <div>
          <p className="qrv-eyebrow">Product information</p>
          <h2>{result.product_name || 'Verified product'}</h2>
          {result.generic_name && <p>{result.generic_name}</p>}
        </div>
        {result.product_image_url && <img src={result.product_image_url} alt={result.product_name || 'Product'} />}
      </div>
      <dl className="qrv-details-grid">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className={label === 'GTIN' || label === 'Serial number' || label === 'SKU' ? 'qrv-mono' : undefined}>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ContactCard({ result }: { result: VerificationResult }) {
  const website = safeWebUrl(result.website_url);
  if (!result.contact_email && !result.contact_phone && !website) return null;

  return (
    <section className="qrv-card qrv-contact-card">
      <p className="qrv-eyebrow">Need assistance?</p>
      <h2>Official product support</h2>
      <p>Contact the brand through its verified support channels.</p>
      <div className="qrv-contact-list">
        {result.contact_email && (
          <a href={`mailto:${result.contact_email}`}>
            <Mail aria-hidden="true" />
            <span>
              <small>Email support</small>
              {result.contact_email}
            </span>
          </a>
        )}
        {result.contact_phone && (
          <a href={`tel:${result.contact_phone.replace(/[^+\d]/g, '')}`}>
            <Phone aria-hidden="true" />
            <span>
              <small>Call support</small>
              {result.contact_phone}
            </span>
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noreferrer">
            <Globe2 aria-hidden="true" />
            <span>
              <small>Official website</small>Visit product page
            </span>
            <ExternalLink aria-hidden="true" />
          </a>
        )}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="qrv-footer">
      <div className="qrv-shell">
        <span>
          <ShieldCheck aria-hidden="true" /> Powered by <strong>CipherCode</strong>
        </span>
        <span>© 2026 CipherCode. Secure product experiences.</span>
      </div>
    </footer>
  );
}

function useQRRouteInput(): { input: VerificationRequest | null; requestKey: string } {
  const { gtin, serial, timestamp } = useParams<{
    gtin: string;
    serial: string;
    timestamp: string;
  }>();
  const [searchParams] = useSearchParams();
  const signature = searchParams.get('c')?.replace(/ /g, '+') || null;
  const channelParam = searchParams.get('qr');
  const qrChannel: QRChannel | undefined = channelParam === 'overt' || channelParam === 'covert' ? channelParam : undefined;

  return React.useMemo(() => {
    const values = [gtin, serial, timestamp, signature];
    const requestKey = JSON.stringify([...values, qrChannel]);
    if (values.some((value) => !value)) return { input: null, requestKey };
    return {
      input: {
        gtin: gtin as string,
        serial_number: serial as string,
        timestamp: timestamp as string,
        signature: signature as string,
        ...(qrChannel ? { qr_channel: qrChannel } : {}),
      },
      requestKey,
    };
  }, [gtin, qrChannel, serial, signature, timestamp]);
}

function usePublicVerification(input: VerificationRequest | null, requestKey: string) {
  const [result, setResult] = React.useState<VerificationResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [networkError, setNetworkError] = React.useState<string | null>(null);
  const startedFor = React.useRef<string | null>(null);
  const scanEventId = React.useRef<string>(createScanEventId());

  const verify = React.useCallback(
    async (secureCode?: string) => {
      if (!input) return;
      if (secureCode) setSubmitting(true);
      else setLoading(true);
      setNetworkError(null);

      const payload: VerificationRequest = {
        ...input,
        ...(secureCode ? { secure_code: secureCode } : {}),
      };

      try {
        const response = await axios.post<VerificationResult>(`${API_BASE_URL}/api/v1/public/qr/verify`, payload, {
          headers: { 'X-Scan-Event-Id': scanEventId.current },
        });
        setResult(response.data);
      } catch (error: unknown) {
        setNetworkError(errorMessage(error));
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
    [input],
  );

  React.useEffect(() => {
    if (!input) {
      setLoading(false);
      setNetworkError('This QR code is incomplete or malformed.');
      return;
    }
    if (startedFor.current === requestKey) return;
    startedFor.current = requestKey;
    void verify();
  }, [input, requestKey, verify]);

  return { result, loading, submitting, networkError, verify };
}

export function PublicQRValidation() {
  const { input, requestKey } = useQRRouteInput();
  const { result, loading, submitting, networkError, verify } = usePublicVerification(input, requestKey);

  if (loading) return <LoadingView />;
  if (networkError) return <NetworkErrorView message={networkError} onRetry={() => void verify()} />;
  if (!result) return null;
  const hasProductContent = Boolean(result.product_name || result.contact_email || result.contact_phone || result.website_url);

  return (
    <div className="qrv-page">
      <BrandHeader result={result} />
      <main className="qrv-shell qrv-main">
        <StatusPanel result={result} submitting={submitting} onSecureCode={(code) => void verify(code)} />
        {result.authentic && result.scan_event_id && <LocationConsent scanEventId={result.scan_event_id} />}
        {result.banner_image_url && (
          <figure className="qrv-banner">
            <img src={result.banner_image_url} alt={`${result.product_name || 'Product'} banner`} />
          </figure>
        )}
        {hasProductContent && (
          <div className="qrv-content-grid">
            <ProductDetails result={result} />
            <ContactCard result={result} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
