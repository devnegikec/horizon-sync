import * as React from 'react';

import { AlertTriangle, XCircle } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import type { ReceivingSlip, ReceivingSlipGroup, ReceivingSlipGroupItem, ReceivingSlipItem } from '../../../types/wms.types';
import { QRDetailDialog, type QRDetailColumn, type QRDetailRow } from '../QRDetailDialog';
import { WMSStatusBadge } from '../WMSStatusBadge';

import { ConditionBadge } from './ConditionBadge';
import { FlagBadge } from './FlagBadge';
import { getGroupCondition, getGroupFlag } from './groupAggregates';
import { InboundExceptionDialog } from './InboundExceptionDialog';

// ─── Slip → generic rows ──────────────────────────────────────────────────────

function itemToChildRow(item: ReceivingSlipGroupItem, productName: string): QRDetailRow {
  return {
    id: item.id,
    name: item.name ?? productName,
    sku: item.sku,
    serialNumber: item.serial_number,
    manufacturingDate: item.manufacturing_date ?? null,
    expiryDate: item.expiry_date ?? null,
    quantity: item.quantity,
    meta: {
      flag: item.flag,
      conditionCode: item.condition_code ?? null,
      item,
    },
  };
}

function groupToRow(group: ReceivingSlipGroup, index: number): QRDetailRow {
  return {
    id: group.parent_qseal?.id ?? `group-${index}`,
    name: group.product_name,
    sku: group.items[0]?.sku ?? null,
    serialNumber: group.parent_qseal?.serial_number ?? null,
    quantity: group.items.length,
    meta: {
      flag: getGroupFlag(group),
      conditionCode: getGroupCondition(group),
    },
    children: group.items.map((item) => itemToChildRow(item, group.product_name)),
  };
}

function legacyToRow(item: ReceivingSlipItem): QRDetailRow {
  return {
    id: item.id,
    name: item.parent_qseal?.name ?? item.sku,
    sku: item.sku,
    serialNumber: item.parent_qseal?.serial_number ?? null,
    quantity: item.quantity,
    meta: {
      flag: item.flag,
      conditionCode: item.condition_code ?? null,
    },
  };
}

/** Maps a slip's grouped (preferred) or legacy flat items into dialog rows. */
function slipToRows(slip: ReceivingSlip): QRDetailRow[] {
  if (slip.groups && slip.groups.length > 0) {
    return slip.groups.map(groupToRow);
  }
  return (slip.items ?? []).map(legacyToRow);
}

/** Total picked/expected units across a slip's groups (or its flat total). */
function countUnits(slip: ReceivingSlip): number {
  if (slip.groups && slip.groups.length > 0) {
    return slip.groups.reduce((sum, group) => sum + group.items.length, 0);
  }
  return slip.total_items;
}

// ─── Extra columns ────────────────────────────────────────────────────────────

function FlagCell({ row }: { row: QRDetailRow }) {
  return <FlagBadge flag={(row.meta?.flag as string) ?? 'ok'} />;
}

function ConditionCell({ row }: { row: QRDetailRow }) {
  return <ConditionBadge code={(row.meta?.conditionCode as string | null) ?? null} />;
}

function ActionsCell({
  row,
  onException,
  onReject,
}: {
  row: QRDetailRow;
  onException: (item: ReceivingSlipGroupItem) => void;
  onReject?: (itemId: string) => void;
}) {
  const item = row.meta?.item as ReceivingSlipGroupItem | undefined;
  // Parent (group) rows carry no per-item actions.
  if (!item) return null;

  if (item.flag === 'rejected') {
    return (
      <span className="text-xs font-medium text-destructive">
        Rejected{item.rejection_reason ? ` — ${item.rejection_reason}` : ''}
      </span>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => onException(item)}>
        <AlertTriangle className="mr-1 h-3.5 w-3.5" />
        Exception
      </Button>
      {onReject && (
        <Button size="sm"
          variant="outline"
          className="h-7 border-destructive/20 px-2 text-xs text-destructive hover:!bg-destructive hover:!text-white"
          onClick={() => onReject(item.id)}>
          <XCircle className="mr-1 h-3.5 w-3.5" />
          Reject
        </Button>
      )}
    </div>
  );
}

// ─── Summary block ────────────────────────────────────────────────────────────

function SlipSummary({ slip, totalUnits }: { slip: ReceivingSlip; totalUnits: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs text-muted-foreground">Status</p>
          <WMSStatusBadge status={slip.status} />
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs text-muted-foreground">Total Boxes</p>
          <p className="text-lg font-semibold">{slip.groups?.length ?? slip.total_boxes}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs text-muted-foreground">Total Items</p>
          <p className="text-lg font-semibold">{totalUnits}</p>
        </div>
      </div>

      {(slip.asn_order_no || slip.vehicle_no) && (
        <div className="flex flex-wrap gap-2">
          {slip.asn_order_no && (
            <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
              ASN: {slip.asn_order_no}
            </span>
          )}
          {slip.vehicle_no && (
            <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
              Vehicle: {slip.vehicle_no}
            </span>
          )}
        </div>
      )}

      {slip.rejection_reason && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <span className="font-medium">Rejection reason: </span>
          {slip.rejection_reason}
        </div>
      )}

      {slip.notes && (
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Notes: </span>
          {slip.notes}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Created: {slip.created_at ? new Date(slip.created_at).toLocaleString() : '\u2014'}
      </p>
    </div>
  );
}

// ─── Slip detail dialog ───────────────────────────────────────────────────────

interface SlipDetailDialogProps {
  slip: ReceivingSlip | null;
  loading: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRejectItem?: (slipId: string, itemId: string, reason: string) => Promise<void>;
  onExceptionCreated?: () => void;
}

export function SlipDetailDialog({ slip, loading, open, onOpenChange, onRejectItem, onExceptionCreated }: SlipDetailDialogProps) {
  const { toast } = useToast();
  const [exceptionItem, setExceptionItem] = React.useState<ReceivingSlipGroupItem | null>(null);

  const handleReject = React.useCallback(async (itemId: string) => {
    if (!slip || !onRejectItem) return;
    const reason = prompt('Rejection reason:');
    if (!reason?.trim()) return;
    try {
      await onRejectItem(slip.id, itemId, reason);
      toast({ title: 'Item rejected' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  }, [slip, onRejectItem, toast]);

  const rows = React.useMemo(() => (slip ? slipToRows(slip) : []), [slip]);

  const columns = React.useMemo<QRDetailColumn[]>(
    () => [
      { id: 'flag', header: 'Flag', cell: (row) => <FlagCell row={row} /> },
      { id: 'condition', header: 'Condition', cell: (row) => <ConditionCell row={row} /> },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: (row) => (
          <ActionsCell row={row}
            onException={setExceptionItem}
            onReject={onRejectItem ? handleReject : undefined} />
        ),
      },
    ],
    [handleReject, onRejectItem],
  );

  return (
    <>
      <QRDetailDialog open={open}
        onOpenChange={onOpenChange}
        title={slip ? `Receiving Slip — ${slip.slip_number}` : 'Loading...'}
        loading={loading}
        loadingMessage="Loading slip details..."
        rows={rows}
        columns={columns}
        emptyMessage="No items"
        contentClassName="max-w-4xl max-h-[90vh] flex flex-col"
        summary={slip ? <SlipSummary slip={slip} totalUnits={countUnits(slip)} /> : undefined} />

      {slip && (
        <InboundExceptionDialog open={Boolean(exceptionItem)}
          onOpenChange={(next) => {
            if (!next) setExceptionItem(null);
          }}
          slipId={slip.id}
          item={exceptionItem}
          onCompleted={() => onExceptionCreated?.()} />
      )}
    </>
  );
}
