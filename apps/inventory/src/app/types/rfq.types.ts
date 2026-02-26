/**
 * RFQ (Request for Quotation) TypeScript types
 * Based on backend schemas from core-service/app/schemas/rfq.py
 */

export interface SupplierQuote {
  id: string;
  organization_id: string;
  rfq_line_id: string;
  supplier_id: string;
  quoted_price: number;
  quoted_delivery_date: string;
  supplier_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RFQLine {
  id: string;
  organization_id: string;
  rfq_id: string;
  item_id: string;
  quantity: number;
  required_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
  quotes: SupplierQuote[];
}

export interface RFQSupplier {
  id: string;
  organization_id: string;
  rfq_id: string;
  supplier_id: string;
  created_at: string;
}

export interface RFQ {
  id: string;
  organization_id: string;
  material_request_id?: string;
  reference_type?: string;
  reference_id?: string;
  status: 'draft' | 'sent' | 'partially_responded' | 'fully_responded' | 'closed';
  closing_date: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  line_items: RFQLine[];
  suppliers: RFQSupplier[];
}

export type RFQStatus = RFQ['status'];

export interface RFQListItem {
  id: string;
  organization_id: string;
  material_request_id?: string;
  status: string;
  closing_date: string;
  created_at: string;
  created_by?: string;
  line_items_count: number;
  suppliers_count: number;
}

export interface RFQLineCreate {
  item_id: string;
  quantity: number;
  required_date: string;
  description?: string;
}

export interface CreateRFQPayload {
  material_request_id?: string;
  reference_type?: string;
  reference_id?: string;
  closing_date: string;
  line_items?: RFQLineCreate[];
  supplier_ids: string[];
}

export interface UpdateRFQPayload {
  closing_date?: string;
  line_items?: RFQLineCreate[];
  supplier_ids?: string[];
}

export interface RecordQuotePayload {
  rfq_line_id: string;
  supplier_id: string;
  quoted_price: number;
  quoted_delivery_date: string;
  supplier_notes?: string;
}

export interface RFQFilters {
  page?: number;
  page_size?: number;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
  material_request_id?: string;
}

// Internal filters for the management hook
export interface RFQManagementFilters {
  search: string;
  status: string;
  material_request_id?: string;
}

export interface RFQsResponse {
  rfqs: RFQListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
