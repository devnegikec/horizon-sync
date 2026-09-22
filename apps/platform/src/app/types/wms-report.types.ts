/** Shared pagination shape returned by every WMS report endpoint. */
export interface ReportPagination {
    page: number;
    page_size: number;
    total_items: number | null;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export type WmsReportType =
    | 'stock-movements'
    | 'inventory-aging'
    | 'receiving-variance'
    | 'bin-capacity';

// ============================================
// Stock movement report
// ============================================

export interface StockMovementSummary {
    total_in_qty: number;
    total_in_value: number;
    total_out_qty: number;
    total_out_value: number;
    total_transfer_qty: number;
    total_adjustment_qty: number;
}

export interface StockMovementRow {
    id: string;
    performed_at: string | null;
    movement_type: 'in' | 'out' | 'transfer' | 'adjustment';
    quantity: number;
    unit_cost: number | null;
    line_value: number;
    reference_type: string | null;
    reference_id: string | null;
    notes: string | null;
    warehouse_id: string | null;
    warehouse_name: string | null;
    item_id: string | null;
    item_code: string | null;
    item_name: string | null;
    sku: string | null;
}

export interface StockMovementsResponse {
    summary: StockMovementSummary;
    rows: StockMovementRow[];
    pagination: ReportPagination;
}

// ============================================
// Inventory aging report
// ============================================

export interface InventoryAgingSummary {
    idle_item_count: number;
    total_idle_qty: number;
    total_idle_value: number;
    days_idle: number;
}

export interface InventoryAgingRow {
    item_id: string;
    item_code: string | null;
    item_name: string | null;
    sku: string | null;
    warehouse_id: string | null;
    warehouse_name: string | null;
    quantity_on_hand: number;
    quantity_reserved: number;
    quantity_available: number;
    last_moved_at: string | null;
    last_unit_cost: number | null;
    est_value: number;
    days_idle: number | null;
}

export interface InventoryAgingResponse {
    summary: InventoryAgingSummary;
    rows: InventoryAgingRow[];
    pagination: ReportPagination;
}

// ============================================
// Receiving vs ASN variance report
// ============================================

export interface ReceivingVarianceSummary {
    total_expected_qty: number;
    total_received_qty: number;
    total_variance_qty: number;
    line_count: number;
    short_line_count: number;
    excess_line_count: number;
}

export interface ReceivingVarianceRow {
    asn_order_id: string;
    asn_order_no: string | null;
    order_date: string | null;
    asn_status: string | null;
    warehouse_id: string | null;
    warehouse_name: string | null;
    item_id: string;
    item_code: string | null;
    item_name: string | null;
    sku: string | null;
    expected_qty: number;
    received_qty: number;
    variance_qty: number;
}

export interface ReceivingVarianceResponse {
    summary: ReceivingVarianceSummary;
    rows: ReceivingVarianceRow[];
    pagination: ReportPagination;
}

// ============================================
// Bin capacity utilization report
// ============================================

export interface BinCapacitySummary {
    total_bins: number;
    bins_with_volume_capacity: number;
    bins_with_weight_capacity: number;
    total_capacity_cc: number;
    total_occupied_cc: number;
    volume_utilization_pct: number;
    total_capacity_grams: number;
    total_occupied_grams: number;
    weight_utilization_pct: number | null;
    over_utilized_bins: number;
    full_bins: number;
}

export interface BinCapacityRow {
    bin_id: string;
    code: string | null;
    full_path: string | null;
    location_type: string | null;
    is_pickable: boolean;
    unit_count: number;
    master_pack_count: number;
    occupied_cc: number;
    capacity_cc: number | null;
    volume_utilization_pct: number | null;
    occupied_grams: number;
    capacity_grams: number | null;
    weight_utilization_pct: number | null;
}

export interface BinCapacityResponse {
    summary: BinCapacitySummary;
    rows: BinCapacityRow[];
    pagination: ReportPagination;
}
