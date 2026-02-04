/**
 * Warehouse Types
 * Based on API endpoints: /api/v1/warehouses
 */

export type WarehouseType = 'warehouse' | 'store' | 'transit';

export interface Warehouse {
  id: string;
  organization_id?: string;
  name: string;
  code: string;
  description?: string;
  parent_warehouse_id?: string | null;
  parent?: {
    id: string;
    code: string;
    name: string;
  } | null;
  warehouse_type: WarehouseType;
  address_line1?: string;
  address_line2?: string;
  city?: string | null;
  state?: string;
  postal_code?: string;
  country?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  total_capacity?: number;
  capacity_uom?: string;
  stock_account_id?: string;
  is_active: boolean;
  is_default: boolean;
  extra_data?: Record<string, unknown>;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateWarehousePayload {
  name: string;
  code: string;
  description?: string;
  parent_warehouse_id?: string | null;
  warehouse_type: WarehouseType;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  total_capacity?: number;
  capacity_uom?: string;
  stock_account_id?: string;
  is_active?: boolean;
  is_default?: boolean;
  extra_data?: Record<string, unknown>;
}

export type UpdateWarehousePayload = Partial<CreateWarehousePayload>;

export interface WarehousesResponse {
  warehouses: Warehouse[];
  pagination: Pagination;
  status_counts?: {
    active: number;
    inactive: number;
  };
  type_counts?: {
    warehouse: number;
    store: number;
    transit: number;
  };
}

export interface Pagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface WarehouseFilters {
  search: string;
  warehouseType: string;
  status: string;
}
