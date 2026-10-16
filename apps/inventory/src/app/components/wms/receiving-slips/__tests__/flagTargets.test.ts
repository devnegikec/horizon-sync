import { describe, expect, it } from '@jest/globals';

import type { ReceivingSlipGroupItem, SettableLineFlag } from '../../../../types/wms.types';
import { flagOptionsFor, readTarget, seedFlagForm } from '../FlagLineDialog';
import { packFlagItems } from '../SlipDetailDialog';

/** Only the flagging columns are read, so the fixture stays deliberately small. */
function line(overrides: Partial<ReceivingSlipGroupItem>): ReceivingSlipGroupItem {
  return {
    id: 'line-1',
    sku: 'PTK-DUK-M009',
    quantity: 1,
    flag: 'ok',
    ...overrides,
  } as unknown as ReceivingSlipGroupItem;
}

describe('readTarget', () => {
  it('treats a closed dialog as no target', () => {
    expect(readTarget(null)).toEqual({ primary: null, lineCount: 0, isPack: false });
  });

  it('treats a single line as a line, not a pack', () => {
    const target = readTarget([line({})]);

    expect(target.isPack).toBe(false);
    expect(target.lineCount).toBe(1);
    expect(target.primary?.id).toBe('line-1');
  });

  it('treats several lines as a master pack, keyed off the first', () => {
    const target = readTarget([line({ id: 'a' }), line({ id: 'b' })]);

    expect(target.isPack).toBe(true);
    expect(target.lineCount).toBe(2);
    expect(target.primary?.id).toBe('a');
  });
});

describe('flagOptionsFor', () => {
  it('offers every flag on a single line', () => {
    expect(flagOptionsFor(false)).toEqual(['short', 'damaged', 'excess', 'hold', 'quarantine']);
  });

  it('withholds `short` from a pack, because a shortage is a per-line quantity', () => {
    const options = flagOptionsFor(true);

    expect(options).not.toContain('short');
    expect(options).toEqual(['damaged', 'excess', 'hold', 'quarantine']);
  });
});

describe('seedFlagForm', () => {
  it('starts a single line from its own current values, so a re-flag is a correction', () => {
    const seed = seedFlagForm([line({ flag: 'damaged', reason_code: 'DAMAGED', short_qty: 3 })]);

    expect(seed).toEqual({ flag: 'damaged', reasonCode: 'DAMAGED', shortQty: '3' });
  });

  it('defaults a settled line to short', () => {
    expect(seedFlagForm([line({ flag: 'ok' })]).flag).toBe('short');
  });

  it('starts a pack neutral instead of inheriting a single line state', () => {
    const seed = seedFlagForm([line({ flag: 'damaged', reason_code: 'DAMAGED', short_qty: 3 }), line({ id: 'b' })]);

    expect(seed).toEqual({ flag: 'damaged', reasonCode: '', shortQty: '' });
  });

  it('never seeds a pack with `short`, which is not offered for packs', () => {
    const options = flagOptionsFor(true);
    const seed = seedFlagForm([line({ flag: 'short', short_qty: 5 }), line({ id: 'b' })]);

    expect(options).toContain(seed.flag as SettableLineFlag);
  });

  it('starts a closed dialog neutral', () => {
    expect(seedFlagForm(null)).toEqual({ flag: 'damaged', reasonCode: '', shortQty: '' });
  });
});

describe('packFlagItems', () => {
  it('keeps lines that can still change', () => {
    const items = packFlagItems([line({ id: 'a', flag: 'ok' }), line({ id: 'b', flag: 'damaged' })]);

    expect(items.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('drops rejected lines, which are terminal', () => {
    const items = packFlagItems([line({ id: 'a', flag: 'rejected' }), line({ id: 'b', flag: 'ok' })]);

    expect(items.map((item) => item.id)).toEqual(['b']);
  });
});
