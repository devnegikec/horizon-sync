import * as React from 'react';

import { RefreshCw } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import { useReceivingSlips } from '../../hooks/useWMS';
import type { ReceivingSlip } from '../../types/wms.types';
import { WMSStatusBadge } from './WMSStatusBadge';

interface ReceivingSlipListProps {
  warehouseId?: string;
}

export function ReceivingSlipList({ warehouseId }: ReceivingSlipListProps) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');

  const { data, loading, error, refetch, approveSlip, rejectSlip } = useReceivingSlips({
    warehouse_id: warehouseId,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: 20,
  });

  const handleApprove = async (slip: ReceivingSlip) => {
    if (!window.confirm(`Approve receiving slip ${slip.slip_number}?`)) return;
    try {
      await approveSlip(slip.id);
      toast({ title: 'Slip approved', description: `${slip.slip_number} moved to put-away.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to approve', variant: 'destructive' });
    }
  };

  const handleReject = async (slip: ReceivingSlip) => {
    if (!rejectReason.trim()) return;
    try {
      await rejectSlip(slip.id, rejectReason);
      toast({ title: 'Slip rejected', description: slip.slip_number });
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to reject', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="pending_putaway">Pending Put-Away</SelectItem>
            <SelectItem value="putaway_complete">Put-Away Complete</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading receiving slips...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {!loading && data && (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slip #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Boxes</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Items</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.slips.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No receiving slips found
                    </td>
                  </tr>
                )}
                {data.slips.map((slip) => (
                  <React.Fragment key={slip.id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium">{slip.slip_number}</td>
                      <td className="px-4 py-3">
                        <WMSStatusBadge status={slip.status} />
                      </td>
                      <td className="px-4 py-3 text-right">{slip.total_boxes}</td>
                      <td className="px-4 py-3 text-right">{slip.total_items}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {slip.created_at ? new Date(slip.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {slip.status === 'pending_review' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApprove(slip)}>
                              Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => setRejectingId(slip.id)}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {rejectingId === slip.id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 bg-muted/30">
                          <div className="flex items-center gap-2">
                            <input
                              className="flex-1 border rounded px-3 py-1.5 text-sm bg-background"
                              placeholder="Rejection reason..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              autoFocus
                            />
                            <Button size="sm" variant="destructive" onClick={() => handleReject(slip)} disabled={!rejectReason.trim()}>
                              Confirm Reject
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { setRejectingId(null); setRejectReason(''); }}>
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {data.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {data.pagination.page} of {data.pagination.total_pages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!data.pagination.has_prev} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={!data.pagination.has_next} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
