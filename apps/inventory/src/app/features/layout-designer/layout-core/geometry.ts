/**
 * Axis-aligned 2D geometry on the ground plane (X/Z), in metres.
 *
 * The document format restricts every structure to axis-aligned rectangles with
 * orientation 0 or 90 degrees, which makes collision detection cheap rectangle
 * overlap rather than a full 3D separating-axis test. Height is tracked
 * separately by the compiler.
 *
 * Mirrors `core-service/app/layout_design/geometry.py`.
 */

/** Geometry comparison tolerance: 0.1 mm. */
export const EPS = 1e-4;

/** Decimals retained when rounding derived coordinates. */
export const PRECISION = 6;

/** Share of a bin's raw volume considered usable (honeycombing, handling clearance). */
export const DEFAULT_UTILIZATION = 0.85;

/** Below this clear corridor width we warn - a counterbalance forklift needs ~2.5 m. */
export const MIN_AISLE_WIDTH_M = 2.5;

/** Cap repeated diagnostics so one bad parameter cannot emit 10k messages. */
export const MAX_DIAGNOSTICS_PER_CODE = 25;

/** Cubic centimetres per cubic metre (bin limits are stored in cc). */
export const CC_PER_M3 = 1_000_000;

export interface AABB {
  minX: number;
  minZ: number;
  maxX: number;
  maxZ: number;
}

export type Vec2 = readonly [number, number];

export function aabb(minX: number, minZ: number, maxX: number, maxZ: number): AABB {
  return { minX, minZ, maxX, maxZ };
}

/** Overlap area of two rectangles; zero when they only touch. */
export function overlapArea(a: AABB, b: AABB): number {
  const dx = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const dz = Math.min(a.maxZ, b.maxZ) - Math.max(a.minZ, b.minZ);
  if (dx <= EPS || dz <= EPS) return 0;
  return dx * dz;
}

/** True when the two rectangles share real area (touching is not overlapping). */
export function overlaps(a: AABB, b: AABB): boolean {
  return overlapArea(a, b) > 0;
}

/** True when `inner` lies inside `outer` within `eps`. */
export function contains(outer: AABB, inner: AABB, eps: number = EPS): boolean {
  return (
    inner.minX >= outer.minX - eps &&
    inner.maxX <= outer.maxX + eps &&
    inner.minZ >= outer.minZ - eps &&
    inner.maxZ <= outer.maxZ + eps
  );
}

/** Unit vector, or `null` when the input is degenerate (zero length). */
export function normalize2(x: number, z: number): Vec2 | null {
  const length = Math.hypot(x, z);
  if (length <= EPS) return null;
  return [x / length, z / length];
}

/** True when the direction runs exactly along X or Z. */
export function isAxisAligned(forward: Vec2): boolean {
  return Math.abs(forward[0]) <= EPS || Math.abs(forward[1]) <= EPS;
}

/** Left-hand perpendicular when walking along `forward`. For forward = +X this yields -Z. */
export function perpendicularLeft(forward: Vec2): Vec2 {
  return [forward[1], -forward[0]];
}

/** Right-hand perpendicular when walking along `forward`. */
export function perpendicularRight(forward: Vec2): Vec2 {
  return [-forward[1], forward[0]];
}

/**
 * AABB of an oriented rectangle described in (along, perpendicular) lane-local space.
 * Rotation of 0/90 degrees is handled naturally because both basis vectors are axis-aligned.
 */
export function orientedRectAabb(
  origin: Vec2,
  forward: Vec2,
  perp: Vec2,
  s0: number,
  s1: number,
  t0: number,
  t1: number,
): AABB {
  const xs: number[] = [];
  const zs: number[] = [];
  for (const s of [s0, s1]) {
    for (const t of [t0, t1]) {
      xs.push(origin[0] + forward[0] * s + perp[0] * t);
      zs.push(origin[1] + forward[1] * s + perp[1] * t);
    }
  }
  return aabb(Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs));
}

export function nearlyEqual(a: number, b: number, eps: number = EPS): boolean {
  return Math.abs(a - b) <= eps;
}

/** Round a metric value, normalising negative zero. */
export function roundMetric(value: number, decimals: number = PRECISION): number {
  const rounded = Number(value.toFixed(decimals));
  return rounded === 0 ? 0 : rounded;
}
