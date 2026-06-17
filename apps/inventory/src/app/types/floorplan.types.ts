// ============================================================
// Floor Plan Designer — TypeScript Types
// Mirrors backend Pydantic schemas in app/schemas/floor_plan.py
// ============================================================

export interface AisleSpec {
  code: string;
  name?: string | null;
  orientation: 'x' | 'y';
  grid_x: number;
  grid_y: number;
  num_bays: number;
  bay_spacing: number;
  num_levels: number;
  bins_per_level: number;
  bin_capacity: number;
}

export interface ZoneSpec {
  code: string;
  name?: string | null;
  grid_x: number;
  grid_y: number;
  aisles: AisleSpec[];
}

export interface FloorPlanConfig {
  grid_unit: number;
  zones: ZoneSpec[];
}

// ---- Requests ----

export interface FloorPlanPreviewRequest {
  warehouse_id: string;
  config: FloorPlanConfig;
}

export interface FloorPlanApplyRequest {
  warehouse_id: string;
  name: string;
  description?: string | null;
  config: FloorPlanConfig;
  replace_existing: boolean;
}

// ---- Responses ----

export interface GeneratedLocationSummary {
  zone_count: number;
  aisle_count: number;
  bay_count: number;
  level_count: number;
  bin_count: number;
  sample_bin_codes: string[];
}

export interface FloorPlanPreviewResponse {
  warehouse_id: string;
  summary: GeneratedLocationSummary;
  config: FloorPlanConfig;
}

export interface FloorPlanResponse {
  id: string;
  warehouse_id: string;
  name: string;
  description: string | null;
  config: FloorPlanConfig;
  generated_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface FloorPlanApplyResponse {
  floor_plan_id: string;
  locations_created: number;
  locations_deleted: number;
  summary: GeneratedLocationSummary;
}

// ---- Default factory (used by the form) ----

export function defaultAisleSpec(): AisleSpec {
  return {
    code: '',
    name: null,
    orientation: 'x',
    grid_x: 0,
    grid_y: 0,
    num_bays: 4,
    bay_spacing: 1.5,
    num_levels: 3,
    bins_per_level: 1,
    bin_capacity: 100,
  };
}

export function defaultZoneSpec(): ZoneSpec {
  return {
    code: '',
    name: null,
    grid_x: 0,
    grid_y: 0,
    aisles: [defaultAisleSpec()],
  };
}

export function defaultFloorPlanConfig(): FloorPlanConfig {
  return { grid_unit: 1.0, zones: [defaultZoneSpec()] };
}
