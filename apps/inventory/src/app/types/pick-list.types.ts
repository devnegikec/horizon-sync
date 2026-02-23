/**
 * Pick List Types
 * Based on API endpoint: /api/v1/pick-lists
 */

export type PickListStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

export interface PickListItem {
  id: string;
  pick_list_id: string;
  item_id: string;
  item_name?: string;
  item_code?: string;
  warehouse_id: string;
  warehouse_name?: string;
  warehouse_code?: string;
  qty: number;
  picked_qty: number;
  uom: string;
  created_at: string;
  updated_at: string;
}

export interface PickList {
  id: string;
  organization_id: string;
  pick_list_no: string;
  sales_order_id: string | null;
  sales_order_no?: string;
  status: PickListStatus;
  remarks: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  items: PickListItem[];
}

export interface PickListListItem {
  id: string;
  organization_id: string;
  pick_list_no: string;
  sales_order_id: string | null;
  sales_order_no?: string;
  status: PickListStatus;
  created_at: string;
  created_by: string | null;
  items_count: number;
}

export interface PickListResponse {
  pick_lists: PickListListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface PaginationInfo {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
