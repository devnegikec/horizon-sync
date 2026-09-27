/**
 * Layout document (v1) - the JSON input format for the warehouse designer.
 *
 * The document **is** the input format: there is no separate import schema and no
 * translation layer. It is authored by this designer, hand-written by a warehouse
 * engineer, or exported from an existing design, then compiled by `compile.ts`
 * before anything is sent to the server. The server recompiles the same document
 * and remains the authority on apply.
 *
 * Two deliberate choices:
 *
 * - **camelCase field names.** The wire contract keeps the camelCase shape the
 *   designer already emits, and the *same* JSON is compiled by the Python engine in
 *   `core-service/app/layout_design/schema.py`. Using the field names directly as
 *   the contract means the two compilers cannot drift on spelling.
 * - **Bins are never authored.** The document describes racking, levels and runs;
 *   bays and bins are derived, so the two can never disagree.
 *
 * Units are **metres everywhere**, matching `WarehouseLocation.position_x/y/z`.
 *
 * Validation is expressed with zod, which is already this app's validator, so the
 * schema reads as a declaration rather than a branch tree - and every field carries
 * the same default the Pydantic model applies.
 *
 * Design ref: ../../../../../../docs/LAYOUT_JSON_DESIGNER_PLAN.md section 3
 */

import { z } from 'zod';

import { DEFAULT_UTILIZATION } from './geometry';
import { DEFAULT_BIN_CODE_PATTERN, NAMING_SCHEMES, isValidCodePattern } from './naming';

/** The document version this build compiles. */
export const CURRENT_SCHEMA_VERSION = 1;

/** Fallback zone code when an aisle does not declare `zoneCode`. */
export const DEFAULT_ZONE_CODE = '01';

const metadataSchema = z.record(z.string(), z.unknown()).default({});

/**
 * Floor-level origin corner.
 *
 * The default is a *complete* object rather than `{}`: zod returns a `.default()`
 * value as-is instead of re-parsing it through the object schema, so `{}` would
 * leave `x` and `z` undefined and every footprint comparison would become NaN.
 */
export const originSchema = z
  .object({
    x: z.number().default(0),
    z: z.number().default(0),
  })
  .default(() => ({ x: 0, z: 0 }));

export const rackLevelSchema = z.object({
  clearHeightM: z.number().positive(),
  binDepthM: z.number().positive(),
  beamHeightM: z.number().nonnegative().default(0.08),
  maxWeightKg: z.number().positive().optional(),
});

export const rackTypeSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().default(''),
  bayWidthM: z.number().positive(),
  depthM: z.number().positive(),
  uprightWidthM: z.number().positive().default(0.12),
  uprightDepthM: z.number().positive().default(0.12),
  metadata: metadataSchema,
});

export const laneSegmentSchema = z
  .object({
    kind: z.enum(['RACK', 'GAP']),
    startM: z.number().nonnegative(),
    endM: z.number().positive(),
    label: z.string().optional(),
  })
  .refine((segment) => segment.endM > segment.startM, {
    message: 'Lane segment endM must be greater than startM',
  });

export const centerlineSchema = z.object({
  x1: z.number(),
  z1: z.number(),
  x2: z.number(),
  z2: z.number(),
});

export const laneSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1),
  side: z.enum(['LEFT', 'RIGHT']),
  rackTypeId: z.string().min(1),
  startOffsetM: z.number().nonnegative().default(0),
  lengthM: z.number().positive(),
  levels: z.array(rackLevelSchema).min(1),
  segments: z.array(laneSegmentSchema).optional(),
  skipBays: z.array(z.number().int().positive()).default([]),
  binCodePattern: z
    .string()
    .default(DEFAULT_BIN_CODE_PATTERN)
    .refine(isValidCodePattern, {
      message: 'binCodePattern must contain at least one placeholder and only use {warehouse} {aisle} {lane} {side} {bay} {level}',
    }),
  metadata: metadataSchema,
});

export const aisleSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1),
  zoneCode: z.string().min(1).optional(),
  orientation: z.enum(['X', 'Z']),
  centerline: centerlineSchema,
  widthM: z.number().positive(),
  travelDirection: z.enum(['BOTH', 'FORWARD', 'REVERSE']).default('BOTH'),
  lanes: z.array(laneSchema).default([]),
  metadata: metadataSchema,
});

export const obstacleSchema = z.object({
  id: z.string().optional(),
  kind: z.enum(['COLUMN', 'PILLAR', 'WALL', 'OFFICE', 'CUSTOM']).default('CUSTOM'),
  x: z.number(),
  z: z.number(),
  widthM: z.number().positive(),
  depthM: z.number().positive(),
  heightM: z.number().positive(),
  metadata: metadataSchema,
});

export const warehouseSchema = z.object({
  id: z.string().optional(),
  code: z.string().min(1),
  name: z.string().default(''),
  lengthM: z.number().positive(),
  widthM: z.number().positive(),
  heightM: z.number().positive(),
  origin: originSchema,
  metadata: metadataSchema,
});

export const layoutOptionsSchema = z
  .object({
    namingScheme: z.enum(NAMING_SCHEMES).default('wms_typed'),
    defaultZoneCode: z.string().min(1).default(DEFAULT_ZONE_CODE),
    utilization: z.number().positive().default(DEFAULT_UTILIZATION),
  })
  .default(() => ({ namingScheme: 'wms_typed' as const, defaultZoneCode: DEFAULT_ZONE_CODE, utilization: DEFAULT_UTILIZATION }));

export const layoutDocSchema = z.object({
  schemaVersion: z.number().int().default(CURRENT_SCHEMA_VERSION),
  layout: layoutOptionsSchema,
  warehouse: warehouseSchema,
  rackTypes: z.array(rackTypeSchema).default([]),
  obstacles: z.array(obstacleSchema).default([]),
  aisles: z.array(aisleSchema).default([]),
});

export type LayoutOptions = z.infer<typeof layoutOptionsSchema>;
export type LayoutOrigin = z.infer<typeof originSchema>;
export type LayoutWarehouse = z.infer<typeof warehouseSchema>;
export type RackLevel = z.infer<typeof rackLevelSchema>;
export type RackType = z.infer<typeof rackTypeSchema>;
export type LaneSegment = z.infer<typeof laneSegmentSchema>;
export type LaneCenterline = z.infer<typeof centerlineSchema>;
export type Lane = z.infer<typeof laneSchema>;
export type Aisle = z.infer<typeof aisleSchema>;
export type Obstacle = z.infer<typeof obstacleSchema>;
export type LayoutDoc = z.infer<typeof layoutDocSchema>;

export interface ParsedDocument {
  /** The validated document, or `null` when it did not parse. */
  doc: LayoutDoc | null;
  /** Human-readable problems, capped, for a `LAYOUT_DOC_INVALID` diagnostic. */
  issues: string[];
}

/**
 * Validate raw JSON into a `LayoutDoc`.
 *
 * Returns issues instead of throwing, so a bad file is reported through the same
 * diagnostics channel as a bad dimension.
 */
export function parseDocument(raw: unknown): ParsedDocument {
  const result = layoutDocSchema.safeParse(raw);
  if (result.success) {
    return { doc: result.data, issues: [] };
  }
  const issues = result.error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`);
  return { doc: null, issues };
}

/** The zone an aisle belongs to (its own `zoneCode`, else the document default). */
export function zoneCodeFor(doc: LayoutDoc, aisle: Aisle): string {
  return aisle.zoneCode ?? doc.layout.defaultZoneCode;
}

/** Rack types indexed by id. */
export function rackTypeIndex(doc: LayoutDoc): Map<string, RackType> {
  return new Map(doc.rackTypes.map((rackType) => [rackType.id, rackType]));
}

/**
 * A lane's runs, materialising the implicit single RACK run.
 *
 * An omitted `segments` means one continuous RACK run covering `lengthM`. It is
 * materialised at every entry point so a document cannot have two readings.
 */
export function resolvedSegments(lane: Lane): LaneSegment[] {
  if (lane.segments && lane.segments.length > 0) return lane.segments;
  return [{ kind: 'RACK', startM: 0, endM: lane.lengthM }];
}

/** Pitch consumed by a level stack: beams plus clear openings. */
export function stackHeightM(levels: readonly RackLevel[]): number {
  return levels.reduce((total, level) => total + level.beamHeightM + level.clearHeightM, 0);
}

/** Bays that fit in `value` metres at `pitch` metre centres. */
export function floorCount(value: number, pitch: number): number {
  if (pitch <= 0) return 0;
  return Math.floor((value + 1e-4) / pitch);
}

/** Display label for an obstacle, used in diagnostic messages. */
export function obstacleLabel(obstacle: Obstacle): string {
  return obstacle.id ?? `${obstacle.kind}@(${obstacle.x},${obstacle.z})`;
}
