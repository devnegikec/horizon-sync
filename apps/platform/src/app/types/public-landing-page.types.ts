export interface PublicLandingPageCustomField {
  label: string;
  value: string;
  sort_order?: number;
}

export interface PublicLandingPageConfig {
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
    custom_fields?: PublicLandingPageCustomField[];
  };
  social_links?: Array<{
    platform?: string;
    url: string;
    label?: string;
    enabled?: boolean;
    sort_order?: number;
  }>;
  feedback?: {
    enabled?: boolean;
    type?: 'feedback' | 'survey' | 'none';
    title?: string;
    description?: string;
    survey_url?: string;
    thank_you_message?: string;
  };
  warranty?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    cta_text?: string;
    cta_url?: string;
  };
  custom_cta?: {
    enabled?: boolean;
    button_text?: string;
    button_url?: string;
    button_style?: 'primary' | 'secondary' | 'outline';
  };
  footer?: {
    text?: string;
    show_powered_by?: boolean;
    custom_links?: Array<{
      label: string;
      url: string;
      sort_order?: number;
    }>;
  };
}

export interface PublicLandingPageResponse {
  config: PublicLandingPageConfig;
}
