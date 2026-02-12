export interface QuotationLineItem {
  id?: string;
  quotation_id?: string;
  item_id: string;
  item_name?: string;
  item_sku?: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  sort_order: number;
  extra_data?: Record<string, unknown>;
}

export interface CustomerInfo {
  customer_code: string;
  customer_name: string;
  email?: string;
  phone?: string;
}

export interface Quotation {
  id: string;
  quotation_no: string;
  organization_id: string;
  customer_id: string;
  customer_name?: string;
  customer?: CustomerInfo;
  quotation_date: string;
  valid_until: string;
  grand_total: string;
  currency: string;
  status: QuotationStatus;
  remarks?: string;
  line_items?: QuotationLineItem[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at?: string;
  submitted_at?: string;
  extra_data?: Record<string, unknown>;
}

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface QuotationResponse {
  quotations: Quotation[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface QuotationLineItemCreate {
  item_id: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
  sort_order: number;
}

export interface QuotationCreate {
  quotation_no?: string;
  customer_id: string;
  quotation_date: string;
  valid_until: string;
  status?: QuotationStatus;
  grand_total?: number;
  currency: string;
  remarks?: string;
  items: QuotationLineItemCreate[];
}

export interface QuotationUpdate {
  quotation_date?: string;
  valid_until?: string;
  status?: QuotationStatus;
  remarks?: string;
  items?: QuotationLineItemCreate[];
}

export interface PaginationInfo {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ServerPaginationConfig {
  pageIndex: number;
  pageSize: number;
  totalItems: number;
  onPaginationChange: (pageIndex: number, pageSize: number) => void;
}
