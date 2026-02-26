/**
 * Stock Management Types
 * Based on API endpoints: /api/v1/stock-levels, /api/v1/stock-movements,
 * /api/v1/stock-entries, /api/v1/stock-reconciliations
 */

import type { Pagination } from './warehouse.types';

// Stock Levels
export interface ProductInfo {
  name: string;
  code: string;
}

export interface WarehouseInfo {
  name: string;
  code: string;
}

export interface StockLevel {
  id: string;
  organization_id?: string;
  product_id: string;
  product_name?: string; // Deprecated: use product.name instead
  product_code?: string; // Deprecated: use product.code instead
  warehouse_id: string;
  warehouse_name?: string; // Deprecated: use warehouse.name instead
  product?: ProductInfo;
  warehouse?: WarehouseInfo;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  last_counted_at?: string | null;
  created_at?: string;
  updated_at: string;
}

export interface CreateStockLevelPayload {
  item_id: string;
  warehouse_id: string;
  quantity_on_hand?: number;
  quantity_reserved?: number;
  quantity_available?: number;
  last_counted_at?: string;
}

export interface StockLevelsResponse {
  stock_levels: StockLevel[];
  pagination: Pagination;
  stats?: StockLevelStats;
}

export interface StockLevelStats {
  total_items: number;
  total_warehouses: number;
  low_stock_items: number;
  out_of_stock_items: number;
}

// Stock Movements
export type MovementType = 'in' | 'out' | 'transfer' | 'adjustment';

export interface StockMovement {
  id: string;
  organization_id?: string;
  product_id: string;
  product_name?: string; // Deprecated: use product.name instead
  product_code?: string; // Deprecated: use product.code instead
  warehouse_id: string;
  warehouse_name?: string; // Deprecated: use warehouse.name instead
  product?: ProductInfo;
  warehouse?: WarehouseInfo;
  movement_type: MovementType;
  quantity: number;
  unit_cost?: number | string | null;
  reference_type?: string | null;
  reference_id?: string | null;
  notes?: string | null;
  performed_by?: string | null;
  performed_by_name?: string | null;
  performed_at: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateStockMovementPayload {
  item_id: string;
  warehouse_id: string;
  movement_type: string;
  quantity: number;
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  performed_at?: string;
}

export interface StockMovementsResponse {
  stock_movements: StockMovement[];
  pagination: Pagination;
  stats?: StockMovementStats;
}

export interface StockMovementStats {
  total_movements: number;
  stock_in: number;
  stock_out: number;
  adjustments: number;
}

// Stock Entries
export type StockEntryType = 'material_receipt' | 'material_issue' | 'material_transfer' | 'manufacture' | 'repack';

export type StockEntryStatus = 'draft' | 'submitted' | 'cancelled';

export interface StockEntryItem {
  id?: string;
  item_id: string;
  item_name?: string;
  item_code?: string;
  source_warehouse_id?: string;
  target_warehouse_id?: string;
  qty: number;
  uom?: string;
  basic_rate?: number;
  valuation_rate?: number;
  batch_no?: string;
  serial_nos?: string[];
  description?: string;
  extra_data?: Record<string, unknown>;
}

export interface StockEntry {
  id: string;
  organization_id?: string;
  stock_entry_no: string;
  stock_entry_type: StockEntryType;
  from_warehouse_id?: string | null;
  from_warehouse_name?: string | null; // Deprecated: use from_warehouse.name instead
  to_warehouse_id?: string | null;
  to_warehouse_name?: string | null; // Deprecated: use to_warehouse.name instead
  from_warehouse?: WarehouseInfo;
  to_warehouse?: WarehouseInfo;
  posting_date: string;
  posting_time?: string | null;
  status: StockEntryStatus;
  reference_type?: string | null;
  reference_id?: string | null;
  remarks?: string | null;
  total_value?: number | string | null;
  expense_account_id?: string | null;
  cost_center_id?: string | null;
  is_backflush?: boolean | null;
  bom_id?: string | null;
  extra_data?: Record<string, unknown> | null;
  submitted_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  items?: StockEntryItem[];
}

export interface CreateStockEntryPayload {
  stock_entry_no?: string;
  stock_entry_type: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  posting_date: string;
  posting_time?: string;
  status?: StockEntryStatus;
  reference_type?: string;
  reference_id?: string;
  remarks?: string;
  total_value?: number;
  expense_account_id?: string;
  cost_center_id?: string;
  is_backflush?: boolean;
  bom_id?: string;
  extra_data?: Record<string, unknown>;
  items: StockEntryItem[];
}

export interface StockEntriesResponse {
  stock_entries: StockEntry[];
  pagination: Pagination;
  stats?: StockEntryStats;
}

export interface StockEntryStats {
  total_entries: number;
  draft_count: number;
  submitted_count: number;
  total_value: number;
}

// Stock Reconciliations
export interface StockReconciliationItem {
  id?: string;
  item_id: string;
  item_name?: string;
  item_code?: string;
  warehouse_id: string;
  warehouse_name?: string;
  current_qty?: number;
  qty: number;
  qty_difference?: number;
  current_valuation_rate?: number;
  valuation_rate?: number;
  batch_no?: string;
  serial_nos?: string[];
  extra_data?: Record<string, unknown>;
}

export interface StockReconciliation {
  id: string;
  organization_id?: string;
  reconciliation_no: string;
  purpose?: string | null;
  posting_date: string;
  posting_time?: string | null;
  status: StockEntryStatus;
  expense_account_id?: string | null;
  difference_account_id?: string | null;
  remarks?: string | null;
  extra_data?: Record<string, unknown> | null;
  submitted_at?: string | null;
  created_at: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  items?: StockReconciliationItem[];
  items_count?: number;
  total_difference?: number;
}

export interface CreateStockReconciliationPayload {
  reconciliation_no?: string;
  purpose: string;
  posting_date: string;
  posting_time?: string;
  status?: StockEntryStatus;
  expense_account_id?: string;
  difference_account_id?: string;
  remarks?: string;
  extra_data?: Record<string, unknown>;
  items: StockReconciliationItem[];
}

export interface StockReconciliationsResponse {
  stock_reconciliations: StockReconciliation[];
  pagination: Pagination;
  stats?: StockReconciliationStats;
}

export interface StockReconciliationStats {
  total_reconciliations: number;
  pending_count: number;
  completed_count: number;
  total_adjustments: number;
}

// Filters
export interface StockLevelFilters {
  search: string;
  item_id: string;
  warehouse_id: string;
}

export interface StockMovementFilters {
  search: string;
  item_id: string;
  warehouse_id: string;
  movement_type: string;
  reference_type: string;
}

export interface StockEntryFilters {
  search: string;
  stock_entry_type: string;
  status: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
}

export interface StockReconciliationFilters {
  search: string;
  status: string;
}
