import * as React from 'react';

import { RefreshCw, ChevronDown, ChevronRight, CheckCircle2, SkipForward } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import { usePutAwayLists, usePutAwayList } from '../../hooks/useWMS';
import type { PutAwayItem, PutAwayList } from '../../types/wms.types';
import { WMSStatusBadge } from './WMSStatusBadge';

// ─── Item row with Complete / Skip actions ───────────────────────────────────

interface ItemRowProps {
  item: PutAwayItem;
  listId: string;
  onComplete: (itemId: string, binId?: string) => Promise<PutAwayItem>;
  onSkip: (itemId: string, reason: string) => Promise<PutAwayItem>;
}

function PutAwayItemRow({ item, onComplete, onSkip }: ItemRowProps) {
  const [skipping, setSkipping] = React.useState(false);
  const [skipReason, setSkipReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const { toast } = useToast();

  const handleComplete = async () => {
    setBusy(true);
    try {
      await onComplete(item.id, item.suggested_bin_id ?? undefined);
      toast({ title: 'Item completed', description: `${item.sku} put away.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = async () => {
    if (!skipReason.trim()) return;
    setBusy(true);
    try {
      await onSkip(item.id, skipReason);
      toast({ title: 'Item skipped', description: item.sku });
      setSkipping(false);
      setSkipReason('');
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const isDone = item.status === 'completed' || item.status === 'skipped';

  return (
    <>
      <tr className={isDone ? 'opacity-50' : 'hover:bg-muted/20'}>
        <td className="px-4 py-2 font-mono font-medium">{item.sku}</td>
        <td className="px-4 py-2 text-muted-foreground text-xs">{item.batch_number ?? '—'}</td>
        <td className="px-4 py-2 text-right">{item.quantity}</td>
        <td className="px-4 py-2 font-mono text-xs">{item.suggested_bin_code ?? '—'}</td>
        <td className="px-4 py-2">
          <WMSStatusBadge status={item.status} />
        </td>
        <td className="px-4 py-2 text-right">
          {!isDone && (
            <div className="flex items-center justify-end gap-1">
              <Button size="sm" variant="outline"
                className="text-green-600 border-green-200 hover:bg-green-50 gap-1 h-7 px-2 text-xs"
                disabled={busy}
                onClick={handleComplete}>
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </Button>
              <Button size="sm" variant="outline"
                className="text-muted-foreground gap-1 h-7 px-2 text-xs"
                disabled={busy}
                onClick={() => setSkipping((s) => !s)}>
                <SkipForward className="h-3 w-3" />
                Skip
              </Button>
            </div>
          )}
        </td>
      </tr>
      {skipping && (
        <tr>
          <td colSpan={6} className="px-4 py-2 bg-muted/30">
            <div className="flex items-center gap-2">
              <Input
                className="flex-1 h-8 text-sm"
                placeholder="Skip reason..."
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
              />
              <Button size="sm" variant="destructive" className="h-8" disabled={!skipReason.trim() || busy} onClick={handleSkip}>
                Confirm Skip
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setSkipping(false); setSkipReason(''); }}>
                Cancel
              </Button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Expanded detail panel for a single put-away list ────────────────────────

function PutAwayDetail({ listId }: { listId: string }) {
  const { list, loading, error, completeItem, skipItem } = usePutAwayList(listId);

  if (loading) return <div className="px-4 py-4 text-sm text-muted-foreground animate-pulse">Loading items...</div>;
  if (error) return <div className="px-4 py-4 text-sm text-destructive">{error}</div>;
  if (!list) return null;

  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/30">
        <tr>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">SKU</th>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Batch</th>
          <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty</th>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Suggested Bin</th>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
          <th className="text-right px-4 py-2 font-medium text-muted-foreground">Actions</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {list.items.length === 0 && (
          <tr>
            <td colSpan={6} className="px-4 py-4 text-center text-muted-foreground text-xs">No items</td>
          </tr>
        )}
        {list.items.map((item) => (
          <PutAwayItemRow
            key={item.id}
            item={item}
            listId={listId}
            onComplete={completeItem}
            onSkip={skipItem}
          />
        ))}
      </tbody>
    </table>
  );
}

// ─── Main PutAwayView ─────────────────────────────────────────────────────────

interface PutAwayViewProps {
  warehouseId?: string;
}

export function PutAwayView({ warehouseId }: PutAwayViewProps) {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const { data, loading, error, refetch } = usePutAwayLists({
    warehouse_id: warehouseId,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: 20,
  });

  const lists: PutAwayList[] = (data?.put_away_lists as PutAwayList[] | undefined) ?? [];
  const pagination = data?.pagination as
    | { page: number; total_pages: number; has_prev: boolean; has_next: boolean }
    | undefined;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Put-away lists are created automatically when a receiving slip is approved. Click a row to expand items and mark them complete or skip.
      </p>

      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading put-away lists...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {!loading && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-8 px-4 py-3" />
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">List #</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Items</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Worker</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lists.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No put-away lists found. Approve a receiving slip to generate one.
                  </td>
                </tr>
              )}
              {lists.map((list) => (
                <React.Fragment key={list.id}>
                  <tr
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === list.id ? null : list.id)}
                  >
                    <td className="px-4 py-3 text-muted-foreground">
                      {expandedId === list.id
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />}
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">{list.list_number}</td>
                    <td className="px-4 py-3"><WMSStatusBadge status={list.status} /></td>
                    <td className="px-4 py-3 text-right">{list.items.length}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{list.worker_id ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {list.created_at ? new Date(list.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                  {expandedId === list.id && (
                    <tr>
                      <td colSpan={6} className="bg-muted/20 px-0 py-0">
                        <PutAwayDetail listId={list.id} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {pagination.page} of {pagination.total_pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!pagination.has_prev} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={!pagination.has_next} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
