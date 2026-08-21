// QSeal Types — matches QR Products API from openapi.json

export type QSealQRType = 'dynamic' | 'secure_qr_runtime' | 'static_qr';

// Derived status from is_active boolean for UI display
export type QSealProductStatus = 'active' | 'inactive';

/**
 * List item returned by GET /api/v1/qr-products
 */
export interface QSealProductListItem {
  id: string;
  name: string;
  generic_name: string | null;
  gtin: string | null;
  industry: string | null;
  qr_type: string | null;
  is_active: boolean;
  activation_method: string | null;
  sr_number_type: string | null;
  serial_prefix_setting_id: string | null;
  serial_prefix: string | null;
  created_at: string;
}

/**
 * Full product returned by GET /api/v1/qr-products/{product_id}
 */
export interface QSealProduct {
  id: string;
  organization_id: string;
  brand_id: string | null;
  name: string;
  generic_name: string | null;
  gtin: string | null;
  industry: string | null;
  qr_type: QSealQRType | string | null;
  is_active: boolean;
  landing_page: string | null;
  image_url: string | null;
  banner_image_url: string | null;
  email: string | null;
  phone_number: string | null;
  client_product_auth_url: string | null;
  activation_method: string;
  sr_number_type: string | null;
  serial_prefix_setting_id: string | null;
  serial_prefix: string | null;
  redirect_to_client: boolean;
  warranty_period_months: number | null;
  shelf_life_setting_id: string | null;
  extra_data: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Helper to derive display status from is_active */
export function getProductStatus(product: { is_active: boolean }): QSealProductStatus {
  return product.is_active ? 'active' : 'inactive';
}

export interface QSealBlock {
  id: string;
  product_id: string;
  block_no: string;
  qr_type: QSealQRType;
  quantity: number;
  activated_count: number;
  scan_count: number;
  created_at: string;
}

export interface QSealCreditInfo {
  monthly_quota: number;
  used_this_month: number;
  remaining: number;
  reset_date: string;
}

export interface QSealProductListResponse {
  products: QSealProductListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface CreateQSealProductPayload {
  name: string;
  brand_id?: string | null;
  generic_name?: string | null;
  gtin?: string | null;
  industry?: string | null;
  qr_type?: string | null;
  landing_page?: string | null;
  image_url?: string | null;
  banner_image_url?: string | null;
  email?: string | null;
  phone_number?: string | null;
  client_product_auth_url?: string | null;
  activation_method?: string;
  sr_number_type?: string | null;
  serial_prefix_setting_id: string;
  redirect_to_client?: boolean;
  warranty_period_months?: number | null;
  shelf_life_setting_id: string;
  extra_data?: Record<string, unknown> | null;
}

export interface UpdateQSealProductPayload {
  name?: string | null;
  generic_name?: string | null;
  gtin?: string | null;
  industry?: string | null;
  qr_type?: string | null;
  is_active?: boolean | null;
  landing_page?: string | null;
  image_url?: string | null;
  banner_image_url?: string | null;
  email?: string | null;
  phone_number?: string | null;
  activation_method?: string | null;
  sr_number_type?: string | null;
  serial_prefix_setting_id?: string | null;
  redirect_to_client?: boolean | null;
  warranty_period_months?: number | null;
  shelf_life_setting_id?: string;
  extra_data?: Record<string, unknown> | null;
}

export type QSealProductImageType = 'logo' | 'banner';

export interface QSealProductImageResponse {
  image_type: QSealProductImageType;
  url: string | null;
}

export interface QSealProductImageChanges {
  logoFile: File | null;
  bannerFile: File | null;
  removeLogo: boolean;
  removeBanner: boolean;
}

export interface QSealFilters {
  search?: string;
  status?: string; // 'all' | 'active' | 'inactive'
}

export interface ScanAnalyticsResponse {
  total_scans: number;
  unique_serials: number;
  by_date: { date: string; count: number }[];
  by_country: { country: string; count: number }[];
}

// ── Analytics Types ──────────────────────────────────────────

export interface AnalyticsFilters {
  date_from?: string;
  date_to?: string;
}

export interface AnalyticsSummary {
  total_scans: number;
  unique_serials: number;
  by_date: { date: string; count: number }[];
  by_country: { country: string; count: number }[];
  by_device: { device_type: string; count: number }[];
}

export interface AnalyticsCTABreakdown {
  breakdown: { cta_action: string; count: number }[];
  total_scans_with_cta: number;
}

export interface AnalyticsInteractionFunnel {
  total_scans: number;
  scans_with_cta: number;
  scans_with_interactions: number;
  total_interactions: number;
  conversion_rate: number;
  top_interaction_types: { interaction_type: string; count: number }[];
}

export interface AnalyticsGeoPoint {
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  count: number;
}

export interface AnalyticsDeviceTimeline {
  date: string;
  mobile: number;
  desktop: number;
  tablet: number;
  unknown: number;
}

export interface AnalyticsScanEvent {
  id: string;
  serial_number: string;
  scan_timestamp: string;
  cta_action: string | null;
  qr_type: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  street_address: string | null;
  ip_address: string | null;
  referrer_url: string | null;
  language: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface AnalyticsScanListResponse {
  events: AnalyticsScanEvent[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
