// QSeal Types — matches QSeal platform domain

export type QSealProductStatus = 'active' | 'inactive' | 'draft';

export type QSealQRType = 'dynamic' | 'secure_qr_runtime' | 'static_qr';

export interface QSealProduct {
  id: string;
  organization_id: string;
  product_code: string;
  product_name: string;
  description: string | null;
  category: string | null;
  qr_type: QSealQRType;
  status: QSealProductStatus;
  total_blocks: number;
  total_qr_codes: number;
  activated_count: number;
  scan_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
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
  products: QSealProduct[];
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
  product_code: string;
  product_name: string;
  description?: string | null;
  category?: string | null;
  qr_type: QSealQRType;
}

export interface QSealFilters {
  search?: string;
  status?: string;
  qr_type?: string;
}
