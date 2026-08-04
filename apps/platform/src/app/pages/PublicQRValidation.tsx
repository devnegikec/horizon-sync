import * as React from 'react';

import axios, { AxiosError } from 'axios';
import { Shield } from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';

import { environment } from '../../environments/environment';

const API_BASE_URL = environment.apiCoreUrl;

/**
 * Resolve a landing page image URL for display.
 * Backend stores relative paths like `/static/landing-pages/...`.
 * Prepend core service base URL so images render correctly.
 */
function resolveImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface VerificationResult {
  message: string;
  authentic: boolean;
  product_name: string | null;
  brand_name: string | null;
  gtin: string | null;
  serial_number: string | null;
  product_id?: string | null;
  organization_id?: string | null;
}

interface LandingPageData {
  logo_url?: string | null;
  banner_image_url?: string | null;
  primary_color?: string;
  accent_color?: string;
  product_details?: {
    show_gtin?: boolean;
    show_batch?: boolean;
    show_mfg_date?: boolean;
    show_expiry_date?: boolean;
    show_serial_number?: boolean;
    custom_fields?: Array<{ label: string; value: string }>;
  };
  social_links?: Array<{
    platform: string;
    url: string;
    enabled: boolean;
    label?: string;
  }>;
  feedback?: {
    enabled: boolean;
    type: string;
    title: string;
    description: string;
    survey_url?: string;
  };
  warranty?: {
    enabled: boolean;
    title: string;
    description: string;
    cta_text: string;
    cta_url: string;
  };
  custom_cta?: {
    enabled: boolean;
    button_text: string;
    button_url: string;
    button_style: string;
  };
  footer?: {
    text: string;
    show_powered_by: boolean;
    custom_links?: Array<{ label: string; url: string }>;
  };
}

// ─── Social Icons (simple SVG for public page) ───────────────────────────────

const SOCIAL_ICONS: Record<string, string> = {
  facebook:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  twitter:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  instagram:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
  linkedin:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
  youtube:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
  whatsapp:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>',
  telegram:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
  website:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
};

function getSocialIcon(platform: string): string {
  return (
    SOCIAL_ICONS[platform] ||
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8m-4-4h8"/></svg>'
  );
}

function SocialIconHtml({ platform }: { platform: string }) {
  return <span dangerouslySetInnerHTML={{ __html: getSocialIcon(platform) }} />;
}

// ─── Shared animation keyframes (injected via style tag) ─────────────────────

const ANIMATION_STYLES = `
  @keyframes qr-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes qr-fade-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes qr-scale-in {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes qr-pulse-soft {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  @keyframes qr-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

// ─── Loading View ────────────────────────────────────────────────────────────

function LoadingView() {
  return (
    <>
      <style>{ANIMATION_STYLES}</style>
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb] p-4 font-sans">
        <div className="w-full max-w-sm rounded-2xl bg-white p-10 text-center shadow-lg shadow-black/5">
          {/* Spinner */}
          <div className="mx-auto mb-5 h-10 w-10 animate-[qr-spin_0.7s_linear_infinite] rounded-full border-[3px] border-gray-200 border-t-[#3b82f6]" />
          <p className="text-sm font-medium text-gray-500">Verifying QR code...</p>
          <p className="mt-2 text-xs text-gray-400">Please wait a moment</p>
        </div>
      </div>
    </>
  );
}

// ─── Error View ──────────────────────────────────────────────────────────────

function ErrorView({ message }: { message: string }) {
  return (
    <>
      <style>{ANIMATION_STYLES}</style>
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb] p-4 font-sans">
        <div className="w-full max-w-sm animate-[qr-fade-in_0.4s_ease-out] overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/5">
          {/* Red accent bar */}
          <div className="h-1 bg-gradient-to-r from-red-400 to-rose-500" />
          <div className="px-8 py-10 text-center">
            {/* Error icon */}
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-500 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.15)]">
              ✕
            </div>
            <h2 className="mb-2 text-xl font-semibold tracking-tight text-gray-900">Verification Failed</h2>
            <p className="text-sm leading-relaxed text-gray-500">{message}</p>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Product Details (fallback for non-customized) ───────────────────────────

function ProductDetails({ result }: { result: VerificationResult }) {
  return (
    <div className="divide-y divide-gray-100 border-t border-gray-100 pt-4 text-left">
      {result.product_name && (
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs font-medium text-gray-400">Product</span>
          <span className="text-xs font-semibold text-gray-700">{result.product_name}</span>
        </div>
      )}
      {result.brand_name && (
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs font-medium text-gray-400">Brand</span>
          <span className="text-xs font-semibold text-gray-700">{result.brand_name}</span>
        </div>
      )}
      {result.gtin && (
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs font-medium text-gray-400">GTIN</span>
          <span className="font-mono text-xs font-semibold text-gray-700">{result.gtin}</span>
        </div>
      )}
      {result.serial_number && (
        <div className="flex items-center justify-between py-2.5">
          <span className="text-xs font-medium text-gray-400">Serial Number</span>
          <span className="font-mono text-xs font-semibold text-gray-700">{result.serial_number}</span>
        </div>
      )}
    </div>
  );
}

// ─── Simple Verified View (fallback when no landing page config) ─────────────

function SimpleVerifiedView({ result }: { result: VerificationResult }) {
  return (
    <>
      <style>{ANIMATION_STYLES}</style>
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb] p-4 font-sans">
        <div className="w-full max-w-sm animate-[qr-fade-in_0.4s_ease-out] overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/5">
          {/* Green accent bar */}
          <div className="h-1 bg-gradient-to-r from-emerald-400 to-green-500" />
          <div className="px-8 py-10 text-center">
            {/* Success icon with scale animation */}
            <div className="mx-auto mb-5 flex h-14 w-14 animate-[qr-scale-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)] items-center justify-center rounded-full bg-emerald-50 text-2xl font-bold text-emerald-500 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]">
              ✓
            </div>
            <h2 className="mb-2 text-xl font-semibold tracking-tight text-gray-900">Authentic Product</h2>
            <p className="mb-1 text-sm leading-relaxed text-gray-500">This QR code is genuine and verified. test</p>
            <ProductDetails result={result} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Landing Page Sub-Components (matches MobilePreview.tsx exactly) ──────────

const CTA_STYLE_CLASSES: Record<string, string> = {
  primary: 'text-white hover:opacity-90',
  secondary: 'bg-white border text-gray-800 hover:bg-gray-50',
  outline: 'bg-transparent border-2 text-white border-white hover:bg-white/10',
};

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={mono ? 'font-mono font-medium' : 'font-medium'}>{value}</span>
    </div>
  );
}

/** Product detail rows card — matches MobilePreview details section exactly. */
function LandingDetailCard({ rows }: { rows: Array<{ label: string; value: string; mono?: boolean }> }) {
  if (!rows.length) return null;
  return (
    <div className="rounded-xl border bg-gray-50/50 p-4 space-y-2">
      {rows.map((r, i) => <DetailRow key={i} {...r} />)}
    </div>
  );
}

/** Build detail rows from landing page config + verification result. */
function buildDetailRows(lp: LandingPageData, result: VerificationResult): Array<{ label: string; value: string; mono?: boolean }> {
  const pd = lp.product_details;
  const rows: Array<{ label: string; value: string; mono?: boolean }> = [];
  // Use a flat array of [condition, label, value, mono] tuples
  ([
    [pd?.show_gtin, 'GTIN', result.gtin, true],
    [pd?.show_batch, 'Batch No.', result.product_name, false],
    [pd?.show_mfg_date, 'Mfg. Date', null, false],
    [pd?.show_expiry_date, 'Expiry Date', null, false],
    [pd?.show_serial_number, 'Serial No.', result.serial_number, true],
  ] as Array<[boolean | undefined, string, string | null | undefined, boolean]>).forEach(
    ([show, label, val, mono]) => {
      if (show) rows.push({ label, value: val || '—', mono });
    },
  );
  (pd?.custom_fields || []).forEach((f) => {
    if (f.label) rows.push({ label: f.label, value: f.value || '—' });
  });
  return rows;
}

/** Feedback / Survey block — matches MobilePreview exactly. */
function LandingFeedbackBlock({ fb, primary, onInteraction }: { fb: NonNullable<LandingPageData['feedback']>; primary: string; onInteraction: (type: string, label: string) => void }) {
  const label = fb.type === 'survey' ? 'Take Survey' : 'Give Feedback';
  return (
    <div className="rounded-xl p-4 text-white text-center" style={{ background: primary }}>
      <p className="font-semibold text-sm">{fb.title || 'Share Your Feedback'}</p>
      {fb.description && <p className="text-xs mt-1 opacity-90">{fb.description}</p>}
      {fb.type === 'survey' && fb.survey_url ? (
        <a href={fb.survey_url} target="_blank" rel="noopener noreferrer" onClick={() => onInteraction('survey_click', label)}>
          <button type="button"
            className="mt-2 px-4 py-1.5 rounded-full bg-white text-sm font-medium hover:bg-white/90 transition-colors"
            style={{ color: primary }}>Take Survey</button>
        </a>
      ) : (
        <button type="button"
          onClick={() => onInteraction('feedback_click', label)}
          className="mt-2 px-4 py-1.5 rounded-full bg-white text-sm font-medium hover:bg-white/90 transition-colors"
          style={{ color: primary }}>Give Feedback</button>
      )}
    </div>
  );
}

/** Warranty block — matches MobilePreview exactly. */
function LandingWarrantyBlock({ w, primary, onInteraction }: { w: NonNullable<LandingPageData['warranty']>; primary: string; onInteraction: (type: string, label: string) => void }) {
  const label = w.cta_text || 'Warranty CTA';
  const button = w.cta_text && (
    <button type="button"
      onClick={() => onInteraction('warranty_click', label)}
      className="mt-2 px-4 py-1.5 rounded-full text-sm font-medium text-white transition-colors hover:opacity-90"
      style={{ background: primary }}>{w.cta_text}</button>
  );
  return (
    <div className="rounded-xl border p-4 text-center">
      <Shield className="h-5 w-5 mx-auto" style={{ color: primary }} />
      <p className="font-semibold text-sm mt-1">{w.title || 'Product Warranty'}</p>
      {w.description && <p className="text-xs text-gray-500 mt-1">{w.description}</p>}
      {button && w.cta_url ? (
        <a href={w.cta_url} target="_blank" rel="noopener noreferrer">{button}</a>
      ) : button}
    </div>
  );
}

/** Custom CTA block — matches MobilePreview exactly. */
function LandingCTABlock({ cta, primary, onInteraction }: { cta: NonNullable<LandingPageData['custom_cta']>; primary: string; onInteraction: (type: string, label: string) => void }) {
  const cls = CTA_STYLE_CLASSES[cta.button_style] || CTA_STYLE_CLASSES.primary;
  const style = cta.button_style !== 'secondary' ? { background: primary } : { borderColor: primary, color: primary };
  const label = cta.button_text;
  const btn = (
    <button type="button"
      onClick={() => onInteraction('cta_click', label)}
      className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${cls}`}
      style={style}>{cta.button_text}</button>
  );
  return (
    <div className="text-center">
      {cta.button_url ? (
        <a href={cta.button_url} target="_blank" rel="noopener noreferrer">{btn}</a>
      ) : btn}
    </div>
  );
}

/** Social links block — matches MobilePreview exactly. */
function LandingSocialsBlock({ links, primary, onInteraction }: { links: NonNullable<LandingPageData['social_links']>; primary: string; onInteraction: (type: string, label: string) => void }) {
  const visible = links.filter((l) => l.enabled && l.url);
  if (!visible.length) return null;
  return (
    <div className="text-center pt-2">
      <p className="text-xs text-gray-400 mb-2">Follow Us</p>
      <div className="flex justify-center gap-3">
        {visible.map((link, i) => (
          <a key={i}
            href={link.url || '#'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onInteraction('social_click', link.label || link.platform)}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
            style={{ background: primary, color: '#fff' }}
            title={link.label || link.platform}>
            <SocialIconHtml platform={link.platform} />
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Landing Page View (phone mockup — matches MobilePreview.tsx) ─────────────

/** Banner + Logo header section extracted to reduce component complexity. */
function LandingHeader({ lp, result }: { lp: LandingPageData; result: VerificationResult }) {
  const bannerUrl = resolveImageUrl(lp.banner_image_url);
  const logoUrl = resolveImageUrl(lp.logo_url);
  const isAuthentic = result.authentic;
  return (
    <>
      {bannerUrl && (
        <div className="w-full h-36 overflow-hidden">
          <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
        </div>
      )}
      {logoUrl && (
        <div className="flex justify-center -mt-10 relative z-10">
          <div className="w-20 h-20 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden">
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
          </div>
        </div>
      )}
      <div className="px-5 mt-3 text-center">
        {isAuthentic ? (
          <>
            <Shield className="h-10 w-10 mx-auto text-emerald-500" />
            <h3 className="text-lg font-bold text-emerald-600">Authentic Product</h3>
            <p className="text-xs font-medium text-emerald-500">Verified by QSeal</p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-lg font-bold text-red-500">✕</div>
            <h3 className="text-lg font-bold text-red-600">Verification Failed</h3>
            <p className="text-xs text-red-500">{result.message || 'This product could not be verified.'}</p>
          </>
        )}
      </div>
    </>
  );
}

function LandingPageView({ lp, result, onInteraction }: { lp: LandingPageData; result: VerificationResult; onInteraction: (type: string, label: string) => void }) {
  const primary = lp.primary_color || '#1a56db';
  const rows = buildDetailRows(lp, result);

  return (
    <>
      <style>{ANIMATION_STYLES}</style>
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 font-sans">
        <div className="relative w-[375px] min-h-[700px] animate-[qr-fade-in_0.5s_ease-out] overflow-hidden rounded-[3rem] border-[6px] border-gray-800 bg-white shadow-2xl">
          <div className="absolute left-1/2 top-0 z-10 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-gray-800" />
          <div className="h-full overflow-y-auto pb-4 pt-8">
            <LandingHeader lp={lp} result={result} />
            <LandingSectionsView rows={rows} lp={lp} primary={primary} onInteraction={onInteraction} />
            <LandingFooterBlock lp={lp} />
          </div>
        </div>
      </div>
    </>
  );
}

/** Sections below the header — isolated to satisfy complexity limit. */
function LandingSectionsView({ rows, lp, primary, onInteraction }: {
  rows: Array<{ label: string; value: string; mono?: boolean }>;
  lp: LandingPageData;
  primary: string;
  onInteraction: (type: string, label: string) => void;
}) {
  const sections: React.ReactNode[] = [];
  sections.push(<LandingDetailCard key="d" rows={rows} />);
  const fb = lp.feedback; if (fb && fb.enabled && fb.type !== 'none') sections.push(<LandingFeedbackBlock key="f" fb={fb} primary={primary} onInteraction={onInteraction} />);
  const w = lp.warranty; if (w && w.enabled) sections.push(<LandingWarrantyBlock key="w" w={w} primary={primary} onInteraction={onInteraction} />);
  const cta = lp.custom_cta; if (cta && cta.enabled && cta.button_text) sections.push(<LandingCTABlock key="c" cta={cta} primary={primary} onInteraction={onInteraction} />);
  const sx = lp.social_links; if (sx) sections.push(<LandingSocialsBlock key="s" links={sx} primary={primary} onInteraction={onInteraction} />);
  return <div className="px-5 mt-3 space-y-3">{sections}</div>;
}

/** Footer block — matches MobilePreview exactly. */
function LandingFooterBlock({ lp }: { lp: LandingPageData }) {
  return (
    <div className="mt-4 px-5 py-4 border-t bg-gray-50 text-center space-y-1">
      {lp.footer?.text && <p className="text-[10px] text-gray-400">{lp.footer.text}</p>}
      {(lp.footer?.custom_links || []).length > 0 && (
        <div className="flex justify-center gap-3">
          {(lp.footer?.custom_links || []).map((link, i) =>
            link.label && (
              <a key={i}
                href={link.url || '#'}
                className="text-[10px] text-gray-500 hover:underline">{link.label}</a>
            ),
          )}
        </div>
      )}
      {lp.footer?.show_powered_by !== false && (
        <p className="text-[10px] text-gray-300">Powered by QSeal</p>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseApiError(err: unknown): string {
  const axiosErr = err as AxiosError<Record<string, unknown>>;
  const data = axiosErr.response?.data;
  if (!data) return 'Verification failed';
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data.message === 'string') return data.message;
  if (typeof data.detail === 'object' && data.detail !== null) {
    const d = data.detail as Record<string, unknown>;
    return typeof d.message === 'string' ? d.message : JSON.stringify(d);
  }
  return 'Verification failed';
}

// ─── Analytics Helpers ────────────────────────────────────────────────────────

/** Detect device type from user-agent. */
function deviceType(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return 'mobile';
  if (/iPad|Tablet/i.test(ua)) return 'tablet';
  return 'desktop';
}

/** Detect OS from user-agent. */
function detectOS(): string {
  const ua = navigator.userAgent;
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'macOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

/** Detect browser from user-agent. */
function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua)) return 'Safari';
  if (/Firefox/i.test(ua)) return 'Firefox';
  return 'Unknown';
}

/** Try to get browser geolocation with a short timeout. Returns null on denial/error. */
function getGeolocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 3000, maximumAge: 60000 },
    );
  });
}

/**
 * Send scan ingest event to analytics backend. Fire-and-forget — never throws.
 * Attempts browser geolocation first; backend falls back to IP geolocation if unavailable.
 * Returns the scan ID for subsequent interaction tracking.
 */
async function sendScanIngest(serialNumber: string, gtin: string, organizationId: string): Promise<string | null> {
  try {
    const geo = await getGeolocation();
    const body = {
      serial_number: serialNumber,
      gtin,
      device_type: deviceType(),
      os: detectOS(),
      browser: detectBrowser(),
      ip_address: null,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      city: null,
      state: null,
      country: null,
      extra_data: {},
    };
    const url = `${API_BASE_URL}/api/v1/analytics/scans/ingest?organization_id=${encodeURIComponent(organizationId)}`;
    const res = await axios.post(url, body);
    console.log('[QR] Scan ingest recorded:', res.data?.id);
    return res.data?.id || null;
  } catch (err) {
    console.warn('[QR] Scan ingest failed (non-blocking):', (err as AxiosError)?.message);
    return null;
  }
}

/**
 * Record a CTA interaction on the landing page.
 */
async function sendCTAInteraction(scanId: string, interactionType: string, ctaLabel: string) {
  try {
    const url = `${API_BASE_URL}/api/v1/analytics/scans/${scanId}/interactions`;
    await axios.post(url, { interaction_type: interactionType, cta_label: ctaLabel });
    console.log('[QR] CTA interaction recorded:', interactionType, ctaLabel);
  } catch (err) {
    console.warn('[QR] CTA interaction failed (non-blocking):', (err as AxiosError)?.message);
  }
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function PublicQRValidation() {
  const { serial, timestamp } = useParams<{
    gtin: string;
    serial: string;
    timestamp: string;
  }>();
  const [searchParams] = useSearchParams();
  const cipher = searchParams.get('c');

  const [result, setResult] = React.useState<VerificationResult | null>(null);
  const [landingPage, setLandingPage] = React.useState<LandingPageData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const scanIdRef = React.useRef<string | null>(null);

  // Fire analytics scan ingest after landing page loads (gives us organization_id)
  const trackScan = React.useCallback(async (gtin: string, lp: LandingPageData) => {
    const orgId = (lp as Record<string, unknown>).organization_id as string | undefined;
    if (orgId && serial) {
      scanIdRef.current = await sendScanIngest(serial, gtin, orgId);
    }
  }, [serial]);

  React.useEffect(() => {
    if (serial && timestamp && cipher) {
      verify(serial, timestamp, cipher);
    } else {
      setLoading(false);
      setError('Missing verification parameters');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serial, timestamp, cipher]);

  const fetchLandingPage = async (sku: string) => {
    if (!sku) return;
    try {
      const url = `${API_BASE_URL}/api/v1/public/products/sku/${encodeURIComponent(sku)}/landing-page`;
      console.log('[QR] Fetching landing page:', url);
      const lpRes = await axios.get(url);
      console.log('[QR] Landing page response:', lpRes.data);
      const lpConfig = lpRes.data?.config || null;
      setLandingPage(lpConfig);
      // Track scan after we have organization_id from landing page config
      if (lpConfig) {
        trackScan(sku, lpConfig);
      }
    } catch (err) {
      const axiosErr = err as AxiosError;
      console.error('[QR] Landing page fetch failed:', axiosErr.response?.status, axiosErr.message);
      setLandingPage(null);
    }
  };

  const verify = async (serialNumber: string, nonce: string, sig: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/v1/qr-products/authenticate`, {
        serial_number: serialNumber,
        nonce,
        cipher: sig,
      });
      console.log('[QR] Authenticate response:', res.data);
      setResult(res.data);

      // Fetch landing page by SKU (GTIN) from authenticate response
      const sku = res.data?.gtin;
      console.log('[QR] sku (gtin):', sku, 'authentic:', res.data?.authentic);
      if (sku) {
        await fetchLandingPage(sku);
      } else {
        console.warn('[QR] No gtin/sku in authenticate response — cannot fetch landing page.');
      }
    } catch (err: unknown) {
      const detail = parseApiError(err);
      setError(detail);
      setResult({
        authentic: false,
        message: detail,
        product_name: null,
        brand_name: null,
        gtin: null,
        serial_number: null,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingView />;
  if (error && !result) return <ErrorView message={error} />;
  if (!result) return null;

  // Show designed landing page whenever config exists (regardless of auth result)
  if (landingPage) {
    return (
      <LandingPageView lp={landingPage}
        result={result}
        onInteraction={(type, label) => {
          if (scanIdRef.current) sendCTAInteraction(scanIdRef.current, type, label);
        }} />
    );
  }

  // Authentic but no landing page → simple verified view
  if (result.authentic) {
    return <SimpleVerifiedView result={result} />;
  }

  // Not authentic
  return (
    <>
      <style>{ANIMATION_STYLES}</style>
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fb] p-4 font-sans">
        <div className="w-full max-w-sm animate-[qr-fade-in_0.4s_ease-out] overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/5">
          <div className="h-1 bg-gradient-to-r from-red-400 to-rose-500" />
          <div className="px-8 py-10 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl font-bold text-red-500 shadow-[inset_0_0_0_1px_rgba(239,68,68,0.15)]">
              ✕
            </div>
            <h2 className="mb-2 text-xl font-semibold tracking-tight text-gray-900">Verification Failed</h2>
            <p className="text-sm leading-relaxed text-gray-500">{result.message}</p>
          </div>
        </div>
      </div>
    </>
  );
}
