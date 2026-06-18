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
    description: '1 zone, 2 aisles, 24 bins — ideal for small stockrooms',
    config: {
      grid_unit: 1.0,
      zones: [
        {
          code: 'A',
          name: 'Main Storage',
          grid_x: 0,
          grid_y: 0,
          aisles: [
            {
              code: 'A01',
              name: 'Aisle 1',
              orientation: 'x',
              grid_x: 0,
              grid_y: 0,
              num_bays: 4,
              bay_spacing: 1.5,
              num_levels: 3,
              bins_per_level: 1,
              bin_capacity: 100,
            },
            {
              code: 'A02',
              name: 'Aisle 2',
              orientation: 'x',
              grid_x: 0,
              grid_y: 3,
              num_bays: 4,
              bay_spacing: 1.5,
              num_levels: 3,
              bins_per_level: 1,
              bin_capacity: 100,
            },
          ],
        },
      ],
    },
  },
  {
    id: 'medium-warehouse',
    name: 'Medium Warehouse',
    description: '2 zones, 4 aisles, 96 bins — standard distribution center',
    config: {
      grid_unit: 1.0,
      zones: [
        {
          code: 'A',
          name: 'Fast Movers',
          grid_x: 0,
          grid_y: 0,
          aisles: [
            {
              code: 'A01',
              name: 'Aisle 1',
              orientation: 'x',
              grid_x: 0,
              grid_y: 0,
              num_bays: 6,
              bay_spacing: 1.5,
              num_levels: 4,
              bins_per_level: 1,
              bin_capacity: 150,
            },
            {
              code: 'A02',
              name: 'Aisle 2',
              orientation: 'x',
              grid_x: 0,
              grid_y: 3,
              num_bays: 6,
              bay_spacing: 1.5,
              num_levels: 4,
              bins_per_level: 1,
              bin_capacity: 150,
            },
          ],
        },
        {
          code: 'B',
          name: 'Bulk Storage',
          grid_x: 0,
          grid_y: 10,
          aisles: [
            {
              code: 'B01',
              name: 'Aisle 3',
              orientation: 'x',
              grid_x: 0,
              grid_y: 0,
              num_bays: 6,
              bay_spacing: 1.5,
              num_levels: 2,
              bins_per_level: 1,
              bin_capacity: 500,
            },
            {
              code: 'B02',
              name: 'Aisle 4',
              orientation: 'x',
              grid_x: 0,
              grid_y: 3,
              num_bays: 6,
              bay_spacing: 1.5,
              num_levels: 2,
              bins_per_level: 1,
              bin_capacity: 500,
            },
          ],
        },
      ],
    },
  },
  {
    id: 'large-warehouse',
    name: 'Large Warehouse',
    description: '3 zones, 6 aisles, 216 bins — high-density racking layout',
    config: {
      grid_unit: 1.0,
      zones: [
        {
          code: 'A',
          name: 'Picking Zone',
          grid_x: 0,
          grid_y: 0,
          aisles: [
            {
              code: 'A01',
              name: 'Pick Aisle 1',
              orientation: 'x',
              grid_x: 0,
              grid_y: 0,
              num_bays: 8,
              bay_spacing: 1.5,
              num_levels: 4,
              bins_per_level: 2,
              bin_capacity: 100,
            },
            {
              code: 'A02',
              name: 'Pick Aisle 2',
              orientation: 'x',
              grid_x: 0,
              grid_y: 4,
              num_bays: 8,
              bay_spacing: 1.5,
              num_levels: 4,
              bins_per_level: 2,
              bin_capacity: 100,
            },
          ],
        },
        {
          code: 'B',
          name: 'Reserve Storage',
          grid_x: 0,
          grid_y: 12,
          aisles: [
            {
              code: 'B01',
              name: 'Reserve 1',
              orientation: 'y',
              grid_x: 0,
              grid_y: 0,
              num_bays: 6,
              bay_spacing: 2.0,
              num_levels: 5,
              bins_per_level: 1,
              bin_capacity: 300,
            },
            {
              code: 'B02',
              name: 'Reserve 2',
              orientation: 'y',
              grid_x: 4,
              grid_y: 0,
              num_bays: 6,
              bay_spacing: 2.0,
              num_levels: 5,
              bins_per_level: 1,
              bin_capacity: 300,
            },
          ],
        },
        {
          code: 'C',
          name: 'Cold Storage',
          grid_x: 0,
          grid_y: 26,
          aisles: [
            {
              code: 'C01',
              name: 'Cold Aisle 1',
              orientation: 'x',
              grid_x: 0,
              grid_y: 0,
              num_bays: 4,
              bay_spacing: 2.0,
              num_levels: 3,
              bins_per_level: 1,
              bin_capacity: 200,
            },
            {
              code: 'C02',
              name: 'Cold Aisle 2',
              orientation: 'x',
              grid_x: 0,
              grid_y: 4,
              num_bays: 4,
              bay_spacing: 2.0,
              num_levels: 3,
              bins_per_level: 1,
              bin_capacity: 200,
            },
          ],
        },
      ],
    },
  },
  {
    id: 'cross-dock',
    name: 'Cross-Dock Facility',
    description: '2 zones (inbound/outbound), 4 aisles, 48 bins — transit hub',
    config: {
      grid_unit: 1.0,
      zones: [
        {
          code: 'IN',
          name: 'Inbound Staging',
          grid_x: 0,
          grid_y: 0,
          aisles: [
            {
              code: 'IN1',
              name: 'Receiving 1',
              orientation: 'y',
              grid_x: 0,
              grid_y: 0,
              num_bays: 6,
              bay_spacing: 1.5,
              num_levels: 2,
              bins_per_level: 1,
              bin_capacity: 250,
            },
            {
              code: 'IN2',
              name: 'Receiving 2',
              orientation: 'y',
              grid_x: 3,
              grid_y: 0,
              num_bays: 6,
              bay_spacing: 1.5,
              num_levels: 2,
              bins_per_level: 1,
              bin_capacity: 250,
            },
          ],
        },
        {
          code: 'OUT',
          name: 'Outbound Staging',
          grid_x: 10,
          grid_y: 0,
          aisles: [
            {
              code: 'OUT1',
              name: 'Dispatch 1',
              orientation: 'y',
              grid_x: 0,
              grid_y: 0,
              num_bays: 6,
              bay_spacing: 1.5,
              num_levels: 2,
              bins_per_level: 1,
              bin_capacity: 250,
            },
            {
              code: 'OUT2',
              name: 'Dispatch 2',
              orientation: 'y',
              grid_x: 3,
              grid_y: 0,
              num_bays: 6,
              bay_spacing: 1.5,
              num_levels: 2,
              bins_per_level: 1,
              bin_capacity: 250,
            },
          ],
        },
      ],
    },
  },
];
