/**
 * Smart Picking Types
 * Based on API endpoints: /api/v1/smart-picking
 */

// ============================================
// SUGGEST ALLOCATION TYPES
// ============================================

export interface AllocationSuggestionItem {
  item_id: string;
  item_code: string;
  item_name: string;
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  suggested_qty: number;
  current_available: number;
  uom: string;
}

export interface UnallocatedItem {
  item_id: string;
  item_code: string;
  item_name: string;
  short_qty: number;
  uom: string;
}

export interface AllocationSuggestionResponse {
  sales_order_id: string;
  sales_order_no: string;
  customer_id: string;
  suggestions: AllocationSuggestionItem[];
  unallocated: UnallocatedItem[];
}

// ============================================
// CREATE PICK LIST TYPES
// ============================================

export interface SmartPickAllocation {
  item_id: string;
  warehouse_id: string;
  qty: number;
  uom: string;
}

export interface SmartPickListCreate {
  sales_order_id: string;
  allocations: SmartPickAllocation[];
  remarks?: string | null;
}

export interface SmartPickListItem {
  id: string;
  item_id: string;
  warehouse_id: string;
  qty: number;
  picked_qty: number;
  uom: string;
}

export interface SmartPickListResponse {
  id: string;
  pick_list_no: string;
  status: string;
  sales_order_id: string;
  sales_order_no: string;
  items: SmartPickListItem[];
  created_at: string;
}

// ============================================
// DELIVERY NOTE FROM PICK LIST TYPES
// ============================================

export interface DeliveryNoteFromPickListRequest {
  pick_list_id: string;
  delivery_date?: string | null;
  remarks?: string | null;
}

export interface DeliveryNoteItem {
  id: string;
  item_id: string;
  warehouse_id: string;
  qty: number;
  uom: string;
  rate: number;
  amount: number;
}

export interface DeliveryNoteFromPickListResponse {
  id: string;
  delivery_note_no: string;
  customer_id: string;
  status: string;
  pick_list_id: string;
  items: DeliveryNoteItem[];
  stock_movements_created: number;
  created_at: string;
}
