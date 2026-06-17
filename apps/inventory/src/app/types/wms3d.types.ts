// ============================================================
// 3D Warehouse View & Smart Location Engine — TypeScript Types
// Mirrors backend Pydantic schemas in app/schemas/wms_3d.py
// ============================================================

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

// ---- Layout (GET /wms-3d/layout) ----

export interface LayoutWarehouse {
  id: string;
  name: string;
  code: string;
}

export interface LayoutBin {
  id: string;
  code: string;
  full_path: string | null;
  position: Position3D;
  capacity: number;
  available_capacity: number;
  fill_percentage: number;
  is_active: boolean;
  is_reserved: boolean;
  reserved_by_worker_id: string | null;
  items_count: number;
  has_expiring_items: boolean;
}

export interface LayoutLevel {
  id: string;
  code: string;
  name: string | null;
  position: Position3D;
  bins: LayoutBin[];
}

export interface LayoutBay {
  id: string;
  code: string;
  name: string | null;
  position: Position3D;
  levels: LayoutLevel[];
}

export interface LayoutAisle {
  id: string;
  code: string;
  name: string | null;
  position: Position3D;
  orientation: string | null;
  bays: LayoutBay[];
}

export interface LayoutZone {
  id: string;
  code: string;
  name: string | null;
  position: Position3D;
  aisles: LayoutAisle[];
}

export interface LayoutResponse {
  warehouse: LayoutWarehouse;
  zones: LayoutZone[];
}

// ---- Live Status (GET /wms-3d/status) ----

export interface StatusReservedBy {
  worker_id: string;
  expires_in_seconds: number;
}

export interface StatusBin {
  bin_id: string;
  fill_percentage: number;
  is_reserved: boolean;
  reserved_by: StatusReservedBy | null;
}

export interface StatusWorker {
  worker_id: string;
  name: string | null;
  current_bin_id: string | null;
  task_type: string | null;
  last_scan_at: string | null;
}

export interface StatusResponse {
  bins: StatusBin[];
  workers: StatusWorker[];
}

// ---- Suggest (POST /wms-3d/suggest) ----

export interface SuggestRequest {
  task_type: 'put_away' | 'pick';
  item_id: string;
  quantity: number;
  warehouse_id: string;
  worker_id: string;
  batch_number?: string | null;
  exclude_bin_ids?: string[];
  worker_position?: Position3D | null;
  limit?: number;
}

export interface Suggestion {
  rank: number;
  bin_id: string;
  bin_code: string | null;
  position: Position3D;
  score: number;
  reasons: string[];
  available_capacity: number;
  distance_from_worker: number;
  estimated_time_seconds: number;
  batch_number: string | null;
  expiry_date: string | null;
}

export interface SuggestResponse {
  suggestions: Suggestion[];
  strategy_used: string;
  total_candidates_evaluated: number;
  excluded_bins: number;
}

// ---- Reserve / Release ----

export interface ReserveRequest {
  bin_id: string;
  worker_id: string;
  task_id?: string | null;
  task_type?: string | null;
  ttl_seconds?: number;
}

export interface ReservationResponse {
  id: string;
  bin_id: string;
  worker_id: string;
  task_id: string | null;
  task_type: string | null;
  reserved_at: string;
  expires_at: string;
  expires_in_seconds: number;
}

export interface ReleaseRequest {
  bin_id: string;
  worker_id: string;
}

export interface ReleaseResponse {
  released: boolean;
  bin_id: string;
}

// ---- Flat Bin (flattened from layout hierarchy, used by renderer) ----

export interface FlatBin extends LayoutBin {
  zone_id: string;
  zone_code: string;
  zone_name: string | null;
  aisle_id: string;
  aisle_code: string;
  aisle_name: string | null;
  bay_id: string;
  bay_code: string;
  bay_name: string | null;
  level_id: string;
  level_code: string;
  level_name: string | null;
  // Live status overlay (merged from StatusResponse)
  live_fill_pct?: number;
  live_is_reserved?: boolean;
  live_reserved_by?: StatusReservedBy | null;
}
