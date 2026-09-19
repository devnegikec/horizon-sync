import type { BalanceStatus } from '../../../types/wms.types';
import { formatDate } from '../../../utility/formatDate';

export { FieldError, fieldIssue } from '../apiErrorFields';

/** Placeholder for a value the ledger has not been given. */
export const EMPTY = '—';

export const STATUS_STYLES: Record<BalanceStatus, string> = {
  open: 'bg-amber-500/10 text-amber-600',
  resolved: 'bg-emerald-500/10 text-emerald-600',
  written_off: 'bg-rose-500/10 text-rose-600',
};

export const STATUS_LABELS: Record<BalanceStatus, string> = {
  open: 'Open',
  resolved: 'Resolved',
  written_off: 'Written off',
};

/** Server ids are UUIDs; the first block is enough to correlate rows in the UI. */
export function shortId(value: string | null): string {
  return value ? value.slice(0, 8) : EMPTY;
}

/** `formatDate` throws on unparseable input, which an audit trail must survive. */
export function formatStamp(value: string | null): string {
  if (!value) return EMPTY;
  try {
    return formatDate(value, 'DD-MMM-YY', { includeTime: true });
  } catch {
    return value;
  }
}

/** `'written_off'` reads as "written off" in prose. */
export function humanStatus(status: BalanceStatus): string {
  return status.replace(/_/g, ' ');
}

export function StatusPill({ status }: { status: BalanceStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
