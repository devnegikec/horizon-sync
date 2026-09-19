import type { InboundException } from '../../types/wms.types';

const EMPTY = '\u2014';

export interface ExceptionGroup {
  /** Stable identity of the collapsed rows, or the row's own id when ungrouped. */
  key: string;
  sku: string;
  batchNumber: string | null;
  /** Summed quantity of every exception in the group. */
  quantity: number;
  exceptions: InboundException[];
  /** `true` when more than one exception collapsed into this group. */
  collapsed: boolean;
}

/**
 * Exceptions can only be collapsed when both the SKU and the batch are known —
 * without them there is no shared identity to group on, and rows that happen to
 * share a null would be merged misleadingly.
 */
function groupKey(exception: InboundException): string | null {
  if (!exception.sku || !exception.batch_number) return null;
  return `${exception.sku}::${exception.batch_number}`;
}

/**
 * Collapses the queue by SKU + batch, so a master pack whose units were all
 * excepted reads as one entry instead of one row per unit.
 *
 * Ungroupable rows keep a single-row group of their own, and insertion order is
 * preserved so the server's ordering still holds.
 */
export function exceptionGroups(exceptions: InboundException[]): ExceptionGroup[] {
  const groups = new Map<string, ExceptionGroup>();

  exceptions.forEach((exception, index) => {
    const key = groupKey(exception) ?? `${exception.id}#${index}`;
    const existing = groups.get(key);
    if (existing) {
      existing.exceptions.push(exception);
      existing.quantity += exception.quantity;
      existing.collapsed = true;
      return;
    }
    groups.set(key, {
      key,
      sku: exception.sku ?? '',
      batchNumber: exception.batch_number,
      quantity: exception.quantity,
      exceptions: [exception],
      collapsed: false,
    });
  });

  return [...groups.values()];
}

/** The distinct non-empty values in a column, in first-seen order. */
function distinct(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

/**
 * The status every row in the group shares, or `null` when they disagree — a
 * merged group must never claim a state that only some of its rows are in.
 */
export function groupStatus(group: ExceptionGroup): string | null {
  const statuses = distinct(group.exceptions.map((exception) => exception.status));
  return statuses.length === 1 ? statuses[0] : null;
}

/** Every destination the collapsed rows landed in. */
export function groupDestinations(group: ExceptionGroup): string {
  const destinations = distinct(group.exceptions.map((exception) => exception.destination));
  return destinations.length > 0 ? destinations.join(', ') : EMPTY;
}

/** Every reason code behind the collapsed rows. */
export function groupReasons(group: ExceptionGroup): string {
  const reasons = distinct(group.exceptions.map((exception) => exception.reason_code));
  return reasons.length > 0 ? reasons.join(', ') : EMPTY;
}

/** A resolved exception is read-only: it can no longer be disposed of. */
export function isResolvedStatus(status: string): boolean {
  return status === 'closed' || status === 'released'
}
