import { describe, expect, it } from '@jest/globals';

import type { InboundExceptionReason, ReturnReference, ReturnReferenceLine } from '../../../../types/wms.types';
import {
  buildRegistrationLines,
  canCancelRegistration,
  canSubmitRegistration,
  initialLineDrafts,
  lineDraftError,
  parseQuantity,
  parseSerials,
  registrationReasonOptions,
  registrationTotalQty,
  returnableLines,
  type RegistrationDraftState,
} from '../returnRegistrations';

function line(overrides: Partial<ReturnReferenceLine> = {}): ReturnReferenceLine {
  return {
    line_id: 'line-1',
    item_id: 'item-1',
    sku: 'TTK-COOK-897',
    item_name: 'Prestige Cooker 3L',
    uom: 'NOS',
    invoiced_qty: 10,
    already_returned_qty: 2,
    returnable_qty: 8,
    ...overrides,
  };
}

function reference(lines: ReturnReferenceLine[]): ReturnReference {
  return { invoice: null, lines, suggested_warehouse_id: 'wh-1' };
}

function state(overrides: Partial<RegistrationDraftState> = {}): RegistrationDraftState {
  return {
    reference: reference([line()]),
    drafts: [{ lineId: 'line-1', included: true, quantity: '2', serials: '' }],
    reasonCode: 'RETURN_DAMAGED',
    ...overrides,
  };
}

describe('returnableLines', () => {
  it('hides lines that cannot be returned again', () => {
    const lines = returnableLines(reference([line({ line_id: 'a' }), line({ line_id: 'b', returnable_qty: 0 })]));

    expect(lines.map((entry) => entry.line_id)).toEqual(['a']);
    expect(returnableLines(null)).toEqual([]);
  });

  it('starts every line unselected', () => {
    expect(initialLineDrafts(reference([line()]))).toEqual([{ lineId: 'line-1', included: false, quantity: '1', serials: '' }]);
  });
});

describe('quantity validation', () => {
  it('rejects anything that is not a positive number', () => {
    expect(parseQuantity('0')).toBeNull();
    expect(parseQuantity('-2')).toBeNull();
    expect(parseQuantity('two')).toBeNull();
    expect(parseQuantity('2.5')).toBe(2.5);
  });

  it('caps the quantity at the returnable amount', () => {
    expect(lineDraftError(line({ returnable_qty: 8 }), { lineId: 'line-1', included: true, quantity: '8', serials: '' })).toBeNull();
    expect(lineDraftError(line({ returnable_qty: 8 }), { lineId: 'line-1', included: true, quantity: '9', serials: '' })).toBe(
      'Only 8 can be returned',
    );
    expect(lineDraftError(line(), { lineId: 'line-1', included: true, quantity: '', serials: '' })).toBe(
      'Enter a quantity greater than zero',
    );
  });
});

describe('submission', () => {
  it('needs a reason and at least one valid selected line', () => {
    expect(canSubmitRegistration(state())).toBe(true);
    expect(canSubmitRegistration(state({ reasonCode: '' }))).toBe(false);
    expect(canSubmitRegistration(state({ drafts: [{ lineId: 'line-1', included: false, quantity: '2', serials: '' }] }))).toBe(false);
    expect(canSubmitRegistration(state({ drafts: [{ lineId: 'line-1', included: true, quantity: '99', serials: '' }] }))).toBe(false);
  });

  it('ignores lines the API no longer offers', () => {
    expect(canSubmitRegistration(state({ drafts: [{ lineId: 'gone', included: true, quantity: '1', serials: '' }] }))).toBe(false);
  });

  it('builds the request lines, omitting empty serial lists', () => {
    const withSerials = state({
      drafts: [
        { lineId: 'line-1', included: true, quantity: '2', serials: 'TTK-1T1ZB0, TTK-1T1ZB1' },
      ],
    });

    expect(buildRegistrationLines(withSerials)).toEqual([
      { sku: 'TTK-COOK-897', quantity: 2, uom: 'NOS', serials: ['TTK-1T1ZB0', 'TTK-1T1ZB1'] },
    ]);
    expect(buildRegistrationLines(state())[0]).not.toHaveProperty('serials');
  });

  it('sums the units across the selected lines', () => {
    const two = state({
      reference: reference([line({ line_id: 'a' }), line({ line_id: 'b', sku: 'PTK-TOA-G001' })]),
      drafts: [
        { lineId: 'a', included: true, quantity: '2', serials: '' },
        { lineId: 'b', included: true, quantity: '3', serials: '' },
        { lineId: 'b', included: false, quantity: '5', serials: '' },
      ],
    });

    expect(registrationTotalQty(two)).toBe(5);
  });
});

describe('serials', () => {
  it('splits on any separator and de-duplicates', () => {
    expect(parseSerials('A1, A2\nA1  A3')).toEqual(['A1', 'A2', 'A3']);
    expect(parseSerials('  ')).toEqual([]);
  });
});

describe('canCancelRegistration', () => {
  it('allows cancelling only before the dock starts receiving', () => {
    expect(canCancelRegistration('draft')).toBe(true);
    expect(canCancelRegistration('ready')).toBe(true);
    expect(canCancelRegistration('receiving')).toBe(false);
    expect(canCancelRegistration('received')).toBe(false);
    expect(canCancelRegistration('closed')).toBe(false);
    expect(canCancelRegistration('cancelled')).toBe(false);
  });
});

describe('registrationReasonOptions', () => {
  it('keeps only the return categories', () => {
    const reasons: InboundExceptionReason[] = [
      { code: 'RETURN_GOOD', name: 'Returned good', category: 'return_good', default_destination: null, requires_approval: false },
      { code: 'RETURN_DAMAGED', name: 'Returned damaged', category: 'return_damage', default_destination: 'QUARANTINE', requires_approval: true },
      { code: 'RETURN_SCRAP', name: 'Returned scrap', category: 'return_scrap', default_destination: null, requires_approval: false },
      { code: 'SHORT', name: 'Short', category: 'short', default_destination: null, requires_approval: false },
    ];

    expect(registrationReasonOptions(reasons).map((entry) => entry.code)).toEqual(['RETURN_GOOD', 'RETURN_DAMAGED', 'RETURN_SCRAP']);
  });
});
