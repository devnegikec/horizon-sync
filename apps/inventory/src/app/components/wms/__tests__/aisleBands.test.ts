/**
 * The walkway is the part of the layout the eye cannot measure from a perspective view, so
 * its band is pinned here: the width has to come off the racks, and the band has to run the
 * length of the aisle rather than of one bay.
 */
import type { FlatBin } from '../../../types/wms3d.types';
import { DEFAULT_AISLE_WIDTH, deriveAisleBands } from '../aisleBands';
import { DEFAULT_BIN_DEPTH, deriveBinMetrics } from '../binMetrics';

interface BinAt {
  x: number;
  z: number;
  height?: number;
  aisle?: string;
  level?: string;
}

function bin({ x, z, height = 0.78, aisle = 'a1', level = 'L01' }: BinAt, index: number): FlatBin {
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
    aisle_name: 'Fast movers',
    bay_id: 'bay',
    bay_code: 'B01',
    bay_name: null,
    level_id: 'level',
    level_code: level,
    level_name: null,
  };
}

function bandsFor(bins: BinAt[]) {
  const flat = bins.map(bin);
  return deriveAisleBands(flat, deriveBinMetrics(flat));
}

describe('deriveAisleBands', () => {
  describe('an aisle racked both sides', () => {
    // Lane centres 3.2 m apart: 1.1 m of that is racking, so 2.1 m is walkway.
    const bands = bandsFor(
      [5, 8.2].flatMap((z) => [1.35, 4.05].map((x) => ({ x, z }))),
    );

    it('measures the walkway between the two rack faces', () => {
      expect(bands[0].widthM).toBeCloseTo(3.2 - DEFAULT_BIN_DEPTH, 6);
    });

    it('reports the width as measured', () => {
      expect(bands[0].measured).toBe(true);
    });

    it('runs along the bays, not the lanes', () => {
      expect(bands[0].alongX).toBe(true);
      expect(bands[0].centerX).toBeCloseTo(2.7, 6);
      expect(bands[0].centerZ).toBeCloseTo(6.6, 6);
    });

    it('covers the outermost bays in full', () => {
      // Bays are 2.7 m pitch, so the band reaches half a bay past each centre.
      expect(bands[0].start).toBeCloseTo(0, 6);
      expect(bands[0].end).toBeCloseTo(5.4, 6);
    });

    it('hangs its label above the tallest bin', () => {
      expect(bands[0].topZ).toBeGreaterThan(0.78);
      expect(bands[0].code).toBe('A01');
      expect(bands[0].name).toBe('Fast movers');
    });
  });

  describe('an aisle racked one side', () => {
    it('falls back to the default width and says so', () => {
      const bands = bandsFor([1.35, 4.05].map((x) => ({ x, z: 5 })));

      expect(bands[0].measured).toBe(false);
      expect(bands[0].widthM).toBe(DEFAULT_AISLE_WIDTH);
    });
  });

  describe('aisles running along Z', () => {
    it('measures the run on Z and the walkway across X', () => {
      const bands = bandsFor(
        [4.6, 7.8].flatMap((x) => [0.675, 2.025, 3.375].map((z) => ({ x, z }))),
      );

      expect(bands[0].alongX).toBe(false);
      expect(bands[0].widthM).toBeCloseTo(3.2 - DEFAULT_BIN_DEPTH, 6);
      expect(bands[0].centerZ).toBeCloseTo(2.025, 6);
      expect(bands[0].start).toBeCloseTo(0, 6);
      expect(bands[0].end).toBeCloseTo(4.05, 6);
    });
  });

  describe('several aisles', () => {
    it('returns one band per aisle, ordered by code', () => {
      const bands = bandsFor([
        ...['a1', 'a2'].flatMap((aisle) => [1.35, 4.05].map((x) => ({ x, z: 5, aisle }))),
      ]);

      expect(bands).toHaveLength(2);
      expect(bands.map((band) => band.id)).toEqual(['a1', 'a2']);
    });
  });

  it('returns nothing for no bins', () => {
    expect(deriveAisleBands([], deriveBinMetrics([]))).toEqual([]);
  });
});
