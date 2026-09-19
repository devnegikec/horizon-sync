import * as React from 'react';

import { AlertTriangle, Lock, XCircle } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import type { FlagLineResponse, ReceivingSlip, ReceivingSlipGroup, ReceivingSlipGroupItem, ReceivingSlipItem } from '../../../types/wms.types';
import { toNormalizedApiError, type NormalizedApiError } from '../../../utility/api/core';
import { hasPermission } from '../../../utils/permissions';
import { QRDetailDialog, type QRDetailColumn, type QRDetailRow } from '../QRDetailDialog';
import { WMSStatusBadge } from '../WMSStatusBadge';

import { ConditionBadge } from './ConditionBadge';
import { FlagBadge } from './FlagBadge';
import { FlagLineDialog } from './FlagLineDialog';
import { getGroupCondition, getGroupFlag } from './groupAggregates';
import { RejectItemDialog } from './RejectItemDialog';

// ─── Slip → generic rows ──────────────────────────────────────────────────────

function itemToChildRow(item: ReceivingSlipGroupItem, productName: string): QRDetailRow {
  return {
    id: item.id,
    name: item.name ?? productName,
    sku: item.sku,
    batch: item.batch_number,
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
  const items = Array.isArray(group.items) ? group.items : [];
  return {
    id: group.parent_qseal?.id ?? `group-${index}`,
    name: group.product_name,
    sku: items[0]?.sku ?? null,
    batch: items[0]?.batch_number ?? null,
    serialNumber: group.parent_qseal?.serial_number ?? null,
    quantity: items.reduce((sum, item) => sum + (item.quantity || 0), 0),
    meta: {
      flag: getGroupFlag(group),
      conditionCode: getGroupCondition(group),
      packItems: packFlagItems(items),
    },
    children: items.map((item) => itemToChildRow(item, group.product_name)),
  };
}

/**
 * Lines a pack-level flag may still change. A rejected line is terminal, so it is
 * left out of the fan-out.
 */
export function packFlagItems(items: ReceivingSlipGroupItem[]): ReceivingSlipGroupItem[] {
  return items.filter((item) => item.flag !== 'rejected');
}

/** Adapts a legacy flat item to the shape the item actions/exception dialog expect. */
function legacyActionItem(item: ReceivingSlipItem): ReceivingSlipGroupItem {
  return {
    id: item.id,
    name: item.parent_qseal?.name ?? null,
    serial_number: item.parent_qseal?.serial_number ?? '',
    sku: item.sku,
    batch_number: item.batch_number,
    quantity: item.quantity,
    box_count: item.box_count,
    flag: item.flag,
    condition_code: item.condition_code ?? null,
    notes: item.notes,
  };
}

function legacyToRow(item: ReceivingSlipItem): QRDetailRow {
  return {
    id: item.id,
    name: item.parent_qseal?.name ?? item.sku,
    sku: item.sku,
    batch: item.batch_number,
    serialNumber: item.parent_qseal?.serial_number ?? null,
    quantity: item.quantity,
    meta: {
      flag: item.flag,
      conditionCode: item.condition_code ?? null,
      item: legacyActionItem(item),
    },
  };
}

/** Maps a slip's grouped (preferred) or legacy flat items into dialog rows. */
function slipToRows(slip: ReceivingSlip): QRDetailRow[] {
  if (Array.isArray(slip.groups) && slip.groups.length > 0) {
    return slip.groups.map(groupToRow);
  }
  return (Array.isArray(slip.items) ? slip.items : []).map(legacyToRow);
}

/** Total picked/expected units across a slip's groups (or its flat total). */
function countUnits(slip: ReceivingSlip): number {
  if (Array.isArray(slip.groups) && slip.groups.length > 0) {
    return slip.groups.reduce(
      (sum, group) => sum + (Array.isArray(group.items) ? group.items.reduce((groupSum, item) => groupSum + (item.quantity || 0), 0) : 0),
      0,
    );
  }
  return slip.total_items;
}

/** Result copy for the post-flag toast: what actually changed on the line(s). */
function flagToastCopy(results: FlagLineResponse[]): { title: string; description: string } {
  const [first] = results;
  if (!first) return { title: 'Flag saved', description: '' };

  if (results.length > 1) {
    return {
      title: `${results.length} lines flagged ${first.flag}`,
      description: `Master pack for ${first.sku} segregated to ${first.destination ?? 'HOLD/QUARANTINE'}.`,
    };
  }

  if (first.flag === 'short') {
    return {
      title: 'Line flagged short',
      description: `${first.short_qty ?? 0} unit(s) missing against the ASN for ${first.sku}.`,
    };
  }
  return {
    title: `Line flagged ${first.flag}`,
    description: `${first.sku} segregated to ${first.destination ?? 'HOLD/QUARANTINE'}.`,
  };
}

// ─── Extra columns ────────────────────────────────────────────────────────────

function FlagCell({ row }: { row: QRDetailRow }) {
  return <FlagBadge flag={(row.meta?.flag as string) ?? 'ok'} />;
}

function ConditionCell({ row }: { row: QRDetailRow }) {
  return <ConditionBadge code={(row.meta?.conditionCode as string | null) ?? null} />;
}

/**
 * Flagging is only legal while the slip is pending review; afterwards the API
 * answers `409 SLIP_NOT_PENDING_REVIEW`. It also needs `warehouse.update` or
 * `wms.scan`. A control the operator cannot use is disabled with the actual
 * reason rather than left to fail on submit.
 */
function flagBlockedReason(slip: ReceivingSlip | null, canWrite: boolean): string | null {
  if (!canWrite) {
    return 'You do not have permission to flag receipt lines — warehouse.update or wms.scan is required.';
  }
  if (slip?.status !== 'pending_review') {
    return 'Flags can only be applied while the slip is pending review. Capture them before the Draft Receipt Note is approved.';
  }
  return null;
}

function FlagButton({ label, onFlag }: { label: string; onFlag: () => void }) {
  return (
    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onFlag}>
      <AlertTriangle className="mr-1 h-3.5 w-3.5" />
      {label}
    </Button>
  );
}

/**
 * The flag control for a row, or nothing at all.
 *
 * It is withdrawn — rather than rendered disabled — once the slip has left
 * `pending_review`, because a lock that can never be released is only noise. The
 * reason is stated once in the slip summary instead.
 */
function FlagControl({
  row,
  canFlag,
  onFlag,
  onFlagPack,
}: {
  row: QRDetailRow;
  canFlag: boolean;
  onFlag: (item: ReceivingSlipGroupItem) => void;
  onFlagPack: (items: ReceivingSlipGroupItem[]) => void;
}) {
  const item = row.meta?.item as ReceivingSlipGroupItem | undefined;
  const packItems = row.meta?.packItems as ReceivingSlipGroupItem[] | undefined;

  if (!canFlag) return null;
  if (item) return <FlagButton label="Flag" onFlag={() => onFlag(item)}/>;
  if (!packItems?.length) return null;

  // A pack row has no line of its own, and the flag endpoint is line-scoped, so
  // the dialog fans the flag out across the pack.
  return <FlagButton label={`Flag pack (${packItems.length})`} onFlag={() => onFlagPack(packItems)}/>;
}

/** Reject is a per-line decision, so it never appears on a pack row. */
function RejectControl({
  item,
  onReject,
}: {
  item?: ReceivingSlipGroupItem;
  onReject?: (item: ReceivingSlipGroupItem) => void;
}) {
  if (!item || !onReject) return null;

  return (
    <Button size="sm"
      variant="outline"
      className="h-7 border-destructive/20 px-2 text-xs text-destructive hover:!bg-destructive hover:!text-white"
      onClick={() => onReject(item)}>
      <XCircle className="mr-1 h-3.5 w-3.5" />
      Reject
    </Button>
  );
}

function ActionsCell({
  row,
  canFlag,
  onFlag,
  onFlagPack,
  onReject,
}: {
  row: QRDetailRow;
  canFlag: boolean;
  onFlag: (item: ReceivingSlipGroupItem) => void;
  onFlagPack: (items: ReceivingSlipGroupItem[]) => void;
  onReject?: (item: ReceivingSlipGroupItem) => void;
}) {
  const item = row.meta?.item as ReceivingSlipGroupItem | undefined;

  // A rejected line is read-only, and its reason is all that is worth showing.
  if (item?.flag === 'rejected') {
    return <span className="text-xs font-medium text-destructive">Rejected{item.rejection_reason ? ` — ${item.rejection_reason}` : ''}</span>;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <FlagControl row={row} canFlag={canFlag} onFlag={onFlag} onFlagPack={onFlagPack}/>
      <RejectControl item={item} onReject={onReject}/>
    </div>
  );
}

// ─── Summary block ────────────────────────────────────────────────────────────

/**
 * Why flagging is unavailable, stated once for the whole slip instead of as a
 * locked button on every row.
 */
function FlagBlockedNote({ reason }: { reason: string | null }) {
  if (!reason) return null;

  return (
    <p className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>{reason}</span>
    </p>
  );
}

function SlipSummary({ slip, totalUnits, flagBlocked }: { slip: ReceivingSlip; totalUnits: number; flagBlocked: string | null }) {
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
          {slip.asn_order_no && <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">ASN: {slip.asn_order_no}</span>}
          {slip.vehicle_no && <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">Vehicle: {slip.vehicle_no}</span>}
        </div>
      )}

      <FlagBlockedNote reason={flagBlocked}/>

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

      <p className="text-xs text-muted-foreground">Created: {slip.created_at ? new Date(slip.created_at).toLocaleString() : '\u2014'}</p>
    </div>
  );
}

// ─── Slip detail dialog ───────────────────────────────────────────────────────

interface SlipDetailDialogProps {
  slip: ReceivingSlip | null;
  loading: boolean;
  /** Detail fetch failure, shown in place of the line items. */
  error?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRejectItem?: (slipId: string, itemId: string, reason: string) => Promise<void>;
  /** Fired after a line is flagged, so the caller can refresh the slip and list. */
  onLineFlagged?: () => void;
}

export function SlipDetailDialog({ slip, loading, error, open, onOpenChange, onRejectItem, onLineFlagged }: SlipDetailDialogProps) {
  const { toast } = useToast();
  const permissions = useUserStore((state) => state.permissions.permissions);
  const [flagTarget, setFlagTarget] = React.useState<ReceivingSlipGroupItem[] | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<ReceivingSlipGroupItem | null>(null);
  const [rejectBusy, setRejectBusy] = React.useState(false);
  const [rejectError, setRejectError] = React.useState<NormalizedApiError | null>(null);

  // Drop any in-flight line edit when the selected slip changes, so a line from a
  // previous slip is never submitted against the new slip's id.
  React.useEffect(() => {
    setFlagTarget(null);
    setRejectTarget(null);
    setRejectError(null);
  }, [slip?.id]);

  /** Rejection is confirmed in a dialog; the API owns the resulting state. */
  const confirmReject = async (reason: string) => {
    if (!slip || !rejectTarget || !onRejectItem) return;
    setRejectBusy(true);
    setRejectError(null);
    try {
      await onRejectItem(slip.id, rejectTarget.id, reason);
      toast({ title: 'Line rejected', description: `${rejectTarget.sku} — ${reason}` });
      setRejectTarget(null);
    } catch (err) {
      // The parent refreshes the slip, so keep the dialog open on the failure.
      setRejectError(toNormalizedApiError(err));
    } finally {
      setRejectBusy(false);
    }
  };

  const rows = React.useMemo(() => (slip ? slipToRows(slip) : []), [slip]);

  // Hiding the control up front is the documented answer to a 403; the API also
  // refuses line edits once the slip is approved or rejected.
  const canWrite = hasPermission(permissions, 'warehouse.update') || hasPermission(permissions, 'wms.scan');
  const flagBlocked = flagBlockedReason(slip, canWrite);
  const canFlag = flagBlocked === null;

  /** The flag endpoint owns the resulting state, so report what it returned. */
  const handleFlagged = React.useCallback(
    (results: FlagLineResponse[]) => {
      toast(flagToastCopy(results));
      onLineFlagged?.();
    },
    [toast, onLineFlagged],
  );

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
            canFlag={canFlag}
            onFlag={(item) => setFlagTarget([item])}
            onFlagPack={setFlagTarget}
            onReject={onRejectItem ? setRejectTarget : undefined}/>
        ),
      },
    ],
    [canFlag, onRejectItem],
  );

  return (
    <>
      <QRDetailDialog open={open}
        onOpenChange={onOpenChange}
        title={slip ? `Receiving Slip — ${slip.slip_number}` : 'Receiving Slip'}
        loading={loading}
        loadingMessage="Loading slip details..."
        rows={rows}
        columns={columns}
        emptyMessage={error ?? 'No items'}
        summary={slip ? <SlipSummary slip={slip} totalUnits={countUnits(slip)} flagBlocked={flagBlocked}/> : undefined}/>

      {slip && (
        <FlagLineDialog open={Boolean(flagTarget)}
          onOpenChange={(next) => {
            if (!next) setFlagTarget(null);
          }}
          slipId={slip.id}
          lines={flagTarget}
          onFlagged={handleFlagged}
          onStale={onLineFlagged}/>
      )}

      <RejectItemDialog item={rejectTarget}
        submitting={rejectBusy}
        error={rejectError}
        onOpenChange={(next) => {
          if (!next) setRejectTarget(null);
        }}
        onConfirm={confirmReject}/>
    </>
  );
}
