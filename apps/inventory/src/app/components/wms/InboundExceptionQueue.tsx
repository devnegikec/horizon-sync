import * as React from 'react';

import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button, Input, Label, Textarea } from '@horizon-sync/ui/components';

import type { BulkDispositionAction, InboundException, WMSPagination } from '../../types/wms.types';
import { inboundApi } from '../../utility/api/wms';
import { hasPermission } from '../../utils/permissions';

const PAGE_SIZE = 20;

const STATUS_STYLES: Record<string, string> = {
  pending_approval: 'bg-amber-500/10 text-amber-600',
  open: 'bg-amber-500/10 text-amber-600',
  approved: 'bg-blue-500/10 text-blue-600',
  released: 'bg-emerald-500/10 text-emerald-600',
  closed: 'bg-muted text-muted-foreground',
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'bg-muted text-muted-foreground';
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${style}`}>{status.replace(/_/g, ' ')}</span>;
}

const DISPOSITION_ACTIONS: { value: BulkDispositionAction; label: string }[] = [
  { value: 'release_to_receiving', label: 'Release' },
  { value: 'move_to_hold', label: 'Hold' },
  { value: 'move_to_quarantine', label: 'Quarantine' },
  { value: 'return_to_sender', label: 'Return' },
  { value: 'dispose', label: 'Dispose' },
];

function requiresNote(action: BulkDispositionAction): boolean {
  return action === 'return_to_sender' || action === 'dispose';
}

function exceptionIdentity(exception: InboundException): string {
  return exception.item_name || exception.sku || exception.qr_identifier || 'Unknown identity';
}

function isResolvedStatus(status: string): boolean {
  return status === 'closed' || status === 'released';
}

/* ------------------------------------------------------------------ */
/*  Row / table / bulk bar / pagination                                */
/* ------------------------------------------------------------------ */

function ExceptionRow({
  exception,
  canDispose,
  isSelected,
  busy,
  onToggle,
  onDispose,
}: {
  exception: InboundException;
  canDispose: boolean;
  isSelected: boolean;
  busy: boolean;
  onToggle: (id: string) => void;
  onDispose: (exception: InboundException, action: BulkDispositionAction) => void;
}) {
  const resolved = isResolvedStatus(exception.status);
  const identity = exceptionIdentity(exception);

  return (
    <tr className="hover:bg-muted/20">
      {canDispose && (
        <td className="px-3 py-2 align-top">
          {!resolved && (
            <input type="checkbox" aria-label={`Select ${identity}`} checked={isSelected} onChange={() => onToggle(exception.id)} />
          )}
        </td>
      )}
      <td className="px-4 py-2 align-top">
        <span className="flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          {identity}
        </span>
        {exception.note && <p className="mt-1 text-xs text-muted-foreground">{exception.note}</p>}
        {exception.evidence.length > 0 && <p className="mt-1 text-xs text-muted-foreground">{exception.evidence.length} evidence file(s) attached</p>}
      </td>
      <td className="px-4 py-2 align-top text-xs text-muted-foreground">{exception.reason_code}</td>
      <td className="px-4 py-2 align-top text-center">{exception.quantity}</td>
      <td className="px-4 py-2 align-top text-xs">{exception.destination ?? '—'}</td>
      <td className="px-4 py-2 align-top"><StatusBadge status={exception.status} /></td>
      {canDispose && (
        <td className="px-4 py-2 align-top text-right">
          {!resolved && (
            <div className="inline-flex flex-wrap justify-end gap-1">
              {DISPOSITION_ACTIONS.map(({ value, label }) => (
                <Button key={value}
                  size="sm"
                  variant={value === 'dispose' ? 'destructive' : 'outline'}
                  className="h-7 px-2 text-xs"
                  disabled={busy}
                  onClick={() => onDispose(exception, value)}>
                  {label}
                </Button>
              ))}
            </div>
          )}
        </td>
      )}
    </tr>
  );
}

function ExceptionsTable({
  exceptions,
  canDispose,
  selected,
  loading,
  busy,
  onToggleAll,
  onToggle,
  onDispose,
}: {
  exceptions: InboundException[];
  canDispose: boolean;
  selected: Set<string>;
  loading: boolean;
  busy: boolean;
  onToggleAll: () => void;
  onToggle: (id: string) => void;
  onDispose: (exception: InboundException, action: BulkDispositionAction) => void;
}) {
  const selectable = exceptions.filter((e) => !isResolvedStatus(e.status));
  const allVisibleSelected = selectable.length > 0 && selectable.every((e) => selected.has(e.id));

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/30">
          <tr>
            {canDispose && (
              <th className="w-10 px-3 py-2">
                <input type="checkbox" aria-label="Select all" checked={allVisibleSelected} onChange={onToggleAll} disabled={loading || selectable.length === 0} />
              </th>
            )}
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Item</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Reason</th>
            <th className="text-center px-4 py-2 font-medium text-muted-foreground">Qty</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Destination</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
            {canDispose && <th className="text-right px-4 py-2 font-medium text-muted-foreground">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {exceptions.map((exception) => (
            <ExceptionRow key={exception.id}
              exception={exception}
              canDispose={canDispose}
              isSelected={selected.has(exception.id)}
              busy={busy}
              onToggle={onToggle}
              onDispose={onDispose}/>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BulkActionBar({
  count,
  busy,
  onAction,
  onClear,
}: {
  count: number;
  busy: boolean;
  onAction: (action: BulkDispositionAction) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
      <span className="text-sm font-medium">{count} selected</span>
      {DISPOSITION_ACTIONS.map(({ value, label }) => (
        <Button key={value}
          size="sm"
          variant={value === 'dispose' ? 'destructive' : 'outline'}
          disabled={busy}
          onClick={() => onAction(value)}>
          {label}
        </Button>
      ))}
      <Button size="sm" variant="ghost" disabled={busy} onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}

function PaginationFooter({
  pagination,
  page,
  loading,
  onPrev,
  onNext,
}: {
  pagination: WMSPagination | null;
  page: number;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (!pagination || pagination.total_pages <= 0) return null;
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>Page {page} of {pagination.total_pages} · {pagination.total_items} total</span>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={!pagination.has_prev || loading} onClick={onPrev}>
          <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Prev
        </Button>
        <Button size="sm" variant="outline" disabled={!pagination.has_next || loading} onClick={onNext}>
          Next <ChevronRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Queue                                                              */
/* ------------------------------------------------------------------ */

export function InboundExceptionQueue({ warehouseId }: { warehouseId?: string }) {
  const token = useUserStore((state) => state.accessToken);
  const permissions = useUserStore((state) => state.permissions.permissions);
  const canDispose = hasPermission(permissions, 'inbound_exception.dispose');

  const [exceptions, setExceptions] = React.useState<InboundException[]>([]);
  const [pagination, setPagination] = React.useState<WMSPagination | null>(null);
  const [page, setPage] = React.useState(1);
  const [destination, setDestination] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [note, setNote] = React.useState('');
  const [itemId, setItemId] = React.useState('');
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = React.useState(false);

  const requestSeqRef = React.useRef(0);
  const selectableIds = React.useMemo(
    () => exceptions.filter((e) => !isResolvedStatus(e.status)).map((e) => e.id),
    [exceptions],
  );

  const load = React.useCallback(
    async (targetPage: number) => {
      if (!token) return;
      const seq = requestSeqRef.current + 1;
      requestSeqRef.current = seq;
      setSelected(new Set());
      setLoading(true);
      setError(null);
      setNotice(null);
      try {
        const res = await inboundApi.listExceptions(token, {
          warehouse_id: warehouseId,
          destination: destination || undefined,
          status: status || undefined,
          page: targetPage,
          page_size: PAGE_SIZE,
        });
        if (seq !== requestSeqRef.current) return;
        setExceptions(res.exceptions ?? []);
        setPagination(res.pagination ?? null);
        setPage(res.pagination?.page ?? targetPage);
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load exceptions');
      } finally {
        if (seq === requestSeqRef.current) setLoading(false);
      }
    },
    [token, warehouseId, destination, status],
  );

  React.useEffect(() => {
    setSelected(new Set());
    load(1);
  }, [load]);

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = selectableIds.length > 0 && selectableIds.every((id) => next.has(id));
      if (allSelected) {
        selectableIds.forEach((id) => next.delete(id));
      } else {
        selectableIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const disposeOne = async (exception: InboundException, action: BulkDispositionAction) => {
    if (!token) return;
    if (requiresNote(action) && !note.trim()) {
      setError('A decision note is required for return-to-sender and dispose.');
      return;
    }
    setActiveId(exception.id);
    setError(null);
    setNotice(null);
    try {
      await inboundApi.disposeException(token, exception.id, {
        action,
        note: note.trim() || undefined,
        item_id: itemId.trim() || undefined,
      });
      setNote('');
      setItemId('');
      await load(page);
      setNotice('Disposition updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disposition failed');
    } finally {
      setActiveId(null);
    }
  };

  const disposeBulk = async (action: BulkDispositionAction) => {
    if (!token || selected.size === 0) return;
    if (requiresNote(action) && !note.trim()) {
      setError('A decision note is required for return-to-sender and dispose.');
      return;
    }
    setBulkBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await inboundApi.bulkDisposeExceptions(token, {
        exception_ids: [...selected],
        action,
        note: note.trim() || undefined,
      });
      const message = `Bulk disposition complete — ${res.disposed_count ?? 0} succeeded, ${res.failed_count ?? 0} failed.`;
      setNote('');
      setSelected(new Set());
      await load(page);
      setNotice(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bulk disposition failed');
    } finally {
      setBulkBusy(false);
    }
  };

  const anyBusy = bulkBusy || activeId !== null;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Hold / Quarantine Queue</h2>
          <p className="text-sm text-muted-foreground">Non-pickable inbound stock awaiting a manager decision.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => load(page)} disabled={loading}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-3 rounded-lg border bg-muted/20 p-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="exception-destination">Destination</Label>
          <select id="exception-destination"
            className="w-full rounded-md border bg-background px-3 py-2"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}>
            <option value="">All destinations</option>
            <option value="HOLD">HOLD</option>
            <option value="QUARANTINE">QUARANTINE</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="exception-status">Status</Label>
          <select id="exception-status"
            className="w-full rounded-md border bg-background px-3 py-2"
            value={status}
            onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="open">Open</option>
            <option value="approved">Approved</option>
            <option value="released">Released</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="exception-note">Decision note (required for Return / Dispose)</Label>
          <Textarea id="exception-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Required when returning to sender or disposing"/>
        </div>
        <div className="space-y-1">
          <Label htmlFor="exception-item-id">Corrected SKU item ID (single release only)</Label>
          <Input id="exception-item-id" value={itemId} onChange={(event) => setItemId(event.target.value)} placeholder="Optional item UUID" />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {notice && <p className="text-sm text-emerald-600">{notice}</p>}

      {canDispose && selected.size > 0 && (
        <BulkActionBar count={selected.size} busy={anyBusy} onAction={disposeBulk} onClear={() => setSelected(new Set())} />
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading exception queue…</p>}
      {!loading && exceptions.length === 0 && (
        <p className="rounded-lg border py-8 text-center text-sm text-muted-foreground">No hold or quarantine exceptions.</p>
      )}

      {exceptions.length > 0 && (
        <ExceptionsTable exceptions={exceptions}
          canDispose={canDispose}
          selected={selected}
          loading={loading}
          busy={anyBusy}
          onToggleAll={toggleAll}
          onToggle={toggleOne}
          onDispose={disposeOne}/>
      )}

      <PaginationFooter pagination={pagination} page={page} loading={loading} onPrev={() => load(page - 1)} onNext={() => load(page + 1)} />
    </div>
  );
}
