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
  sku: string | null;
  generic_name: string | null;
  gtin: string | null;
  industry: string | null;
  qr_type: string | null;
  is_active: boolean;
  activation_method: string | null;
  created_at: string;
}

/**
 * Full product returned by GET /api/v1/qr-products/{product_id}
 */
export interface QSealProduct {
  id: string;
  organization_id: string;
  name: string;
  brand_id?: string | null;
  brand_name?: string | null;
  sku: string | null;
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
  redirect_to_client: boolean;
  warranty_period_months: number | null;
  linked_item_id?: string | null;
  items_per_master_pack?: number | null;
  extra_data: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;

  // Item-sourced mirrors (synced from the linked inventory item)
  item_code?: string | null;
  description?: string | null;
  uom?: string | null;
  standard_rate?: number | string | null;
  valuation_rate?: number | string | null;
  weight_per_unit?: number | string | null;
  weight_uom?: string | null;
  barcode?: string | null;
  maintain_stock?: boolean | null;
  has_batch_no?: boolean | null;
  has_serial_no?: boolean | null;
  item_type?: string | null;
  valuation_method?: string | null;
  allow_negative_stock?: boolean | null;
  item_group_id?: string | null;
  has_variants?: boolean | null;
  variant_of?: string | null;
  variant_attributes?: Record<string, unknown> | null;
  batch_number_series?: string | null;
  serial_number_series?: string | null;
  enable_auto_reorder?: boolean | null;
  reorder_level?: number | null;
  reorder_qty?: number | null;
  min_order_qty?: number | null;
  max_order_qty?: number | null;
  inspection_required_before_purchase?: boolean | null;
  inspection_required_before_delivery?: boolean | null;
  quality_inspection_template?: string | null;
  sales_tax_template_id?: string | null;
  purchase_tax_template_id?: string | null;
  images?: string[] | null;
  tags?: string[] | null;
  custom_fields?: Record<string, unknown> | null;
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

export interface QSealPackagingDetailsPayload {
  unit_name: string;
  conversion_factor: number;
  items_per_master_pack?: number | null;
  length_mm: number | null;
  width_mm: number | null;
  height_mm: number | null;
  weight_grams: number | null;
}

export interface CreateQSealProductPayload {
  name: string;
  packaging_details?: QSealPackagingDetailsPayload | null;
  brand_id?: string | null;
  sku?: string | null;
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
  redirect_to_client?: boolean;
  warranty_period_months?: number | null;
  extra_data?: Record<string, unknown> | null;
}

export interface UpdateQSealProductPayload {
  name?: string | null;
  sku?: string | null;
  packaging_details?: QSealPackagingDetailsPayload | null;
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
  redirect_to_client?: boolean | null;
  warranty_period_months?: number | null;
  extra_data?: Record<string, unknown> | null;
}

export interface QSealFilters {
  search?: string;
  status?: string;   // 'all' | 'active' | 'inactive'
  qr_type?: string;
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
  city: string;
  state: string | null;
  country: string;
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
