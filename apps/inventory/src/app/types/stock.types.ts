/**
 * Stock Management Types
 * Based on API endpoints: /api/v1/stock-levels, /api/v1/stock-movements,
 * /api/v1/stock-entries, /api/v1/stock-reconciliations
 */

import type { Pagination } from './warehouse.types';

// Stock Levels
export interface StockLevel {
  id: string;
  organization_id?: string;
  product_id: string;
  warehouse_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  last_counted_at?: string;
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
}

// Stock Movements
export type MovementType =
  | 'receipt'
  | 'issue'
  | 'transfer'
  | 'adjustment'
  | 'return'
  | 'purchase_receipt'
  | 'sales_issue';

export interface StockMovement {
  id: string;
  organization_id?: string;
  product_id: string;
  warehouse_id: string;
  movement_type: string;
  quantity: number;
  unit_cost?: string;
  reference_type?: string;
  reference_id?: string;
  notes?: string;
  performed_by?: string;
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
}

// Stock Entries
export type StockEntryType =
  | 'material_receipt'
  | 'material_issue'
  | 'material_transfer'
  | 'manufacture'
  | 'repack';

export type StockEntryStatus = 'draft' | 'submitted' | 'cancelled';

export interface StockEntryItem {
  id?: string;
  item_id: string;
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
  stock_entry_type: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  posting_date: string;
  posting_time?: string;
  status: string;
  reference_type?: string;
  reference_id?: string;
  remarks?: string;
  total_value?: string;
  expense_account_id?: string;
  cost_center_id?: string;
  is_backflush?: boolean;
  bom_id?: string;
  extra_data?: Record<string, unknown>;
  submitted_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  items: StockEntryItem[];
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
}

// Stock Reconciliations
export interface StockReconciliationItem {
  id?: string;
  item_id: string;
  warehouse_id: string;
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
  purpose: string;
  posting_date: string;
  posting_time?: string;
  status: string;
  expense_account_id?: string;
  difference_account_id?: string;
  remarks?: string;
  extra_data?: Record<string, unknown>;
  submitted_at?: string;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  items: StockReconciliationItem[];
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
}

// Filters
export interface StockLevelFilters {
  search: string;
  warehouseId: string;
}

export interface StockMovementFilters {
  search: string;
  warehouseId: string;
  movementType: string;
}

export interface StockEntryFilters {
  search: string;
  entryType: string;
  status: string;
}

export interface StockReconciliationFilters {
  search: string;
  status: string;
}
