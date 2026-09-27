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

import type { BinMetrics } from './binMetrics';

const PLAN = {
  floorFill: '#0b1220',
  floorStroke: 'rgba(148, 163, 184, 0.45)',
  gridStroke: 'rgba(148, 163, 184, 0.16)',
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

interface PlanView {
  viewBox: string;
  floor: { x: number; y: number; width: number; height: number };
  bays: PlanBay[];
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

/** Footprint extents of the racks, padded, in plan coordinates. */
function measure(bays: PlanBay[]): PlanView['floor'] {
  const xs = bays.flatMap((bay) => [bay.x, bay.x + bay.width]);
  const ys = bays.flatMap((bay) => [bay.y, bay.y + bay.height]);
  const minX = Math.min(...xs) - PAD_M;
  const minY = Math.min(...ys) - PAD_M;

  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) + PAD_M - minX,
    height: Math.max(...ys) + PAD_M - minY,
  };
}

function buildPlan(bins: FlatBin[], metrics: BinMetrics): PlanView | null {
  if (bins.length === 0) return null;

  const bays = buildBays(bins, metrics);
  const floor = measure(bays);

  return {
    viewBox: `${floor.x} ${floor.y} ${floor.width} ${floor.height}`,
    floor,
    bays,
  };
}

export interface LayoutMiniMapProps {
  bins: FlatBin[];
  metrics: BinMetrics;
  className?: string;
}

export function LayoutMiniMap({ bins, metrics, className }: LayoutMiniMapProps) {
  const [open, setOpen] = React.useState(true);
  const plan = React.useMemo(() => buildPlan(bins, metrics), [bins, metrics]);

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
      )}
    </div>
  );
}
