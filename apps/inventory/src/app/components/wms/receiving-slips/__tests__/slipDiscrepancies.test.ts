import { describe, expect, it } from '@jest/globals';

import type { ReceivingSlip, ReceivingSlipGroupItem } from '../../../types/wms.types';
import { discrepancyPhrases, slipDiscrepancies } from '../slipDiscrepancies';

/** Only `groups[].items` is read, so the fixture stays this small on purpose. */
function slipWith(lines: Partial<ReceivingSlipGroupItem>[]): ReceivingSlip {
  return { id: 'slip-1', groups: [{ items: lines }] } as unknown as ReceivingSlip;
}

describe('slipDiscrepancies', () => {
  it('reports nothing for a missing slip', () => {
    expect(slipDiscrepancies(null)).toEqual({ flagged: 0, shortLines: 0, shortUnits: 0, segregatedLines: 0 });
  });

  it('treats ok and rejected lines as settled, not as discrepancies', () => {
    const found = slipDiscrepancies(slipWith([{ flag: 'ok' }, { flag: 'rejected' }]));

    expect(found).toEqual({ flagged: 0, shortLines: 0, shortUnits: 0, segregatedLines: 0 });
    expect(discrepancyPhrases(found)).toEqual([]);
  });

  it('sums the missing units across short lines', () => {
    const found = slipDiscrepancies(slipWith([{ flag: 'short', short_qty: 3 }, { flag: 'short', short_qty: 2 }, { flag: 'ok' }]));

    expect(found.flagged).toBe(2);
    expect(found.shortLines).toBe(2);
    expect(found.shortUnits).toBe(5);
    expect(discrepancyPhrases(found)).toEqual(['2 line(s) short — 5 unit(s) missing']);
  });

  it('counts every segregation flag as needing a disposition', () => {
    const found = slipDiscrepancies(slipWith([{ flag: 'damaged' }, { flag: 'excess' }, { flag: 'hold' }, { flag: 'quarantine' }]));

    expect(found.segregatedLines).toBe(4);
    expect(found.shortLines).toBe(0);
    expect(discrepancyPhrases(found)).toEqual(['4 line(s) damaged, excess, on hold or quarantined']);
  });

  it('counts a flag this build does not know about', () => {
    expect(slipDiscrepancies(slipWith([{ flag: 'melted' }])).flagged).toBe(1);
  });

  it('treats a short line without a quantity as zero units, never NaN', () => {
    const found = slipDiscrepancies(slipWith([{ flag: 'short', short_qty: null }]));

    expect(found.shortUnits).toBe(0);
    expect(discrepancyPhrases(found)).toEqual(['1 line(s) short — 0 unit(s) missing']);
  });

  it('falls back to the legacy flat payload, which carries no short quantity', () => {
    const legacy = { id: 'slip-1', items: [{ flag: 'short' }, { flag: 'ok' }] } as unknown as ReceivingSlip;
    const found = slipDiscrepancies(legacy);

    expect(found.shortLines).toBe(1);
    expect(found.shortUnits).toBe(0);
  });

  it('prefers grouped lines over the legacy list when both are present', () => {
    const both = { id: 'slip-1', groups: [{ items: [{ flag: 'ok' }] }], items: [{ flag: 'short' }] } as unknown as ReceivingSlip;

    expect(slipDiscrepancies(both).flagged).toBe(0);
  });

  it('describes short and segregated lines together', () => {
    const found = slipDiscrepancies(slipWith([{ flag: 'short', short_qty: 4 }, { flag: 'hold' }]));

    expect(discrepancyPhrases(found)).toEqual([
      '1 line(s) short — 4 unit(s) missing',
      '1 line(s) damaged, excess, on hold or quarantined',
    ]);
  });
});
