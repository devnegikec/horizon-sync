export interface QuotationLineItem {
  id: string;
  quotation_id?: string;
  organization_id?: string;
  item_id: string;
  item_name?: string;
  item_sku?: string;
  item_code?: string;
  qty: number | string;
  uom: string;
  rate: number | string;
  amount: number | string;
  tax_template_id?: string | null;
  tax_rate?: number | string;
  tax_amount?: number | string;
  total_amount?: number | string;
  sort_order: number;
  min_order_qty?: number;
  max_order_qty?: number;
  standard_rate?: string;
  stock_levels?: {
    quantity_on_hand: number;
    quantity_reserved: number;
    quantity_available: number;
  };
  item_group?: {
    id: string;
    name: string;
    code: string;
  };
  tax_info?: {
    id: string;
    template_name: string;
    template_code: string;
    is_compound: boolean;
    breakup: Array<{
      rule_name: string;
      tax_type: string;
      rate: number;
      is_compound: boolean;
    }>;
  } | null;
  created_at?: string;
  updated_at?: string;
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
  items?: QuotationLineItem[]; // API returns 'items' instead of 'line_items'
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
  qty: number | string;
  uom: string;
  rate: number | string;
  amount: number | string;
  tax_template_id?: string | null;
  tax_rate?: number | string;
  tax_amount?: number | string;
  total_amount?: number | string;
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
