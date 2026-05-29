// ============================================
// WAREHOUSE LOCATION TYPES
// ============================================

export type LocationType = 'zone' | 'aisle' | 'bay' | 'level' | 'bin';

export interface CreateLocationRequest {
  warehouse_id: string;
  parent_location_id: string | null;
  location_type: LocationType;
  code: string;
  name?: string | null;
  capacity?: number;
  capacity_uom?: string | null;
  position_x?: number;
  position_y?: number;
}

export interface UpdateLocationRequest {
  name?: string | null;
  capacity?: number;
  capacity_uom?: string | null;
  position_x?: number;
  position_y?: number;
}

export interface WarehouseLocation {
  id: string;
  organization_id: string;
  warehouse_id: string;
  parent_location_id: string | null;
  location_type: LocationType;
  code: string;
  full_path: string | null;
  name: string | null;
  capacity: number;
  total_capacity: number;
  available_capacity: number;
  capacity_uom: string | null;
  position_x: number;
  position_y: number;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface LocationTree
  extends Omit<WarehouseLocation, 'organization_id' | 'version' | 'created_at' | 'updated_at'> {
  children: LocationTree[];
}

export interface LocationSummary {
  total_bins: number;
  occupied_bins: number;
  total_capacity: number;
  used_capacity: number;
  available_capacity: number;
  item_count: number;
}

export interface PaginatedLocations {
  locations: WarehouseLocation[];
  pagination: WMSPagination;
}

// ============================================
// BIN STOCK TYPES
// ============================================

export interface AddStockRequest {
  bin_id: string;
  item_id: string;
  quantity: number;
  batch_number?: string | null;
}

export interface RemoveStockRequest {
  bin_id: string;
  item_id: string;
  quantity: number;
  batch_number?: string | null;
}

export interface BinStockLevel {
  id: string;
  organization_id: string;
  bin_location_id: string;
  item_id: string;
  quantity_on_hand: number;
  batch_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface BinStockInfo {
  bin_location_id: string;
  bin_code: string | null;
  bin_name: string | null;
  warehouse_id: string;
  item_id: string;
  quantity_on_hand: number;
  batch_number: string | null;
  bin_capacity: number;
  available_capacity: number;
  is_active: boolean;
  created_at: string;
}

// ============================================
// INBOUND TYPES
// ============================================

export interface StartSessionRequest {
  warehouse_id: string;
  dock_location?: string | null;
}

export interface RecordScanRequest {
  qr_data: string;
  device_type?: string | null;
  os?: string | null;
}

export interface ScanSession {
  id: string;
  organization_id: string;
  session_type: string;
  worker_id: string;
  warehouse_id: string;
  dock_location: string | null;
  status: 'open' | 'closed';
  total_boxes_scanned: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string | null;
}

export interface ScanResult {
  scan_item_id: string;
  session_id: string;
  qr_identifier: string;
  sku: string;
  quantity: number;
  batch_number: string;
  scanned_at: string | null;
  total_boxes_scanned: number;
}

export interface BatchBreakdown {
  batch_number: string;
  quantity: number;
  box_count: number;
}

export interface SKUBreakdown {
  sku: string;
  total_quantity: number;
  total_boxes: number;
  batches: BatchBreakdown[];
}

export interface SessionSummary {
  session_id: string;
  status: string;
  session_type: string;
  warehouse_id: string;
  worker_id: string;
  dock_location: string | null;
  started_at: string | null;
  ended_at: string | null;
  total_boxes: number;
  total_quantity: number;
  items: SKUBreakdown[];
}

export type ReceivingSlipStatus = 'pending_review' | 'pending_putaway' | 'putaway_complete' | 'rejected';

export interface ReceivingSlipItem {
  id: string;
  sku: string;
  batch_number: string | null;
  quantity: number;
  box_count: number;
  flag: string;
  notes: string | null;
}

export interface ReceivingSlip {
  id: string;
  organization_id: string;
  slip_number: string;
  session_id: string;
  warehouse_id: string;
  status: ReceivingSlipStatus;
  total_boxes: number;
  total_items: number;
  rejection_reason: string | null;
  notes: string | null;
  items: ReceivingSlipItem[];
  created_at: string | null;
  updated_at: string | null;
}

export interface PaginatedReceivingSlips {
  receiving_slips: ReceivingSlip[];
  pagination: WMSPagination;
}

// ============================================
// PUT-AWAY TYPES
// ============================================

export type PutAwayStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface PutAwayItem {
  id: string;
  put_away_list_id: string;
  sku: string;
  batch_number: string | null;
  quantity: number;
  suggested_bin_id: string | null;
  suggested_bin_code: string | null;
  status: 'pending' | 'completed' | 'skipped';
  sort_order: number;
}

export interface PutAwayList {
  id: string;
  organization_id: string;
  put_away_list_no: string;
  warehouse_id: string;
  receiving_slip_id: string | null;
  reference_type: string | null;
  reference_id: string | null;
  status: PutAwayStatus;
  total_items: number;
  completed_items: number;
  pending_items: number;
  remarks: string | null;
  assigned_to: string | null;
  items: PutAwayItem[];
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ============================================
// OUTBOUND / PICK LIST TYPES
// ============================================

export type PickListStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';

export interface SAPInvoiceItem {
  item_id: string;
  sku: string;
  quantity: number;
  uom: string;
}

export interface SAPInvoicePayload {
  invoice_reference: string;
  warehouse_id: string;
  items: SAPInvoiceItem[];
}

export interface PickListProgress {
  total_items: number;
  picked_items: number;
  remaining_items: number;
  total_qty: number;
  picked_qty: number;
  remaining_qty: number;
  completion_percentage: number;
}

export interface PickListItem {
  id: string;
  item_id: string;
  warehouse_id: string;
  qty: number;
  picked_qty: number;
  uom: string;
  batch_no: string | null;
  bin_location_id: string | null;
  sort_order: number;
}

export interface PickList {
  id: string;
  organization_id: string;
  pick_list_no: string;
  warehouse_id: string;
  status: PickListStatus;
  pick_date: string | null;
  reference_type: string | null;
  invoice_reference: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  items: PickListItem[];
  progress: PickListProgress | null;
}

export interface PaginatedPickLists {
  pick_lists: PickList[];
  pagination: WMSPagination;
}

export interface PickScanResult {
  pick_list_id: string;
  pick_list_status: string;
  pick_list_item_id: string;
  item_id: string;
  sku: string;
  scanned_qty: number;
  picked_qty: number;
  required_qty: number;
  remaining_qty: number;
  batch: string | null;
}

// ============================================
// GATE VERIFICATION TYPES
// ============================================

export type GateSessionStatus = 'open' | 'verified' | 'cancelled';

export interface GateSessionRequest {
  pick_list_id: string;
  vehicle_number?: string | null;
  driver_name?: string | null;
  driver_contact?: string | null;
}

export interface GateVerificationItem {
  id: string;
  qr_identifier: string;
  sku: string;
  quantity: number;
  status: 'verified' | 'unauthorized';
  scanned_at: string | null;
}

export interface DispatchInfo {
  id: string;
  organization_id: string;
  dispatch_number: string;
  pick_list_id: string;
  gate_session_id: string;
  invoice_reference: string | null;
  vehicle_number: string | null;
  driver_name: string | null;
  dispatched_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface GateSession {
  id: string;
  organization_id: string;
  pick_list_id: string;
  warehouse_id: string;
  worker_id: string;
  vehicle_number: string | null;
  driver_name: string | null;
  driver_contact: string | null;
  status: GateSessionStatus;
  verified_at: string | null;
  items: GateVerificationItem[];
  dispatch: DispatchInfo | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface GateScanResult {
  gate_item_id: string;
  session_id: string;
  qr_identifier: string;
  sku: string;
  quantity: number;
  batch: string | null;
  status: 'verified' | 'unauthorized';
  scanned_at: string | null;
}

export interface GateSessionProgress {
  session_id: string;
  status: string;
  pick_list_id: string;
  vehicle_number: string | null;
  driver_name: string | null;
  total_scanned: number;
  verified_count: number;
  unauthorized_count: number;
  verified_qty: number;
  expected_total_qty: number;
  all_verified: boolean;
  items: GateVerificationItem[];
}

// ============================================
// DISPATCH TYPES
// ============================================

export interface DispatchRecord {
  id: string;
  organization_id: string;
  dispatch_number: string;
  pick_list_id: string;
  gate_session_id: string;
  invoice_reference: string | null;
  vehicle_number: string | null;
  driver_name: string | null;
  dispatched_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DispatchListResponse {
  dispatches: DispatchRecord[];
  pagination: WMSPagination;
}

// ============================================
// WORKER TASK TYPES
// ============================================

export type TaskType = 'put_away' | 'pick';
export type TaskStatus = 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface WorkerTaskCreate {
  task_type: TaskType;
  worker_id: string;
  reference_id: string;
}

export interface WorkerTask {
  id: string;
  organization_id: string;
  task_type: TaskType;
  worker_id: string;
  reference_id: string;
  status: TaskStatus;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface WorkerTaskListResponse {
  tasks: WorkerTask[];
  pagination: WMSPagination;
}

// ============================================
// SHARED TYPES
// ============================================

export interface WMSPagination {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}
