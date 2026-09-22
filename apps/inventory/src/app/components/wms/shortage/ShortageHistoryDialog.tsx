import * as React from 'react';

import { FileClock, RefreshCw, TriangleAlert } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components';

import type { ShortBalance, ShortBalanceEvent, ShortBalanceEventType } from '../../../types/wms.types';
import { toNormalizedApiError, type NormalizedApiError } from '../../../utility/api/core';
import { inboundApi } from '../../../utility/api/wms';

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
const PRE_MIGRATION_NOTE = 'No history recorded before 18 Sep 2026.';

function statusChange(event: ShortBalanceEvent): string | null {
  if (!event.from_status) return `Set to ${humanStatus(event.to_status)}`;
  if (event.from_status === event.to_status) return null;
  return `${humanStatus(event.from_status)} → ${humanStatus(event.to_status)}`;
}

function HistoryEvent({ event }: { event: ShortBalanceEvent }) {
  const change = statusChange(event);
  const isClosure = event.event_type === 'written_off' || event.event_type === 'resolved';

  return (
    <li className="relative border-l border-border pb-4 pl-4 last:pb-0">
      <span className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ${isClosure ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      <div className="flex flex-wrap items-baseline justify-between gap-x-2">
        <p className="text-sm font-medium">{EVENT_LABELS[event.event_type]}</p>
        <span className="text-xs text-muted-foreground">{formatStamp(event.created_at)}</span>
      </div>
      {change && <p className="text-xs text-muted-foreground">{change}</p>}
      <p className="mt-1 text-xs text-muted-foreground">
        Expected {event.expected_qty} · received {event.received_qty} · short {event.short_qty}
      </p>
      {event.reason_code && (
        <p className="mt-1 text-xs">
          <span className="text-muted-foreground">Reason</span> {event.reason_code}
        </p>
      )}
      {event.note && <p className="mt-1 text-xs">{event.note}</p>}
      {event.receiving_slip_id && (
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">Slip {shortId(event.receiving_slip_id)}</p>
      )}
      {event.actor_id && (
        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">Actor {shortId(event.actor_id)}</p>
      )}
    </li>
  );
}

function EmptyHistory() {
  return (
    <div className="flex items-start gap-2 rounded-lg border bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
      <FileClock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{PRE_MIGRATION_NOTE} This shortage predates arrival-level history, so only its current state is available.</span>
    </div>
  );
}

function HistoryError({ error, onRetry }: { error: NormalizedApiError; onRetry: () => void }) {
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

type HistoryState = 'loading' | 'error' | 'empty' | 'ready';

function historyState(loading: boolean, error: NormalizedApiError | null, count: number): HistoryState {
  if (loading) return 'loading';
  if (error) return 'error';
  if (count === 0) return 'empty';
  return 'ready';
}

function HistoryBody({
  loading,
  error,
  events,
  onRetry,
}: {
  loading: boolean;
  error: NormalizedApiError | null;
  events: ShortBalanceEvent[];
  onRetry: () => void;
}) {
  const state = historyState(loading, error, events.length);

  return (
    <div className="max-h-[26rem] overflow-y-auto pr-1">
      {state === 'loading' && <p className="py-6 text-center text-sm text-muted-foreground">Loading history…</p>}
      {state === 'error' && error && <HistoryError error={error} onRetry={onRetry}/>}
      {state === 'empty' && <EmptyHistory/>}
      {state === 'ready' && (
        <ol className="pt-1">
          {events.map((event) => (
            <HistoryEvent key={event.id} event={event}/>
          ))}
        </ol>
      )}
    </div>
  );
}

export interface ShortageHistoryDialogProps {
  /** Balance whose arrival-level trail is shown. `null` closes the dialog. */
  balance: ShortBalance | null;
  onOpenChange: (open: boolean) => void;
}

export function ShortageHistoryDialog({ balance, onOpenChange }: ShortageHistoryDialogProps) {
  const token = useUserStore((state) => state.accessToken);
  const balanceId = balance?.id ?? null;

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
    if (balanceId) void load();
  }, [balanceId, load]);

  return (
    <Dialog open={!!balance} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Shortage history</DialogTitle>
          <DialogDescription>
            Every arrival recorded for <span className="font-mono font-medium text-foreground">{balance?.sku ?? EMPTY}</span> while this
            shortage stayed outstanding.
          </DialogDescription>
        </DialogHeader>

        <HistoryBody loading={loading}
          error={error}
          events={events}
          onRetry={() => void load()}/>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
