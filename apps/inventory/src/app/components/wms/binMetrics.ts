/**
 * Bin footprint, measured from the layout rather than assumed.
 *
 * The 3D payload carries only a bin's centre position — `WarehouseLocation` has no
 * width/height/depth columns — so a renderer that draws a fixed cube is wrong for every
 * warehouse except the one it was tuned against. Drawing a 0.8 m cube in a bay that is
 * 2.7 m wide leaves a 1.9 m hole between neighbouring bins, which is exactly what a
 * fixed-size cube looks like on screen.
 *
 * The scale is instead *measured* from the bins' own spacing, and the measurement is
 * exact rather than approximate: the compiler centres each bay every `bayWidthM` along
 * the aisle run, and stacks each level `beamHeightM + clearHeightM` above the last.
 *
 * The measurement is taken within a single aisle's level, as the *most repeated* gap
 * rather than the smallest — see `runGaps` and `modalGap` for why both of those matter
 * when a warehouse is not a perfect grid.
 *
 * Axis convention, matching `position` on `LayoutBin`:
 * `x` is plan X, `y` is plan Z (depth), and `z` is the height of the bin's *centre*
 * above the floor. There is no lift to apply — `z` is already a centre, not a base.
 */
import type { FlatBin } from '../../types/wms3d.types';

const EPS = 1e-4;

/** Assumed rack depth, across the aisle run. Not derivable from positions alone. */
export const DEFAULT_BIN_DEPTH = 1.1;
/** Fallback for a layout too sparse to measure. */
export const DEFAULT_BIN_HEIGHT = 0.85;

/**
 * Ceiling on a pitch we are willing to believe is a bay.
 *
 * A group of bins can be consistent and still not be a row: every bin in one column of a
 * warehouse shares an X, so grouping them yields perfectly regular gaps — of the *aisle*
 * pitch. Anything wider than this is an aisle spacing, not a bay width.
 */export const MAX_TRUSTED_PITCH = 4;

/** Beam height, which is the gap the compiler leaves between two stacked levels. */
const BEAM_CLEARANCE = 0.08;
const MIN_BIN_HEIGHT = 0.2;

export interface BinMetrics {
  /** Extent along world X, in metres. */
  sizeX: number;
  /** Extent along world Y, i.e. height, in metres. */
  sizeY: number;
  /** Extent along world Z, in metres. */
  sizeZ: number;
  /** True when the run pitch came from the layout rather than from a default. */
  measured: boolean;
  /**
   * Axis the bays step along, or null when no pitch was measurable.
   *
   * Which axis is the run is not otherwise recoverable from the two sizes: the cross axis
   * is a constant rack depth, and a warehouse could legitimately have a 1.1 m bay.
   */
  runAxis: 'x' | 'z' | null;
}

const planX = (bin: FlatBin): number => bin.position.x;
const planZ = (bin: FlatBin): number => bin.position.y;
const height = (bin: FlatBin): number => bin.position.z;

/** Non-zero gaps between the distinct, sorted coordinates of one group. */
function gapsOf(values: number[]): number[] {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  const gaps: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > EPS) gaps.push(gap);
  }

  return gaps;
}

/**
 * The pitch, taken as the *most repeated* gap rather than the smallest.
 *
 * A row is not always perfectly regular, and the two ways it can stray pull the estimate
 * in opposite directions. A cross-aisle hole widens one gap; a stray bin landing a few
 * centimetres off a bay narrows one. "Smallest gap wins" survives the first and is ruined
 * by the second — a single misplaced bin shrinks *every* bin in the warehouse, leaving a
 * gap the width of a bay between all the rest, which is exactly the artefact this module
 * exists to prevent. Neither outlier repeats, so the mode ignores both.
 *
 * Gaps are bucketed to the millimetre so coordinates the backend rounded still count as
 * equal.
 */
function modalGap(gaps: number[]): number | null {
  if (gaps.length === 0) return null;

  const counts = new Map<number, number>();
  for (const gap of gaps) {
    const bucket = Math.round(gap * 1000);
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  let pitch: number | null = null;
  let best = 0;
  for (const [bucket, count] of counts) {
    // Ties go to the smaller gap: overlap reads as a mistake, a hairline gap does not.
    if (count > best || (count === best && pitch !== null && bucket < pitch)) {
      pitch = bucket;
      best = count;
    }
  }

  return pitch === null ? null : pitch / 1000;
}

/**
 * Gaps between neighbours in the same straight run along one axis.
 *
 * A group is one lane-level of one aisle: an aisle, a level, and a coordinate on the
 * perpendicular axis — collinear by construction. The aisle is part of the key on
 * purpose. Grouping by the perpendicular coordinate alone was enough for a warehouse of
 * parallel aisles, but a second aisle that merely *crosses* this one contributes a bin to
 * the same line, and one bin a few centimetres off a bay used to redefine the bay pitch
 * for the whole warehouse.
 */
function runGaps(bins: FlatBin[], axis: 'x' | 'z'): number[] {
  const rows = new Map<string, number[]>();

  for (const bin of bins) {
    const along = axis === 'x' ? planX(bin) : planZ(bin);
    const other = axis === 'x' ? planZ(bin) : planX(bin);
    const key = `${bin.aisle_id}|${bin.level_code}|${other.toFixed(3)}`;
    const row = rows.get(key);
    if (row) row.push(along);
    else rows.set(key, [along]);
  }

  return [...rows.values()].flatMap(gapsOf);
}

/** Gaps between stacked levels, measured up each bay's own column. */
function levelGaps(bins: FlatBin[]): number[] {
  const columns = new Map<string, number[]>();

  for (const bin of bins) {
    const key = `${planX(bin).toFixed(3)}|${planZ(bin).toFixed(3)}`;
    const column = columns.get(key);
    if (column) column.push(height(bin));
    else columns.set(key, [height(bin)]);
  }

  return [...columns.values()].flatMap(gapsOf);
}

function trusted(pitch: number | null): number | null {
  if (pitch === null || pitch > MAX_TRUSTED_PITCH) return null;
  return pitch;
}

/**
 * Footprint for every bin in a layout.
 *
 * The two horizontal pitches are not symmetric. The run axis always has the *smaller*
 * spacing, because a bay is narrower than the distance between two rows of racking — so
 * the larger of the two is the aisle pitch and says nothing about the size of a bin. That
 * axis therefore takes a realistic rack depth instead of a measured value.
 *
 * A warehouse whose aisles run both ways gets the depth default on whichever axis lost,
 * which is a few centimetres wrong on the minority of racks and not worth the per-bin
 * bookkeeping to fix.
 */
export function deriveBinMetrics(bins: FlatBin[]): BinMetrics {
  const pitchX = trusted(modalGap(runGaps(bins, 'x')));
  const pitchZ = trusted(modalGap(runGaps(bins, 'z')));
  const level = trusted(modalGap(levelGaps(bins)));

  const alongX = pitchX !== null && (pitchZ === null || pitchX <= pitchZ);
  const sizeY =
    level === null ? DEFAULT_BIN_HEIGHT : Math.max(level - BEAM_CLEARANCE, MIN_BIN_HEIGHT);

  if (alongX && pitchX !== null) {
    return { sizeX: pitchX, sizeY, sizeZ: DEFAULT_BIN_DEPTH, measured: true, runAxis: 'x' };
  }
  if (pitchZ !== null) {
    return { sizeX: DEFAULT_BIN_DEPTH, sizeY, sizeZ: pitchZ, measured: true, runAxis: 'z' };
  }
  return {
    sizeX: DEFAULT_BIN_DEPTH,
    sizeY,
    sizeZ: DEFAULT_BIN_DEPTH,
    measured: false,
    runAxis: null,
  };
}
