import { describe, expect, it } from '@jest/globals';

import type { InboundException } from '../../../types/wms.types';
import {
  exceptionGroups,
  groupDestinations,
  groupReasons,
  groupStatus,
  isResolvedStatus,
} from '../exceptionGroups';

/** Only the grouped columns are read, so the fixture stays deliberately small. */
function exception(overrides: Partial<InboundException>): InboundException {
  return {
    id: 'e1',
    sku: 'PTK-DUK-M009',
    batch_number: 'B-1',
    quantity: 1,
    status: 'open',
    destination: 'HOLD',
    reason_code: 'DAMAGED',
    ...overrides,
  } as unknown as InboundException;
}

describe('exceptionGroups', () => {
  it('collapses the units of one master pack that share a SKU and batch', () => {
    const groups = exceptionGroups([
      exception({ id: 'a', quantity: 2 }),
      exception({ id: 'b', quantity: 3 }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].collapsed).toBe(true);
    expect(groups[0].quantity).toBe(5);
    expect(groups[0].exceptions.map((grouped) => grouped.id)).toEqual(['a', 'b']);
  });

  it('leaves a lone row uncollapsed so the common case is unchanged', () => {
    const groups = exceptionGroups([exception({ id: 'a' })]);

    expect(groups).toHaveLength(1);
    expect(groups[0].collapsed).toBe(false);
  });

  it('keeps the server order of first appearance', () => {
    const groups = exceptionGroups([
      exception({ id: 'a', sku: 'S1', batch_number: 'B1' }),
      exception({ id: 'b', sku: 'S2', batch_number: 'B2' }),
      exception({ id: 'c', sku: 'S1', batch_number: 'B1' }),
    ]);

    expect(groups.map((group) => group.key)).toEqual(['["S1","B1"]', '["S2","B2"]']);
    expect(groups[0].exceptions.map((grouped) => grouped.id)).toEqual(['a', 'c']);
  });

  it('groups on the SKU + batch pair, not on either alone', () => {
    const groups = exceptionGroups([
      exception({ id: 'a', sku: 'S1', batch_number: 'B1' }),
      exception({ id: 'b', sku: 'S1', batch_number: 'B2' }),
      exception({ id: 'c', sku: 'S2', batch_number: 'B1' }),
    ]);

    expect(groups).toHaveLength(3);
  });

  it('does not merge rows that merely both lack a batch', () => {
    const groups = exceptionGroups([
      exception({ id: 'a', batch_number: null }),
      exception({ id: 'b', batch_number: null }),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.every((group) => !group.collapsed)).toBe(true);
  });

  it('does not merge rows that lack a SKU', () => {
    const groups = exceptionGroups([
      exception({ id: 'a', sku: null }),
      exception({ id: 'b', sku: null }),
    ]);

    expect(groups).toHaveLength(2);
  });

  it('reports nothing for an empty queue', () => {
    expect(exceptionGroups([])).toEqual([]);
  });
});

describe('group aggregates', () => {
  const two = exceptionGroups([
    exception({ id: 'a', status: 'open', destination: 'HOLD', reason_code: 'DAMAGED' }),
    exception({ id: 'b', status: 'open', destination: 'QUARANTINE', reason_code: 'DAMAGED' }),
  ]);

  it('claims a status only when every row agrees', () => {
    expect(groupStatus(two[0])).toBe('open');
  });

  it('refuses to claim a status when the rows disagree', () => {
    const mixed = exceptionGroups([
      exception({ id: 'a', status: 'open' }),
      exception({ id: 'b', status: 'approved' }),
    ]);

    expect(groupStatus(mixed[0])).toBeNull();
  });

  it('lists every destination the rows landed in', () => {
    expect(groupDestinations(two[0])).toBe('HOLD, QUARANTINE');
  });

  it('lists the reason codes without repeating them', () => {
    expect(groupReasons(two[0])).toBe('DAMAGED');
  });

  it('falls back to a dash when a column is empty everywhere', () => {
    const bare = exceptionGroups([
      exception({ id: 'a', destination: null }),
      exception({ id: 'b', destination: null }),
    ]);

    expect(groupDestinations(bare[0])).toBe('\u2014');
  });
});

describe('isResolvedStatus', () => {
  it('treats closed and released as terminal', () => {
    expect(isResolvedStatus('closed')).toBe(true);
    expect(isResolvedStatus('released')).toBe(true);
  });

  it('keeps every actionable status open', () => {
    expect(isResolvedStatus('pending_approval')).toBe(false);
    expect(isResolvedStatus('open')).toBe(false);
    expect(isResolvedStatus('approved')).toBe(false);
  });
});
