/**
 * Rule registry for the layout document compiler.
 *
 * Every diagnostic code the compiler can emit is declared here exactly once, with
 * its severity. Consequences that matter:
 *
 * 1. **Severity is policy, declared centrally.** Call sites report a *code*; they
 *    cannot declare the same rule as a warning in one place and an error in another.
 * 2. **The registry is the contract.** This file mirrors
 *    `core-service/app/layout_design/rules.py` one-for-one, and the shared fixtures
 *    assert the same codes on both sides.
 *
 * Errors block `apply`; warnings do not.
 *
 * Design ref: ../../../../../../docs/LAYOUT_JSON_DESIGNER_PLAN.md section 3.2
 */

export type RuleSeverity = 'error' | 'warning';

export interface RuleDefinition {
  code: string;
  severity: RuleSeverity;
  description: string;
}

const rule = (code: string, severity: RuleSeverity, description: string): RuleDefinition => ({
  code,
  severity,
  description,
});

export const RULES: Record<string, RuleDefinition> = {
  // --- Document structure --------------------------------------------------
  NO_RACK_TYPES_DEFINED: rule('NO_RACK_TYPES_DEFINED', 'error', 'Aisles have lanes but the document defines no rack types.'),
  AISLE_CODE_DUPLICATE: rule('AISLE_CODE_DUPLICATE', 'error', 'Two aisles share a code, which breaks bin-code uniqueness.'),
  LANE_UNKNOWN_RACK_TYPE: rule('LANE_UNKNOWN_RACK_TYPE', 'error', 'A lane references a rackTypeId that is not in the document.'),
  ZONE_CODE_DUPLICATE: rule('ZONE_CODE_DUPLICATE', 'error', 'Two zones share a code, so their location paths would collide.'),
  SCHEMA_VERSION_UNSUPPORTED: rule('SCHEMA_VERSION_UNSUPPORTED', 'error', "The document's schemaVersion is not supported by this build."),
  LAYOUT_DOC_INVALID: rule('LAYOUT_DOC_INVALID', 'error', 'The document does not match the layout schema (missing or malformed fields).'),

  // --- Aisle geometry ------------------------------------------------------
  AISLE_ZERO_LENGTH: rule('AISLE_ZERO_LENGTH', 'error', 'Aisle centerline start and end coincide.'),
  AISLE_NOT_AXIS_ALIGNED: rule('AISLE_NOT_AXIS_ALIGNED', 'error', 'Aisle runs diagonally; v1 supports only exactly X or Z aligned aisles.'),
  AISLE_ORIENTATION_MISMATCH: rule('AISLE_ORIENTATION_MISMATCH', 'error', 'Declared orientation contradicts the centerline direction.'),
  AISLE_OUT_OF_FOOTPRINT: rule('AISLE_OUT_OF_FOOTPRINT', 'error', 'The clear corridor extends beyond the warehouse footprint.'),
  AISLE_OBSTACLE_OVERLAP: rule('AISLE_OBSTACLE_OVERLAP', 'error', 'The clear corridor passes through a column, wall or other obstacle.'),
  AISLE_TOO_NARROW: rule('AISLE_TOO_NARROW', 'warning', 'Corridor is narrower than a counterbalance forklift realistically needs.'),
  AISLE_WITHOUT_LANES: rule('AISLE_WITHOUT_LANES', 'warning', 'Aisle has no rack rows, so it stores nothing.'),

  // --- Lane geometry -------------------------------------------------------
  LANE_RUN_EXCEEDS_AISLE: rule('LANE_RUN_EXCEEDS_AISLE', 'error', 'A lane run starts or ends beyond the aisle centerline.'),
  LANE_OVERLAP: rule('LANE_OVERLAP', 'error', 'Two lanes occupy the same floor space, which usually means aisles are too close.'),
  LANE_ZERO_BAYS: rule('LANE_ZERO_BAYS', 'warning', 'A lane is shorter than one bay, so it yields no bins.'),
  LANE_HAS_NO_RACK_SEGMENT: rule('LANE_HAS_NO_RACK_SEGMENT', 'warning', 'Every segment of a lane is a GAP, so it yields no bins.'),
  LEVEL_DEPTH_EXCEEDS_RACK: rule('LEVEL_DEPTH_EXCEEDS_RACK', 'warning', 'A level is configured deeper than the structural rack frame.'),
  LEVEL_STACK_EXCEEDS_HEIGHT: rule('LEVEL_STACK_EXCEEDS_HEIGHT', 'error', 'The level stack (beams plus clear heights) is taller than the building.'),

  // --- Bins ----------------------------------------------------------------
  BIN_OUT_OF_FOOTPRINT: rule('BIN_OUT_OF_FOOTPRINT', 'error', 'A bay extends beyond the warehouse footprint.'),
  BAY_OBSTACLE_OVERLAP: rule('BAY_OBSTACLE_OVERLAP', 'error', 'A bay collides with a column, wall or other obstacle.'),
  BIN_CODE_DUPLICATE: rule('BIN_CODE_DUPLICATE', 'error', 'Two bins resolve to the same code; the bin code pattern is not unique enough.'),
  LOCATION_PATH_ALREADY_EXISTS: rule('LOCATION_PATH_ALREADY_EXISTS', 'error', 'A generated location path already exists in this warehouse with a different type.'),

  // --- Meta ----------------------------------------------------------------
  DIAGNOSTICS_TRUNCATED: rule('DIAGNOSTICS_TRUNCATED', 'warning', 'Further instances of a repeated issue were suppressed to avoid flooding.'),
};

export const BLOCKING_RULE_CODES: ReadonlySet<string> = new Set(
  Object.values(RULES)
    .filter((definition) => definition.severity === 'error')
    .map((definition) => definition.code),
);

/** Return the definition for `code`, or `undefined` when it is not registered. */
export function getRule(code: string): RuleDefinition | undefined {
  return RULES[code];
}

/** The registry as plain rows, ordered by code, for the "explain this code" panel. */
export function ruleRegistryPayload(): RuleDefinition[] {
  return Object.values(RULES).sort((a, b) => (a.code < b.code ? -1 : 1));
}
