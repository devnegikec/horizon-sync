import * as React from 'react';

import { RefreshCw, Eye, PackageOpen } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ConfirmationDialog } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { useToast } from '@horizon-sync/ui/hooks';

import { useReceivingSlips } from '../../hooks/useWMS';
import type { ReceivingSlip } from '../../types/wms.types';

import { SlipDetailDialog } from './receiving-slips';
import { WMSStatusBadge } from './WMSStatusBadge';

interface ReceivingSlipListProps {
  warehouseId?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ReceivingSlipList({ warehouseId }: ReceivingSlipListProps) {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [rejectingId, setRejectingId] = React.useState<string | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [viewSlip, setViewSlip] = React.useState<ReceivingSlip | null>(null);
  const [viewLoading, setViewLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmApproveSlip, setConfirmApproveSlip] = React.useState<ReceivingSlip | null>(null);
  const [confirmPutAwaySlip, setConfirmPutAwaySlip] = React.useState<ReceivingSlip | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const { data, loading, error, refetch, approveSlip, rejectSlip, getSlip, generatePutAway } = useReceivingSlips({
    warehouse_id: warehouseId,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: 20,
  });

  const handleView = async (slip: ReceivingSlip) => {
    setDialogOpen(true);
    setViewSlip(null);
    setViewLoading(true);
    try {
      const detail = await getSlip(slip.id);
      setViewSlip(detail);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to load slip', variant: 'destructive' });
      setDialogOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const handleApprove = async (slip: ReceivingSlip) => {
    setConfirmApproveSlip(slip);
  };

  const handleConfirmApprove = async () => {
    const slip = confirmApproveSlip;
    if (!slip) return;
    setActionLoading(true);
    try {
      await approveSlip(slip.id);
      toast({ title: 'Slip approved', description: `${slip.slip_number} moved to put-away.` });
      setConfirmApproveSlip(null);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to approve', variant: 'destructive' });
    } finally {
      setActionLoading(false);
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

  const handleGeneratePutAway = async (slip: ReceivingSlip) => {
    setConfirmPutAwaySlip(slip);
  };

  const handleConfirmPutAway = async () => {
    const slip = confirmPutAwaySlip;
    if (!slip) return;
    setActionLoading(true);
    try {
      await generatePutAway(slip.id);
      toast({ title: 'Put-away generated', description: `Put-away list created from ${slip.slip_number}.` });
      setConfirmPutAwaySlip(null);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to generate put-away', variant: 'destructive' });
    } finally {
      setActionLoading(false);
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
                {data.receiving_slips.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      No receiving slips found
                    </td>
                  </tr>
                )}
                {data.receiving_slips.map((slip) => (
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
                        <div className="flex items-center justify-end gap-2">

                          {slip.status === 'pending_review' && (
                            <>
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50 h-7 px-2 text-xs" onClick={() => handleApprove(slip)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10 h-7 px-2 text-xs" onClick={() => setRejectingId(slip.id)}>
                                Reject
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="gap-1 h-7 px-2 text-xs" onClick={() => handleView(slip)}>
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          {slip.status === 'pending_putaway' && (
                            <Button size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 h-7 px-2 text-xs" onClick={() => handleGeneratePutAway(slip)}>
                              <PackageOpen className="h-3.5 w-3.5 mr-1" />
                              Put-Away
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {rejectingId === slip.id && (
                      <tr>
                        <td colSpan={6} className="px-4 py-3 bg-muted/30">
                          <div className="flex items-center gap-2">
                            <input className="flex-1 border rounded px-3 py-1.5 text-sm bg-background"
                              placeholder="Rejection reason..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}/>
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

      <SlipDetailDialog slip={viewSlip}
        loading={viewLoading}
        open={dialogOpen}
        onOpenChange={setDialogOpen}/>

      <ConfirmationDialog
        open={!!confirmApproveSlip}
        onOpenChange={(open) => { if (!open) setConfirmApproveSlip(null); }}
        title="Approve Receiving Slip"
        description={`Are you sure you want to approve ${confirmApproveSlip?.slip_number}? This will move it to put-away.`}
        confirmLabel="Approve"
        loading={actionLoading}
        onConfirm={handleConfirmApprove}
      />

      <ConfirmationDialog
        open={!!confirmPutAwaySlip}
        onOpenChange={(open) => { if (!open) setConfirmPutAwaySlip(null); }}
        title="Generate Put-Away List"
        description={`Generate put-away list from receiving slip ${confirmPutAwaySlip?.slip_number}?`}
        confirmLabel="Generate"
        loading={actionLoading}
        onConfirm={handleConfirmPutAway}
      />
    </div>
  );
}
