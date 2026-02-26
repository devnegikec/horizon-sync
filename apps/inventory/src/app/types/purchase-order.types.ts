/**
 * Purchase Order TypeScript types
 * Based on backend schemas from core-service/app/schemas/purchase_order.py
 */

export interface PurchaseOrderLine {
  id: string;
  organization_id: string;
  purchase_order_id: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  received_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  organization_id: string;
  rfq_id?: string;
  reference_type?: string;
  reference_id?: string;
  party_type: 'SUPPLIER';
  party_id: string;
  status: 'draft' | 'submitted' | 'partially_received' | 'fully_received' | 'closed' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  tax_rate?: number;
  discount_amount?: number;
  grand_total: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  line_items: PurchaseOrderLine[];
}

export type PurchaseOrderStatus = PurchaseOrder['status'];

export interface PurchaseOrderListItem {
  id: string;
  organization_id: string;
  rfq_id?: string;
  party_id: string;
  supplier_name?: string;
  status: string;
  grand_total: number;
  created_at: string;
  created_by?: string;
  line_items_count: number;
}

export interface PurchaseOrderLineCreate {
  item_id: string;
  quantity: number;
  unit_price: number;
}

export interface CreatePurchaseOrderPayload {
  rfq_id?: string;
  supplier_id: string; // Backend expects supplier_id, not party_id
  tax_rate?: number;
  discount_amount?: number;
  line_items: PurchaseOrderLineCreate[];
}

export interface UpdatePurchaseOrderPayload {
  supplier_id?: string; // Backend expects supplier_id, not party_id
  tax_rate?: number;
  discount_amount?: number;
  line_items?: PurchaseOrderLineCreate[];
}

export interface PurchaseOrderFilters {
  page?: number;
  page_size?: number;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export interface PurchaseOrdersResponse {
  purchase_orders: PurchaseOrderListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}
