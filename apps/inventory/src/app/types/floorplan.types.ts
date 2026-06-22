// ============================================================
// Floor Plan Designer — TypeScript Types
// Mirrors backend Pydantic schemas in app/schemas/floor_plan.py
// ============================================================

export interface AisleSpec {
  code: string;
  name?: string | null;
  direction: 'horizontal' | 'vertical';
  position_along: number;
  position_start: number;
  corridor_width: number;
  rows: 'both' | 'left_only' | 'right_only';
  num_levels: number;
  level_height: number;
  bins_per_level: number;
  bin_capacity: number;
  num_bays_per_row: number;
  bay_depth: number;
}

export interface ZoneSpec {
  code: string;
  name?: string | null;
  offset_x: number;
  offset_y: number;
  aisle_spacing: number;
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

export interface FloorPlanUpdateRequest {
  name?: string | null;
  description?: string | null;
  config: FloorPlanConfig;
}

export interface FloorPlanUpdateResponse {
  floor_plan_id: string;
  name: string;
  locations_created: number;
  locations_deleted: number;
  summary: GeneratedLocationSummary;
}

export interface FloorPlanDeleteResponse {
  floor_plan_id: string;
  deleted: boolean;
  locations_deactivated: number;
}

// ---- Default factory (used by the form) ----

export function defaultAisleSpec(): AisleSpec {
  return {
    code: '',
    name: 'New Aisle',
    direction: 'horizontal',
    position_along: 0,
    position_start: 0,
    corridor_width: 3.0,
    rows: 'both',
    num_levels: 5,
    level_height: 1.4,
    bins_per_level: 1,
    bin_capacity: 100,
    num_bays_per_row: 10,
    bay_depth: 1.8,
  };
}

export function defaultZoneSpec(): ZoneSpec {
  const aisle = defaultAisleSpec();
  aisle.code = 'A-01';
  aisle.name = 'Aisle 1';
  aisle.rows = 'both';
  return {
    code: 'Z-01',
    name: null,
    offset_x: 0,
    offset_y: 0,
    aisle_spacing: 6.5,
    aisles: [aisle],
  };
}

export function defaultFloorPlanConfig(): FloorPlanConfig {
  return { grid_unit: 1.0, zones: [defaultZoneSpec()] };
}

// ---- Preloaded layout templates ----

export interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  config: FloorPlanConfig;
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'small-warehouse',
    name: 'Small Warehouse',
    description: '1 zone, 2 aisles (corridor), 5 levels, 100 bins — small stockroom',
    config: { grid_unit: 1.0, zones: [{ code: 'Z-01', name: 'Main Storage', offset_x: 0, offset_y: 0, aisle_spacing: 6.5, aisles: [
      { code: 'A-01', name: 'Aisle 1', direction: 'horizontal', position_along: 0, position_start: 0, corridor_width: 3.0, rows: 'right_only', num_levels: 5, level_height: 1.4, bins_per_level: 1, bin_capacity: 100, num_bays_per_row: 10, bay_depth: 1.8 },
      { code: 'A-02', name: 'Aisle 2', direction: 'horizontal', position_along: 0, position_start: 0, corridor_width: 3.0, rows: 'left_only', num_levels: 5, level_height: 1.4, bins_per_level: 1, bin_capacity: 100, num_bays_per_row: 10, bay_depth: 1.8 },
    ] }] },
  },
  {
    id: 'medium-warehouse',
    name: 'Medium Warehouse',
    description: '2 zones, 4 aisles, 5 levels, 400 bins — standard distribution',
    config: { grid_unit: 1.0, zones: [
      { code: 'Z-01', name: 'Fast Movers', offset_x: 0, offset_y: 0, aisle_spacing: 6.5, aisles: [
        { code: 'A-01', name: 'Aisle 1', direction: 'horizontal', position_along: 0, position_start: 0, corridor_width: 3.0, rows: 'right_only', num_levels: 5, level_height: 1.4, bins_per_level: 1, bin_capacity: 150, num_bays_per_row: 15, bay_depth: 1.8 },
        { code: 'A-02', name: 'Aisle 2', direction: 'horizontal', position_along: 0, position_start: 0, corridor_width: 3.0, rows: 'both', num_levels: 5, level_height: 1.4, bins_per_level: 1, bin_capacity: 150, num_bays_per_row: 15, bay_depth: 1.8 },
      ] },
      { code: 'Z-02', name: 'Bulk Storage', offset_x: 0, offset_y: 50, aisle_spacing: 6.5, aisles: [
        { code: 'A-01', name: 'Aisle 1', direction: 'horizontal', position_along: 0, position_start: 0, corridor_width: 4.0, rows: 'both', num_levels: 3, level_height: 2.0, bins_per_level: 1, bin_capacity: 500, num_bays_per_row: 10, bay_depth: 2.0 },
        { code: 'A-02', name: 'Aisle 2', direction: 'horizontal', position_along: 0, position_start: 0, corridor_width: 4.0, rows: 'left_only', num_levels: 3, level_height: 2.0, bins_per_level: 1, bin_capacity: 500, num_bays_per_row: 10, bay_depth: 2.0 },
      ] },
    ] },
  },
  {
    id: 'large-warehouse',
    name: 'Large Warehouse',
    description: '3 zones, 6 aisles, 5 levels, 900 bins — high-density racking',
    config: { grid_unit: 1.0, zones: [
      { code: 'Z-01', name: 'Picking Zone', offset_x: 0, offset_y: 0, aisle_spacing: 6.5, aisles: [
        { code: 'A-01', name: 'Aisle 1', direction: 'horizontal', position_along: 0, position_start: 0, corridor_width: 3.0, rows: 'right_only', num_levels: 5, level_height: 1.4, bins_per_level: 2, bin_capacity: 100, num_bays_per_row: 20, bay_depth: 1.8 },
        { code: 'A-02', name: 'Aisle 2', direction: 'horizontal', position_along: 0, position_start: 0, corridor_width: 3.0, rows: 'left_only', num_levels: 5, level_height: 1.4, bins_per_level: 2, bin_capacity: 100, num_bays_per_row: 20, bay_depth: 1.8 },
      ] },
      { code: 'Z-02', name: 'Reserve Storage', offset_x: 0, offset_y: 55, aisle_spacing: 7.0, aisles: [
        { code: 'A-01', name: 'Aisle 1', direction: 'horizontal', position_along: 0, position_start: 0, corridor_width: 4.0, rows: 'right_only', num_levels: 6, level_height: 1.4, bins_per_level: 1, bin_capacity: 300, num_bays_per_row: 15, bay_depth: 2.0 },
        { code: 'A-02', name: 'Aisle 2', direction: 'horizontal', position_along: 0, position_start: 0, corridor_width: 4.0, rows: 'left_only', num_levels: 6, level_height: 1.4, bins_per_level: 1, bin_capacity: 300, num_bays_per_row: 15, bay_depth: 2.0 },
      ] },
      { code: 'Z-03', name: 'Cold Storage', offset_x: 0, offset_y: 110, aisle_spacing: 6.5, aisles: [
        { code: 'A-01', name: 'Aisle 1', direction: 'horizontal', position_along: 0, position_start: 0, corridor_width: 3.0, rows: 'right_only', num_levels: 4, level_height: 1.5, bins_per_level: 1, bin_capacity: 200, num_bays_per_row: 12, bay_depth: 1.8 },
        { code: 'A-02', name: 'Aisle 2', direction: 'horizontal', position_along: 0, position_start: 0, corridor_width: 3.0, rows: 'left_only', num_levels: 4, level_height: 1.5, bins_per_level: 1, bin_capacity: 200, num_bays_per_row: 12, bay_depth: 1.8 },
      ] },
    ] },
  },
  {
    id: 'cross-dock',
    name: 'Cross-Dock Facility',
    description: '2 zones (inbound/outbound), 4 aisles, 3 levels, 240 bins — transit hub',
    config: { grid_unit: 1.0, zones: [
      { code: 'Z-01', name: 'Inbound Staging', offset_x: 0, offset_y: 0, aisle_spacing: 6.5, aisles: [
        { code: 'A-01', name: 'Aisle 1', direction: 'vertical', position_along: 0, position_start: 0, corridor_width: 3.5, rows: 'right_only', num_levels: 3, level_height: 1.5, bins_per_level: 1, bin_capacity: 250, num_bays_per_row: 12, bay_depth: 1.8 },
        { code: 'A-02', name: 'Aisle 2', direction: 'vertical', position_along: 0, position_start: 0, corridor_width: 3.5, rows: 'left_only', num_levels: 3, level_height: 1.5, bins_per_level: 1, bin_capacity: 250, num_bays_per_row: 12, bay_depth: 1.8 },
      ] },
      { code: 'Z-02', name: 'Outbound Staging', offset_x: 30, offset_y: 0, aisle_spacing: 6.5, aisles: [
        { code: 'A-01', name: 'Aisle 1', direction: 'vertical', position_along: 0, position_start: 0, corridor_width: 3.5, rows: 'right_only', num_levels: 3, level_height: 1.5, bins_per_level: 1, bin_capacity: 250, num_bays_per_row: 12, bay_depth: 1.8 },
        { code: 'A-02', name: 'Aisle 2', direction: 'vertical', position_along: 0, position_start: 0, corridor_width: 3.5, rows: 'left_only', num_levels: 3, level_height: 1.5, bins_per_level: 1, bin_capacity: 250, num_bays_per_row: 12, bay_depth: 1.8 },
      ] },
    ] },
  },
];
