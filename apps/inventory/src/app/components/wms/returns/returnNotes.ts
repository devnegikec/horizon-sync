import {
  dispositionReasonCategories,
  RETURN_DISPOSITIONS_BY_CONDITION,
  type InboundExceptionReason,
  type ReturnDispositionAction,
  type ReturnLineCondition,
  type ReturnReceiptNoteDetail,
  type ReturnReceiptNoteGroup,
  type ReturnReceiptNoteItem,
} from '../../../types/wms.types';
import type { QRDetailRow } from '../QRDetailDialog';

export const EMPTY = '\u2014';

/** Picker labels. The codes themselves are the API contract. */
export const DISPOSITION_LABELS: Record<ReturnDispositionAction, string> = {
  release_to_stock: 'Release to stock',
  move_to_hold: 'Move to hold',
  move_to_quarantine: 'Move to quarantine',
  scrap: 'Scrap',
  return_to_dealer: 'Return to dealer',
};

export const CONDITION_LABELS: Record<ReturnLineCondition, string> = {
  pending: 'Unclassified',
  good: 'Good',
  damaged: 'Damaged',
  hold: 'Hold',
  quarantine: 'Quarantine',
};

/** Order used by the condition summaries, unclassified last so it stands out. */
const CONDITION_ORDER: ReturnLineCondition[] = ['good', 'damaged', 'hold', 'quarantine', 'pending'];

export function dispositionLabel(action: ReturnDispositionAction | null | undefined): string {
  return action ? DISPOSITION_LABELS[action] : EMPTY;
}

/** A note line together with the group it belongs to — the cells need both. */
export interface ReturnNoteLine {
  item: ReturnReceiptNoteItem;
  group: ReturnReceiptNoteGroup;
}

/** Every line of the note, flattened in group order. */
export function noteLines(note: ReturnReceiptNoteDetail | null): ReturnNoteLine[] {
  if (!note) return [];
  return note.groups.flatMap((group) => group.items.map((item) => ({ item, group })));
}

/**
 * Lines the dock has not classified. The API refuses to approve a note that still
 * has one (`RETURN_NOTE_HAS_UNCLASSIFIED_LINES`), so the UI blocks it too.
 */
export function unclassifiedLines(note: ReturnReceiptNoteDetail | null): ReturnNoteLine[] {
  return noteLines(note).filter((line) => line.item.condition === 'pending');
}

/** A note is approvable only while pending, fully classified, and with something expected. */
export function canApproveNote(note: ReturnReceiptNoteDetail | null): boolean {
  if (!note || note.status !== 'pending_approval') return false;
  if (note.expected_qty <= 0) return false;
  return unclassifiedLines(note).length === 0;
}

/** Total received quantity of a group. */
export function groupQuantity(group: ReturnReceiptNoteGroup): number {
  return group.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
}

/** The conditions present in a group, as `1 good · 2 damaged`. */
export function conditionSummary(group: ReturnReceiptNoteGroup): string {
  const parts: string[] = [];
  for (const condition of CONDITION_ORDER) {
    const quantity = group.items
      .filter((item) => item.condition === condition)
      .reduce((sum, item) => sum + (item.quantity || 0), 0);
    if (quantity > 0) parts.push(`${quantity} ${CONDITION_LABELS[condition].toLowerCase()}`);
  }
  return parts.length > 0 ? parts.join(' \u00b7 ') : EMPTY;
}

/** The dispositions this line's condition permits; empty while unclassified. */
export function dispositionsForLine(item: ReturnReceiptNoteItem): ReturnDispositionAction[] {
  return RETURN_DISPOSITIONS_BY_CONDITION[item.condition] ?? [];
}

/** A classified line without a stored disposition still needs a decision. */
export function lineNeedsDisposition(item: ReturnReceiptNoteItem): boolean {
  return item.condition !== 'pending' && !item.disposition;
}

/** The action a fresh decision starts on: the condition's first legal routing. */
export function defaultDisposition(item: ReturnReceiptNoteItem): ReturnDispositionAction {
  return dispositionsForLine(item)[0] ?? 'move_to_hold';
}

/** Reason codes the current condition/action pair accepts. */
export function dispositionReasonOptions(
  reasons: InboundExceptionReason[],
  item: ReturnReceiptNoteItem,
  action: ReturnDispositionAction,
): InboundExceptionReason[] {
  const categories = dispositionReasonCategories(item.condition, action);
  return reasons.filter((reason) => categories.includes(reason.category));
}

/** Keeps the selected reason valid when the action changes its category. */
export function nextDispositionReason(
  reasons: InboundExceptionReason[],
  item: ReturnReceiptNoteItem,
  action: ReturnDispositionAction,
  current: string,
): string {
  const options = dispositionReasonOptions(reasons, item, action);
  if (options.some((option) => option.code === current)) return current;
  return options[0]?.code ?? '';
}

/** Sets the extra columns need: the line, its group, and the note's status. */
export interface ReturnNoteRowMeta {
  item?: ReturnReceiptNoteItem;
  group?: ReturnReceiptNoteGroup;
  status?: string;
}

function groupRow(note: ReturnReceiptNoteDetail, group: ReturnReceiptNoteGroup, index: number): QRDetailRow {
  return {
    id: `${note.id}:${index}`,
    name: group.product_name,
    sku: group.sku,
    batch: group.batch_number ?? null,
    serialNumber: null,
    quantity: groupQuantity(group),
    meta: { group, status: note.status } satisfies ReturnNoteRowMeta,
    children: group.items.map((item) => itemRow(note, group, item)),
  };
}

function itemRow(note: ReturnReceiptNoteDetail, group: ReturnReceiptNoteGroup, item: ReturnReceiptNoteItem): QRDetailRow {
  return {
    id: item.id,
    name: group.product_name,
    sku: group.sku,
    batch: group.batch_number ?? null,
    serialNumber: item.serial_number,
    quantity: item.quantity,
    meta: { item, group, status: note.status } satisfies ReturnNoteRowMeta,
  };
}

/** Grouped parent rows with the received units as expandable sub-rows. */
export function returnNoteRows(note: ReturnReceiptNoteDetail | null): QRDetailRow[] {
  if (!note) return [];
  return note.groups.map((group, index) => groupRow(note, group, index));
}
