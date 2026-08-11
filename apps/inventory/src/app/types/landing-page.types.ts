/**
 * Landing Page Configuration Types
 *
 * Defines the structure for the QR product landing page builder.
 * Each product can have one landing page configuration.
 */

// ─── Social Media ────────────────────────────────────────────────────────────

export type SocialPlatform =
  | 'facebook'
  | 'twitter'
  | 'instagram'
  | 'linkedin'
  | 'youtube'
  | 'whatsapp'
  | 'telegram'
  | 'website'
  | 'other';

export interface SocialLink {
  id?: string;
  platform: SocialPlatform;
  url: string;
  label?: string;
  enabled: boolean;
  sort_order?: number;
}

// ─── Product Details Display ─────────────────────────────────────────────────

export interface ProductDetailsConfig {
  show_gtin: boolean;
  show_batch: boolean;
  show_mfg_date: boolean;
  show_expiry_date: boolean;
  show_serial_number: boolean;
  custom_fields: CustomField[];
}

export interface CustomField {
  id?: string;
  label: string;
  value: string;
  sort_order?: number;
}

// ─── Feedback / Survey ───────────────────────────────────────────────────────

export type FeedbackType = 'feedback' | 'survey' | 'none';

export interface FeedbackConfig {
  enabled: boolean;
  type: FeedbackType;
  title: string;
  description: string;
  survey_url?: string;
  thank_you_message?: string;
}

// ─── Warranty ────────────────────────────────────────────────────────────────

export interface WarrantyConfig {
  enabled: boolean;
  title: string;
  description: string;
  cta_text: string;
  cta_url: string;
}

// ─── Custom CTA ──────────────────────────────────────────────────────────────

export type CTAButtonStyle = 'primary' | 'secondary' | 'outline';

export interface CustomCTAConfig {
  enabled: boolean;
  button_text: string;
  button_url: string;
  button_style: CTAButtonStyle;
}

// ─── Footer ──────────────────────────────────────────────────────────────────

export interface FooterLink {
  label: string;
  url: string;
  sort_order?: number;
}

export interface FooterConfig {
  text: string;
  show_powered_by: boolean;
  custom_links: FooterLink[];
}

// ─── Main Config ─────────────────────────────────────────────────────────────

export interface LandingPageConfig {
  product_id: string;
  organization_id?: string;

  // Visuals
  logo_url: string | null;
  banner_image_url: string | null;

  // Branding
  primary_color: string;
  accent_color: string;

  // Sections
  product_details: ProductDetailsConfig;
  social_links: SocialLink[];
  feedback: FeedbackConfig;
  warranty: WarrantyConfig;
  custom_cta: CustomCTAConfig;
  footer: FooterConfig;

  // Meta
  created_at?: string;
  updated_at?: string;
}

// ─── API Payloads ────────────────────────────────────────────────────────────

export interface LandingPageConfigCreate {
  product_id: string;
  logo_url?: string | null;
  banner_image_url?: string | null;
  primary_color?: string;
  accent_color?: string;
  product_details?: ProductDetailsConfig;
  social_links?: SocialLink[];
  feedback?: FeedbackConfig;
  warranty?: WarrantyConfig;
  custom_cta?: CustomCTAConfig;
  footer?: FooterConfig;
}

export interface LandingPageConfigUpdate {
  logo_url?: string | null;
  banner_image_url?: string | null;
  primary_color?: string;
  accent_color?: string;
  product_details?: ProductDetailsConfig;
  social_links?: SocialLink[];
  feedback?: FeedbackConfig;
  warranty?: WarrantyConfig;
  custom_cta?: CustomCTAConfig;
  footer?: FooterConfig;
}

export interface LandingPageConfigResponse {
  config: LandingPageConfig;
}

// ─── Social Platform Display Info ────────────────────────────────────────────

export const SOCIAL_PLATFORM_INFO: Record<SocialPlatform, { label: string; icon: string; placeholder: string }> = {
  facebook: { label: 'Facebook', icon: 'facebook', placeholder: 'https://facebook.com/yourpage' },
  twitter: { label: 'Twitter / X', icon: 'twitter', placeholder: 'https://twitter.com/yourhandle' },
  instagram: { label: 'Instagram', icon: 'instagram', placeholder: 'https://instagram.com/yourprofile' },
  linkedin: { label: 'LinkedIn', icon: 'linkedin', placeholder: 'https://linkedin.com/company/yourcompany' },
  youtube: { label: 'YouTube', icon: 'youtube', placeholder: 'https://youtube.com/@yourchannel' },
  whatsapp: { label: 'WhatsApp', icon: 'whatsapp', placeholder: 'https://wa.me/yournumber' },
  telegram: { label: 'Telegram', icon: 'telegram', placeholder: 'https://t.me/yourchannel' },
  website: { label: 'Website', icon: 'globe', placeholder: 'https://yourcompany.com' },
  other: { label: 'Other', icon: 'link', placeholder: 'https://...' },
};
