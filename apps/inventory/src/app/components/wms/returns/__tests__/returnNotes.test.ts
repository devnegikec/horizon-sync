import { describe, expect, it } from '@jest/globals';

import type {
  InboundExceptionReason,
  ReturnReceiptNoteDetail,
  ReturnReceiptNoteGroup,
  ReturnReceiptNoteItem,
} from '../../../../types/wms.types';
import {
  canApproveNote,
  conditionSummary,
  defaultDisposition,
  dispositionReasonOptions,
  dispositionsForLine,
  groupQuantity,
  lineNeedsDisposition,
  nextDispositionReason,
  noteLines,
  returnNoteRows,
  unclassifiedLines,
} from '../returnNotes';

function line(overrides: Partial<ReturnReceiptNoteItem> = {}): ReturnReceiptNoteItem {
  return {
    id: 'line-1',
    serial_number: null,
    quantity: 1,
    condition: 'good',
    reason_code: null,
    note: null,
    exception_id: null,
    destination: null,
    disposition: null,
    ...overrides,
  };
}

function group(overrides: Partial<ReturnReceiptNoteGroup> = {}): ReturnReceiptNoteGroup {
  return {
    product_name: 'Prestige Cooker 3L',
    sku: 'TTK-COOK-897',
    batch_number: 'TTK-Y5S7N4',
    items: [line()],
    ...overrides,
  };
}

function note(overrides: Partial<ReturnReceiptNoteDetail> = {}): ReturnReceiptNoteDetail {
  return {
    id: 'note-1',
    note_no: 'RRN-2026-00017',
    status: 'pending_approval',
    registration_id: 'reg-1',
    registration_no: 'RR-2026-00042',
    warehouse: { id: 'wh-1', name: 'Ecity' },
    expected_qty: 3,
    received_qty: 2,
    short_qty: 1,
    groups: [group()],
    ...overrides,
  };
}

function reason(code: string, category: string): InboundExceptionReason {
  return { code, name: code, category, default_destination: null, requires_approval: false };
}

describe('noteLines', () => {
  it('flattens every group in order', () => {
    const lines = noteLines(
      note({
        groups: [
          group({ sku: 'A', items: [line({ id: 'a1' }), line({ id: 'a2' })] }),
          group({ sku: 'B', items: [line({ id: 'b1' })] }),
        ],
      }),
    );

    expect(lines.map((entry) => entry.item.id)).toEqual(['a1', 'a2', 'b1']);
    expect(lines[0].group.sku).toBe('A');
    expect(noteLines(null)).toEqual([]);
  });
});

describe('approval gate', () => {
  it('flags the lines the dock has not classified', () => {
    const pending = note({
      groups: [group({ items: [line({ id: 'a', condition: 'good' }), line({ id: 'b', condition: 'pending' })] })],
    });

    expect(unclassifiedLines(pending).map((entry) => entry.item.id)).toEqual(['b']);
    expect(canApproveNote(pending)).toBe(false);
  });

  it('allows approval once every line is classified', () => {
    const classified = note({
      groups: [group({ items: [line({ condition: 'good' }), line({ condition: 'damaged' })] })],
    });

    expect(canApproveNote(classified)).toBe(true);
  });

  it('refuses approval for a note that is no longer pending', () => {
    expect(canApproveNote(note({ status: 'approved' }))).toBe(false);
    expect(canApproveNote(note({ status: 'rejected' }))).toBe(false);
    expect(canApproveNote(null)).toBe(false);
  });

  it('refuses approval when nothing was expected', () => {
    expect(canApproveNote(note({ expected_qty: 0 }))).toBe(false);
  });
});

describe('dispositionsForLine', () => {
  it('offers only the routings the condition permits', () => {
    expect(dispositionsForLine(line({ condition: 'good' }))).toEqual(['release_to_stock']);
    expect(dispositionsForLine(line({ condition: 'hold' }))).toEqual(['move_to_hold', 'return_to_dealer']);
    expect(dispositionsForLine(line({ condition: 'quarantine' }))).toEqual(['move_to_quarantine', 'scrap', 'return_to_dealer']);
    expect(dispositionsForLine(line({ condition: 'damaged' }))).toContain('scrap');
  });

  it('offers nothing while a line is unclassified', () => {
    expect(dispositionsForLine(line({ condition: 'pending' }))).toEqual([]);
    expect(defaultDisposition(line({ condition: 'damaged' }))).toBe('move_to_hold');
  });

  it('treats a classified line without a disposition as undecided', () => {
    expect(lineNeedsDisposition(line({ condition: 'good' }))).toBe(true);
    expect(lineNeedsDisposition(line({ condition: 'good', disposition: 'release_to_stock' }))).toBe(false);
    expect(lineNeedsDisposition(line({ condition: 'pending' }))).toBe(false);
  });
});

describe('disposition reasons', () => {
  const reasons = [reason('RETURN_DAMAGED', 'damage'), reason('HOLD', 'hold'), reason('QA_HOLD', 'quarantine'), reason('RETURN_SCRAP', 'return_scrap')];
  const damaged = line({ condition: 'damaged' });

  it('keeps the reason inside the condition category, whatever the routing', () => {
    expect(dispositionReasonOptions(reasons, damaged, 'move_to_quarantine').map((entry) => entry.code)).toEqual(['RETURN_DAMAGED']);
    expect(dispositionReasonOptions(reasons, damaged, 'move_to_hold').map((entry) => entry.code)).toEqual(['RETURN_DAMAGED']);
    expect(dispositionReasonOptions(reasons, line({ condition: 'hold' }), 'move_to_hold').map((entry) => entry.code)).toEqual(['HOLD']);
  });

  it('uses the scrap list for scrap and dealer returns', () => {
    expect(dispositionReasonOptions(reasons, damaged, 'scrap').map((entry) => entry.code)).toEqual(['RETURN_SCRAP']);
    expect(dispositionReasonOptions(reasons, damaged, 'return_to_dealer').map((entry) => entry.code)).toEqual(['RETURN_SCRAP']);
  });

  it('re-seeds the reason when the action changes category', () => {
    const held = line({ condition: 'hold' });

    expect(nextDispositionReason(reasons, damaged, 'scrap', 'HOLD')).toBe('RETURN_SCRAP');
    expect(nextDispositionReason(reasons, held, 'move_to_hold', 'HOLD')).toBe('HOLD');
    expect(nextDispositionReason(reasons, held, 'move_to_hold', 'RETURN_SCRAP')).toBe('HOLD');
  });
});

describe('group summaries', () => {
  it('sums the received quantity of a group', () => {
    expect(groupQuantity(group({ items: [line({ quantity: 2 }), line({ quantity: 3 })] }))).toBe(5);
  });

  it('lists the conditions present, unclassified last', () => {
    const mixed = group({ items: [line({ condition: 'damaged' }), line({ condition: 'good', quantity: 2 }), line({ condition: 'pending' })] });

    expect(conditionSummary(mixed)).toBe('2 good \u00b7 1 damaged \u00b7 1 unclassified');
    expect(conditionSummary(group({ items: [] }))).toBe('\u2014');
  });
});

describe('returnNoteRows', () => {
  it('renders each group as a parent row with its units as children', () => {
    const rows = returnNoteRows(
      note({
        groups: [
          group({ sku: 'A', items: [line({ id: 'a1', quantity: 2 }), line({ id: 'a2', quantity: 1 })] }),
          group({ sku: 'B', items: [line({ id: 'b1' })] }),
        ],
      }),
    );

    expect(rows.map((row) => row.id)).toEqual(['note-1:0', 'note-1:1']);
    expect(rows.map((row) => row.quantity)).toEqual([3, 1]);
    expect(rows[0].children?.map((child) => child.id)).toEqual(['a1', 'a2']);
    expect(rows[0].name).toBe('Prestige Cooker 3L');
    expect(rows[0].sku).toBe('A');
  });

  it('carries the line and its group on the child rows for the action cells', () => {
    const rows = returnNoteRows(note({ groups: [group({ items: [line({ id: 'a1', serial_number: 'TTK-1T1ZB0', condition: 'damaged' })] })] }));
    const child = rows[0].children?.[0];
    const meta = child?.meta as { item: ReturnReceiptNoteItem; group: ReturnReceiptNoteGroup; status: string };

    expect(child?.serialNumber).toBe('TTK-1T1ZB0');
    expect(meta.item.condition).toBe('damaged');
    expect(meta.group.sku).toBe('TTK-COOK-897');
    expect(meta.status).toBe('pending_approval');
  });

  it('returns no rows without a note', () => {
    expect(returnNoteRows(null)).toEqual([]);
  });
});
