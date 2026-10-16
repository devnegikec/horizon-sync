/**
 * Top-down plan of the same layout the 3D canvas draws.
 *
 * Perspective is a poor instrument for checking a layout: it hides whether two racks share
 * a centreline and it is easy to orbit past an overlap without noticing. This draws the
 * footprints orthographically, in metres, where a gap is visible as a gap.
 *
 * SVG rather than a second WebGL canvas: no second render loop, no second context, and the
 * text stays crisp at any size.
 */
import * as React from 'react';

import { cn } from '@horizon-sync/ui/lib';

import type { FlatBin } from '../../types/wms3d.types';

import type { AisleBand } from './aisleBands';
import type { BinMetrics } from './binMetrics';

const PLAN = {
  floorFill: '#0b1220',
  floorStroke: 'rgba(148, 163, 184, 0.45)',
  gridStroke: 'rgba(148, 163, 184, 0.16)',
  /** Walkways, in the amber floor tape the 3D scene paints them with. */
  aisleFill: 'rgba(251, 191, 36, 0.16)',
  aisleStroke: 'rgba(251, 191, 36, 0.55)',
  rackFill: 'rgba(96, 165, 250, 0.30)',
  rackStroke: 'rgba(96, 165, 250, 0.55)',
} as const;

/** Metres of margin drawn around the racks, before the viewBox is fitted. */
const PAD_M = 1;
/** Grid spacing, in metres. */
const GRID_M = 5;

interface PlanBay {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  aisleCode: string;
  levels: number;
}

/** A rectangle in plan coordinates, in metres. */
interface PlanBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PlanView {
  viewBox: string;
  floor: PlanBox;
  aisles: Array<{ band: AisleBand; box: PlanBox }>;
  bays: PlanBay[];
}

/** The walkway's footprint, turned to face whichever way its aisle runs. */
function aisleBox(band: AisleBand): PlanBox {
  const run = band.end - band.start;
  return band.alongX
    ? { x: band.start, y: band.centerZ - band.widthM / 2, width: run, height: band.widthM }
    : { x: band.centerX - band.widthM / 2, y: band.start, width: band.widthM, height: run };
}

/**
 * One rectangle per bay column, not per bin.
 *
 * A column is every level of one bay, so drawing it once keeps the node count at the bay
 * count instead of the bin count — a 100k-bin layout would otherwise put 100k rectangles
 * in the DOM and make the plan view the slowest thing in the app.
 */
function buildBays(bins: FlatBin[], metrics: BinMetrics): PlanBay[] {
  const byColumn = new Map<string, { x: number; z: number; aisleCode: string; heights: Set<number> }>();

  for (const bin of bins) {
    const { x, y: z, z: height } = bin.position;
    const key = `${x.toFixed(3)}|${z.toFixed(3)}`;
    const column = byColumn.get(key);
    if (column) {
      column.heights.add(height);
    } else {
      byColumn.set(key, { x, z, aisleCode: bin.aisle_code, heights: new Set([height]) });
    }
  }

  return [...byColumn.entries()].map(([key, column]) => ({
    key,
    x: column.x - metrics.sizeX / 2,
    y: column.z - metrics.sizeZ / 2,
    width: metrics.sizeX,
    height: metrics.sizeZ,
    aisleCode: column.aisleCode,
    levels: column.heights.size,
  }));
}

/** Footprint extents of everything drawn, padded, in plan coordinates. */
function measure(boxes: PlanBox[]): PlanBox {
  const xs = boxes.flatMap((box) => [box.x, box.x + box.width]);
  const ys = boxes.flatMap((box) => [box.y, box.y + box.height]);
  const minX = Math.min(...xs) - PAD_M;
  const minY = Math.min(...ys) - PAD_M;

  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) + PAD_M - minX,
    height: Math.max(...ys) + PAD_M - minY,
  };
}

function buildPlan(bins: FlatBin[], metrics: BinMetrics, bands: AisleBand[]): PlanView | null {
  if (bins.length === 0) return null;

  const bays = buildBays(bins, metrics);
  const aisles = bands.map((band) => ({ band, box: aisleBox(band) }));
  // The walkways take part in the extents: a one-sided aisle's band reaches past its
  // racking, and clipping it would be the one thing the plan is for.
  const floor = measure([...bays, ...aisles.map((aisle) => aisle.box)]);

  return {
    viewBox: `${floor.x} ${floor.y} ${floor.width} ${floor.height}`,
    floor,
    aisles,
    bays,
  };
}

export interface LayoutMiniMapProps {
  bins: FlatBin[];
  metrics: BinMetrics;
  aisleBands: AisleBand[];
  className?: string;
}

export function LayoutMiniMap({ bins, metrics, aisleBands, className }: LayoutMiniMapProps) {
  const [open, setOpen] = React.useState(true);
  const plan = React.useMemo(() => buildPlan(bins, metrics, aisleBands), [bins, metrics, aisleBands]);

  if (!plan) return null;
  const { floor } = plan;

  return (
    <div className={cn('rounded-lg border border-blue-900 bg-slate-900/90 backdrop-blur-sm', className)}>
      <button type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-slate-200">
        <span>Plan View</span>
        <span aria-hidden="true">{open ? '–' : '+'}</span>
      </button>

      {open && (
        <>
        <svg viewBox={plan.viewBox}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Top-down plan of the warehouse"
          className="block h-auto max-h-52 w-full px-2.5 pb-2.5">
          <defs>
            <pattern id="plan-grid" width={GRID_M} height={GRID_M} patternUnits="userSpaceOnUse">
              <path d={`M ${GRID_M} 0 L 0 0 0 ${GRID_M}`} fill="none" stroke={PLAN.gridStroke} strokeWidth={0.06} />
            </pattern>
          </defs>

          <rect x={floor.x} y={floor.y} width={floor.width} height={floor.height} fill={PLAN.floorFill} stroke={PLAN.floorStroke} strokeWidth={0.12} />
          <rect x={floor.x} y={floor.y} width={floor.width} height={floor.height} fill="url(#plan-grid)" />

          {/* Walkways, under the racks: the empty space is the point of the plan */}
          {plan.aisles.map(({ band, box }) => (
            <rect key={band.id}
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              fill={PLAN.aisleFill}
              stroke={PLAN.aisleStroke}
              strokeWidth={0.06}>
              <title>{`${band.code} walkway — ${band.measured ? '' : '≈'}${band.widthM.toFixed(1)} m`}</title>
            </rect>
          ))}

          {plan.bays.map((bay) => (
            <rect key={bay.key}
              x={bay.x}
              y={bay.y}
              width={bay.width}
              height={bay.height}
              fill={PLAN.rackFill}
              stroke={PLAN.rackStroke}
              strokeWidth={0.04}>
              <title>{`${bay.aisleCode} — ${bay.levels} level${bay.levels === 1 ? '' : 's'}`}</title>
            </rect>
          ))}
        </svg>

        {/* Widths, spelled out: a swatch is no use if the number cannot be read */}
        <ul className="flex flex-wrap gap-x-2.5 gap-y-1 px-2.5 pb-2.5 text-[10px] leading-none">
          {plan.aisles.map(({ band }) => (
            <li key={band.id} className="flex items-center gap-1">
              <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: PLAN.aisleStroke }} />
              <span className="text-slate-300">{band.code}</span>
              <span className="text-slate-400">
                {band.measured ? '' : '≈'}
                {band.widthM.toFixed(1)} m
              </span>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}
