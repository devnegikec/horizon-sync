/**
 * The measurement in `binMetrics` is the whole fix for "consecutive bins have gaps", so it
 * is pinned here rather than eyeballed in the canvas — jsdom has no WebGL, and a wrong
 * pitch is invisible in a unit test but obvious on screen.
 */
import type { FlatBin } from '../../../types/wms3d.types';
import {
  DEFAULT_BIN_DEPTH,
  DEFAULT_BIN_HEIGHT,
  MAX_TRUSTED_PITCH,
  deriveBinMetrics,
} from '../binMetrics';

interface BinAt {
  x: number;
  z: number;
  height: number;
  /** Which aisle and level the bin belongs to — the measurement is scoped to these. */
  aisle?: string;
  level?: string;
}

/** Minimal FlatBin: position, plus the aisle/level the row is grouped by. */
function bin({ x, z, height, aisle = 'aisle', level = 'L01' }: BinAt, index: number): FlatBin {
  return {
    id: `bin-${index}`,
    code: `BN${index}`,
    full_path: null,
    position: { x, y: z, z: height },
    capacity: 0,
    available_capacity: 0,
    fill_percentage: 0,
    is_active: true,
    is_reserved: false,
    reserved_by_worker_id: null,
    items_count: 0,
    has_expiring_items: false,
    zone_id: 'zone',
    zone_code: 'Z01',
    zone_name: null,
    aisle_id: aisle,
    aisle_code: 'A01',
    aisle_name: null,
    bay_id: 'bay',
    bay_code: 'B01',
    bay_name: null,
    level_id: 'level',
    level_code: level,
    level_name: null,
  };
}

function layout(bins: BinAt[]): FlatBin[] {
  return bins.map(bin);
}

describe('deriveBinMetrics', () => {
  describe('a bay width that is measured, not assumed', () => {
    // The bug: a fixed 0.8 m cube inside a 2.7 m bay leaves a 1.9 m hole between bins.
    const wideBays = layout(
      Array.from({ length: 5 }).flatMap((_, level) =>
        Array.from({ length: 4 }, (_, index) => ({
          x: 1.35 + index * 2.7,
          z: 6,
          height: 0.78 + level * 1.48,
        })),
      ),
    );

    it('sizes a bin to the bay pitch', () => {
      expect(deriveBinMetrics(wideBays).sizeX).toBeCloseTo(2.7, 6);
    });

    it('reports that the size was measured', () => {
      expect(deriveBinMetrics(wideBays).measured).toBe(true);
    });

    it('sizes a bin to the level pitch, less the beam', () => {
      // Level pitch is beamHeightM + clearHeightM = 0.08 + 1.4.
      expect(deriveBinMetrics(wideBays).sizeY).toBeCloseTo(1.4, 6);
    });

    it('uses the depth default across the run, because that pitch is the aisle spacing', () => {
      expect(deriveBinMetrics(wideBays).sizeZ).toBe(DEFAULT_BIN_DEPTH);
    });
  });

  describe('an interrupted run', () => {
    it('ignores a cross-aisle gap instead of averaging it in', () => {
      const broken = layout(
        [0.6, 1.8, 3.0, 9.0, 10.2, 11.4].map((x) => ({ x, z: 5, height: 0.78 })),
      );

      // The 6.0 m hole between 3.0 and 9.0 must not become the bin width.
      expect(deriveBinMetrics(broken).sizeX).toBeCloseTo(1.2, 6);
    });

    it('ignores a stray bin a few centimetres off a bay', () => {
      // The bug this pins: the *smallest* gap used to win, so one bin 0.2 m from a bay
      // shrank every bin in the warehouse and left a 1.2 m hole between the rest.
      const stray = layout(
        [0.6, 1.8, 3.0, 3.2].map((x) => ({ x, z: 5, height: 0.78 })),
      );

      expect(deriveBinMetrics(stray).sizeX).toBeCloseTo(1.2, 6);
    });
  });

  describe('a second aisle crossing the first', () => {
    it('does not let the crossing aisle redefine the bay pitch', () => {
      // A perpendicular aisle really can put a bin on the same line as this one. Grouping
      // by coordinate alone let that bin in; the row is now scoped to its own aisle.
      const crossing = layout([
        ...['a-x', 'a-z'].flatMap((aisle, lane) =>
          [0.6, 2.1, 3.6].map((x) => ({ x: x + lane * 0.05, z: 5, height: 0.78, aisle })),
        ),
      ]);

      expect(deriveBinMetrics(crossing).sizeX).toBeCloseTo(1.5, 6);
    });
  });

  describe('two lanes of one aisle', () => {
    it('takes the smaller spacing as the run and the larger as the aisle pitch', () => {
      const lanes = layout(
        [5, 8.2].flatMap((z) =>
          [0.6, 1.8, 3.0].map((x) => ({ x, z, height: 0.78 })),
        ),
      );
      const metrics = deriveBinMetrics(lanes);

      // 1.2 (bay pitch) vs 3.2 (between lanes): the smaller one is the bay.
      expect(metrics.sizeX).toBeCloseTo(1.2, 6);
      expect(metrics.sizeZ).toBe(DEFAULT_BIN_DEPTH);
    });
  });

  describe('aisles running along Z', () => {
    it('measures the run on Z and keeps the depth default on X', () => {
      const vertical = layout(
        [0.675, 2.025, 3.375].map((z) => ({ x: 4, z, height: 0.78 })),
      );
      const metrics = deriveBinMetrics(vertical);

      expect(metrics.sizeZ).toBeCloseTo(1.35, 6);
      expect(metrics.sizeX).toBe(DEFAULT_BIN_DEPTH);
    });
  });

  describe('layouts too sparse to measure', () => {
    it('falls back to defaults for a single bin', () => {
      const metrics = deriveBinMetrics(layout([{ x: 1, z: 2, height: 0 }]));

      expect(metrics.measured).toBe(false);
      expect(metrics.sizeX).toBe(DEFAULT_BIN_DEPTH);
      expect(metrics.sizeY).toBe(DEFAULT_BIN_HEIGHT);
      expect(metrics.sizeZ).toBe(DEFAULT_BIN_DEPTH);
    });

    it('refuses a pitch wide enough to be an aisle', () => {
      const farApart = layout([
        { x: 0, z: 0, height: 0.78 },
        { x: MAX_TRUSTED_PITCH + 2, z: 0, height: 0.78 },
      ]);
      const metrics = deriveBinMetrics(farApart);

      expect(metrics.measured).toBe(false);
      expect(metrics.sizeX).toBe(DEFAULT_BIN_DEPTH);
    });
  });

  describe('a bin centre height', () => {
    it('treats position.z as the centre, so no lift is added anywhere', () => {
      // Two levels 1.48 apart: the bins must be 1.4 tall, centred where they are given.
      const stacked = layout([
        { x: 0, z: 0, height: 0.78 },
        { x: 0, z: 0, height: 2.26 },
      ]);

      expect(deriveBinMetrics(stacked).sizeY).toBeCloseTo(1.4, 6);
    });
  });
});
