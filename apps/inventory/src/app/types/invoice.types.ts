// Invoice Types

export type InvoiceType = 'sales' | 'purchase';

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  item_id: string;
  item_name?: string;
  item_code?: string;
  quantity: number;
  unit_price: number;
  amount: number;
  tax_amount?: number;
  total_amount: number;
  uom?: string;
  description?: string;
}

export interface Invoice {
  id: string;
  organization_id: string;
  invoice_no: string;
  invoice_type: InvoiceType;
  party_id: string;
  party_type: string;
  party_name?: string;
  posting_date: string;
  due_date: string;
  status: InvoiceStatus;
  grand_total: number;
  outstanding_amount: number;
  currency: string;
  reference_type?: string | null;
  reference_id?: string | null;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  line_items?: InvoiceLineItem[];
}

export interface InvoiceListItem {
  id: string;
  organization_id: string;
  invoice_no: string;
  invoice_type: InvoiceType;
  party_id: string;
  party_name?: string;
  posting_date: string;
  due_date: string;
  status: InvoiceStatus;
  grand_total: number;
  outstanding_amount: number;
  currency: string;
  created_at: string;
}

export interface InvoiceResponse {
  invoices: InvoiceListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface InvoiceCreateRequest {
  invoice_no?: string;
  invoice_type: InvoiceType;
  party_id: string;
  party_type: string;
  posting_date: string;
  due_date: string;
  status?: InvoiceStatus;
  grand_total: number;
  outstanding_amount: number;
  currency: string;
  reference_type?: string | null;
  reference_id?: string | null;
  remarks?: string | null;
}

export interface InvoiceUpdateRequest {
  posting_date?: string;
  due_date?: string;
  status?: InvoiceStatus;
  remarks?: string | null;
}

export interface MarkAsPaidRequest {
  payment_date?: string;
  payment_amount?: number;
  payment_method?: string;
  payment_reference?: string;
}
