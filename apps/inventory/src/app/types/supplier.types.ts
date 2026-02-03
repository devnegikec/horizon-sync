/**
 * Supplier Management Types
 * Based on API endpoints: /api/v1/item-suppliers
 */

import type { Pagination } from './warehouse.types';

export interface ItemSupplier {
  id: string;
  organization_id?: string;
  item_id: string;
  supplier_id: string;
  supplier_part_no?: string;
  lead_time_days?: number;
  is_default: boolean;
  extra_data?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export interface CreateItemSupplierPayload {
  item_id: string;
  supplier_id: string;
  supplier_part_no?: string;
  lead_time_days?: number;
  is_default?: boolean;
  extra_data?: Record<string, unknown>;
}

export type UpdateItemSupplierPayload = Partial<CreateItemSupplierPayload>

export interface ItemSuppliersResponse {
  item_suppliers: ItemSupplier[];
  pagination: Pagination;
}

export interface ItemSupplierFilters {
  search: string;
  supplierId: string;
  itemId: string;
}
