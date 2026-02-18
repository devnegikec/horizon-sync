/**
 * Purchase Receipt (Receipt Note) TypeScript types
 * Based on backend API documentation
 */

export interface PurchaseReceiptLine {
  id: string;
  purchase_receipt_id: string;
  purchase_order_line_id: string;
  item_id: string;
  quantity: number;
  created_at: string;
}

export interface PurchaseReceipt {
  id: string;
  organization_id: string;
  reference_type: 'PURCHASE_ORDER';
  reference_id: string;
  received_date: string;
  status: 'completed';
  created_by?: string;
  created_at: string;
  updated_at: string;
  line_items: PurchaseReceiptLine[];
}

export interface PurchaseReceiptListItem {
  id: string;
  organization_id: string;
  reference_type: string;
  reference_id: string;
  received_date: string;
  status: string;
  created_at: string;
  line_items_count?: number;
}

export interface PurchaseReceiptLineCreate {
  purchase_order_line_id: string;
  item_id: string;
  quantity: number;
}

export interface CreatePurchaseReceiptPayload {
  reference_type: 'PURCHASE_ORDER';
  reference_id: string;
  received_date: string;
  line_items: PurchaseReceiptLineCreate[];
}

export interface PurchaseReceiptFilters {
  page?: number;
  page_size?: number;
  reference_type?: string;
  reference_id?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PurchaseReceiptsResponse {
  purchase_receipts: PurchaseReceiptListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}
