import * as React from 'react';

import { RefreshCw, Eye, Loader2 } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { useToast } from '@horizon-sync/ui/hooks';

import { useReceivingSlips } from '../../hooks/useWMS';
import type { ReceivingSlip, ReceivingSlipItem } from '../../types/wms.types';

import { WMSStatusBadge } from './WMSStatusBadge';

interface ReceivingSlipListProps {
  warehouseId?: string;
}

// ─── Flag badge ──────────────────────────────────────────────────────────────

function FlagBadge({ flag }: { flag: string }) {
  const map: Record<string, string> = {
    ok: 'bg-green-100 text-green-700',
    short: 'bg-yellow-100 text-yellow-700',
    damaged: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${map[flag] ?? 'bg-gray-100 text-gray-700'}`}>
      {flag}
    </span>
  );
}

// ─── Slip detail dialog ───────────────────────────────────────────────────────

interface SlipDetailDialogProps {
  slip: ReceivingSlip | null;
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SlipDetailDialog({ slip, loading, open, onOpenChange }: SlipDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {slip ? `Receiving Slip — ${slip.slip_number}` : 'Loading...'}
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && slip && (
          <div className="flex flex-col gap-4 overflow-y-auto">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <WMSStatusBadge status={slip.status} />
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Boxes</p>
                <p className="font-semibold text-lg">{slip.total_boxes}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Items</p>
                <p className="font-semibold text-lg">{slip.total_items}</p>
              </div>
            </div>

            {slip.rejection_reason && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <span className="font-medium">Rejection reason: </span>{slip.rejection_reason}
              </div>
            )}

            {slip.notes && (
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Notes: </span>{slip.notes}
              </div>
            )}

            {/* Items table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Line Items ({slip.items.length})
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">SKU</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Batch</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right px-4 py-2 font-medium text-muted-foreground">Boxes</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Flag</th>
                    <th className="text-left px-4 py-2 font-medium text-muted-foreground">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {slip.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground text-xs">
                        No items
                      </td>
                    </tr>
                  )}
                  {slip.items.map((item: ReceivingSlipItem) => (
                    <tr key={item.id} className="hover:bg-muted/20">
                      <td className="px-4 py-2 font-mono font-medium">{item.sku}</td>
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.batch_number ?? '—'}</td>
                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">{item.box_count}</td>
                      <td className="px-4 py-2"><FlagBadge flag={item.flag} /></td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{item.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              Created: {slip.created_at ? new Date(slip.created_at).toLocaleString() : '—'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
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

  const { data, loading, error, refetch, approveSlip, rejectSlip, getSlip } = useReceivingSlips({
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
                          <Button size="sm" variant="ghost" className="gap-1 h-7 px-2 text-xs" onClick={() => handleView(slip)}>
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
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
    </div>
  );
}
