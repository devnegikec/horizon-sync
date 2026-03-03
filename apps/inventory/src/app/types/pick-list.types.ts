/**
 * Pick List Types
 * Based on API endpoint: /api/v1/pick-lists
 */

export type PickListStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

export interface PickListItemInfo {
  id: string;
  name: string;
  code: string;
}

export interface PickListWarehouseInfo {
  id: string;
  name: string;
  code: string;
}

export interface PickListReferenceInfo {
  id: string;
  reference_type: string;
  name: string;
  code: string;
}

export interface PickListItem {
  id: string;
  organization_id: string;
  item: PickListItemInfo;
  warehouse: PickListWarehouseInfo;
  qty: string;
  picked_qty: string;
  uom: string;
  batch_no: string | null;
  sort_order: number;
  created_at: string;
  // Legacy fields for backward compatibility
  pick_list_id?: string;
  item_id?: string;
  item_name?: string;
  item_code?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  warehouse_code?: string;
  updated_at?: string;
}

export interface PickList {
  id: string;
  organization_id: string;
  pick_list_no: string;
  warehouse_id: string;
  warehouse?: PickListWarehouseInfo;
  status: PickListStatus;
  pick_date: string | null;
  reference_type: string | null;
  reference_id: string | null;
  reference?: PickListReferenceInfo;
  remarks: string | null;
  completed_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  items: PickListItem[];
  // Legacy fields for backward compatibility
  sales_order_id?: string | null;
  sales_order_no?: string;
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
