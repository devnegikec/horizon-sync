import * as React from 'react';

import { RefreshCw, Eye, Loader2, PackageOpen, ChevronDown, ChevronRight } from 'lucide-react';

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
import type { ReceivingSlip, ReceivingSlipGroup } from '../../types/wms.types';

import { WMSStatusBadge } from './WMSStatusBadge';

/* ------------------------------------------------------------------ */
/*  Expandable group row (parent_qseal + items)                       */
/* ------------------------------------------------------------------ */

function ReceivingGroupRow({ group, boxIndex, totalBoxes }: {
  group: ReceivingSlipGroup;
  boxIndex: number;
  totalBoxes: number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const sku = group.items[0]?.sku ?? '—';
  const flag = group.items[0]?.flag ?? 'ok';
  const qty = group.items.length;

  return (
    <>
      {/* Group (box) row */}
      <tr className="hover:bg-muted/20 cursor-pointer transition-colors"
        onClick={() => setExpanded((e) => !e)}>
        <td className="px-4 py-2">
          <span className="inline-flex items-center gap-1">
            {expanded
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            }
            <span className="font-medium">{group.product_name}</span>
          </span>
        </td>
        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{sku}</td>
        <td className="px-4 py-2 font-mono text-xs">{group.parent_qseal.name}</td>
        <td className="px-4 py-2 text-center">
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
            {boxIndex}/{totalBoxes}
          </span>
        </td>
        <td className="px-4 py-2 text-center font-medium">{qty}</td>
        <td className="px-4 py-2"><FlagBadge flag={flag} /></td>
      </tr>

      {/* Expanded: individual item rows */}
      {expanded && group.items.map((item) => (
        <tr key={item.id} className="bg-muted/20">
          <td className="px-4 py-1.5 pl-10">
            <span className="font-mono text-xs font-medium">{item.serial_number}</span>
          </td>
          <td className="px-4 py-1.5 text-xs text-muted-foreground" colSpan={5}>
            <span className="inline-flex gap-3">
              <span>SKU: <span className="font-mono">{item.sku}</span></span>
              {item.manufacturing_date && (
                <span>Mfg: {new Date(item.manufacturing_date).toLocaleDateString()}</span>
              )}
              {item.expiry_date && (
                <span>Exp: {new Date(item.expiry_date).toLocaleDateString()}</span>
              )}
            </span>
          </td>
        </tr>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Groups table                                                      */
/* ------------------------------------------------------------------ */

function ReceivingGroupsTable({ groups }: { groups: ReceivingSlipGroup[] }) {
  if (groups.length === 0) {
    return <p className="px-4 py-6 text-center text-muted-foreground text-xs">No items</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="bg-muted/30">
        <tr>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Product Name</th>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">SKU</th>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Batch</th>
          <th className="text-center px-4 py-2 font-medium text-muted-foreground">Box</th>
          <th className="text-center px-4 py-2 font-medium text-muted-foreground">Qty</th>
          <th className="text-left px-4 py-2 font-medium text-muted-foreground">Flag</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {groups.map((group, idx) => (
          <ReceivingGroupRow key={group.parent_qseal.id}
            group={group}
            boxIndex={idx + 1}
            totalBoxes={groups.length} />
        ))}
      </tbody>
    </table>
  );
}

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
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] flex flex-col">
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
                <p className="font-semibold text-lg">{slip.groups?.length ?? slip.total_boxes}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Items</p>
                <p className="font-semibold text-lg">
                  {slip.groups?.reduce((sum, g) => sum + g.items.length, 0) ?? slip.total_items}
                </p>
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

            {/* Groups — each group is one parent box with expandable items */}
            {slip.groups && slip.groups.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Line Items ({slip.groups.length} boxes, {slip.groups.reduce((s, g) => s + g.items.length, 0)} units)
                </div>
                <ReceivingGroupsTable groups={slip.groups} />
              </div>
            ) : slip.items && slip.items.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Line Items ({slip.items.length})
                </div>
                <p className="px-4 py-6 text-center text-muted-foreground text-xs">Flat format — no parent grouping available</p>
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-xs py-4">No items</p>
            )}

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

  const handleGeneratePutAway = async (slip: ReceivingSlip) => {
    if (!window.confirm(`Generate put-away list from ${slip.slip_number}?`)) return;
    try {
      await generatePutAway(slip.id);
      toast({ title: 'Put-away generated', description: `Put-away list created from ${slip.slip_number}.` });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to generate put-away', variant: 'destructive' });
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
    </div>
  );
}
