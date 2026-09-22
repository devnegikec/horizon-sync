export type BatchStatus = 'active' | 'expired' | 'consumed';

export interface BatchCreatePayload {
  batch_no: string;
  item_id: string;
  manufacturing_date?: string | null;
  expiry_date?: string | null;
  supplier_id?: string | null;
  supplier_batch_no?: string | null;
  status?: BatchStatus | null;
  reference_type?: string | null;
  reference_id?: string | null;
  description?: string | null;
  extra_data?: Record<string, unknown> | null;
}

export interface Batch {
  id: string;
  organization_id: string;
  batch_no: string;
  item_id: string;
  manufacturing_date: string | null;
  expiry_date: string | null;
  supplier_id: string | null;
  supplier_batch_no: string | null;
  status: BatchStatus | null;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  extra_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface BatchListItem {
  id: string;
  batch_no: string;
  item_id: string;
  /** ERP item / product SKU (returned by the /batches list endpoint) */
  sku?: string | null;
  /** Product display name (returned by the /batches list endpoint) */
  product_name?: string | null;
  /** @deprecated older field name — prefer product_name */
  item_name?: string | null;
  expiry_date: string | null;
  status: BatchStatus | null;
  created_at: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface BatchListResponse {
  batches: BatchListItem[];
  pagination: PaginationMeta;
}
