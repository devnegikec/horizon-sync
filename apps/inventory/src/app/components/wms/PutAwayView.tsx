import * as React from 'react';

import { Eye } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';

import { usePutAwayLists } from '../../hooks/useWMS';
import type { PutAwayList } from '../../types/wms.types';

import { PutAwayDetailDialog } from './PutAwayDetailDialog';
import { WMSStatusBadge } from './WMSStatusBadge';

// ─── Main PutAwayView ─────────────────────────────────────────────────────────

interface PutAwayViewProps {
  warehouseId?: string;
  /** Controlled status filter (e.g. driven by the inbound stat cards). */
  statusFilter?: string;
  /** Increment to trigger a refetch (e.g. from the panel-level Refresh button). */
  refreshKey?: number;
  onStatusFilterChange?: (status: string) => void;
}

export function PutAwayView({ warehouseId, statusFilter: statusFilterProp, refreshKey, onStatusFilterChange }: PutAwayViewProps) {
  const [internalStatusFilter, setInternalStatusFilter] = React.useState('all');
  const statusFilter = statusFilterProp ?? internalStatusFilter;
  const setStatusFilter = onStatusFilterChange ?? setInternalStatusFilter;
  const [page, setPage] = React.useState(1);
  const [viewListId, setViewListId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Reset to the first page whenever the status filter changes.
  React.useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data, loading, error, refetch } = usePutAwayLists({
    warehouse_id: warehouseId,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: 20,
  });

  // Refetch when the panel-level Refresh button is pressed (skip the initial mount).
  const lastRefreshKeyRef = React.useRef(refreshKey);
  React.useEffect(() => {
    if (lastRefreshKeyRef.current === refreshKey) return;
    lastRefreshKeyRef.current = refreshKey;
    refetch();
  }, [refreshKey, refetch]);

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
      </div>

      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading put-away lists...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {!loading && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">List #</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Receiving Slip</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Items</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Worker</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {lists.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No put-away lists found. Generate one from an approved receiving slip.
                  </td>
                </tr>
              )}
              {lists.map((list) => (
                <tr key={list.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium">{list.put_away_list_no}</td>
                  <td className="px-4 py-3"><WMSStatusBadge status={list.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{list.receiving_slip_no ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{list.total_items}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{list.worker_name ?? list.assigned_to ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {list.created_at ? new Date(list.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm"
                      variant="ghost"
                      className="gap-1 h-7 px-2 text-xs"
                      onClick={() => { setViewListId(list.id); setDialogOpen(true); }}>
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </td>
                </tr>
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

      <PutAwayDetailDialog listId={viewListId}
        open={dialogOpen}
        onOpenChange={setDialogOpen} />
    </div>
  );
}
