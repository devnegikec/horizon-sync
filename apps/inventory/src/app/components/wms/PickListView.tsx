import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, UserRound, Loader2, ChevronDown, ChevronRight, Truck, PackageCheck, PackageOpen, type LucideIcon } from 'lucide-react';
import QRCode from 'qrcode';

import { useUserStore } from '@horizon-sync/store';
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableSkeleton,
} from '@horizon-sync/ui/components';
import { DataTable } from '@horizon-sync/ui/components/data-table';
import { DetailDialog } from '@horizon-sync/ui/components/ui/detail-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { useToast } from '@horizon-sync/ui/hooks';

import { useRefreshOnKey } from '../../hooks/useRefreshOnKey';
import { usePickList, usePickLists, usePickSettings } from '../../hooks/useWMS';
import type { PickList, PickListItem, PickSerialDetail, PickListProgress, WMSWorker, PackingSlipListItem } from '../../types/wms.types';
import { wmsWorkerApi, packingSlipApi } from '../../utility/api/wms';

import { createPickListColumns } from './PickListColumns';
import { WMSStatusBadge } from './WMSStatusBadge';

function workerDisplayName(w: WMSWorker | undefined): string | null {
  if (!w) return null;
  const full = `${w.first_name} ${w.last_name}`.trim();
  return w.display_name ?? (full.length > 0 ? full : null) ?? w.id;
}

function workerQrValue(w: WMSWorker | null | undefined): string | null {
  if (!w) return null;
  return w.qr_code || w.barcode || null;
}

function WorkerQrCode({ value, size = 64 }: { value: string | null; size?: number }) {
  const [url, setUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    if (!value) {
      setUrl(null);
      return;
    }
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    })
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!url) return null;
  return <img src={url} alt={`QR ${value}`} width={size} height={size} className="rounded-md border border-border bg-white p-1 shrink-0" />;
}

function WorkerQrDialog({
  open,
  onOpenChange,
  worker,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker: WMSWorker | null | undefined;
}) {
  const qr = workerQrValue(worker);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Worker QR Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          {qr ? <WorkerQrCode value={qr} size={260} /> : <p className="text-sm text-muted-foreground">No QR code assigned</p>}
          {worker && (
            <div className="text-center">
              <p className="font-semibold">{worker.display_name ?? `${worker.first_name} ${worker.last_name}`.trim()}</p>
              {worker.employee_id && <p className="text-xs text-muted-foreground font-mono mt-0.5">{worker.employee_id}</p>}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function useWorkers(enabled: boolean, warehouseId?: string): WMSWorker[] {
  const accessToken = useUserStore((s) => s.accessToken);
  const [workers, setWorkers] = React.useState<WMSWorker[]>([]);

  React.useEffect(() => {
    if (!enabled || !accessToken) return;
    let cancelled = false;
    wmsWorkerApi
      .list(accessToken, { page: 1, page_size: 100, warehouse_id: warehouseId })
      .then((data) => {
        if (!cancelled) setWorkers(data.workers ?? []);
      })
      .catch(() => {
        if (!cancelled) setWorkers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, accessToken, warehouseId]);

  return workers;
}

// ============================================
// PICK LIST DETAIL (mirrors PutAwayDetailDialog)
// ============================================

interface PickLineGroup {
  itemId: string;
  rows: PickListItem[];
}

function groupPickItems(items: PickListItem[]): PickLineGroup[] {
  const groups = new Map<string, PickLineGroup>();
  for (const it of items) {
    const g = groups.get(it.item_id) ?? { itemId: it.item_id, rows: [] };
    g.rows.push(it);
    groups.set(it.item_id, g);
  }
  return Array.from(groups.values());
}

/** First non-null value from a list, or null. */
function firstValue<T>(values: (T | null | undefined)[]): T | null {
  return values.find((v) => v != null) ?? null;
}

/** Bin path/id for a single pick line, if assigned. */
function lineBin(row: PickListItem): string | null {
  return row.bin_location_path || row.bin_location_id || null;
}

/** Unique serials across a group's rows, paired with their bin. */
function collectSerialRows(rows: PickListItem[]): { serial: PickSerialDetail; bin: string | null }[] {
  const out: { serial: PickSerialDetail; bin: string | null }[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const bin = lineBin(row);
    for (const serial of row.serials ?? []) {
      if (serial.serial_number && !seen.has(serial.serial_number)) {
        seen.add(serial.serial_number);
        out.push({ serial, bin });
      }
    }
  }
  return out;
}

function pickStatusLabel(done: boolean, pickedQty: number): string {
  if (done) return '✓ Done';
  return pickedQty > 0 ? 'Partial' : 'Pending';
}

function pickStatusClass(done: boolean, pickedQty: number): string {
  if (done) return 'text-green-600';
  return pickedQty > 0 ? 'text-blue-600' : 'text-muted-foreground';
}

/** Split a picked quantity into full cases plus loose units. */
function splitCases(pickedQty: number, perCase: number | null): { cases: number; loose: number } {
  if (perCase && perCase > 0) {
    const cases = Math.floor(pickedQty / perCase);
    return { cases, loose: pickedQty - cases * perCase };
  }
  return { cases: 0, loose: pickedQty };
}

/** "picked/total" for a case/loose column, falling back to a dash. */
function qtyCell(picked: number, total: number | null): string {
  if (total == null) return '—';
  if (total === 0) return '0';
  return `${picked}/${total}`;
}

function ExpandChevron({ expanded }: { expanded: boolean }) {
  const Icon = expanded ? ChevronDown : ChevronRight;
  return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
}

function PickLineRow({ group }: { group: PickLineGroup }) {
  const [expanded, setExpanded] = React.useState(false);
  const rows = group.rows;
  const first = rows[0];
  const requiredQty = rows.reduce((sum, row) => sum + (row.qty || 0), 0);
  const pickedQty = rows.reduce((sum, row) => sum + (row.picked_qty || 0), 0);
  const batch = firstValue(rows.map((row) => row.batch_no));
  const hu = firstValue(rows.map((row) => row.handling_unit_id));
  const bins = Array.from(new Set(rows.map((row) => lineBin(row) ?? '').filter(Boolean)));
  const serialRows = collectSerialRows(rows);

  const done = pickedQty >= requiredQty;
  const statusText = pickStatusLabel(done, pickedQty);
  const statusClass = pickStatusClass(done, pickedQty);

  const perCase = firstValue(rows.map((row) => row.per_case_qty));
  const caseQty = firstValue(rows.map((row) => row.case_qty));
  const looseQty = firstValue(rows.map((row) => row.loose_qty));
  const { cases: pickedCases, loose: pickedLoose } = splitCases(pickedQty, perCase);

  return (
    <>
      <tr className="hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => setExpanded((e) => !e)}>
        <td className="px-4 py-2">
          <span className="inline-flex items-center gap-1">
            <ExpandChevron expanded={expanded} />
            <span className="font-mono font-medium">{first.sku ?? first.item_id}</span>
            {first.item_name && <span className="text-xs text-muted-foreground ml-2">{first.item_name}</span>}
            {hu && (
              <span className="ml-2 inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-mono text-blue-600">
                HU {hu.slice(0, 8)}
              </span>
            )}
          </span>
        </td>
        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{batch ?? '—'}</td>
        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
          {bins.length === 0 ? (
            '—'
          ) : (
            <span className="inline-flex items-center gap-1 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5">{bins[0]}</span>
              {bins.length > 1 && (
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-muted-foreground">+{bins.length - 1}</span>
              )}
            </span>
          )}
        </td>
        <td className="px-4 py-2 text-right">{requiredQty}</td>
        <td className="px-4 py-2 text-right text-muted-foreground">{perCase ?? '—'}</td>
        <td className="px-4 py-2 text-right text-muted-foreground">{qtyCell(pickedCases, caseQty)}</td>
        <td className="px-4 py-2 text-right text-muted-foreground">{qtyCell(pickedLoose, looseQty)}</td>
        <td className="px-4 py-2 text-right font-semibold">{pickedQty}</td>
        <td className="px-4 py-2">
          <span className={`text-xs font-medium ${statusClass}`}>{statusText}</span>
        </td>
      </tr>
      {expanded &&
        serialRows.map(({ serial, bin }, idx) => (
          <tr key={`${serial.serial_number}-${idx}`} className="bg-muted/20">
            <td className="px-4 py-1.5 pl-10">
              <span className="font-mono text-xs font-medium">S.N: {serial.serial_number}</span>
            </td>
            <td className="px-4 py-1.5 text-xs text-muted-foreground" colSpan={8}>
              <span className="inline-flex gap-3 flex-wrap items-center">
                <span>
                  SKU: <span className="font-mono">{serial.sku ?? first.sku}</span>
                </span>
                {serial.manufacturing_date && <span>Mfg: {new Date(serial.manufacturing_date).toLocaleDateString()}</span>}
                {serial.expiry_date && <span>Exp: {new Date(serial.expiry_date).toLocaleDateString()}</span>}
                {bin && <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-mono">Bin: {bin}</span>}
              </span>
            </td>
          </tr>
        ))}
    </>
  );
}

interface AssignWorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWorkerId: string | null;
  warehouseId?: string;
  onAssign: (workerId: string) => Promise<void>;
}

function AssignWorkerDialog({ open, onOpenChange, currentWorkerId, warehouseId, onAssign }: AssignWorkerDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [workers, setWorkers] = React.useState<WMSWorker[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string>('');
  const [qrOpen, setQrOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open || !accessToken) return;
    setLoading(true);
    wmsWorkerApi
      .list(accessToken, { page: 1, page_size: 100, warehouse_id: warehouseId })
      .then((data) => setWorkers(data.workers ?? []))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }, [open, accessToken, warehouseId]);

  React.useEffect(() => {
    if (open) setSelectedId(currentWorkerId ?? '');
  }, [open, currentWorkerId]);

  const selectedWorker = React.useMemo(() => workers.find((w) => w.id === selectedId) ?? null, [workers, selectedId]);

  const handleConfirm = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await onAssign(selectedId);
      toast({ title: 'Worker assigned' });
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Assign Worker</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loading ? 'Loading workers...' : 'Select worker'} />
              </SelectTrigger>
              <SelectContent>
                {workers.map((w) => {
                  const name = w.display_name ?? `${w.first_name} ${w.last_name}`.trim() ?? w.id;
                  return (
                    <SelectItem key={w.id} value={w.id}>
                      {name}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {selectedWorker && (
              <div className="rounded-lg border p-3 flex items-center gap-3">
                <button type="button"
                  onClick={() => setQrOpen(true)}
                  className="shrink-0 rounded-md hover:ring-2 hover:ring-blue-400 transition"
                  title="View worker QR code">
                  <WorkerQrCode value={workerQrValue(selectedWorker)} size={56} />
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {selectedWorker.display_name ?? `${selectedWorker.first_name} ${selectedWorker.last_name}`.trim()}
                  </p>
                  {selectedWorker.employee_id && <p className="text-xs text-muted-foreground font-mono">{selectedWorker.employee_id}</p>}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={!selectedId || busy}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                Assign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <WorkerQrDialog open={qrOpen} onOpenChange={setQrOpen} worker={selectedWorker} />
    </>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
}

function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, destructive, onConfirm }: ConfirmDialogProps) {
  const [busy, setBusy] = React.useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button size="sm" variant={destructive ? 'destructive' : 'default'} onClick={handleConfirm} disabled={busy}>
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
            {confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// PICK LIST DETAIL DIALOG — HELPERS
// ============================================

const PRE_COMPLETE_STATUSES = ['draft', 'confirmed', 'pending_picking', 'in_progress'];
const CLOSED_STATUSES = ['pick_complete', 'completed', 'ready_for_dispatch', 'in_transit', 'delivered', 'cancelled'];

interface PickListCaps {
  canComplete: boolean;
  canCancel: boolean;
  canAccept: boolean;
  canConfirm: boolean;
  canMarkReady: boolean;
  canMarkInTransit: boolean;
  canMarkDelivered: boolean;
  /** Handling-unit association is only available once the task has been accepted. */
  canAssignHu: boolean;
}

/** Which lifecycle actions are available for a given pick list. */
function pickListCaps(pickList: PickList | null): PickListCaps {
  const status = pickList?.status;
  return {
    canComplete: !!status && PRE_COMPLETE_STATUSES.includes(status),
    canCancel: !!status && !CLOSED_STATUSES.includes(status),
    canAccept: !!status && ['draft', 'confirmed', 'pending_picking'].includes(status),
    canConfirm: status === 'draft',
    canMarkReady: !!status && ['pick_complete', 'completed'].includes(status),
    canMarkInTransit: status === 'ready_for_dispatch',
    canMarkDelivered: status === 'in_transit',
    canAssignHu: !!pickList?.accepted_at,
  };
}

/** Warehouse used to load worker options. */
function pickListWarehouseId(pickList: PickList | null, warehouseId?: string): string | undefined {
  return pickList?.warehouse_id ?? warehouseId;
}

/** Selected handling-unit line, defaulting to the first open line. */
function effectiveHuLineId(huItemId: string, lines: PickListItem[]): string {
  return huItemId || lines[0]?.id || '';
}

interface AssignedWorkerInfo {
  id: string | null;
  name: string | null;
  employeeId: string | null;
  qr: string | null;
  raw: WMSWorker | undefined;
}

/** Resolves the pick list's assigned worker into display-ready fields. */
function useAssignedWorker(pickList: PickList | null, workers: WMSWorker[]): AssignedWorkerInfo {
  const workerById = React.useMemo(() => new Map(workers.map((w) => [w.id, w])), [workers]);
  const assignedTo = pickList?.assigned_to ?? null;
  const raw = assignedTo ? workerById.get(assignedTo) : undefined;
  const name = assignedTo ? (workerDisplayName(raw) ?? assignedTo) : null;
  return {
    id: assignedTo,
    name,
    employeeId: raw?.employee_id ?? null,
    qr: workerQrValue(raw),
    raw,
  };
}

interface PickListFooterHandlers {
  onConfirm: () => void;
  onAccept: () => void;
  onComplete: () => void;
  onMarkReady: () => void;
  onMarkInTransit: () => void;
  onMarkDelivered: () => void;
  onCancel: () => void;
}

interface PickListFooterAction {
  key: string;
  label: string;
  icon?: LucideIcon;
  variant: 'default' | 'outline';
  className: string;
  onClick: () => void;
}

function pickListFooterActions(caps: PickListCaps, handlers: PickListFooterHandlers): PickListFooterAction[] {
  const actions: PickListFooterAction[] = [];
  if (caps.canConfirm)
    actions.push({ key: 'confirm', label: 'Confirm', icon: CheckCircle2, variant: 'default', className: 'gap-2', onClick: handlers.onConfirm });
  if (caps.canAccept)
    actions.push({ key: 'accept', label: 'Accept Task', icon: CheckCircle2, variant: 'outline', className: 'gap-2', onClick: handlers.onAccept });
  if (caps.canComplete)
    actions.push({
      key: 'complete',
      label: 'Mark Complete',
      icon: CheckCircle2,
      variant: 'default',
      className: 'gap-2',
      onClick: handlers.onComplete,
    });
  if (caps.canMarkReady)
    actions.push({
      key: 'ready',
      label: 'Ready for Dispatch',
      icon: PackageCheck,
      variant: 'outline',
      className: 'gap-2',
      onClick: handlers.onMarkReady,
    });
  if (caps.canMarkInTransit)
    actions.push({
      key: 'transit',
      label: 'Mark In Transit',
      icon: Truck,
      variant: 'outline',
      className: 'gap-2',
      onClick: handlers.onMarkInTransit,
    });
  if (caps.canMarkDelivered)
    actions.push({
      key: 'delivered',
      label: 'Mark Delivered',
      icon: PackageCheck,
      variant: 'outline',
      className: 'gap-2',
      onClick: handlers.onMarkDelivered,
    });
  if (caps.canCancel)
    actions.push({
      key: 'cancel',
      label: 'Cancel',
      variant: 'outline',
      className: 'text-destructive border-destructive/20 hover:bg-destructive/10',
      onClick: handlers.onCancel,
    });
  return actions;
}

function PickListFooter({
  caps,
  handlers,
  hasWorker,
  onAssignClick,
  onClose,
}: {
  caps: PickListCaps;
  handlers: PickListFooterHandlers;
  hasWorker: boolean;
  onAssignClick: () => void;
  onClose: () => void;
}) {
  const actions = pickListFooterActions(caps, handlers);
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button key={action.key} size="sm" variant={action.variant} className={action.className} onClick={action.onClick}>
            {Icon && <Icon className="h-4 w-4" />}
            {action.label}
          </Button>
        );
      })}
      <Button size="sm" variant="outline" className="gap-2" onClick={onAssignClick}>
        <UserRound className="h-4 w-4" />
        {hasWorker ? 'Re-assign Worker' : 'Assign Worker'}
      </Button>
      <Button type="button" variant="outline" onClick={onClose}>
        Close
      </Button>
    </div>
  );
}

function PickListSummaryCards({
  pickList,
  progress,
  worker,
  onShowQr,
}: {
  pickList: PickList;
  progress: PickListProgress | null;
  worker: AssignedWorkerInfo;
  onShowQr: () => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-3 text-sm">
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground mb-1">Status</p>
        <WMSStatusBadge status={pickList.status} />
        {pickList.accepted_at && <p className="text-xs text-muted-foreground mt-1">Accepted {new Date(pickList.accepted_at).toLocaleTimeString()}</p>}
      </div>
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground mb-1">Progress</p>
        <p className="font-semibold text-lg">{progress ? `${progress.completion_percentage}%` : '—'}</p>
      </div>
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground mb-1">Invoice Ref</p>
        <p className="font-medium font-mono text-sm">{pickList.invoice_reference ?? '—'}</p>
      </div>
      <div className="rounded-lg border p-3">
        <p className="text-xs text-muted-foreground mb-1">Worker</p>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-sm">{worker.name ?? '—'}</p>
            {worker.employeeId && <p className="text-xs text-muted-foreground font-mono mt-0.5">{worker.employeeId}</p>}
          </div>
          {worker.qr && (
            <button type="button"
              onClick={onShowQr}
              className="shrink-0 rounded-md hover:ring-2 hover:ring-blue-400 transition"
              title="View worker QR code">
              <WorkerQrCode value={worker.qr} size={44} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PickListProgressBar({ progress }: { progress: PickListProgress | null }) {
  if (!progress) return null;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {progress.picked_qty} of {progress.total_qty} items picked
        </span>
        <span>{progress.completion_percentage}%</span>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${progress.completion_percentage}%` }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          Qty: {progress.picked_qty} / {progress.total_qty}
        </span>
        <span>Remaining: {progress.remaining_qty}</span>
      </div>
    </div>
  );
}

function HandlingUnitSection({
  visible,
  lines,
  itemId,
  onItemChange,
  huInput,
  onHuInputChange,
  onAssign,
  error,
}: {
  visible: boolean;
  lines: PickListItem[];
  itemId: string;
  onItemChange: (value: string) => void;
  huInput: string;
  onHuInputChange: (value: string) => void;
  onAssign: () => void;
  error: string | null;
}) {
  if (!visible || lines.length === 0) return null;
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Handling unit</p>
      <div className="flex gap-2">
        <Select value={itemId} onValueChange={onItemChange}>
          <SelectTrigger className="w-[260px] shrink-0">
            <SelectValue placeholder="Select line" />
          </SelectTrigger>
          <SelectContent>
            {lines.map((line) => (
              <SelectItem key={line.id} value={line.id}>
                {line.sku ?? line.item_id} — {(line.qty ?? 0) - (line.picked_qty ?? 0)} remaining
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={huInput}
          onChange={(e) => onHuInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onAssign();
          }}
          placeholder="Handling unit ID (trolley/carton/pallet)..."
          className="font-mono text-sm"/>
        <Button onClick={onAssign} variant="outline" className="gap-2 shrink-0">
          Assign HU
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function PickListItemsTable({ items, progress }: { items: PickListItem[]; progress: PickListProgress | null }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Line Items ({new Set(items.map((i) => i.item_id)).size} SKUs · {progress?.total_qty ?? items.length} units)
      </div>
      <table className="w-full text-sm">
        <thead className="bg-muted/30">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">SKU</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Batch</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Location Bin</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">Required</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">Per Case</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">Cases</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">Loose</th>
            <th className="text-right px-4 py-2 font-medium text-muted-foreground">Picked</th>
            <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.length === 0 && (
            <tr>
              <td colSpan={9} className="px-4 py-4 text-center text-muted-foreground text-xs">
                No items
              </td>
            </tr>
          )}
          {groupPickItems(items).map((group) => (
            <PickLineRow key={group.itemId} group={group} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PickListDetailBody({
  pickList,
  loading,
  error,
  caps,
  progress,
  worker,
  lines,
  itemId,
  onItemChange,
  huInput,
  onHuInputChange,
  onAssignHu,
  huError,
  onShowQr,
}: {
  pickList: PickList | null;
  loading: boolean;
  error: string | null;
  caps: PickListCaps;
  progress: PickListProgress | null;
  worker: AssignedWorkerInfo;
  lines: PickListItem[];
  itemId: string;
  onItemChange: (value: string) => void;
  huInput: string;
  onHuInputChange: (value: string) => void;
  onAssignHu: () => void;
  huError: string | null;
  onShowQr: () => void;
}) {
  const { enableHandlingUnit } = usePickSettings();
  if (error) return <div className="text-sm text-destructive py-4">{error}</div>;
  if (loading || !pickList) return null;
  return (
    <div className="flex flex-col gap-4">
      <PickListSummaryCards pickList={pickList} progress={progress} worker={worker} onShowQr={onShowQr} />
      <PickListProgressBar progress={progress} />
      <HandlingUnitSection visible={caps.canAssignHu && enableHandlingUnit}
        lines={lines}
        itemId={itemId}
        onItemChange={onItemChange}
        huInput={huInput}
        onHuInputChange={onHuInputChange}
        onAssign={onAssignHu}
        error={huError}/>
      <PickListItemsTable items={pickList.items} progress={progress} />
      <p className="text-xs text-muted-foreground">Created: {pickList.created_at ? new Date(pickList.created_at).toLocaleString() : '—'}</p>
    </div>
  );
}

function PickListConfirmDialog({
  action,
  onClose,
  onConfirmComplete,
  onConfirmCancel,
}: {
  action: 'complete' | 'cancel' | null;
  onClose: () => void;
  onConfirmComplete: () => Promise<void>;
  onConfirmCancel: () => Promise<void>;
}) {
  const isComplete = action === 'complete';
  return (
    <ConfirmDialog open={action !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title={isComplete ? 'Mark pick list complete?' : 'Cancel pick list?'}
      description={
        isComplete
          ? 'Any lines that are not fully picked will be validated against the short-pick policy.'
          : 'Cancelling will release any reserved stock. This action cannot be undone.'
      }
      confirmLabel={isComplete ? 'Mark Complete' : 'Cancel Pick List'}
      destructive={action === 'cancel'}
      onConfirm={isComplete ? onConfirmComplete : onConfirmCancel}/>
  );
}

interface PickListDetailDialogProps {
  listId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId?: string;
}

function PickListDetailDialog({ listId, open, onOpenChange, warehouseId }: PickListDetailDialogProps) {
  const { toast } = useToast();
  const { pickList, loading, error, complete, cancel, assignWorker, accept, confirm, markReady, markInTransit, markDelivered, assignHandlingUnit } =
    usePickList(listId);
  const workers = useWorkers(open, pickListWarehouseId(pickList, warehouseId));
  const worker = useAssignedWorker(pickList, workers);
  const [huInput, setHuInput] = React.useState('');
  const [huItemId, setHuItemId] = React.useState('');
  const [scanError, setScanError] = React.useState<string | null>(null);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [qrOpen, setQrOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<'complete' | 'cancel' | null>(null);

  const openLines = React.useMemo(() => (pickList?.items ?? []).filter((i) => i.qty - (i.picked_qty ?? 0) > 0), [pickList]);
  const effectiveHuItemId = effectiveHuLineId(huItemId, openLines);

  const handleAssign = React.useCallback(
    async (workerId: string) => {
      await assignWorker(workerId);
    },
    [assignWorker],
  );

  const handleAssignHu = async () => {
    const huId = huInput.trim();
    if (!huId || !effectiveHuItemId) return;
    try {
      setScanError(null);
      await assignHandlingUnit(effectiveHuItemId, huId);
      setHuInput('');
      toast({ title: 'Handling unit assigned' });
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Failed to assign handling unit');
    }
  };

  const handleComplete = async () => {
    try {
      await complete();
      toast({ title: 'Pick list completed' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  const handleAccept = async () => {
    try {
      await accept();
      toast({ title: 'Task accepted', description: 'Timer started' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to accept', variant: 'destructive' });
    }
  };

  const handleCancel = async () => {
    try {
      await cancel();
      toast({ title: 'Pick list cancelled' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  const handleConfirm = async () => {
    try {
      await confirm();
      toast({ title: 'Pick list confirmed' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  const handleMarkReady = async () => {
    try {
      await markReady();
      toast({ title: 'Ready for dispatch' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  const handleMarkInTransit = async () => {
    try {
      await markInTransit();
      toast({ title: 'Marked in transit' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  const handleMarkDelivered = async () => {
    try {
      await markDelivered();
      toast({ title: 'Marked delivered' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  const progress = pickList?.progress ?? null;
  const caps = pickListCaps(pickList);

  return (
    <>
      <DetailDialog open={open}
        onOpenChange={onOpenChange}
        title={pickList ? `Pick — ${pickList.pick_list_no}` : 'Loading...'}
        size="xl"
        loading={loading}
        loadingMessage="Loading pick list details..."
        footer={
          <PickListFooter caps={caps}
            handlers={{
              onConfirm: handleConfirm,
              onAccept: handleAccept,
              onComplete: () => setConfirmAction('complete'),
              onMarkReady: handleMarkReady,
              onMarkInTransit: handleMarkInTransit,
              onMarkDelivered: handleMarkDelivered,
              onCancel: () => setConfirmAction('cancel'),
            }}
            hasWorker={worker.id !== null}
            onAssignClick={() => setAssignOpen(true)}
            onClose={() => onOpenChange(false)}/>
        }>
        <PickListDetailBody pickList={pickList}
          loading={loading}
          error={error}
          caps={caps}
          progress={progress}
          worker={worker}
          lines={openLines}
          itemId={effectiveHuItemId}
          onItemChange={setHuItemId}
          huInput={huInput}
          onHuInputChange={setHuInput}
          onAssignHu={handleAssignHu}
          huError={scanError}
          onShowQr={() => setQrOpen(true)}/>
      </DetailDialog>
      <AssignWorkerDialog open={assignOpen}
        onOpenChange={setAssignOpen}
        currentWorkerId={worker.id}
        warehouseId={pickListWarehouseId(pickList, warehouseId)}
        onAssign={handleAssign}/>
      <WorkerQrDialog open={qrOpen} onOpenChange={setQrOpen} worker={worker.raw} />
      <PickListConfirmDialog action={confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirmComplete={handleComplete}
        onConfirmCancel={handleCancel}/>
    </>
  );
}

// ============================================
// PICK LIST LIST (mirrors PutAwayView)
// ============================================

function PackPickListDialog({
  pickList,
  warehouseId,
  onClose,
  onPacked,
}: {
  pickList: PickList | null;
  warehouseId?: string;
  onClose: () => void;
  onPacked: () => void;
}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [slips, setSlips] = React.useState<PackingSlipListItem[]>([]);
  const [target, setTarget] = React.useState('new');
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!pickList || !accessToken) return;
    // Reset per-open state so a previous pick list's destination isn't reused.
    setTarget('new');
    setLoadError(null);
    let cancelled = false;
    setLoading(true);
    packingSlipApi
      .list(accessToken, { warehouse_id: warehouseId, status: 'draft', page: 1, page_size: 100 })
      .then((d) => {
        if (!cancelled) setSlips(d.packing_slips ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setSlips([]);
          setLoadError(err instanceof Error ? err.message : 'Failed to load packing slips');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pickList, accessToken, warehouseId]);

  if (!pickList) return null;

  const handlePack = async () => {
    if (!accessToken) return;
    setBusy(true);
    try {
      const slip = await packingSlipApi.packPickLists(accessToken, [pickList.id], target === 'new' ? undefined : target);
      toast({ title: 'Packed', description: `Added to ${slip.packing_slip_no}` });
      onPacked();
      onClose();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to pack', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open
      onOpenChange={(o) => {
        if (!o) onClose();
      }}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Pack Pick List</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Pack <span className="font-mono font-medium text-foreground">{pickList.pick_list_no}</span> into a packing slip.
          </p>
          <Select value={target} onValueChange={setTarget}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Destination" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">New packing slip</SelectItem>
              {slips.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.packing_slip_no}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {loading && <p className="text-xs text-muted-foreground">Loading draft packing slips…</p>}
          {!loading && loadError && <p className="text-xs text-destructive">Couldn&apos;t load existing packing slips: {loadError}</p>}
          {!loading && !loadError && slips.length === 0 && (
            <p className="text-xs text-muted-foreground">No draft packing slips — a new one will be created.</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handlePack} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <PackageCheck className="h-4 w-4 mr-1" />}
            Pack
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** `'all'` in a filter dropdown means "no server-side filter". */
function filterParam(value: string): string | undefined {
  return value === 'all' ? undefined : value;
}

/** Display name for a pick list's assigned worker. */
function pickListWorkerLabel(pl: PickList, workerById: Map<string, WMSWorker>): string {
  if (pl.worker_name && pl.worker_name !== pl.assigned_to) return pl.worker_name;
  if (pl.assigned_to) return workerDisplayName(workerById.get(pl.assigned_to)) ?? pl.assigned_to;
  return '—';
}

function PickListsEmpty({ filtered, onClearFilter }: { filtered: boolean; onClearFilter: () => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<PackageOpen className="h-12 w-12" />}
            title="No pick lists found"
            description={filtered ? 'No pick lists match the selected filters' : 'Generate one from a confirmed order in the Orders tab.'}
            action={
              filtered ? (
                <Button variant="outline" onClick={onClearFilter}>
                  Clear filters
                </Button>
              ) : undefined
            }/>
        </div>
      </CardContent>
    </Card>
  );
}

type ServerPagination = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

function PickListsTable({
  isInitialLoading,
  error,
  pickLists,
  columns,
  serverPagination,
  pageSize,
  filtered,
  onClearFilter,
}: {
  isInitialLoading: boolean;
  error: string | null;
  pickLists: PickList[];
  columns: ColumnDef<PickList>[];
  serverPagination?: ServerPagination;
  pageSize: number;
  filtered: boolean;
  onClearFilter: () => void;
}) {
  const renderBody = () => {
    if (isInitialLoading) {
      return (
        <Card>
          <CardContent className="p-0">
            <TableSkeleton columns={8} rows={8} showHeader={true} />
          </CardContent>
        </Card>
      );
    }

    if (pickLists.length === 0) {
      return <PickListsEmpty filtered={filtered} onClearFilter={onClearFilter} />;
    }

    return (
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns}
            data={pickLists}
            config={{
              showSerialNumber: false,
              showPagination: true,
              enableRowSelection: false,
              enableColumnVisibility: true,
              enableSorting: false,
              enableFiltering: false,
              initialPageSize: pageSize,
              serverPagination,
            }}
            fixedHeader
            maxHeight="auto"/>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-destructive">{error}</div>}
      {renderBody()}
    </div>
  );
}

interface PickListViewProps {
  warehouseId?: string;
  /** Increment to trigger a refetch (e.g. from the panel-level Refresh button). */
  refreshKey?: number;
}

export function PickListView({ warehouseId, refreshKey }: PickListViewProps) {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('created_at');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [viewListId, setViewListId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [packListId, setPackListId] = React.useState<string | null>(null);
  const workers = useWorkers(true, warehouseId);
  const workerById = React.useMemo(() => new Map(workers.map((w) => [w.id, w])), [workers]);

  const { data, loading, error, refetch } = usePickLists({
    status: filterParam(statusFilter),
    warehouse_id: warehouseId,
    sort_by: sortBy,
    page,
    page_size: pageSize,
  });

  // Refetch when the panel-level Refresh button is pressed (skip the initial mount).
  useRefreshOnKey(refreshKey, refetch);

  const pickLists: PickList[] = data?.pick_lists ?? [];
  const pagination = data?.pagination;
  const isInitialLoading = loading && !data;

  const serverPagination = React.useMemo(() => {
    if (!pagination) return undefined;

    return {
      totalItems: pagination.total_items,
      currentPage: pagination.page,
      pageSize: pagination.page_size,
      onPageChange: (nextPage: number, nextPageSize: number) => {
        if (nextPageSize !== pagination.page_size) {
          setPageSize(nextPageSize);
          setPage(1);
          return;
        }
        setPage(nextPage);
      },
    };
  }, [pagination]);

  const columns = createPickListColumns({
    onPack: (pickList) => setPackListId(pickList.id),
    onView: (pickList) => {
      setViewListId(pickList.id);
      setDialogOpen(true);
    },
    getWorkerLabel: (pickList) => pickListWorkerLabel(pickList, workerById),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="confirmed">Confirm</SelectItem>
            <SelectItem value="pending_picking">Pending Picking</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pick_complete">Pick-complete</SelectItem>
            <SelectItem value="ready_for_dispatch">Ready for dispatch</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy}
          onValueChange={(v) => {
            setSortBy(v);
            setPage(1);
          }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Newest first</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <PickListsTable isInitialLoading={isInitialLoading}
        error={error}
        pickLists={pickLists}
        columns={columns}
        serverPagination={serverPagination}
        pageSize={pageSize}
        filtered={statusFilter !== 'all'}
        onClearFilter={() => {
          setStatusFilter('all');
          setPage(1);
        }}/>

      <PickListDetailDialog listId={viewListId} open={dialogOpen} onOpenChange={setDialogOpen} warehouseId={warehouseId} />

      <PackPickListDialog pickList={data?.pick_lists.find((p) => p.id === packListId) ?? null}
        warehouseId={warehouseId}
        onClose={() => setPackListId(null)}
        onPacked={refetch}/>
    </div>
  );
}
