import * as React from 'react';

import { RefreshCw, TriangleAlert } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components';

import type { ShortBalance, ShortBalanceEvent, ShortBalanceEventType } from '../../../types/wms.types';
import { toNormalizedApiError, type NormalizedApiError } from '../../../utility/api/core';
import { inboundApi } from '../../../utility/api/wms';
import { QRDetailDialog, type QRDetailColumn, type QRDetailRow } from '../QRDetailDialog';
import { WMSStatusBadge } from '../WMSStatusBadge';

import { EMPTY, formatStamp, humanStatus, shortId } from './shortageShared';

const EVENT_LABELS: Record<ShortBalanceEventType, string> = {
  created: 'Shortage recorded',
  updated: 'Balance updated',
  resolved: 'Resolved by a later receipt',
  written_off: 'Written off',
};

/**
 * Balances created before migration 119 have no history rows at all. That is a
 * normal, expected state — never an error.
 */
const PRE_MIGRATION_NOTE = 'No arrival history recorded before 18 Sep 2026.';

function statusChange(event: ShortBalanceEvent): string | null {
  if (!event.from_status) return `Set to ${humanStatus(event.to_status)}`;
  if (event.from_status === event.to_status) return null;
  return `${humanStatus(event.from_status)} → ${humanStatus(event.to_status)}`;
}

function eventToRow(event: ShortBalanceEvent, sku: string): QRDetailRow {
  return {
    id: event.id,
    name: EVENT_LABELS[event.event_type],
    sku,
    quantity: event.short_qty,
    meta: { event },
  };
}

// ─── Summary ──────────────────────────────────────────────────────────────────

function MetricCard({ label, value, valueClassName }: { label: string; value: React.ReactNode; valueClassName?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold ${valueClassName ?? ''}`}>{value}</p>
    </div>
  );
}

function ShortageSummary({ balance }: { balance: ShortBalance }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-3 text-sm">
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs text-muted-foreground">Status</p>
          <WMSStatusBadge status={balance.status} />
        </div>
        <MetricCard label="Expected" value={balance.expected_qty} />
        <MetricCard label="Received" value={balance.received_qty} />
        <MetricCard label="Short" value={balance.short_qty} valueClassName="text-amber-600" />
      </div>

      <div className="flex flex-wrap gap-2">
        {balance.asn_order_no && (
          <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">ASN: {balance.asn_order_no}</span>
        )}
        {balance.receiving_slip_id && (
          <span className="rounded-full border px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
            Slip: {shortId(balance.receiving_slip_id)}
          </span>
        )}
      </div>

      {balance.reason_code && (
        <p className="text-xs text-muted-foreground">
          Dock reason: <span className="font-medium text-foreground">{balance.reason_code}</span>
        </p>
      )}

      {balance.close_reason_code && (
        <p className="text-xs text-muted-foreground">
          Closure reason: <span className="font-medium text-foreground">{balance.close_reason_code}</span>
        </p>
      )}

      {balance.note && (
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Notes: </span>
          {balance.note}
        </div>
      )}

      {balance.close_note && (
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Closure note: </span>
          {balance.close_note}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Created: {formatStamp(balance.created_at)}
        {balance.closed_at ? ` · Closed: ${formatStamp(balance.closed_at)}` : ''}
      </p>
    </div>
  );
}

function HistoryErrorNotice({ error, onRetry }: { error: NormalizedApiError; onRetry: () => void }) {
  const retryable = error.httpStatus === 0 || error.httpStatus >= 500;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 px-3 py-2 text-xs text-destructive">
      <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0">
        <p>{error.message}</p>
        {error.hint && <p className="mt-0.5 text-muted-foreground">{error.hint}</p>}
        {retryable && (
          <Button size="sm" variant="outline" className="mt-2 h-7 px-2 text-xs" onClick={onRetry}>
            <RefreshCw className="mr-1 h-3 w-3" /> Retry
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

export interface ShortageDetailDialogProps {
  /** Balance shown in the dialog. `null` closes it. */
  balance: ShortBalance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Closing a shortage needs `shortages.close`; the action is hidden otherwise. */
  canClose: boolean;
  /** Asks the ledger to open the write-off / close dialogue for this balance. */
  onRequestClose: (balance: ShortBalance) => void;
}

/** Loads a balance's arrival-level audit trail, refetching whenever the dialog reopens or the row changes. */
function useShortageHistory(balanceId: string | null, open: boolean) {
  const token = useUserStore((state) => state.accessToken);

  const [events, setEvents] = React.useState<ShortBalanceEvent[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);

  // Guards against a slow request for the previous balance landing after the
  // user has already switched, which would show the wrong audit trail.
  const requestSeqRef = React.useRef(0);

  const load = React.useCallback(async () => {
    if (!token || !balanceId) return;
    const seq = requestSeqRef.current + 1;
    requestSeqRef.current = seq;
    setLoading(true);
    setError(null);
    try {
      const res = await inboundApi.getShortBalanceHistory(token, balanceId);
      if (seq !== requestSeqRef.current) return;
      setEvents(res ?? []);
    } catch (err) {
      if (seq !== requestSeqRef.current) return;
      setError(toNormalizedApiError(err));
    } finally {
      if (seq === requestSeqRef.current) setLoading(false);
    }
  }, [token, balanceId]);

  React.useEffect(() => {
    setEvents([]);
    setError(null);
    if (open && balanceId) void load();
  }, [open, balanceId, load]);

  return { events, loading, error, reload: load };
}

function HistorySubtitle({
  balance,
  error,
  onRetry,
}: {
  balance: ShortBalance | null;
  error: NormalizedApiError | null;
  onRetry: () => void;
}) {
  if (error) return <HistoryErrorNotice error={error} onRetry={onRetry} />;
  if (balance?.asn_order_no) {
    return (
      <p className="text-sm text-muted-foreground">
        Arrival history for <span className="font-mono font-medium text-foreground">{balance.asn_order_no}</span>
      </p>
    );
  }
  return <p className="text-sm text-muted-foreground">Arrival history for this shortage</p>;
}

function CloseFooter({ balance, canClose, onRequestClose }: { balance: ShortBalance; canClose: boolean; onRequestClose: (balance: ShortBalance) => void }) {
  if (!canClose || balance.status !== 'open') return undefined;

  return (
    <Button variant="outline"
      size="sm"
      className={balance.short_qty > 0 ? 'border-destructive/20 text-red-600 hover:!bg-red-600 hover:!text-white' : undefined}
      onClick={() => onRequestClose(balance)}>
      {balance.short_qty > 0 ? 'Write off shortage' : 'Close shortage'}
    </Button>
  );
}

/**
 * Read-only detail view for a shortage balance, mirroring the receiving-slip
 * detail dialog: a summary block above the record table. The table holds the
 * arrival-by-arrival audit trail, so "History" no longer needs its own action.
 */
export function ShortageDetailDialog({ balance, open, onOpenChange, canClose, onRequestClose }: ShortageDetailDialogProps) {
  const { events, loading, error, reload } = useShortageHistory(balance?.id ?? null, open);

  const rows = React.useMemo(
    () => (balance ? events.map((event) => eventToRow(event, balance.sku)) : []),
    [events, balance],
  );

  const columns = React.useMemo<QRDetailColumn[]>(
    () => [
      {
        id: 'change',
        header: 'Change',
        cell: (row) => {
          const event = row.meta?.event as ShortBalanceEvent | undefined;
          return <span className="text-xs">{event ? statusChange(event) ?? EMPTY : EMPTY}</span>;
        },
      },
      {
        id: 'reason',
        header: 'Reason',
        cell: (row) => {
          const event = row.meta?.event as ShortBalanceEvent | undefined;
          return <span className="text-xs text-muted-foreground">{event?.reason_code ?? EMPTY}</span>;
        },
      },
      {
        id: 'note',
        header: 'Note',
        cell: (row) => {
          const event = row.meta?.event as ShortBalanceEvent | undefined;
          return <span className="text-xs text-muted-foreground">{event?.note ?? EMPTY}</span>;
        },
      },
      {
        id: 'when',
        header: 'When',
        align: 'right',
        cell: (row) => {
          const event = row.meta?.event as ShortBalanceEvent | undefined;
          return <span className="text-xs text-muted-foreground">{formatStamp(event?.created_at ?? null)}</span>;
        },
      },
    ],
    [],
  );

  return (
    <QRDetailDialog open={open}
      onOpenChange={onOpenChange}
      title={balance ? `Shortage — ${balance.sku}` : 'Shortage'}
      loading={loading}
      loadingMessage="Loading shortage details..."
      rows={rows}
      columns={columns}
      emptyMessage={error ? 'History could not be loaded.' : PRE_MIGRATION_NOTE}
      subtitle={<HistorySubtitle balance={balance} error={error} onRetry={() => void reload()} />}
      summary={balance ? <ShortageSummary balance={balance} /> : undefined}
      footer={balance ? <CloseFooter balance={balance} canClose={canClose} onRequestClose={onRequestClose} /> : undefined}/>
  );
}
