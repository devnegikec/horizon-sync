/**
 * Reference documents for the layout compiler tests.
 *
 * `CROSS_AISLE_TWO_WAY` is the **same document** the backend keeps in
 * `core-service/app/layout_design/examples.py`, and both suites assert the same
 * numbers against it (240 bins over 60 bays, with bins BN005/BN006 missing from every
 * level). That shared expectation is the conformance gate between the two compilers:
 * if one drifts, its suite fails.
 */

const LEVEL_5_1_4 = Array.from({ length: 5 }, () => ({
  clearHeightM: 1.4,
  binDepthM: 1.0,
  beamHeightM: 0.08,
  maxWeightKg: 800,
}));

function aisle(code: string, centerZ: number) {
  const segments = [
    { kind: 'RACK' as const, startM: 0, endM: 10.8, label: 'front' },
    { kind: 'GAP' as const, startM: 10.8, endM: 16.2, label: 'cross-aisle' },
    { kind: 'RACK' as const, startM: 16.2, endM: 27.0, label: 'back' },
  ];
  return {
    code,
    orientation: 'X' as const,
    centerline: { x1: 4, z1: centerZ, x2: 31, z2: centerZ },
    widthM: 3.4,
    travelDirection: 'BOTH' as const,
    lanes: [
      {
        code: `${code}-L`,
        side: 'LEFT' as const,
        rackTypeId: 'rt-std',
        startOffsetM: 0,
        lengthM: 27,
        levels: LEVEL_5_1_4,
        segments,
        metadata: { skuClass: 'A' },
      },
      {
        code: `${code}-R`,
        side: 'RIGHT' as const,
        rackTypeId: 'rt-std',
        startOffsetM: 0,
        lengthM: 27,
        levels: LEVEL_5_1_4,
        segments,
      },
    ],
  };
}

/** Three aisles along X, both sides racked, one 2-bay cross-aisle through every lane. */
export const CROSS_AISLE_TWO_WAY = {
  schemaVersion: 1,
  layout: { namingScheme: 'wms_typed', defaultZoneCode: '01' },
  warehouse: {
    code: 'WH-A',
    name: 'Two-way warehouse with a central cross-aisle',
    lengthM: 40,
    widthM: 32,
    heightM: 9,
    origin: { x: 0, z: 0 },
    metadata: { site: 'reference example' },
  },
  rackTypes: [
    {
      id: 'rt-std',
      code: 'STD',
      name: 'Standard pallet rack',
      bayWidthM: 2.7,
      depthM: 1.1,
      uprightWidthM: 0.12,
      uprightDepthM: 0.12,
      metadata: { beamProfile: '100x50' },
    },
  ],
  obstacles: [
    { id: 'col-1', kind: 'COLUMN', x: 6, z: 11.2, widthM: 0.6, depthM: 0.6, heightM: 6 },
    { id: 'col-2', kind: 'COLUMN', x: 16, z: 11.2, widthM: 0.6, depthM: 0.6, heightM: 6 },
    { id: 'col-3', kind: 'COLUMN', x: 26, z: 11.2, widthM: 0.6, depthM: 0.6, heightM: 6 },
    { id: 'pil-1', kind: 'PILLAR', x: 10, z: 28.5, widthM: 0.8, depthM: 0.8, heightM: 9, metadata: { structure: 'roof support' } },
    { id: 'office-1', kind: 'OFFICE', x: 33, z: 24, widthM: 6, depthM: 5, heightM: 3.5, metadata: { purpose: 'goods-in desk' } },
  ],
  aisles: [aisle('A01', 7.5), aisle('A02', 15.5), aisle('A03', 23.5)],
};

/** The smallest valid document: one aisle, one lane, two bays, two levels. */
export const MINIMAL = {
  schemaVersion: 1,
  warehouse: { code: 'WH-MIN', lengthM: 8, widthM: 8, heightM: 6 },
  rackTypes: [{ id: 'rt-std', code: 'STD', bayWidthM: 2.7, depthM: 1.1 }],
  aisles: [
    {
      code: 'A01',
      orientation: 'X' as const,
      centerline: { x1: 1, z1: 4, x2: 7, z2: 4 },
      widthM: 3.0,
      lanes: [
        {
          code: 'A01-L',
          side: 'LEFT' as const,
          rackTypeId: 'rt-std',
          lengthM: 5.4,
          levels: [
            { clearHeightM: 1.4, binDepthM: 1.0, beamHeightM: 0.08 },
            { clearHeightM: 1.4, binDepthM: 1.0, beamHeightM: 0.08 },
          ],
        },
      ],
    },
  ],
};

/** Deep clone helper, so a test can mutate a reference document safely. */
export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
