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
  item_code: string;
  item_name: string;
  uom: string;
  system_qty: number;
  actual_qty: number;
  difference: number;
}

export interface ReconciliationUploadResponse {
  id: string;
  reconciliation_no: string;
  warehouse_id: string;
  warehouse_name: string;
  status: 'pending_review';
  total_items: number;
  items_with_discrepancy: number;
  line_items: ReconciliationLineItem[];
  created_at: string;
}

// ── Confirm response ───────────────────────────────────────────────

export interface ReconciliationConfirmResponse {
  id: string;
  reconciliation_no: string;
  status: 'completed';
  adjustments_made: number;
  stock_movements_created: number;
  completed_at: string;
}
