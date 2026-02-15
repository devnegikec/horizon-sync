// RFQ Types based on sourcing-flow spec

export type RFQStatus = 
  | 'DRAFT' 
  | 'SENT' 
  | 'PARTIALLY_RESPONDED' 
  | 'FULLY_RESPONDED' 
  | 'CLOSED';

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
  material_request_id: string | null;
  reference_type: 'MATERIAL_REQUEST' | null;
  reference_id: string | null;
  status: RFQStatus;
  closing_date: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  line_items: RFQLine[];
  suppliers: RFQSupplier[];
  // Computed fields for convenience
  supplier_ids?: string[];
  line_items_count?: number;
  suppliers_count?: number;
}

export interface CreateRFQPayload {
  material_request_id: string;
  supplier_ids: string[];
  closing_date: string;
  line_items?: RFQLineCreate[]; // Optional when creating from Material Request
}

export interface RFQLineCreate {
  item_id: string;
  quantity: number;
  required_date: string;
  description?: string;
}

export interface UpdateRFQPayload {
  supplier_ids?: string[];
  closing_date?: string;
  notes?: string;
}

export interface RecordQuotePayload {
  supplier_id: string;
  line_item_id: string;
  quoted_price: number;
  quoted_delivery_date: string;
  supplier_notes?: string;
}

export interface RFQListItem {
  id: string;
  organization_id: string;
  material_request_id: string | null;
  status: RFQStatus;
  closing_date: string;
  created_at: string;
  created_by: string | null;
  line_items_count: number;
  suppliers_count: number;
}

export interface RFQListResponse {
  data: RFQListItem[];
  total_count: number;
  page: number;
  page_size: number;
}

export interface RFQFilters {
  status: RFQStatus | 'all';
  search: string;
  page: number;
  page_size: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
