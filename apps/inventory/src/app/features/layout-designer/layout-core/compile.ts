/**
 * Layout document compiler.
 *
 * `buildLayout(document)` turns a layout document into bays, bins, WMS location
 * paths and a diagnostics list. It is **pure and deterministic**: no clock, no
 * randomness, no network - the same document always produces the same output.
 *
 * This mirrors `core-service/app/layout_design/compile.py`. The two are kept honest
 * by shared fixture files that both test suites assert against, each comparing the
 * *full* diagnostics list (code, severity, order) so a divergence fails loudly on
 * one side.
 *
 * The backend recompiles the posted document and is the authority on apply, so a
 * divergence here can only affect the preview - never the stored warehouse.
 *
 * Design ref: ../../../../../../docs/LAYOUT_JSON_DESIGNER_PLAN.md sections 3 and 4
 */

import {
  MAX_DIAGNOSTICS_PER_CODE,
  MIN_AISLE_WIDTH_M,
  CC_PER_M3,
  DEFAULT_UTILIZATION,
  EPS,
  aabb,
  contains,
  isAxisAligned,
  normalize2,
  orientedRectAabb,
  overlapArea,
  overlaps,
  perpendicularLeft,
  perpendicularRight,
  roundMetric,
  type AABB,
  type Vec2,
} from './geometry';
import { UnsupportedSchemaVersionError, migrateDocument } from './migrate';
import { formatBinCode, joinPath, wmsSegment, type NamingScheme } from './naming';
import { RULES, type RuleSeverity } from './rules';
import {
  CURRENT_SCHEMA_VERSION,
  floorCount,
  obstacleLabel,
  parseDocument,
  rackTypeIndex,
  resolvedSegments,
  stackHeightM,
  zoneCodeFor,
  type Aisle,
  type Lane,
  type LaneSegment,
  type LayoutDoc,
  type Obstacle,
  type RackType,
} from './schema';

// ===========================================
// DIAGNOSTICS
// ===========================================

/** A pointer back at the entity a diagnostic is about. */
export interface EntityRef {
  kind: string;
  id: string;
  label: string;
}

/** One structured finding about a layout document. */
export interface Diagnostic {
  code: string;
  severity: RuleSeverity;
  message: string;
  entityRefs: EntityRef[];
  data?: Record<string, unknown>;
}

/**
 * Collects diagnostics, de-duplicating floods.
 *
 * One bad parameter on a 1,500-bin document must not emit 1,500 messages, so
 * repeats of the same code are capped and summarised by a single
 * `DIAGNOSTICS_TRUNCATED` warning.
 */
export class DiagnosticCollector {
  private readonly items: Diagnostic[] = [];
  private readonly counts = new Map<string, number>();
  private readonly truncated = new Map<string, number>();

  constructor(private readonly maxPerCode: number = MAX_DIAGNOSTICS_PER_CODE) {}

  error(code: string, message: string, entityRefs: EntityRef[] = [], data?: Record<string, unknown>): void {
    this.add(code, 'error', message, entityRefs, data);
  }

  warn(code: string, message: string, entityRefs: EntityRef[] = [], data?: Record<string, unknown>): void {
    this.add(code, 'warning', message, entityRefs, data);
  }

  private add(code: string, severity: RuleSeverity, message: string, entityRefs: EntityRef[], data?: Record<string, unknown>): void {
    const definition = RULES[code];
    if (!definition) throw new Error(`Unknown layout rule code: ${code}`);
    if (definition.severity !== severity) {
      throw new Error(`Rule ${code} is registered as '${definition.severity}' but was reported as '${severity}'`);
    }

    const seen = this.counts.get(code) ?? 0;
    this.counts.set(code, seen + 1);
    if (seen >= this.maxPerCode) {
      this.truncated.set(code, seen + 1);
      return;
    }
    this.items.push({ code, severity: definition.severity, message, entityRefs, ...(data ? { data } : {}) });
  }

  /** Every collected diagnostic, with truncation summaries appended. */
  all(): Diagnostic[] {
    const items = [...this.items];
    const truncatedRule = RULES.DIAGNOSTICS_TRUNCATED;
    for (const [code, total] of this.truncated) {
      items.push({
        code: truncatedRule.code,
        severity: truncatedRule.severity,
        message: `${total} instances of ${code} were suppressed after the first ${this.maxPerCode}`,
        entityRefs: [],
        data: { code, suppressed: total - this.maxPerCode },
      });
    }
    return items;
  }

  get errorCount(): number {
    return this.items.filter((item) => item.severity === 'error').length;
  }

  get warningCount(): number {
    return this.items.filter((item) => item.severity === 'warning').length;
  }
}

// ===========================================
// COMPILED SHAPES
// ===========================================

/** A zone, derived from the aisles' `zoneCode` values. */
export interface CompiledZone {
  code: string;
  ordinal: number;
  path: string;
  aisleCount: number;
}

/**
 * One bay of one rack lane - a position along a rack row.
 *
 * Careful with the word "bay": here it is the *document* sense. In the WMS
 * hierarchy the `bay` location is the **rack row itself** (the lane), matching
 * `FloorPlanGeneratorService`'s `B01`/`B02` side codes, and each of these positions
 * becomes a **bin** under a level. That mapping is what keeps the document's bin
 * count equal to the WMS bin count.
 */
export interface CompiledBay {
  zoneCode: string;
  aisleId: string;
  aisleCode: string;
  laneCode: string;
  side: string;
  seq: number;
  isSkipped: boolean;
  inRackRun: boolean;
  centerX: number;
  centerZ: number;
  widthM: number;
  depthM: number;
  rotationDeg: number;
  zonePath: string;
  aislePath: string;
  path: string;
}

/** One storage position, with its WMS path and physical limits. */
export interface CompiledBin {
  label: string;
  warehouseCode: string;
  zoneCode: string;
  aisleCode: string;
  laneCode: string;
  side: string;
  baySeq: number;
  levelIndex: number;
  centerX: number;
  centerY: number;
  centerZ: number;
  widthM: number;
  heightM: number;
  depthM: number;
  rotationDeg: number;
  capacityM3: number;
  usableVolumeM3: number;
  maxVolumeCc: number;
  maxWeightKg: number | null;
  levelPath: string;
  path: string;
}

export interface CompiledLayout {
  doc: LayoutDoc | null;
  zones: CompiledZone[];
  bays: CompiledBay[];
  bins: CompiledBin[];
  diagnostics: Diagnostic[];
}

export interface LayoutSummary {
  zones: number;
  aisles: number;
  lanes: number;
  rackTypes: number;
  obstacles: number;
  bays: number;
  activeBays: number;
  levels: number;
  bins: number;
  errors: number;
  warnings: number;
}

// ===========================================
// RESULT HELPERS
// ===========================================

export function errorCount(compiled: CompiledLayout): number {
  return compiled.diagnostics.filter((item) => item.severity === 'error').length;
}

export function warningCount(compiled: CompiledLayout): number {
  return compiled.diagnostics.filter((item) => item.severity === 'warning').length;
}

/** True when the document may be applied (no blocking diagnostics). */
export function isApplyable(compiled: CompiledLayout): boolean {
  return errorCount(compiled) === 0;
}

export function activeBays(compiled: CompiledLayout): CompiledBay[] {
  return compiled.bays.filter((bay) => bay.inRackRun && !bay.isSkipped);
}

export function summaryOf(compiled: CompiledLayout): LayoutSummary {
  const doc = compiled.doc;
  return {
    zones: compiled.zones.length,
    aisles: doc ? doc.aisles.length : 0,
    lanes: doc ? doc.aisles.reduce((total, aisle) => total + aisle.lanes.length, 0) : 0,
    rackTypes: doc ? doc.rackTypes.length : 0,
    obstacles: doc ? doc.obstacles.length : 0,
    bays: compiled.bays.length,
    activeBays: activeBays(compiled).length,
    levels: doc ? doc.aisles.reduce((total, aisle) => total + aisle.lanes.reduce((sum, lane) => sum + lane.levels.length, 0), 0) : 0,
    bins: compiled.bins.length,
    errors: errorCount(compiled),
    warnings: warningCount(compiled),
  };
}

/** The first `limit` bin paths, so a designer can confirm naming. */
export function sampleBinPaths(compiled: CompiledLayout, limit = 8): string[] {
  return compiled.bins.slice(0, limit).map((bin) => bin.path);
}

/** The code that blocked an apply, or `null` when nothing blocked it. */
export function blockingCode(compiled: CompiledLayout): string | null {
  const blocking = compiled.diagnostics.find((item) => item.severity === 'error');
  return blocking ? blocking.code : null;
}

// ===========================================
// COMPILER
// ===========================================

interface ObstacleBox {
  obstacle: Obstacle;
  rect: AABB;
}

interface CompileState {
  doc: LayoutDoc;
  scheme: NamingScheme;
  utilization: number;
  footprint: AABB;
  obstacleBoxes: ObstacleBox[];
  rackTypes: Map<string, RackType>;
  zones: CompiledZone[];
  bays: CompiledBay[];
  bins: CompiledBin[];
  bayRects: Array<{ key: string; rect: AABB }>;
  seenAisleCodes: Set<string>;
  codeCounts: Map<string, number>;
  codeFirstSeen: Map<string, EntityRef>;
  collector: DiagnosticCollector;
}

interface AisleGeometry {
  forward: Vec2;
  aisleLength: number;
  origin: Vec2;
  perpLeft: Vec2;
  halfWidth: number;
  rotationDeg: number;
}

function emptyLayout(diagnostics: Diagnostic[], doc: LayoutDoc | null = null): CompiledLayout {
  return { doc, zones: [], bays: [], bins: [], diagnostics };
}

function diagnosticOf(code: string, message: string, data?: Record<string, unknown>): Diagnostic {
  const definition = RULES[code];
  return { code, severity: definition ? definition.severity : 'error', message, entityRefs: [], ...(data ? { data } : {}) };
}

/**
 * Compile a layout document into bays, bins, WMS paths and diagnostics.
 *
 * Never throws for malformed input: a document that cannot be parsed, or whose
 * `schemaVersion` is unsupported, comes back as an empty layout carrying the
 * relevant error diagnostic.
 */
export function buildLayout(raw: unknown): CompiledLayout {
  let migrated: unknown;
  try {
    migrated = migrateDocument(raw);
  } catch (error) {
    if (error instanceof UnsupportedSchemaVersionError) {
      return emptyLayout([diagnosticOf('SCHEMA_VERSION_UNSUPPORTED', error.message, { schemaVersion: error.version })]);
    }
    throw error;
  }

  const { doc, issues } = parseDocument(migrated);
  if (!doc) {
    return emptyLayout([diagnosticOf('LAYOUT_DOC_INVALID', issues.join('; '), { errorCount: issues.length })]);
  }
  if (doc.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return emptyLayout(
      [
        diagnosticOf(
          'SCHEMA_VERSION_UNSUPPORTED',
          `Document schemaVersion ${doc.schemaVersion} is not supported; this build compiles version ${CURRENT_SCHEMA_VERSION}`,
          { schemaVersion: doc.schemaVersion },
        ),
      ],
      doc,
    );
  }

  return compileDocument(doc);
}

function compileDocument(doc: LayoutDoc): CompiledLayout {
  const collector = new DiagnosticCollector();
  const warehouse = doc.warehouse;
  const warehouseRef: EntityRef = { kind: 'warehouse', id: warehouse.id ?? warehouse.code, label: warehouse.code };

  const rackTypes = rackTypeIndex(doc);
  if (rackTypes.size === 0 && doc.aisles.some((aisle) => aisle.lanes.length > 0)) {
    collector.error('NO_RACK_TYPES_DEFINED', 'Aisles have lanes but the document defines no rack types', [warehouseRef]);
  }

  const state: CompileState = {
    doc,
    scheme: doc.layout.namingScheme,
    utilization: doc.layout.utilization || DEFAULT_UTILIZATION,
    footprint: aabb(warehouse.origin.x, warehouse.origin.z, warehouse.origin.x + warehouse.lengthM, warehouse.origin.z + warehouse.widthM),
    obstacleBoxes: doc.obstacles.map((obstacle) => ({
      obstacle,
      rect: aabb(obstacle.x, obstacle.z, obstacle.x + obstacle.widthM, obstacle.z + obstacle.depthM),
    })),
    rackTypes,
    zones: [],
    bays: [],
    bins: [],
    bayRects: [],
    seenAisleCodes: new Set<string>(),
    codeCounts: new Map(),
    codeFirstSeen: new Map(),
    collector,
  };

  const zoneOrdinals = computeZoneOrdinals(doc, collector);
  state.zones = buildZones(zoneOrdinals, countAislesPerZone(doc), state.scheme);

  doc.aisles.forEach((aisle, index) => compileAisle(state, aisle, index + 1, zoneOrdinals));
  reportDuplicateBinCodes(state, warehouseRef);
  reportLaneOverlaps(state);

  return { doc, zones: state.zones, bays: state.bays, bins: state.bins, diagnostics: collector.all() };
}

function countAislesPerZone(doc: LayoutDoc): Map<string, number> {
  const counts = new Map<string, number>();
  for (const aisle of doc.aisles) {
    const zoneCode = zoneCodeFor(doc, aisle);
    counts.set(zoneCode, (counts.get(zoneCode) ?? 0) + 1);
  }
  return counts;
}

function computeZoneOrdinals(doc: LayoutDoc, collector: DiagnosticCollector): Map<string, number> {
  const ordinals = new Map<string, number>();
  const used = new Map<number, string>();

  for (const aisle of doc.aisles) {
    const zoneCode = zoneCodeFor(doc, aisle);
    if (ordinals.has(zoneCode)) continue;

    const digits = /(\d+)$/.exec(zoneCode);
    let ordinal = digits ? Number(digits[1]) : ordinals.size + 1;
    const owner = used.get(ordinal);
    if (owner !== undefined && owner !== zoneCode) {
      collector.error(
        'ZONE_CODE_DUPLICATE',
        `Zone codes '${owner}' and '${zoneCode}' would both produce the path segment for ordinal ${ordinal}`,
        [],
        { ordinal },
      );
      ordinal = Math.max(...used.keys()) + 1;
    }
    used.set(ordinal, zoneCode);
    ordinals.set(zoneCode, ordinal);
  }

  return ordinals;
}

function buildZones(ordinals: Map<string, number>, aisleCounts: Map<string, number>, scheme: NamingScheme): CompiledZone[] {
  return [...ordinals.entries()].map(([code, ordinal]) => ({
    code,
    ordinal,
    path: wmsSegment('zone', ordinal, code, scheme),
    aisleCount: aisleCounts.get(code) ?? 0,
  }));
}

function compileAisle(state: CompileState, aisle: Aisle, aisleIndex: number, zoneOrdinals: Map<string, number>): void {
  const aisleRef: EntityRef = { kind: 'aisle', id: aisle.id ?? aisle.code, label: aisle.code };
  if (state.seenAisleCodes.has(aisle.code)) {
    state.collector.error('AISLE_CODE_DUPLICATE', `Aisle code '${aisle.code}' is used more than once`, [aisleRef]);
  }
  state.seenAisleCodes.add(aisle.code);

  const geometry = measureAisle(state, aisle, aisleRef);
  if (!geometry) return;

  const zoneCode = zoneCodeFor(state.doc, aisle);
  const zonePath = wmsSegment('zone', zoneOrdinals.get(zoneCode) ?? 1, zoneCode, state.scheme);
  const aislePath = joinPath(zonePath, wmsSegment('aisle', aisleIndex, aisle.code, state.scheme));

  aisle.lanes.forEach((lane, index) => {
    compileLane(state, { aisle, lane, laneIndex: index + 1, geometry, zoneCode, zonePath, aislePath });
  });
}

function measureAisle(state: CompileState, aisle: Aisle, aisleRef: EntityRef): AisleGeometry | null {
  const deltaX = aisle.centerline.x2 - aisle.centerline.x1;
  const deltaZ = aisle.centerline.z2 - aisle.centerline.z1;
  const forward = normalize2(deltaX, deltaZ);

  if (!forward) {
    state.collector.error('AISLE_ZERO_LENGTH', `Aisle '${aisle.code}' has a zero-length centerline`, [aisleRef]);
    return null;
  }
  if (!isAxisAligned(forward)) {
    state.collector.error(
      'AISLE_NOT_AXIS_ALIGNED',
      `Aisle '${aisle.code}' must run exactly along X or Z; v1 does not support diagonal aisles`,
      [aisleRef],
    );
    return null;
  }

  const derivedOrientation = Math.abs(forward[0]) > Math.abs(forward[1]) ? 'X' : 'Z';
  if (derivedOrientation !== aisle.orientation) {
    state.collector.error(
      'AISLE_ORIENTATION_MISMATCH',
      `Aisle '${aisle.code}' declares orientation '${aisle.orientation}' but its centerline runs along ${derivedOrientation}`,
      [aisleRef],
      { declared: aisle.orientation, derived: derivedOrientation },
    );
  }

  if (aisle.widthM < MIN_AISLE_WIDTH_M) {
    state.collector.warn(
      'AISLE_TOO_NARROW',
      `Aisle '${aisle.code}' is ${roundMetric(aisle.widthM)} m wide; under ${MIN_AISLE_WIDTH_M} m is tight for a counterbalance forklift`,
      [aisleRef],
    );
  }
  if (aisle.lanes.length === 0) {
    state.collector.warn('AISLE_WITHOUT_LANES', `Aisle '${aisle.code}' has no lanes`, [aisleRef]);
  }

  const aisleLength = Math.hypot(deltaX, deltaZ);
  const origin: Vec2 = [aisle.centerline.x1, aisle.centerline.z1];
  const perpLeft = perpendicularLeft(forward);
  const halfWidth = aisle.widthM / 2;

  const corridor = orientedRectAabb(origin, forward, perpLeft, 0, aisleLength, -halfWidth, halfWidth);
  reportCorridorConflicts(state, aisle, aisleRef, corridor);

  return { forward, aisleLength, origin, perpLeft, halfWidth, rotationDeg: derivedOrientation === 'X' ? 0 : 90 };
}

/** Reports a corridor that leaves the building or runs through an obstacle. */
function reportCorridorConflicts(state: CompileState, aisle: Aisle, aisleRef: EntityRef, corridor: AABB): void {
  if (!contains(state.footprint, corridor)) {
    state.collector.error('AISLE_OUT_OF_FOOTPRINT', `Aisle '${aisle.code}' extends beyond the warehouse footprint`, [aisleRef]);
  }
  for (const box of state.obstacleBoxes) {
    if (overlaps(corridor, box.rect)) {
      state.collector.error(
        'AISLE_OBSTACLE_OVERLAP',
        `Aisle '${aisle.code}' intersects obstacle '${obstacleLabel(box.obstacle)}'`,
        [aisleRef, { kind: 'obstacle', id: obstacleLabel(box.obstacle), label: box.obstacle.kind }],
      );
    }
  }
}

interface LaneTarget {
  aisle: Aisle;
  lane: Lane;
  laneIndex: number;
  geometry: AisleGeometry;
  zoneCode: string;
  zonePath: string;
  aislePath: string;
}

/** Measures a lane's levels, reporting depth and height problems. */
function measureLevels(state: CompileState, lane: Lane, rackType: RackType, laneRef: EntityRef): number {
  lane.levels.forEach((level, index) => {
    if (level.binDepthM > rackType.depthM + EPS) {
      state.collector.warn(
        'LEVEL_DEPTH_EXCEEDS_RACK',
        `Level ${index + 1} of lane '${lane.code}' is ${roundMetric(level.binDepthM)} m deep but rack type '${rackType.code}' is ${roundMetric(rackType.depthM)} m deep`,
        [laneRef, { kind: 'level', id: `${lane.id ?? lane.code}:${index}`, label: `L${String(index + 1).padStart(2, '0')}` }],
      );
    }
  });

  const stackHeight = stackHeightM(lane.levels);
  if (stackHeight > state.doc.warehouse.heightM + EPS) {
    state.collector.error(
      'LEVEL_STACK_EXCEEDS_HEIGHT',
      `Lane '${lane.code}' stacks to ${roundMetric(stackHeight)} m but the warehouse is ${roundMetric(state.doc.warehouse.heightM)} m tall`,
      [laneRef, { kind: 'warehouse', id: state.doc.warehouse.id ?? state.doc.warehouse.code, label: state.doc.warehouse.code }],
      { stackHeightM: roundMetric(stackHeight), warehouseHeightM: state.doc.warehouse.heightM },
    );
  }
  return stackHeight;
}

function compileLane(state: CompileState, target: LaneTarget): void {
  const { lane, aisle, geometry } = target;
  const laneRef: EntityRef = { kind: 'lane', id: lane.id ?? lane.code, label: lane.code };

  const rackType = state.rackTypes.get(lane.rackTypeId);
  if (!rackType) {
    state.collector.error('LANE_UNKNOWN_RACK_TYPE', `Lane '${lane.code}' references unknown rack type '${lane.rackTypeId}'`, [laneRef]);
    return;
  }

  if (lane.startOffsetM + lane.lengthM > geometry.aisleLength + EPS) {
    state.collector.error(
      'LANE_RUN_EXCEEDS_AISLE',
      `Lane '${lane.code}' runs ${roundMetric(lane.startOffsetM + lane.lengthM)} m but aisle '${aisle.code}' is only ${roundMetric(geometry.aisleLength)} m long`,
      [laneRef, { kind: 'aisle', id: aisle.id ?? aisle.code, label: aisle.code }],
    );
  }

  measureLevels(state, lane, rackType, laneRef);

  const bayCount = floorCount(lane.lengthM, rackType.bayWidthM);
  if (bayCount === 0) {
    state.collector.warn(
      'LANE_ZERO_BAYS',
      `Lane '${lane.code}' is shorter than one ${roundMetric(rackType.bayWidthM)} m bay`,
      [laneRef],
    );
    return;
  }

  const rackSegments = resolvedSegments(lane).filter((segment) => segment.kind === 'RACK');
  if (rackSegments.length === 0) {
    state.collector.warn('LANE_HAS_NO_RACK_SEGMENT', `Lane '${lane.code}' has no RACK segment, so it produces no bins`, [laneRef]);
  }

  const perp = lane.side === 'LEFT' ? geometry.perpLeft : perpendicularRight(geometry.forward);
  const laneOffset = geometry.halfWidth + rackType.depthM / 2;
  const bayPath = joinPath(target.aislePath, wmsSegment('bay', target.laneIndex, lane.code, state.scheme));
  const bayKey = `${aisle.code}/${lane.code}`;

  for (let index = 0; index < bayCount; index += 1) {
    compileBay(state, { target, rackType, rackSegments, perp, laneOffset, bayPath, bayKey, index, laneRef });
  }
}

interface BayTarget {
  target: LaneTarget;
  rackType: RackType;
  rackSegments: LaneSegment[];
  perp: Vec2;
  laneOffset: number;
  bayPath: string;
  bayKey: string;
  index: number;
  laneRef: EntityRef;
}

function compileBay(state: CompileState, bay: BayTarget): void {
  const { target, rackType, index } = bay;
  const { lane, aisle, geometry } = target;
  const baySeq = index + 1;
  const centerAlong = (index + 0.5) * rackType.bayWidthM;
  const inRackRun = bay.rackSegments.some((segment) => centerAlong >= segment.startM - EPS && centerAlong <= segment.endM + EPS);
  const isSkipped = lane.skipBays.includes(baySeq);
  const offsetAlong = lane.startOffsetM + centerAlong;
  const cx = geometry.origin[0] + geometry.forward[0] * offsetAlong + bay.perp[0] * bay.laneOffset;
  const cz = geometry.origin[1] + geometry.forward[1] * offsetAlong + bay.perp[1] * bay.laneOffset;

  state.bays.push({
    zoneCode: target.zoneCode,
    aisleId: aisle.id ?? aisle.code,
    aisleCode: aisle.code,
    laneCode: lane.code,
    side: lane.side,
    seq: baySeq,
    isSkipped,
    inRackRun,
    centerX: roundMetric(cx),
    centerZ: roundMetric(cz),
    widthM: rackType.bayWidthM,
    depthM: rackType.depthM,
    rotationDeg: geometry.rotationDeg,
    zonePath: target.zonePath,
    aislePath: target.aislePath,
    path: bay.bayPath,
  });

  const halfAlong = rackType.bayWidthM / 2;
  const bayRect = orientedRectAabb(
    geometry.origin,
    geometry.forward,
    bay.perp,
    offsetAlong - halfAlong,
    offsetAlong + halfAlong,
    bay.laneOffset - rackType.depthM / 2,
    bay.laneOffset + rackType.depthM / 2,
  );
  state.bayRects.push({ key: bay.bayKey, rect: bayRect });

  if (!inRackRun || isSkipped) return;

  if (!contains(state.footprint, bayRect)) {
    state.collector.error(
      'BIN_OUT_OF_FOOTPRINT',
      `Bay ${baySeq} of lane '${lane.code}' extends beyond the warehouse footprint`,
      [bay.laneRef, { kind: 'bay', id: `${lane.id ?? lane.code}:${baySeq}`, label: `B${String(baySeq).padStart(2, '0')}` }],
    );
  }
  for (const box of state.obstacleBoxes) {
    if (overlaps(bayRect, box.rect)) {
      state.collector.error(
        'BAY_OBSTACLE_OVERLAP',
        `Bay ${baySeq} of lane '${lane.code}' collides with obstacle '${obstacleLabel(box.obstacle)}'`,
        [bay.laneRef, { kind: 'obstacle', id: obstacleLabel(box.obstacle), label: box.obstacle.kind }],
        { baySeq },
      );
    }
  }

  appendBins(state, { ...bay, cx, cz, baySeq });
}

interface BinTarget extends BayTarget {
  cx: number;
  cz: number;
  baySeq: number;
}

function appendBins(state: CompileState, bay: BinTarget): void {
  const { target, rackType, baySeq } = bay;
  const { lane, aisle } = target;
  let height = 0;

  lane.levels.forEach((level, levelIndex) => {
    const bottom = height + level.beamHeightM;
    const centerY = bottom + level.clearHeightM / 2;
    height = bottom + level.clearHeightM;

    const levelPath = joinPath(bay.bayPath, wmsSegment('level', levelIndex + 1, null, state.scheme));
    // A bin enumerates *along* the rack row, which is how the WMS generator numbers
    // bins (`BN{b:02d}` over the row's bays). The row itself is the WMS `bay`
    // location, so the document's bay number becomes the bin's ordinal.
    const binCode = wmsSegment('bin', baySeq, null, state.scheme);

    const label = formatBinCode(lane.binCodePattern, {
      warehouse: state.doc.warehouse.code,
      aisle: aisle.code,
      lane: lane.code,
      side: lane.side,
      bay: baySeq,
      level: levelIndex + 1,
    });
    const count = (state.codeCounts.get(label) ?? 0) + 1;
    state.codeCounts.set(label, count);
    if (!state.codeFirstSeen.has(label)) state.codeFirstSeen.set(label, bay.laneRef);

    const rawVolume = rackType.bayWidthM * level.clearHeightM * level.binDepthM;
    const usableVolume = rawVolume * state.utilization;

    state.bins.push({
      label,
      warehouseCode: state.doc.warehouse.code,
      zoneCode: target.zoneCode,
      aisleCode: aisle.code,
      laneCode: lane.code,
      side: lane.side,
      baySeq,
      levelIndex,
      centerX: roundMetric(bay.cx),
      centerY: roundMetric(centerY),
      centerZ: roundMetric(bay.cz),
      widthM: rackType.bayWidthM,
      heightM: level.clearHeightM,
      depthM: level.binDepthM,
      rotationDeg: target.geometry.rotationDeg,
      capacityM3: roundMetric(rawVolume),
      usableVolumeM3: roundMetric(usableVolume),
      maxVolumeCc: roundMetric(usableVolume * CC_PER_M3, 2),
      maxWeightKg: level.maxWeightKg ?? null,
      levelPath,
      path: joinPath(levelPath, binCode),
    });
  });
}

function reportDuplicateBinCodes(state: CompileState, warehouseRef: EntityRef): void {
  const duplicates = [...state.codeCounts.entries()].filter(([, count]) => count > 1).sort((a, b) => (a[0] < b[0] ? -1 : 1));
  for (const [code, count] of duplicates) {
    state.collector.error(
      'BIN_CODE_DUPLICATE',
      `Bin code '${code}' is produced ${count} times; the lane bin code pattern is not unique enough`,
      [state.codeFirstSeen.get(code) ?? warehouseRef],
      { code, count },
    );
  }
}

/**
 * Lane pairs whose floor space overlaps, via a sweep on the X axis.
 *
 * Sorted by `minX`, so once a rectangle starts to the right of the current one's
 * `maxX` no later rectangle can overlap it and the inner loop can stop.
 */
function reportLaneOverlaps(state: CompileState): void {
  const ordered = [...state.bayRects].sort((a, b) => a.rect.minX - b.rect.minX);
  const pairs = new Set<string>();

  ordered.forEach((current, index) => {
    for (let next = index + 1; next < ordered.length; next += 1) {
      const candidate = ordered[next];
      if (candidate.rect.minX >= current.rect.maxX - EPS) break;
      if (current.key === candidate.key) continue;
      if (overlapArea(current.rect, candidate.rect) > 0) {
        pairs.add(current.key < candidate.key ? `${current.key}|${candidate.key}` : `${candidate.key}|${current.key}`);
      }
    }
  });

  for (const pair of [...pairs].sort()) {
    const [a, b] = pair.split('|');
    state.collector.error('LANE_OVERLAP', `Lanes '${a}' and '${b}' occupy overlapping floor space`, []);
  }
}
