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

/** Individual unit inside a receiving slip group */
export interface ReceivingSlipGroupItem {
  id: string;
  serial_number: string;
  sku: string;
  batch_number: string | null;
  manufacturing_date?: string;
  expiry_date?: string;
  quantity: number;
  box_count: number;
  flag: string;
  notes: string | null;
}

/** QSeal parent summary embedded in a receiving slip group */
export interface ReceivingSlipParentQSeal {
  id: string;
  serial_number: string;
  name: string;
  qseal_type: string;
  capacity: number;
}

/** A group of items under one QSeal parent (box) */
export interface ReceivingSlipGroup {
  parent_qseal: ReceivingSlipParentQSeal;
  product_name: string;
  items: ReceivingSlipGroupItem[];
}

// Keep for backward compat with older slips
export interface ReceivingSlipItem {
  id: string;
  sku: string;
  batch_number: string | null;
  quantity: number;
  box_count: number;
  flag: string;
  notes: string | null;
  parent_qseal?: ReceivingSlipParentQSeal;
}

export interface ReceivingSlip {
  id: string;
  organization_id: string;
  slip_number: string;
  session_id: string;
  warehouse_id: string;
  asn_order_id: string | null;
  asn_order_no: string | null;
  status: ReceivingSlipStatus;
  total_boxes: number;
  total_items: number;
  rejection_reason: string | null;
  notes: string | null;
  /** New grouped format (preferred) */
  groups?: ReceivingSlipGroup[];
  /** Legacy flat format */
  items?: ReceivingSlipItem[];
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
  item_name?: string | null;
  sku?: string | null;
  warehouse_id: string;
  qty: number;
  picked_qty: number;
  uom: string;
  batch_no: string | null;
  bin_location_id: string | null;
  bin_location_path?: string | null;
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
  pick_list_id?: string;
  pick_list_no?: string;
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
// WMS WORKER TYPES
// ============================================

export interface WMSWorker {
  id: string;
  organization_id: string;
  warehouse_id: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  login_username: string | null;
  barcode: string | null;
  qr_code?: string | null;
  employee_id: string | null;
  role: string;
  status: string;
  is_active: boolean;
  last_login_at: string | null;
  extra_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface WMSWorkerListResponse {
  workers: WMSWorker[];
  pagination: WMSPagination;
}

export interface WMSWorkerCreate {
  warehouse_id: string;
  first_name: string;
  last_name: string;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  login_username?: string | null;
  employee_id?: string | null;
  password?: string | null;
  barcode?: string | null;
  qr_code?: string | null;
  organization_id?: string;
  warehouse_ids?: string[];
  warehouse_role?: string;
  role?: string;
  status?: string;
}

export interface WMSWorkerUpdate {
  warehouse_id?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  email?: string | null;
  phone?: string | null;
  login_username?: string | null;
  employee_id?: string | null;
  password?: string | null;
  barcode?: string | null;
  role?: string | null;
  status?: string | null;
  is_active?: boolean | null;
}

// ============================================
// WMS DEVICE TYPES
// ============================================

export interface WMSDevice {
  id: string;
  organization_id: string;
  warehouse_id: string;
  name: string;
  device_code: string;
  device_type: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  os_version: string | null;
  assigned_to_worker_id: string | null;
  status: string;
  last_synced_at: string | null;
  extra_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface WMSDeviceListResponse {
  devices: WMSDevice[];
  pagination: WMSPagination;
}

export interface WMSDeviceCreate {
  warehouse_id: string;
  name: string;
  device_code: string;
  device_type?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serial_number?: string | null;
  os_version?: string | null;
  assigned_to_worker_id?: string | null;
  status?: string;
}

export interface WMSDeviceUpdate {
  warehouse_id?: string | null;
  name?: string | null;
  device_code?: string | null;
  device_type?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  serial_number?: string | null;
  os_version?: string | null;
  assigned_to_worker_id?: string | null;
  status?: string | null;
}

// ============================================
// STOCK COPY / EXPORT / IMPORT TYPES
// ============================================

export interface CopyStockRequest {
  source_bin_id: string;
  target_bin_id: string;
  item_id: string;
  quantity: number;
  batch_number?: string | null;
}

export interface StockImportRow {
  bin_code: string;
  sku: string;
  quantity: number;
  batch_number?: string | null;
}

export interface StockImportRequest {
  warehouse_id: string;
  rows: StockImportRow[];
  overwrite_existing?: boolean;
}

export interface StockImportResult {
  imported: number;
  updated: number;
  errors: string[];
}

// ============================================
// WMS DASHBOARD TYPES
// ============================================

export interface WMSChartBucket {
  label: string;
  qty: number;
  value: number;
}

export interface WMSActivityItem {
  type: string;
  title: string;
  status: string;
  warehouse_id: string | null;
  worker_name: string | null;
  created_at: string | null;
}

export interface WMSActivityPagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface WMSDashboardStats {
  period: string;
  period_start: string;
  period_end: string;
  // New rich fields
  stats?: {
    total_stock_items: number;
    assigned_warehouses: number;
    low_stock_count: number;
    out_of_stock_count: number;
    active_workers: number;
  };
  stock_overview?: {
    inbound: {
      total_qty: number;
      total_value: number;
      receiving_slips: number;
      chart: WMSChartBucket[];
    };
    outbound: {
      total_qty: number;
      total_value: number;
      dispatches: number;
      chart: WMSChartBucket[];
    };
  };
  activity_pagination?: WMSActivityPagination;
  // Legacy fields (backward compat with WMS DashboardPanel)
  inbound: {
    receiving_slips: number;
    items_received: number;
    stock_in_qty: number;
  };
  outbound: {
    dispatches: number;
    stock_out_qty: number;
  };
  current_stock: {
    total_records: number;
    total_quantity: number;
  };
  workers_count: number;
  recent_activity: WMSActivityItem[];
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
