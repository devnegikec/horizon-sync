/**
 * Stock Reconciliation (CSV-based) Types
 * Based on API endpoints:
 *   GET  /stock-reconciliations/template?warehouse_id={uuid}
 *   POST /stock-reconciliations/upload
 *   POST /stock-reconciliations/{id}/confirm
 */

// ── Upload response (discrepancy preview) ──────────────────────────

export interface ReconciliationLineItem {
  id: string;
  item_id: string;
  item_code?: string;
  item_name?: string;
  uom?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  /** system quantity — may come as system_qty or current_qty */
  system_qty?: number;
  current_qty?: number;
  /** actual counted quantity — may come as actual_qty or qty */
  actual_qty?: number;
  qty?: number;
  /** difference — may come as difference or qty_difference */
  difference?: number;
  qty_difference?: number;
}

export interface ReconciliationUploadResponse {
  id: string;
  reconciliation_no?: string;
  warehouse_id?: string;
  warehouse_name?: string;
  status: string;
  /** items may arrive as `items` or `line_items` */
  items?: ReconciliationLineItem[];
  line_items?: ReconciliationLineItem[];
  total_items?: number;
  items_count?: number;
  items_with_discrepancy?: number;
  total_difference?: number;
  created_at?: string;
}

// ── Confirm response ───────────────────────────────────────────────

export interface ReconciliationConfirmResponse {
  id: string;
  reconciliation_no?: string;
  status: string;
  adjustments_made?: number;
  stock_movements_created?: number;
  completed_at?: string;
}
