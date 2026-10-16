import type { InboundException } from '../../../types/wms.types';
import {
  exceptionGroups,
  groupDestinations,
  groupReasons,
  groupStatus,
  isResolvedStatus,
  type ExceptionGroup,
} from '../exceptionGroups';

export const EMPTY = '\u2014';

/** Serial-match reason codes introduced by the dispatch ↔ inbound match feature. */
export const MISSING_SERIAL_CODE = 'MISSING_SERIAL';
export const UNEXPECTED_SERIAL_CODE = 'UNEXPECTED_SERIAL';
export const WRONG_ITEM_CODE = 'WRONG_ITEM';

const REASON_CODE_LABELS: Record<string, string> = {
  [MISSING_SERIAL_CODE]: 'Missing serial',
  [UNEXPECTED_SERIAL_CODE]: 'Unexpected serial',
  [WRONG_ITEM_CODE]: 'Wrong item',
};

/** Human-friendly label for a reason code; unknown codes render unchanged. */
export function reasonCodeLabel(code: string | null): string {
  if (!code) return EMPTY;
  return REASON_CODE_LABELS[code] ?? code;
}

/**
 * A `MISSING_SERIAL` exception has no physical unit — it is a shortage that is
 * closed through the shortage ledger, never moved to hold/quarantine.
 */
export function isMissingSerial(exception: InboundException): boolean {
  return exception.reason_code === MISSING_SERIAL_CODE;
}

/** A single exception, rendered as its own row. */
export interface ExceptionUnitRow {
  kind: 'unit';
  id: string;
  exception: InboundException;
}

/** Units sharing a SKU and batch, rendered as one expandable parent row. */
export interface ExceptionGroupRow {
  kind: 'group';
  id: string;
  sku: string;
  batchNumber: string | null;
  quantity: number;
  reasons: string;
  destinations: string;
  /** The status every unit shares, or `null` when they disagree. */
  status: string | null;
  exceptions: InboundException[];
  children: ExceptionUnitRow[];
}

/** One row of the queue table: either a lone exception or a collapsed batch. */
export type ExceptionTableRow = ExceptionUnitRow | ExceptionGroupRow;

/** The identity a manager recognises the stock by. */
export function exceptionIdentity(exception: InboundException): string {
  return exception.item_name || exception.sku || exception.qr_identifier || 'Unknown identity';
}

function timestamp(value: string | null): number {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Newest first — the queue is a worklist and the API does not order it for us. */
function byNewestFirst(a: InboundException, b: InboundException): number {
  return timestamp(b.created_at) - timestamp(a.created_at);
}

function unitRow(exception: InboundException): ExceptionUnitRow {
  return { kind: 'unit', id: exception.id, exception };
}

function groupedRow(group: ExceptionGroup): ExceptionGroupRow {
  return {
    kind: 'group',
    id: group.key,
    sku: group.sku,
    batchNumber: group.batchNumber,
    quantity: group.quantity,
    reasons: groupReasons(group),
    destinations: groupDestinations(group),
    status: groupStatus(group),
    exceptions: group.exceptions,
    children: group.exceptions.map(unitRow),
  };
}

/**
 * Collapses units that share a SKU and batch into a parent row (rendered as
 * expandable sub-rows). A batch with a single unit stays one flat row so its
 * serial and reason remain visible without expanding anything.
 */
export function exceptionRows(exceptions: InboundException[]): ExceptionTableRow[] {
  const sorted = [...exceptions].sort(byNewestFirst);
  return exceptionGroups(sorted).map((group) => (group.collapsed ? groupedRow(group) : unitRow(group.exceptions[0])));
}

/** Sub-row accessor for the DataTable; only collapsed batches expand. */
export function exceptionSubRows(row: ExceptionTableRow): ExceptionTableRow[] | undefined {
  return row.kind === 'group' ? row.children : undefined;
}

/** The exceptions a row's actions apply to. */
export function rowExceptions(row: ExceptionTableRow): InboundException[] {
  return row.kind === 'group' ? row.exceptions : [row.exception];
}

/**
 * The exceptions behind the selected rows, de-duplicated and limited to those
 * still actionable — a resolved exception can no longer be disposed of.
 */
export function selectedExceptions(rows: ExceptionTableRow[]): InboundException[] {
  const byId = new Map<string, InboundException>();
  rows.forEach((row) => {
    rowExceptions(row).forEach((exception) => {
      if (!isResolvedStatus(exception.status)) byId.set(exception.id, exception);
    });
  });
  return [...byId.values()];
}
