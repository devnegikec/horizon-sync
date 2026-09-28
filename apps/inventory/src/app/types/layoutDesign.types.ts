// ============================================================
// JSON Layout Designer - API wire types
// Mirrors backend Pydantic schemas in
// core-service/app/schemas/layout_design.py
//
// These are the *wire* shapes (snake_case). The compiler's own types in
// `features/layout-designer/layout-core` are camelCase and deliberately separate:
// the engine is pure and network-free, and the service layer converts between them
// in one place (`services/layoutImport.ts`).
// ============================================================

export type LayoutSeverity = 'error' | 'warning';

/** A pointer back at the entity a diagnostic is about. */
export interface LayoutEntityRef {
  kind: string;
  id: string;
  label: string;
}

/** One structured finding about a layout document. */
export interface LayoutDiagnostic {
  code: string;
  severity: LayoutSeverity;
  message: string;
  entity_refs: LayoutEntityRef[];
  data?: Record<string, unknown> | null;
}

/** Headline counts for the preview header. */
export interface LayoutSummary {
  zones: number;
  aisles: number;
  lanes: number;
  rack_types: number;
  obstacles: number;
  bays: number;
  active_bays: number;
  levels: number;
  bins: number;
  errors: number;
  warnings: number;
}

/** A derived zone. */
export interface LayoutZone {
  code: string;
  ordinal: number;
  path: string;
  aisle_count: number;
}

/** One derived storage position, with its WMS path. */
export interface LayoutBin {
  path: string;
  code: string;
  label: string;
  aisle_code: string;
  lane_code: string;
  side: string;
  bay_seq: number;
  level_index: number;
  level_path: string;
  x: number;
  y: number;
  z: number;
  capacity_m3: number;
  usable_volume_m3: number;
  max_volume_cc: number;
  max_weight_kg: number | null;
}

/** An obstacle as a box, for the plan and 3D overlay. */
export interface LayoutObstacle {
  id: string;
  kind: string;
  x: number;
  z: number;
  width_m: number;
  depth_m: number;
  height_m: number;
}

/** An aisle centreline, for the 2D plan. */
export interface LayoutAislePlan {
  code: string;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  width_m: number;
}

/** Everything needed to draw the document without loading it in 3D. */
export interface LayoutPlan {
  footprint_length_m: number;
  footprint_width_m: number;
  aisles: LayoutAislePlan[];
  obstacles: LayoutObstacle[];
}

/** The compiler's verdict on a document. */
export interface LayoutValidateResponse {
  valid: boolean;
  applyable: boolean;
  summary: LayoutSummary;
  diagnostics: LayoutDiagnostic[];
  sample_bin_paths: string[];
}

/** The verdict plus enough geometry to render the document. */
export interface LayoutPreviewResponse extends LayoutValidateResponse {
  zones: LayoutZone[];
  bins: LayoutBin[];
  plan: LayoutPlan;
}

export interface LayoutApplyRequest {
  warehouse_id: string;
  document: Record<string, unknown>;
  name: string;
  description?: string | null;
  replace_existing: boolean;
}

/** What the apply actually wrote. */
export interface LayoutApplyResponse {
  floor_plan_id: string;
  locations_created: number;
  locations_updated: number;
  locations_deactivated: number;
  summary: LayoutSummary;
  sample_bin_paths: string[];
}

/** A registered diagnostic rule. */
export interface LayoutRule {
  code: string;
  severity: LayoutSeverity;
  description: string;
}

/** An import template served by the backend. */
export interface LayoutExample {
  name: string;
  document: Record<string, unknown>;
}
