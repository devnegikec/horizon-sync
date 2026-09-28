/**
 * Aisle walkways, measured from the racks that flank them.
 *
 * Racking is only half of a warehouse: the space between two rack faces is what a picker
 * walks down, and it is the part of the plan a reader needs to see to judge a layout.
 * Perspective alone hides it — a 3 m walkway and a 1 m artefact look the same from an
 * orbit — so the walkway is drawn as its own band in both views.
 *
 * The payload has no aisle width: `LayoutAisle` carries a position and an orientation, not
 * a span. So, like the bin footprint in `binMetrics`, the width is *measured* rather than
 * assumed — the distance between the two rows of racking that face into the aisle, less
 * the depth each row takes up.
 *
 * Axis convention matches `binMetrics` and `LayoutBin.position`: `x` is plan X, `y` is
 * plan Z, and the aisle runs along whichever of those its bays step along.
 */
import type { FlatBin } from '../../types/wms3d.types';

import type { BinMetrics } from './binMetrics';

/**
 * Walkway assumed for an aisle racked on one side only.
 *
 * A single row of racking says nothing about how wide the walkway beside it is — the other
 * wall of that walkway belongs to the next aisle, or to the building. Three metres is the
 * designer's own default aisle, and the number is reported as approximate so nobody reads
 * it as a measurement.
 */
export const DEFAULT_AISLE_WIDTH = 3;

/** Narrower than this is not a walkway; the measurement has run into the rack depth. */
const MIN_WALKWAY = 0.4;

export interface AisleBand {
  id: string;
  code: string;
  name: string | null;
  /** Centre of the walkway, in plan coordinates (metres). */
  centerX: number;
  centerZ: number;
  /** True when the run — the long axis — is plan X, false when it is plan Z. */
  alongX: boolean;
  /** Extent of the walkway along the run, covering the outermost bays. */
  start: number;
  end: number;
  /** Walkway width across the run, in metres. */
  widthM: number;
  /** True when `widthM` was measured between two rack faces. */
  measured: boolean;
  /** Top of the tallest bin, for hanging a label above the aisle. */
  topZ: number;
}

/** Sorted distinct coordinates, rounded so backend noise does not split a value in two. */
function distinct(values: number[]): number[] {
  return [...new Set(values.map((value) => Number(value.toFixed(3))))].sort((a, b) => a - b);
}

const span = (values: number[]): number => values[values.length - 1] - values[0];

/** Centre of a coordinate list; a lone value is its own centre. */
const middle = (values: number[]): number => (values[0] + values[values.length - 1]) / 2;

/**
 * Which way the aisle runs: along plan X, or along plan Z.
 *
 * The coordinate counts give it away almost always — an aisle has many bays and one or two
 * lanes, so the axis with more distinct values is the run. Only a two-bay, two-lane aisle
 * ties, and there the layout-wide run axis from the bin measurement breaks it: a bay is
 * narrower than the distance between two rows of racking, so the shorter pitch is the run.
 * A layout too sparse to measure anywhere falls back to the shorter span.
 */
function chooseRun(xs: number[], zs: number[], metrics: BinMetrics): boolean {
  if (xs.length !== zs.length) return xs.length > zs.length;
  if (metrics.runAxis !== null) return metrics.runAxis === 'x';
  return span(xs) < span(zs);
}

function groupByAisle(bins: FlatBin[]): Map<string, FlatBin[]> {
  const byAisle = new Map<string, FlatBin[]>();

  for (const bin of bins) {
    const aisle = byAisle.get(bin.aisle_id);
    if (aisle) aisle.push(bin);
    else byAisle.set(bin.aisle_id, [bin]);
  }

  return byAisle;
}

/**
 * The walkway across the run: what is left of the lane separation once the racking that
 * fills it is taken out. One lane, or two lanes closer together than the racks are deep,
 * cannot be measured — see `DEFAULT_AISLE_WIDTH`.
 */
function walkway(lanes: number[], depth: number): { widthM: number; measured: boolean } {
  const gap = lanes.length >= 2 ? span(lanes) - depth : 0;
  const measured = gap >= MIN_WALKWAY;

  return { widthM: measured ? gap : DEFAULT_AISLE_WIDTH, measured };
}

function bandFor(id: string, aisle: FlatBin[], metrics: BinMetrics): AisleBand {
  const xs = distinct(aisle.map((bin) => bin.position.x));
  const zs = distinct(aisle.map((bin) => bin.position.y));

  const alongX = chooseRun(xs, zs, metrics);
  const run = alongX ? xs : zs;
  const lanes = alongX ? zs : xs;
  // The bin is sized to the bay along the run and to a rack depth across it, so this is
  // how much of each lane's separation the racking itself occupies.
  const pitch = alongX ? metrics.sizeX : metrics.sizeZ;
  const depth = alongX ? metrics.sizeZ : metrics.sizeX;
  const { widthM, measured } = walkway(lanes, depth);

  return {
    id,
    code: aisle[0].aisle_code,
    name: aisle[0].aisle_name,
    alongX,
    centerX: alongX ? middle(run) : middle(lanes),
    centerZ: alongX ? middle(lanes) : middle(run),
    start: run[0] - pitch / 2,
    end: run[run.length - 1] + pitch / 2,
    widthM,
    measured,
    topZ: Math.max(...aisle.map((bin) => bin.position.z)) + metrics.sizeY / 2,
  };
}

/**
 * One band per aisle: the walkway between its rack faces, plus how far it runs.
 */
export function deriveAisleBands(bins: FlatBin[], metrics: BinMetrics): AisleBand[] {
  const bands = [...groupByAisle(bins)].map(([id, aisle]) => bandFor(id, aisle, metrics));

  return bands.sort((a, b) => a.code.localeCompare(b.code) || a.id.localeCompare(b.id));
}
