import { DetailDialog } from '@horizon-sync/ui/components';

import type { ReceivingSlip } from '../../../types/wms.types';

import { WMSStatusBadge } from '../WMSStatusBadge';
import { ReceivingGroupsTable } from './ReceivingGroupsTable';

// ─── Slip detail dialog ───────────────────────────────────────────────────────

interface SlipDetailDialogProps {
  slip: ReceivingSlip | null;
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SlipDetailDialog({ slip, loading, open, onOpenChange }: SlipDetailDialogProps) {
  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      title={slip ? `Receiving Slip — ${slip.slip_number}` : 'Loading...'}
      loading={loading}
      loadingMessage="Loading slip details..."
    >
      {slip && (
        <div className="flex flex-col gap-4">
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
    </DetailDialog>
  );
}
