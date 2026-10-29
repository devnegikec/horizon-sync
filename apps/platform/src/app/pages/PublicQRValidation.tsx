import * as React from 'react';

import axios, { AxiosError } from 'axios';
import {
  ArrowRight,
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  CircleHelp,
  ExternalLink,
  Fingerprint,
  Globe2,
  Link2,
  LockKeyhole,
  Mail,
  MessageCircle,
  PackageCheck,
  Phone,
  RefreshCw,
  ScanLine,
  ShieldCheck,
  Star,
  XCircle,
} from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';

import { environment } from '../../environments/environment';
import { getPublicLandingPageBySku } from '../services/publicLandingPage.service';
import type { PublicLandingPageConfig } from '../types/public-landing-page.types';
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
  retry_after_seconds?: number | null;
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
  secure_verified_at: string | null;
  one_time_verified_at: string | null;
  activation_method: string | null;
  industry: string | null;
  warranty_period_months: number | null;
  batch_number: string | null;
  manufacturing_date: string | null;
  expiry_date: string | null;
  logo_url: string | null;
  product_image_url: string | null;
  banner_image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  redirect_to_client?: boolean;
  client_product_auth_url?: string | null;
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

function safeWebUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

function resolveAssetUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value, API_BASE_URL || window.location.origin).href;
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

function BrandHeader({ result, config }: { result: VerificationResult; config: PublicLandingPageConfig | null }) {
  const logoUrl = resolveAssetUrl(config?.logo_url !== undefined ? config.logo_url : result.logo_url);

  return (
    <header className="qrv-brand-header">
      <div className="qrv-shell qrv-brand-header__inner">
        <div className="qrv-brand">
          {logoUrl ? (
            <img src={logoUrl} alt={`${result.brand_name || 'Product'} logo`} />
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

function SecureCodeForm({
  submitting,
  invalid,
  disabled = false,
  onSubmit,
}: {
  submitting: boolean;
  invalid: boolean;
  disabled?: boolean;
  onSubmit: (code: string) => void;
}) {
  const [code, setCode] = React.useState('');

  React.useEffect(() => {
    if (disabled) setCode('');
  }, [disabled]);

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
    placeholder: 'Enter secure code',
    'aria-invalid': invalid,
    disabled: submitting || disabled,
    required: true,
  };

  return (
    <form className="qrv-code-form" onSubmit={submit}>
      <label htmlFor="secure-product-code">Secure code</label>
      <p>Enter the code exactly as shown on the product label.</p>
      <div className="qrv-code-form__controls">
        <input {...codeInputProps} />
        <button className="qrv-button qrv-button--primary" type="submit" disabled={submitting || disabled || !code.trim()}>
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

function formatOneTimeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  // Date-only values are calendar dates, not instants. Keep them stable across
  // viewer time zones by formatting them in UTC.
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const parsed = new Date(dateOnly ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    ...(dateOnly ? { timeZone: 'UTC' } : {}),
  }).format(parsed);
}

function formatVerificationDateTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

function formatLockoutCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function OneTimeSuccessPanel({ result }: { result: VerificationResult }) {
  const scannedAtLabel = formatVerificationDateTime(result.one_time_verified_at) || 'Scan time unavailable';
  const details = [
    ['Product', result.product_name],
    ['Serial number', result.serial_number],
    ['Manufactured', formatOneTimeDate(result.manufacturing_date)],
    ['Batch', result.batch_number],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <section className="qrv-otqr-success" aria-live="polite">
      <div className="qrv-otqr-success__bar">
        <span>Scan result</span>
        <span className="qrv-otqr-success__badge">
          <ScanLine aria-hidden="true" /> One-Time QR
        </span>
      </div>

      <div className="qrv-otqr-success__hero">
        <div className="qrv-otqr-success__seal" aria-hidden="true">
          <Check />
        </div>
        <p className="qrv-eyebrow">First scan recorded</p>
        <h1>One-time scan completed</h1>
        <p className="qrv-otqr-success__message">This product scan was recorded successfully. This QR is now marked as used.</p>
        <div className="qrv-otqr-success__metadata">
          <span>
            <CalendarClock aria-hidden="true" /> Scanned {scannedAtLabel}
          </span>
          <span>
            <Fingerprint aria-hidden="true" /> Unique serial recorded
          </span>
        </div>
      </div>

      <div className="qrv-otqr-success__details">
        <div className="qrv-otqr-success__details-heading">
          <div>
            <p className="qrv-eyebrow">Scanned product</p>
            <h2>Product details</h2>
          </div>
          <ScanLine aria-hidden="true" />
        </div>
        <dl>
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={label === 'Serial number' ? 'qrv-mono' : undefined}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="qrv-otqr-success__notice">
        <ShieldCheck aria-hidden="true" />
        <span>This one-time QR can no longer be used for another scan.</span>
      </div>
    </section>
  );
}

function OneTimeRepeatPanel({ result }: { result: VerificationResult }) {
  const scannedAtLabel = formatVerificationDateTime(result.one_time_verified_at);
  const details = [
    ['Product', result.product_name],
    ['Serial number', result.serial_number],
    ['Manufactured', formatOneTimeDate(result.manufacturing_date)],
    ['Batch', result.batch_number],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <section className="qrv-otqr-repeat" aria-live="polite">
      <div className="qrv-otqr-repeat__bar">
        <span>Scan result</span>
        <span className="qrv-otqr-repeat__badge">
          <ScanLine aria-hidden="true" /> One-Time QR
        </span>
      </div>
      <div className="qrv-otqr-repeat__status">
        <div className="qrv-otqr-repeat__seal" aria-hidden="true">
          <Check />
        </div>
        <h1>Already scanned</h1>
        <p>
          This one-time QR has already been used. The first scan was recorded
          {scannedAtLabel ? ` on ${scannedAtLabel}.` : '.'}
        </p>
      </div>
      <div className="qrv-otqr-repeat__details">
        <h2>Product details</h2>
        <dl>
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={label === 'Serial number' ? 'qrv-mono' : undefined}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function SecureQRChallengePanel({
  result,
  submitting,
  onSecureCode,
}: {
  result: VerificationResult;
  submitting: boolean;
  onSecureCode: (code: string) => void;
}) {
  const invalid = result.verification_status === 'invalid';
  const retryAfterSeconds = Math.max(0, result.retry_after_seconds || 0);
  const [remainingSeconds, setRemainingSeconds] = React.useState(retryAfterSeconds);

  React.useEffect(() => {
    setRemainingSeconds(retryAfterSeconds);
  }, [retryAfterSeconds]);

  React.useEffect(() => {
    if (remainingSeconds <= 0) return undefined;
    const timeoutId = window.setTimeout(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timeoutId);
  }, [remainingSeconds]);

  const temporarilyLocked = remainingSeconds > 0;
  const lockoutExpired = retryAfterSeconds > 0 && !temporarilyLocked;
  const panelStateClass = temporarilyLocked ? ' qrv-secure-panel--locked' : invalid ? ' qrv-secure-panel--error' : '';

  return (
    <section className={`qrv-secure-panel qrv-secure-panel--challenge${panelStateClass}`} aria-live="polite">
      <div className="qrv-secure-panel__header">
        <p className="qrv-secure-panel__eyebrow">Secure QR</p>
        <h1>Enter your secure code</h1>
        <p>Use the code on the product label to complete verification.</p>
      </div>
      <div className="qrv-secure-panel__icon" aria-hidden="true">
        <CircleHelp />
      </div>
      {temporarilyLocked ? (
        <p className="qrv-secure-panel__error qrv-secure-panel__error--locked" role="status" aria-live="polite">
          <Clock3 aria-hidden="true" />
          <span>
            Too many attempts. Try again in <strong>{formatLockoutCountdown(remainingSeconds)}</strong>.
          </span>
        </p>
      ) : lockoutExpired ? (
        <p className="qrv-secure-panel__error qrv-secure-panel__error--locked" role="status" aria-live="polite">
          <Clock3 aria-hidden="true" /> You can try again now.
        </p>
      ) : invalid ? (
        <p className="qrv-secure-panel__error" role="alert">
          {result.message}
        </p>
      ) : null}
      <SecureCodeForm submitting={submitting} invalid={invalid} disabled={temporarilyLocked} onSubmit={onSecureCode} />
      <p className="qrv-secure-panel__privacy">Your secure code is checked privately and is never displayed after verification.</p>
    </section>
  );
}

function SecureQRSuccessPanel({ result }: { result: VerificationResult }) {
  const authenticatedAtLabel = formatVerificationDateTime(result.secure_verified_at);
  const details = [
    ['Product name', result.product_name],
    ['Serial number', result.serial_number],
    ['Manufacturing date', formatOneTimeDate(result.manufacturing_date)],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <section className="qrv-secure-panel qrv-secure-panel--success" aria-live="polite">
      <div className="qrv-secure-panel__header">
        <p className="qrv-secure-panel__eyebrow">Secure QR</p>
        <h1>Product verified</h1>
        <p>The secure code matched this product.</p>
      </div>
      <div className="qrv-secure-panel__icon" aria-hidden="true">
        <Check />
      </div>
      <div className="qrv-secure-panel__timestamp">
        <CalendarClock aria-hidden="true" />
        {authenticatedAtLabel ? `Verified ${authenticatedAtLabel}` : 'Verification time unavailable'}
      </div>
      <div className="qrv-secure-panel__information">
        <div className="qrv-secure-panel__information-heading">
          <h3>Product details</h3>
          <ShieldCheck aria-hidden="true" />
        </div>
        <dl>
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd className={label === 'Serial number' ? 'qrv-mono' : undefined}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function isFirstTimeOneTimeSuccess(result: VerificationResult): boolean {
  return result.qr_type === 'one_time' && result.verification_status === 'authentic';
}

function isOneTimeRepeat(result: VerificationResult): boolean {
  return result.qr_type === 'one_time' && result.verification_status === 'already_used';
}

function VerificationStatusView({
  result,
  submitting,
  firstTimeOneTimeSuccess,
  oneTimeRepeat,
  secureQRChallenge,
  secureQRSuccess,
  onSecureCode,
}: {
  result: VerificationResult;
  submitting: boolean;
  firstTimeOneTimeSuccess: boolean;
  oneTimeRepeat: boolean;
  secureQRChallenge: boolean;
  secureQRSuccess: boolean;
  onSecureCode: (code: string) => void;
}) {
  if (firstTimeOneTimeSuccess) return <OneTimeSuccessPanel result={result} />;
  if (oneTimeRepeat) return <OneTimeRepeatPanel result={result} />;
  if (secureQRChallenge) return <SecureQRChallengePanel result={result} submitting={submitting} onSecureCode={onSecureCode} />;
  if (secureQRSuccess) return <SecureQRSuccessPanel result={result} />;
  return <StatusPanel result={result} submitting={submitting} onSecureCode={onSecureCode} />;
}

function StandardProductDetails({ result, config, hidden }: { result: VerificationResult; config: PublicLandingPageConfig | null; hidden: boolean }) {
  if (hidden) return null;
  return <ProductDetails result={result} config={config} />;
}

function PublicPageExtras({
  result,
  landingPageConfig,
  firstTimeOneTimeSuccess,
  oneTimeQR,
  secureQRChallenge,
  secureQR,
  productContentVisible,
  landingSectionsVisible,
  bannerUrl,
}: {
  result: VerificationResult;
  landingPageConfig: PublicLandingPageConfig | null;
  firstTimeOneTimeSuccess: boolean;
  oneTimeQR: boolean;
  secureQRChallenge: boolean;
  secureQR: boolean;
  productContentVisible: boolean;
  landingSectionsVisible: boolean;
  bannerUrl: string | null;
}) {
  if (secureQR || secureQRChallenge || oneTimeQR) return null;

  return (
    <>
      {result.authentic && result.scan_event_id && <LocationConsent scanEventId={result.scan_event_id} />}
      {bannerUrl && (
        <figure className="qrv-banner">
          <img src={bannerUrl} alt={`${result.product_name || 'Product'} banner`} />
        </figure>
      )}
      {(productContentVisible || landingSectionsVisible) && (
        <div className="qrv-content-grid">
          <StandardProductDetails result={result} config={landingPageConfig} hidden={firstTimeOneTimeSuccess} />
          <ContactCard result={result} />
          <SocialLinksCard config={landingPageConfig} brandName={result.brand_name} />
          <WarrantyCard config={landingPageConfig} />
          <FeedbackCard config={landingPageConfig} />
          <CustomCtaCard config={landingPageConfig} />
        </div>
      )}
    </>
  );
}

function PublicPageMain({
  result,
  landingPageConfig,
  submitting,
  verify,
  firstTimeOneTimeSuccess,
  oneTimeRepeat,
  oneTimeQR,
  secureQRChallenge,
  secureQRSuccess,
  secureQR,
  productContentVisible,
  landingSectionsVisible,
  bannerUrl,
}: {
  result: VerificationResult;
  landingPageConfig: PublicLandingPageConfig | null;
  submitting: boolean;
  verify: (secureCode?: string) => Promise<void>;
  firstTimeOneTimeSuccess: boolean;
  oneTimeRepeat: boolean;
  oneTimeQR: boolean;
  secureQRChallenge: boolean;
  secureQRSuccess: boolean;
  secureQR: boolean;
  productContentVisible: boolean;
  landingSectionsVisible: boolean;
  bannerUrl: string | null;
}) {
  return (
    <main className="qrv-shell qrv-main">
      <VerificationStatusView
        result={result}
        submitting={submitting}
        firstTimeOneTimeSuccess={firstTimeOneTimeSuccess}
        oneTimeRepeat={oneTimeRepeat}
        secureQRChallenge={secureQRChallenge}
        secureQRSuccess={secureQRSuccess}
        onSecureCode={(code) => void verify(code)}
      />
      <PublicPageExtras
        result={result}
        landingPageConfig={landingPageConfig}
        firstTimeOneTimeSuccess={firstTimeOneTimeSuccess}
        oneTimeQR={oneTimeQR}
        secureQRChallenge={secureQRChallenge}
        secureQR={secureQR}
        productContentVisible={productContentVisible}
        landingSectionsVisible={landingSectionsVisible}
        bannerUrl={bannerUrl}
      />
    </main>
  );
}

function LocationConsent({ scanEventId }: { scanEventId: string }) {
  const requested = React.useRef(false);

  React.useEffect(() => {
    if (requested.current || !navigator.geolocation) return;
    requested.current = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        void axios
          .patch(`${API_BASE_URL}/api/v1/public/qr/scans/${scanEventId}/location`, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy_meters: Math.round(position.coords.accuracy),
          })
          .catch(() => {
            // The backend IP enrichment remains the fallback when GPS fails.
          });
      },
      () => {
        // Permission denied or GPS unavailable: keep using backend IP enrichment.
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }, [scanEventId]);

  return null;
}

type ProductDetailVisibilityKey = 'show_gtin' | 'show_batch' | 'show_mfg_date' | 'show_expiry_date' | 'show_serial_number';

function shouldShowProductDetail(config: PublicLandingPageConfig | null, key: ProductDetailVisibilityKey): boolean {
  const settings = config?.product_details;
  if (!settings) return true;
  if (key === 'show_serial_number') return settings[key] === true;
  return settings[key] !== false;
}

function productDetailRows(result: VerificationResult, config: PublicLandingPageConfig | null): Array<[string, string]> {
  const rows: Array<[string, string | null | undefined]> = [
    ['Product', result.product_name],
    ['Variant', result.sku_name],
    ['SKU', result.sku_code],
    ['Industry', result.industry],
    ['Warranty', result.warranty_period_months ? `${result.warranty_period_months} months` : null],
    ...Object.entries(result.variant_attributes || {}),
    ...(config?.product_details?.custom_fields || []).map((field) => [field.label, field.value] as [string, string]),
  ];
  const optionalRows: Array<[string, string | null, ProductDetailVisibilityKey]> = [
    ['GTIN', result.gtin, 'show_gtin'],
    ['Batch', result.batch_number, 'show_batch'],
    ['Manufacturing date', result.manufacturing_date, 'show_mfg_date'],
    ['Expiry date', result.expiry_date, 'show_expiry_date'],
    ['Serial number', result.serial_number, 'show_serial_number'],
  ];
  optionalRows.forEach(([label, value, key]) => {
    if (shouldShowProductDetail(config, key)) rows.push([label, value]);
  });
  return rows.filter((entry): entry is [string, string] => Boolean(entry[1]));
}

function isMonospaceProductDetail(label: string): boolean {
  return ['GTIN', 'Serial number', 'SKU'].includes(label);
}

function ProductDetails({ result, config }: { result: VerificationResult; config: PublicLandingPageConfig | null }) {
  const rows = productDetailRows(result, config);
  if (!result.product_name && rows.length === 0) return null;
  const productImageUrl = resolveAssetUrl(result.product_image_url);

  return (
    <section className="qrv-card qrv-product-card">
      <div className="qrv-section-heading">
        <div>
          <p className="qrv-eyebrow">Product information</p>
          <h2>{result.product_name || 'Verified product'}</h2>
          {result.generic_name && <p>{result.generic_name}</p>}
        </div>
        {productImageUrl && <img src={productImageUrl} alt={result.product_name || 'Product'} />}
      </div>
      <dl className="qrv-details-grid">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className={isMonospaceProductDetail(label) ? 'qrv-mono' : undefined}>{value}</dd>
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

function formatSocialLabel(platform?: string, label?: string): string {
  if (label) return label;
  if (!platform) return 'Official channel';
  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

function SocialLinksCard({ config, brandName }: { config: PublicLandingPageConfig | null; brandName: string | null }) {
  const links = [...(config?.social_links || [])]
    .filter((link) => link.enabled !== false)
    .sort((left, right) => (left.sort_order || 0) - (right.sort_order || 0))
    .map((link) => ({ ...link, href: safeWebUrl(link.url) }))
    .filter((link): link is typeof link & { href: string } => Boolean(link.href));

  if (links.length === 0) return null;

  return (
    <section className="qrv-card qrv-engagement-card qrv-social-card" aria-labelledby="qrv-social-links-title">
      <p className="qrv-eyebrow">Stay connected</p>
      <h2 id="qrv-social-links-title">Connect with {brandName || 'the brand'}</h2>
      <div className="qrv-social-list">
        {links.map((link) => (
          <a key={`${link.label || link.platform || 'channel'}-${link.href}`} href={link.href} target="_blank" rel="noreferrer">
            <Link2 aria-hidden="true" />
            <span>{formatSocialLabel(link.platform, link.label)}</span>
            <ExternalLink aria-hidden="true" />
          </a>
        ))}
      </div>
    </section>
  );
}

function WarrantyCard({ config }: { config: PublicLandingPageConfig | null }) {
  const warranty = config?.warranty;
  const ctaUrl = safeWebUrl(warranty?.cta_url);
  if (!warranty?.enabled) return null;

  return (
    <section className="qrv-card qrv-engagement-card" aria-labelledby="qrv-warranty-title">
      <div className="qrv-engagement-card__icon">
        <ShieldCheck aria-hidden="true" />
      </div>
      <p className="qrv-eyebrow">Warranty</p>
      <h2 id="qrv-warranty-title">{warranty.title || 'Product warranty'}</h2>
      {warranty.description && <p>{warranty.description}</p>}
      {ctaUrl && (
        <a className="qrv-button qrv-button--secondary" href={ctaUrl} target="_blank" rel="noreferrer">
          {warranty.cta_text || 'View warranty'} <ArrowRight aria-hidden="true" />
        </a>
      )}
    </section>
  );
}

function feedbackTitle(type?: 'feedback' | 'survey' | 'none', title?: string): string {
  if (title) return title;
  return type === 'survey' ? 'Share your feedback' : 'Tell us what you think';
}

function feedbackActionLabel(type?: 'feedback' | 'survey' | 'none'): string {
  return type === 'survey' ? 'Take survey' : 'Send feedback';
}

function FeedbackCard({ config }: { config: PublicLandingPageConfig | null }) {
  const feedback = config?.feedback;
  const surveyUrl = safeWebUrl(feedback?.survey_url);
  if (!feedback?.enabled || feedback.type === 'none') return null;

  const title = feedbackTitle(feedback.type, feedback.title);
  const actionLabel = feedbackActionLabel(feedback.type);

  return (
    <section className="qrv-card qrv-engagement-card" aria-labelledby="qrv-feedback-title">
      <div className="qrv-engagement-card__icon">
        <MessageCircle aria-hidden="true" />
      </div>
      <p className="qrv-eyebrow">Your experience matters</p>
      <h2 id="qrv-feedback-title">{title}</h2>
      {feedback.description && <p>{feedback.description}</p>}
      {surveyUrl && (
        <a className="qrv-button qrv-button--secondary" href={surveyUrl} target="_blank" rel="noreferrer">
          {actionLabel} <ExternalLink aria-hidden="true" />
        </a>
      )}
    </section>
  );
}

function CustomCtaCard({ config }: { config: PublicLandingPageConfig | null }) {
  const cta = config?.custom_cta;
  const ctaUrl = safeWebUrl(cta?.button_url);
  if (!cta?.enabled || !ctaUrl) return null;

  const buttonStyle = cta.button_style === 'outline' || cta.button_style === 'secondary' ? cta.button_style : 'primary';

  return (
    <section className="qrv-card qrv-engagement-card qrv-custom-cta-card" aria-labelledby="qrv-custom-cta-title">
      <div>
        <div className="qrv-engagement-card__icon">
          <Star aria-hidden="true" />
        </div>
        <p className="qrv-eyebrow">Recommended for you</p>
        <h2 id="qrv-custom-cta-title">Continue your product journey</h2>
      </div>
      <a className={`qrv-button qrv-button--${buttonStyle}`} href={ctaUrl} target="_blank" rel="noreferrer">
        {cta.button_text || 'Learn more'} <ArrowRight aria-hidden="true" />
      </a>
    </section>
  );
}

function Footer({ config }: { config: PublicLandingPageConfig | null }) {
  const footer = config?.footer;
  const footerText = footer?.text || '© 2026 CipherCode. Secure product experiences.';
  const showPoweredBy = footer?.show_powered_by !== false;
  const links = (footer?.custom_links || [])
    .map((link) => ({ ...link, href: safeWebUrl(link.url) }))
    .filter((link): link is typeof link & { href: string } => Boolean(link.href));

  return (
    <footer className="qrv-footer">
      <div className="qrv-shell">
        {showPoweredBy ? (
          <span>
            <ShieldCheck aria-hidden="true" /> Powered by <strong>CipherCode</strong>
          </span>
        ) : (
          <span />
        )}
        <span className="qrv-footer__details">
          <span>{footerText}</span>
          {links.map((link) => (
            <a key={`${link.label}-${link.href}`} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </span>
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
        if (response.data.redirect_to_client && response.data.client_product_auth_url) {
          window.location.replace(response.data.client_product_auth_url);
          return;
        }
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

function usePublicLandingPage(result: VerificationResult | null): PublicLandingPageConfig | null {
  const [config, setConfig] = React.useState<PublicLandingPageConfig | null>(null);
  const landingPageKey = result?.sku_code || result?.gtin;

  React.useEffect(() => {
    let cancelled = false;
    setConfig(null);

    if (!landingPageKey || result?.verification_status === 'invalid') {
      return () => {
        cancelled = true;
      };
    }

    void getPublicLandingPageBySku(landingPageKey)
      .then((nextConfig) => {
        if (!cancelled) setConfig(nextConfig);
      })
      .catch(() => {
        // A landing page is optional. The verification result remains the fallback.
        if (!cancelled) setConfig(null);
      });

    return () => {
      cancelled = true;
    };
  }, [landingPageKey, result?.verification_status]);

  return config;
}

function hasProductContent(result: VerificationResult, config: PublicLandingPageConfig | null): boolean {
  return [
    result.product_name,
    // ProductDetails also renders these identifier rows on their own, so keep
    // the card visible when only they are present.
    result.sku_code,
    result.gtin,
    result.serial_number,
    result.contact_email,
    result.contact_phone,
    result.website_url,
    config?.product_details?.custom_fields?.length,
  ].some(Boolean);
}

function hasLandingSections(config: PublicLandingPageConfig | null): boolean {
  return [
    config?.social_links?.some((link) => link.enabled !== false),
    config?.warranty?.enabled,
    config?.feedback?.enabled,
    config?.custom_cta?.enabled,
  ].some(Boolean);
}

function publicPageStyle(config: PublicLandingPageConfig | null): React.CSSProperties {
  return {
    '--qrv-primary': config?.primary_color || '#6d28d9',
    '--qrv-accent': config?.accent_color || '#f59e0b',
  } as React.CSSProperties;
}

function publicBannerUrl(result: VerificationResult, config: PublicLandingPageConfig | null): string | null {
  const banner = config?.banner_image_url !== undefined ? config.banner_image_url : result.banner_image_url;
  return resolveAssetUrl(banner);
}

export function PublicQRValidation() {
  const { input, requestKey } = useQRRouteInput();
  const { result, loading, submitting, networkError, verify } = usePublicVerification(input, requestKey);
  const landingPageConfig = usePublicLandingPage(result);

  if (loading) return <LoadingView />;
  if (networkError) return <NetworkErrorView message={networkError} onRetry={() => void verify()} />;
  if (!result) return null;
  const firstTimeOneTimeSuccess = isFirstTimeOneTimeSuccess(result);
  const oneTimeQR = result.qr_type === 'one_time';
  const oneTimeRepeat = isOneTimeRepeat(result);
  const secureQR = result.qr_type === 'secure_code';
  const secureQRChallenge = secureQR && result.challenge_type === 'secure_code' && !result.authentic;
  const secureQRSuccess = secureQR && result.verification_status === 'authentic' && result.authentic;
  const productContentVisible = hasProductContent(result, landingPageConfig);
  const landingSectionsVisible = hasLandingSections(landingPageConfig);
  const bannerUrl = publicBannerUrl(result, landingPageConfig);
  const pageStyle = publicPageStyle(landingPageConfig);

  return (
    <div className={`qrv-page${firstTimeOneTimeSuccess ? ' qrv-page--one-time' : ''}${secureQR ? ' qrv-page--secure-qr' : ''}`} style={pageStyle}>
      <BrandHeader result={result} config={landingPageConfig} />
      <PublicPageMain
        result={result}
        landingPageConfig={landingPageConfig}
        submitting={submitting}
        verify={verify}
        firstTimeOneTimeSuccess={firstTimeOneTimeSuccess}
        oneTimeRepeat={oneTimeRepeat}
        oneTimeQR={oneTimeQR}
        secureQRChallenge={secureQRChallenge}
        secureQRSuccess={secureQRSuccess}
        secureQR={secureQR}
        productContentVisible={productContentVisible}
        landingSectionsVisible={landingSectionsVisible}
        bannerUrl={bannerUrl}
      />
      <Footer config={landingPageConfig} />
    </div>
  );
}
