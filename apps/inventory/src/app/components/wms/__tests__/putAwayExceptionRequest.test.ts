import { describe, expect, it } from '@jest/globals';

import { buildRequest, type PutAwayExceptionTarget } from '../PutAwayExceptionDialog';

function target(overrides: Partial<PutAwayExceptionTarget>): PutAwayExceptionTarget {
  return {
    scope: 'item',
    id: 'put-away-item-1',
    sku: 'PTK-DUK-M009',
    productName: 'Prestige …',
    batchNumber: 'B-1',
    unitCount: 1,
    quantity: 4,
    itemIds: ['put-away-item-1'],
    ...overrides,
  };
}

describe('buildRequest', () => {
  it('raises a unit-scoped exception against the line it came from', () => {
    const request = buildRequest(target({}), 'damaged', 'DAMAGED', 'QUARANTINE', '');

    expect(request).toEqual({
      classification: 'damaged',
      reason_code: 'DAMAGED',
      destination: 'QUARANTINE',
      scope: 'item',
      item_ids: ['put-away-item-1'],
    });
  });

  it('marks a master pack as one pack-scoped exception covering every unit', () => {
    const pack = target({ scope: 'pack', id: 'qseal-9', unitCount: 3, itemIds: ['a', 'b', 'c'] });
    const request = buildRequest(pack, 'hold', 'HOLD_OPS', 'HOLD', '');

    expect(request.scope).toBe('pack');
    expect(request.item_ids).toEqual(['a', 'b', 'c']);
  });

  it('omits the note rather than sending an empty string', () => {
    const request = buildRequest(target({}), 'damaged', 'DAMAGED', 'HOLD', '   ');

    expect(request).not.toHaveProperty('note');
  });

  it('sends the note when the operator wrote one', () => {
    const request = buildRequest(target({}), 'damaged', 'DAMAGED', 'HOLD', '  Carton crushed  ');

    expect(request.note).toBe('Carton crushed');
  });

  it('never emits a short classification, which put-away cannot have', () => {
    const request = buildRequest(target({}), 'excess', 'EXCESS_QTY', 'HOLD', '');

    expect(['damaged', 'excess', 'hold', 'quarantine']).toContain(request.classification);
  });
});
