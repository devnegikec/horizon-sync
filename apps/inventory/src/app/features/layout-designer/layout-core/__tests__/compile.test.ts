/**
 * Tests for the layout document compiler.
 *
 * The compiler is pure, so these need no network and no fixtures beyond the
 * reference documents. They assert the *derived* numbers and the *full* diagnostics
 * list, because those are the contract the Python engine in
 * `core-service/app/layout_design/` mirrors - the same document and the same
 * expectations exist there, which is what stops the two compilers drifting.
 */

import {
  BLOCKING_RULE_CODES,
  QR_LENGTH,
  RULES,
  buildLayout,
  errorCount,
  formatBinCode,
  formatDisplayPath,
  generateQrCodes,
  isApplyable,
  isValidCodePattern,
  sampleBinPaths,
  summaryOf,
  trailingDigits,
  wmsSegment,
  type CompiledLayout,
} from '../index';

import { CROSS_AISLE_TWO_WAY, MINIMAL, clone } from './fixtures';

const codesOf = (compiled: CompiledLayout): string[] => compiled.diagnostics.map((diagnostic) => diagnostic.code);

describe('reference documents', () => {
  it('compiles the cross-aisle document cleanly', () => {
    const compiled = buildLayout(clone(CROSS_AISLE_TWO_WAY));

    expect(compiled.diagnostics).toEqual([]);
    expect(isApplyable(compiled)).toBe(true);
    expect(compiled.bins.length).toBeGreaterThan(0);
  });

  it('derives the documented counts', () => {
    const summary = summaryOf(buildLayout(clone(CROSS_AISLE_TWO_WAY)));

    expect(summary.zones).toBe(1);
    expect(summary.aisles).toBe(3);
    expect(summary.lanes).toBe(6);
    expect(summary.bays).toBe(60); // 3 aisles x 2 lanes x 10 bays
    expect(summary.activeBays).toBe(48); // 2 bays lost per lane to the cross-aisle
    expect(summary.levels).toBe(30);
    expect(summary.bins).toBe(240); // 48 active bays x 5 levels
    expect(summary.rackTypes).toBe(1);
    expect(summary.obstacles).toBe(5);
    expect(summary.errors).toBe(0);
    expect(summary.warnings).toBe(0);
  });

  it('removes exactly the middle bays of every level for the cross-aisle', () => {
    const compiled = buildLayout(clone(CROSS_AISLE_TWO_WAY));
    const levelOne = compiled.bins.filter((bin) => bin.path.startsWith('Z01-A01-B01-L01-')).map((bin) => bin.path);

    expect(levelOne).toEqual([
      'Z01-A01-B01-L01-BN001',
      'Z01-A01-B01-L01-BN002',
      'Z01-A01-B01-L01-BN003',
      'Z01-A01-B01-L01-BN004',
      'Z01-A01-B01-L01-BN007',
      'Z01-A01-B01-L01-BN008',
      'Z01-A01-B01-L01-BN009',
      'Z01-A01-B01-L01-BN010',
    ]);
  });

  it('produces a unique path for every bin', () => {
    const compiled = buildLayout(clone(CROSS_AISLE_TWO_WAY));
    const paths = compiled.bins.map((bin) => bin.path);

    expect(new Set(paths).size).toBe(paths.length);
  });

  it('compiles the minimal document cleanly', () => {
    const compiled = buildLayout(clone(MINIMAL));

    expect(compiled.diagnostics).toEqual([]);
    expect(compiled.bins).toHaveLength(4);
  });
});

describe('WMS naming', () => {
  it('prefixes every segment under the default scheme', () => {
    const compiled = buildLayout(clone(MINIMAL));

    expect(compiled.bins.map((bin) => bin.path)).toEqual([
      'Z01-A01-B01-L01-BN001',
      'Z01-A01-B01-L02-BN001',
      'Z01-A01-B01-L01-BN002',
      'Z01-A01-B01-L02-BN002',
    ]);
  });

  it('maps the left lane to B01 and the right lane to B02', () => {
    const compiled = buildLayout(clone(CROSS_AISLE_TWO_WAY));
    const bayPaths = new Map(compiled.bays.map((bay) => [bay.laneCode, bay.path]));

    expect(bayPaths.get('A01-L')).toBe('Z01-A01-B01');
    expect(bayPaths.get('A01-R')).toBe('Z01-A01-B02');
  });

  it('leaves zone and aisle bare under the floor-plan scheme', () => {
    const document = clone(MINIMAL);
    document.layout = { namingScheme: 'wms_floorplan' } as never;

    const compiled = buildLayout(document);

    expect(compiled.diagnostics).toEqual([]);
    expect(compiled.bins[0].path).toBe('01-01-B01-L01-BN01');
  });

  it('lets the zone code drive the zone segment', () => {
    const document = clone(MINIMAL);
    document.aisles[0].zoneCode = 'Z07';

    expect(buildLayout(document).bins[0].path.startsWith('Z07-')).toBe(true);
  });

  it('prefers an authored aisle number over its position', () => {
    const document = clone(MINIMAL);
    document.aisles[0].code = 'A12';

    expect(buildLayout(document).bins[0].path).toBe('Z01-A12-B01-L01-BN001');
  });

  it('exposes the bin label from the document pattern', () => {
    const compiled = buildLayout(clone(MINIMAL));

    expect(compiled.bins[0].label).toBe('WH-MIN/A01/LEFT/B001/L1');
  });

  it('records the plan-plane centre and the level height separately', () => {
    const compiled = buildLayout(clone(MINIMAL));

    expect(compiled.bins[0].centerX).toBeCloseTo(2.35, 6);
    expect(compiled.bins[0].centerZ).toBeCloseTo(1.95, 6);
    expect(compiled.bins[0].centerY).toBeCloseTo(0.78, 6);
  });

  it('samples bin paths for the preview header', () => {
    expect(sampleBinPaths(buildLayout(clone(MINIMAL)), 2)).toEqual(['Z01-A01-B01-L01-BN001', 'Z01-A01-B01-L02-BN001']);
  });
});

describe('naming helpers', () => {
  it('extracts trailing digits', () => {
    expect(trailingDigits('A03')).toBe('03');
    expect(trailingDigits('MAIN')).toBe('');
    expect(trailingDigits(null)).toBe('');
  });

  it('dashes only the last segment for display', () => {
    expect(formatDisplayPath('Z01-A03-B02-L04-BN001')).toBe('Z01-A03-B02-L04-BN-001');
  });

  it('validates code patterns', () => {
    expect(isValidCodePattern('{warehouse}/{lane}/B{bay:03}')).toBe(true);
    expect(isValidCodePattern('no-placeholders')).toBe(false);
    expect(isValidCodePattern('{unknown}')).toBe(false);
  });

  it('pads pattern tokens', () => {
    expect(formatBinCode('{warehouse}/{aisle}/{side}/B{bay:03}/L{level}', { warehouse: 'WH1', aisle: 'A01', side: 'LEFT', bay: 5, level: 2 })).toBe(
      'WH1/A01/LEFT/B005/L2',
    );
  });

  it('falls back to the default pattern when the pattern is malformed', () => {
    expect(formatBinCode('broken', { warehouse: 'WH1', aisle: 'A01', side: 'LEFT', bay: 1, level: 1 })).toBe('WH1/A01/LEFT/B001/L1');
  });

  it('generates unique readable QR codes', () => {
    const codes = generateQrCodes(200, ['ABCDE']);

    expect(new Set(codes).size).toBe(200);
    expect(codes).not.toContain('ABCDE');
    for (const code of codes) {
      expect(code).toHaveLength(QR_LENGTH);
      expect(/[IO01]/.test(code)).toBe(false);
    }
  });

  it('pads bins to three digits under wms_typed and two otherwise', () => {
    expect(wmsSegment('bin', 7)).toBe('BN007');
    expect(wmsSegment('bin', 7, null, 'wms_floorplan')).toBe('BN07');
  });
});

describe('document diagnostics', () => {
  it('reports a malformed document as LAYOUT_DOC_INVALID', () => {
    const compiled = buildLayout({ schemaVersion: 1, warehouse: { code: 'WH1' } });

    expect(codesOf(compiled)).toEqual(['LAYOUT_DOC_INVALID']);
    expect(isApplyable(compiled)).toBe(false);
  });

  it('reports an unsupported schema version', () => {
    const document = clone(MINIMAL);
    document.schemaVersion = 99;

    expect(codesOf(buildLayout(document))).toEqual(['SCHEMA_VERSION_UNSUPPORTED']);
  });

  it('rejects a diagonal aisle', () => {
    const document = clone(MINIMAL);
    document.aisles[0].centerline = { x1: 1, z1: 1, x2: 7, z2: 5 };

    expect(codesOf(buildLayout(document))).toContain('AISLE_NOT_AXIS_ALIGNED');
  });

  it('rejects a zero-length aisle', () => {
    const document = clone(MINIMAL);
    document.aisles[0].centerline = { x1: 4, z1: 4, x2: 4, z2: 4 };

    expect(codesOf(buildLayout(document))).toContain('AISLE_ZERO_LENGTH');
  });

  it('rejects a declared orientation that contradicts the centerline', () => {
    const document = clone(MINIMAL);
    (document.aisles[0] as { orientation: string }).orientation = 'Z';

    expect(codesOf(buildLayout(document))).toContain('AISLE_ORIENTATION_MISMATCH');
  });

  it('rejects an unknown rack type', () => {
    const document = clone(MINIMAL);
    document.aisles[0].lanes[0].rackTypeId = 'rt-missing';

    expect(codesOf(buildLayout(document))).toContain('LANE_UNKNOWN_RACK_TYPE');
  });

  it('rejects aisles with lanes but no rack types', () => {
    const document = clone(MINIMAL);
    document.rackTypes = [];

    expect(codesOf(buildLayout(document))).toContain('NO_RACK_TYPES_DEFINED');
  });

  it('rejects an aisle outside the footprint', () => {
    const document = clone(MINIMAL);
    document.warehouse.lengthM = 3;

    expect(codesOf(buildLayout(document))).toContain('AISLE_OUT_OF_FOOTPRINT');
  });

  it('rejects a level stack taller than the building', () => {
    const document = clone(MINIMAL);
    document.warehouse.heightM = 2;

    const compiled = buildLayout(document);

    expect(codesOf(compiled)).toContain('LEVEL_STACK_EXCEEDS_HEIGHT');
    expect(isApplyable(compiled)).toBe(false);
  });

  it('rejects an obstacle inside a bay', () => {
    const document = clone(MINIMAL);
    // Inside the left rack (z 1.4-2.5), clear of the corridor (z 2.5-5.5).
    document.obstacles = [{ kind: 'PILLAR', x: 2.0, z: 1.7, widthM: 0.5, depthM: 0.5, heightM: 3 }];

    const codes = codesOf(buildLayout(document));

    expect(codes).toContain('BAY_OBSTACLE_OVERLAP');
    expect(codes).not.toContain('AISLE_OBSTACLE_OVERLAP');
  });

  it('rejects an obstacle inside the corridor', () => {
    const document = clone(MINIMAL);
    document.obstacles = [{ kind: 'COLUMN', x: 3.0, z: 3.8, widthM: 0.5, depthM: 0.5, heightM: 3 }];

    expect(codesOf(buildLayout(document))).toContain('AISLE_OBSTACLE_OVERLAP');
  });

  it('warns about a narrow aisle without blocking', () => {
    const document = clone(MINIMAL);
    document.aisles[0].widthM = 2.0;

    const compiled = buildLayout(document);

    expect(codesOf(compiled)).toEqual(['AISLE_TOO_NARROW']);
    expect(isApplyable(compiled)).toBe(true);
  });

  it('rejects a lane running past its aisle', () => {
    const document = clone(MINIMAL);
    document.aisles[0].lanes[0].lengthM = 99;

    expect(codesOf(buildLayout(document))).toContain('LANE_RUN_EXCEEDS_AISLE');
  });

  it('warns when a lane is shorter than one bay', () => {
    const document = clone(MINIMAL);
    document.aisles[0].lanes[0].lengthM = 1.0;

    const compiled = buildLayout(document);

    expect(codesOf(compiled)).toEqual(['LANE_ZERO_BAYS']);
    expect(compiled.bins).toEqual([]);
  });

  it('warns when an aisle has no lanes', () => {
    const document = clone(MINIMAL);
    document.aisles[0].lanes = [];

    expect(codesOf(buildLayout(document))).toContain('AISLE_WITHOUT_LANES');
  });

  it('rejects a duplicate aisle code', () => {
    const document = clone(CROSS_AISLE_TWO_WAY);
    document.aisles[1].code = 'A01';

    expect(codesOf(buildLayout(document))).toContain('AISLE_CODE_DUPLICATE');
  });

  it('warns when a level is deeper than the rack frame', () => {
    const document = clone(MINIMAL);
    document.aisles[0].lanes[0].levels[0].binDepthM = 5.0;

    const compiled = buildLayout(document);

    expect(codesOf(compiled)).toContain('LEVEL_DEPTH_EXCEEDS_RACK');
    expect(isApplyable(compiled)).toBe(true);
  });

  it('detects lanes occupying the same floor space', () => {
    const document = clone(MINIMAL);
    const second = clone(document.aisles[0]);
    second.code = 'A02';
    second.centerline = { x1: 1, z1: 4, x2: 7, z2: 4 };
    document.aisles = [document.aisles[0], second];

    expect(codesOf(buildLayout(document))).toContain('LANE_OVERLAP');
  });

  it('detects a bin code pattern that is not unique enough', () => {
    const document = clone(MINIMAL);
    document.aisles[0].lanes[0].binCodePattern = '{warehouse}/L{level}';

    expect(codesOf(buildLayout(document))).toContain('BIN_CODE_DUPLICATE');
  });

  it('rejects a bin code pattern with no placeholders', () => {
    const document = clone(MINIMAL);
    (document.aisles[0].lanes[0] as { binCodePattern: string }).binCodePattern = 'nope';

    expect(codesOf(buildLayout(document))).toEqual(['LAYOUT_DOC_INVALID']);
  });

  it('rejects a lane with no levels', () => {
    const document = clone(MINIMAL);
    (document.aisles[0].lanes[0] as { levels: unknown[] }).levels = [];

    expect(codesOf(buildLayout(document))).toEqual(['LAYOUT_DOC_INVALID']);
  });

  it('rejects a non-positive dimension', () => {
    const document = clone(MINIMAL);
    document.warehouse.heightM = 0;

    expect(codesOf(buildLayout(document))).toEqual(['LAYOUT_DOC_INVALID']);
  });
});

describe('rule registry', () => {
  it('is internally consistent', () => {
    const definitions = Object.values(RULES);

    expect(definitions.length).toBeGreaterThan(0);
    for (const definition of definitions) {
      expect(RULES[definition.code]).toBe(definition);
      expect(definition.description).toBeTruthy();
      expect(BLOCKING_RULE_CODES.has(definition.code)).toBe(definition.severity === 'error');
    }
  });

  it('only ever reports registered codes with their registered severity', () => {
    const document = clone(MINIMAL);
    document.warehouse.lengthM = 3;
    document.aisles[0].widthM = 1.0;
    document.obstacles = [{ kind: 'WALL', x: 2.0, z: 2.5, widthM: 1.0, depthM: 1.0, heightM: 3 }];

    const compiled = buildLayout(document);

    expect(errorCount(compiled)).toBeGreaterThan(0);
    for (const diagnostic of compiled.diagnostics) {
      expect(RULES[diagnostic.code]).toBeDefined();
      expect(diagnostic.severity).toBe(RULES[diagnostic.code].severity);
    }
  });
});
