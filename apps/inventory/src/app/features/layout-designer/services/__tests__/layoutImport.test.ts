/**
 * Tests for the import seam: text -> document -> compiler verdict -> wire shapes.
 *
 * `analyseLayoutDocument` is the function the dialog trusts before it posts anything,
 * so it is asserted against the same reference document the compiler suites use.
 */

import { CROSS_AISLE_TWO_WAY, MINIMAL, clone } from '../../layout-core/__tests__/fixtures';
import { analyseLayoutDocument, describeFileProblem, parseLayoutJson, toWireDiagnostics, toWireSummary } from '../layoutImport';

describe('parseLayoutJson', () => {
  it('accepts a JSON object', () => {
    const result = parseLayoutJson('{ "schemaVersion": 1 }');

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.document.schemaVersion).toBe(1);
  });

  it('rejects empty text', () => {
    const result = parseLayoutJson('   ');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('empty');
  });

  it('rejects malformed JSON with a readable message', () => {
    const result = parseLayoutJson('{ nope }');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('Not valid JSON');
  });

  it('rejects a JSON array', () => {
    const result = parseLayoutJson('[]');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain('must be a JSON object');
  });
});

describe('analyseLayoutDocument', () => {
  it('reports a clean reference document as applyable', () => {
    const analysis = analyseLayoutDocument(clone(CROSS_AISLE_TWO_WAY));

    expect(analysis.applyable).toBe(true);
    expect(analysis.blockingCode).toBeNull();
    expect(analysis.diagnostics).toEqual([]);
    expect(analysis.summary.bins).toBe(240);
  });

  it('summarises in the wire shape the API uses', () => {
    const analysis = analyseLayoutDocument(clone(MINIMAL));

    expect(analysis.summary).toEqual({
      zones: 1,
      aisles: 1,
      lanes: 1,
      rack_types: 1,
      obstacles: 0,
      bays: 2,
      active_bays: 2,
      levels: 2,
      bins: 4,
      errors: 0,
      warnings: 0,
    });
  });

  it('blocks a document with errors and names the blocking code', () => {
    const document = clone(MINIMAL);
    document.aisles[0].centerline = { x1: 1, z1: 1, x2: 7, z2: 5 };

    const analysis = analyseLayoutDocument(document);

    expect(analysis.applyable).toBe(false);
    expect(analysis.blockingCode).toBe('AISLE_NOT_AXIS_ALIGNED');
    expect(analysis.diagnostics.map((diagnostic) => diagnostic.severity)).toContain('error');
  });

  it('does not treat warnings as blocking', () => {
    const document = clone(MINIMAL);
    document.aisles[0].widthM = 2.0;

    const analysis = analyseLayoutDocument(document);

    expect(analysis.applyable).toBe(true);
    expect(analysis.summary.warnings).toBe(1);
    expect(analysis.diagnostics[0].code).toBe('AISLE_TOO_NARROW');
  });

  it('keeps warnings applyable in the summary too', () => {
    const document = clone(MINIMAL);
    document.aisles[0].lanes[0].levels[0].binDepthM = 5.0;

    const analysis = analyseLayoutDocument(document);

    expect(analysis.summary.errors).toBe(0);
    expect(analysis.summary.warnings).toBeGreaterThan(0);
  });

  it('samples at most eight generated bin paths', () => {
    const analysis = analyseLayoutDocument(clone(CROSS_AISLE_TWO_WAY));

    expect(analysis.sampleBinPaths).toHaveLength(8);
    expect(analysis.sampleBinPaths[0]).toBe('Z01-A01-B01-L01-BN001');
  });
});

describe('wire conversion', () => {
  it('renames entityRefs to entity_refs and keeps the payload', () => {
    const document = clone(MINIMAL);
    document.aisles[0].lanes[0].rackTypeId = 'rt-missing';

    const analysis = analyseLayoutDocument(document);
    const diagnostic = analysis.diagnostics[0];

    expect(diagnostic.entity_refs[0]).toEqual({ kind: 'lane', id: 'A01-L', label: 'A01-L' });
    expect(diagnostic.severity).toBe('error');
    expect(diagnostic.message).toContain('rt-missing');
  });

  it('produces a payload with no camelCase summary keys left over', () => {
    const summary = toWireSummary({
      zones: 1,
      aisles: 1,
      lanes: 1,
      rackTypes: 1,
      obstacles: 0,
      bays: 2,
      activeBays: 2,
      levels: 2,
      bins: 4,
      errors: 0,
      warnings: 0,
    });

    expect(summary.active_bays).toBe(2);
    expect(summary.rack_types).toBe(1);
    expect(Object.keys(summary)).not.toContain('activeBays');
  });

  it('returns an empty array when there is nothing to convert', () => {
    expect(toWireDiagnostics([])).toEqual([]);
  });
});

describe('describeFileProblem', () => {
  it('accepts a normal json file', () => {
    expect(describeFileProblem(new File(['{}'], 'layout.json', { type: 'application/json' }))).toBeNull();
  });

  it('rejects an empty file', () => {
    expect(describeFileProblem(new File([], 'empty.json'))).toContain('empty');
  });
});
