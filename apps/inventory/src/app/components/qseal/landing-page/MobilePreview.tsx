import * as React from 'react';
import { Shield, Smartphone } from 'lucide-react';

import { SocialIcon } from './SocialIcon';
import { resolveImageUrl } from './image-url';
import type { LandingPageConfig, CustomField, FooterLink } from '../../../types/landing-page.types';
import { SOCIAL_PLATFORM_INFO } from '../../../types/landing-page.types';

interface MobilePreviewProps {
  config: LandingPageConfig;
}

const CTA_STYLE_CLASSES: Record<string, string> = {
  primary: 'text-white hover:opacity-90',
  secondary: 'bg-white border text-gray-800 hover:bg-gray-50',
  outline: 'bg-transparent border-2 text-white border-white hover:bg-white/10',
};

/**
 * Mobile phone frame preview showing how the landing page looks on a device.
 */
export function MobilePreview({ config }: MobilePreviewProps) {
  const primary = config.primary_color || '#1a56db';
  const visibleSocials = config.social_links.filter((l) => l.enabled && l.url);

  return (
    <div className="flex justify-center">
      {/* Phone frame */}
      <div className="w-[375px] min-h-[700px] rounded-[3rem] border-[6px] border-gray-800 bg-white overflow-hidden shadow-2xl relative">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-800 rounded-b-2xl z-10" />

        {/* Scrollable content */}
        <div className="h-full overflow-y-auto pt-8 pb-4">
          {/* Banner */}
          {config.banner_image_url && (
            <div className="w-full h-36 overflow-hidden">
              <img
                src={resolveImageUrl(config.banner_image_url) ?? undefined}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Logo */}
          {config.logo_url && (
            <div className="flex justify-center -mt-10 relative z-10">
              <div className="w-20 h-20 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden">
                <img
                  src={resolveImageUrl(config.logo_url) ?? undefined}
                  alt="Logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
            </div>
          )}

          {/* Product Details */}
          <div className="px-5 mt-3 space-y-3">
            {/* Title */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">Authentic Product</h3>
              <p className="text-xs text-gray-500">Verified by QSeal</p>
            </div>

            {/* Details */}
            <div className="rounded-xl border bg-gray-50/50 p-4 space-y-2">
              {config.product_details.show_gtin && (
                <DetailRow label="GTIN" value="8901234567890" mono />
              )}
              {config.product_details.show_batch && (
                <DetailRow label="Batch No." value="B2026-07-001" mono />
              )}
              {config.product_details.show_mfg_date && (
                <DetailRow label="Mfg. Date" value="15 Jul 2026" />
              )}
              {config.product_details.show_expiry_date && (
                <DetailRow label="Expiry Date" value="14 Jul 2028" />
              )}
              {config.product_details.show_serial_number && (
                <DetailRow label="Serial No." value="SN-2026-0001" mono />
              )}
              {config.product_details.custom_fields.map(
                (f: CustomField, i: number) =>
                  f.label && <DetailRow key={i} label={f.label} value={f.value || '—'} />,
              )}
            </div>

            {/* Feedback / Survey */}
            {config.feedback.enabled && config.feedback.type !== 'none' && (
              <div className="rounded-xl p-4 text-white text-center" style={{ background: primary }}>
                <p className="font-semibold text-sm">
                  {config.feedback.title || 'Share Your Feedback'}
                </p>
                {config.feedback.description && (
                  <p className="text-xs mt-1 opacity-90">{config.feedback.description}</p>
                )}
                <button
                  type="button"
                  className="mt-2 px-4 py-1.5 rounded-full bg-white text-sm font-medium hover:bg-white/90 transition-colors"
                  style={{ color: primary }}
                >
                  {config.feedback.type === 'survey' ? 'Take Survey' : 'Give Feedback'}
                </button>
              </div>
            )}

            {/* Warranty */}
            {config.warranty.enabled && (
              <div className="rounded-xl border p-4 text-center">
                <Shield className="h-5 w-5 mx-auto" style={{ color: primary }} />
                <p className="font-semibold text-sm mt-1">
                  {config.warranty.title || 'Product Warranty'}
                </p>
                {config.warranty.description && (
                  <p className="text-xs text-gray-500 mt-1">{config.warranty.description}</p>
                )}
                {config.warranty.cta_text && (
                  <button
                    type="button"
                    className="mt-2 px-4 py-1.5 rounded-full text-sm font-medium text-white transition-colors hover:opacity-90"
                    style={{ background: primary }}
                  >
                    {config.warranty.cta_text}
                  </button>
                )}
              </div>
            )}

            {/* Custom CTA */}
            {config.custom_cta.enabled && config.custom_cta.button_text && (
              <div className="text-center">
                <button
                  type="button"
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                    CTA_STYLE_CLASSES[config.custom_cta.button_style] || CTA_STYLE_CLASSES.primary
                  }`}
                  style={
                    config.custom_cta.button_style !== 'secondary'
                      ? { background: primary }
                      : { borderColor: primary, color: primary }
                  }
                >
                  {config.custom_cta.button_text}
                </button>
              </div>
            )}

            {/* Social Links */}
            {visibleSocials.length > 0 && (
              <div className="text-center pt-2">
                <p className="text-xs text-gray-400 mb-2">Follow Us</p>
                <div className="flex justify-center gap-3">
                  {visibleSocials.map((link, i) => (
                    <a
                      key={i}
                      href={link.url || '#'}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                      style={{ background: primary, color: '#fff' }}
                      title={SOCIAL_PLATFORM_INFO[link.platform]?.label}
                    >
                      <SocialIcon platform={link.platform} size={16} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 px-5 py-4 border-t bg-gray-50 text-center space-y-1">
            {config.footer.text && (
              <p className="text-[10px] text-gray-400">{config.footer.text}</p>
            )}
            {config.footer.custom_links.length > 0 && (
              <div className="flex justify-center gap-3">
                {config.footer.custom_links.map(
                  (link: FooterLink, i: number) =>
                    link.label && (
                      <a
                        key={i}
                        href={link.url || '#'}
                        className="text-[10px] text-gray-500 hover:underline"
                      >
                        {link.label}
                      </a>
                    ),
                )}
              </div>
            )}
            {config.footer.show_powered_by && (
              <p className="text-[10px] text-gray-300">Powered by QSeal</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Small helper for a consistent detail row in the preview. */
function DetailRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={mono ? 'font-mono font-medium' : 'font-medium'}>{value}</span>
    </div>
  );
}
