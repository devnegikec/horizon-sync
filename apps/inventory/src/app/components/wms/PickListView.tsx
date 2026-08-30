import * as React from 'react';

import { RefreshCw, ScanLine, CheckCircle2, X, Eye, UserRound, Loader2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { DetailDialog } from '@horizon-sync/ui/components/ui/detail-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { useToast } from '@horizon-sync/ui/hooks';
import { useUserStore } from '@horizon-sync/store';

import { usePickList, usePickLists, useErpSyncQueue } from '../../hooks/useWMS';
import type { PickList, PickListItem, PickSerialDetail, WMSWorker, ErpSyncMessage } from '../../types/wms.types';
import { wmsWorkerApi } from '../../utility/api/wms';
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
  return (
    <img
      src={url}
      alt={`QR ${value}`}
      width={size}
      height={size}
      className="rounded-md border border-border bg-white p-1 shrink-0"
    />
  );
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
          {qr ? (
            <WorkerQrCode value={qr} size={260} />
          ) : (
            <p className="text-sm text-muted-foreground">No QR code assigned</p>
          )}
          {worker && (
            <div className="text-center">
              <p className="font-semibold">
                {worker.display_name ?? `${worker.first_name} ${worker.last_name}`.trim()}
              </p>
              {worker.employee_id && (
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{worker.employee_id}</p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function useWorkers(enabled: boolean): WMSWorker[] {
  const accessToken = useUserStore((s) => s.accessToken);
  const [workers, setWorkers] = React.useState<WMSWorker[]>([]);

  React.useEffect(() => {
    if (!enabled || !accessToken) return;
    let cancelled = false;
    wmsWorkerApi
      .list(accessToken, { page: 1, page_size: 100 })
      .then((data) => {
        if (!cancelled) setWorkers(data.workers ?? []);
      })
      .catch(() => {
        if (!cancelled) setWorkers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, accessToken]);

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

function PickLineRow({ group }: { group: PickLineGroup }) {
  const [expanded, setExpanded] = React.useState(false);
  const rows = group.rows;
  const first = rows[0];
  const requiredQty = rows.reduce((s, r) => s + (r.qty || 0), 0);
  const pickedQty = rows.reduce((s, r) => s + (r.picked_qty || 0), 0);
  const batch = rows.map((r) => r.batch_no).find((b) => !!b) ?? null;
  const hu = rows.map((r) => r.handling_unit_id).find((v) => !!v) ?? null;
  const bins = Array.from(
    new Set(rows.map((r) => r.bin_location_path || r.bin_location_id || '').filter(Boolean)),
  );
  const serialRows: { serial: PickSerialDetail; bin: string | null }[] = [];
  const seenSerials = new Set<string>();
  for (const r of rows) {
    const bin = r.bin_location_path || r.bin_location_id || null;
    for (const s of r.serials ?? []) {
      if (s.serial_number && !seenSerials.has(s.serial_number)) {
        seenSerials.add(s.serial_number);
        serialRows.push({ serial: s, bin });
      }
    }
  }

  const done = pickedQty >= requiredQty;
  const statusText = done ? '✓ Done' : pickedQty > 0 ? 'Partial' : 'Pending';
  const statusClass = done ? 'text-green-600' : pickedQty > 0 ? 'text-blue-600' : 'text-muted-foreground';

  const perCase = rows.map((r) => r.per_case_qty).find((v) => v != null) ?? null;
  const caseQty = rows.map((r) => r.case_qty).find((v) => v != null) ?? null;
  const looseQty = rows.map((r) => r.loose_qty).find((v) => v != null) ?? null;
  const pickedCases = perCase && perCase > 0 ? Math.floor(pickedQty / perCase) : 0;
  const pickedLoose = perCase && perCase > 0 ? pickedQty - pickedCases * perCase : pickedQty;

  return (
    <>
      <tr
        className="hover:bg-muted/20 cursor-pointer transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="px-4 py-2">
          <span className="inline-flex items-center gap-1">
            {expanded
              ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            }
            <span className="font-mono font-medium">{first.sku ?? first.item_id}</span>
            {first.item_name && (
              <span className="text-xs text-muted-foreground ml-2">{first.item_name}</span>
            )}
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
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                  +{bins.length - 1}
                </span>
              )}
            </span>
          )}
        </td>
        <td className="px-4 py-2 text-right">{requiredQty}</td>
        <td className="px-4 py-2 text-right text-muted-foreground">{perCase ?? '—'}</td>
        <td className="px-4 py-2 text-right text-muted-foreground">
          {caseQty != null && caseQty > 0 ? `${pickedCases}/${caseQty}` : caseQty === 0 ? '0' : '—'}
        </td>
        <td className="px-4 py-2 text-right text-muted-foreground">
          {looseQty != null && looseQty > 0 ? `${pickedLoose}/${looseQty}` : looseQty === 0 ? '0' : '—'}
        </td>
        <td className="px-4 py-2 text-right font-semibold">{pickedQty}</td>
        <td className="px-4 py-2">
          <span className={`text-xs font-medium ${statusClass}`}>{statusText}</span>
        </td>
      </tr>
      {expanded && serialRows.map(({ serial, bin }, idx) => (
        <tr key={`${serial.serial_number}-${idx}`} className="bg-muted/20">
          <td className="px-4 py-1.5 pl-10">
            <span className="font-mono text-xs font-medium">S.N: {serial.serial_number}</span>
          </td>
          <td className="px-4 py-1.5 text-xs text-muted-foreground" colSpan={8}>
            <span className="inline-flex gap-3 flex-wrap items-center">
              <span>SKU: <span className="font-mono">{serial.sku ?? first.sku}</span></span>
              {serial.manufacturing_date && (
                <span>Mfg: {new Date(serial.manufacturing_date).toLocaleDateString()}</span>
              )}
              {serial.expiry_date && (
                <span>Exp: {new Date(serial.expiry_date).toLocaleDateString()}</span>
              )}
              {bin && (
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 font-mono">
                  Bin: {bin}
                </span>
              )}
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
  onAssign: (workerId: string) => Promise<void>;
}

function AssignWorkerDialog({ open, onOpenChange, currentWorkerId, onAssign }: AssignWorkerDialogProps) {
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
      .list(accessToken, { page: 1, page_size: 100 })
      .then((data) => setWorkers(data.workers ?? []))
      .catch(() => setWorkers([]))
      .finally(() => setLoading(false));
  }, [open, accessToken]);

  React.useEffect(() => {
    if (open) setSelectedId(currentWorkerId ?? '');
  }, [open, currentWorkerId]);

  const selectedWorker = React.useMemo(
    () => workers.find((w) => w.id === selectedId) ?? null,
    [workers, selectedId],
  );

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
                <button
                  type="button"
                  onClick={() => setQrOpen(true)}
                  className="shrink-0 rounded-md hover:ring-2 hover:ring-blue-400 transition"
                  title="View worker QR code"
                >
                  <WorkerQrCode value={workerQrValue(selectedWorker)} size={56} />
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {selectedWorker.display_name ?? `${selectedWorker.first_name} ${selectedWorker.last_name}`.trim()}
                  </p>
                  {selectedWorker.employee_id && (
                    <p className="text-xs text-muted-foreground font-mono">{selectedWorker.employee_id}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleConfirm} disabled={!selectedId || busy}>
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                )}
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

interface PickListDetailDialogProps {
  listId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PickListDetailDialog({ listId, open, onOpenChange }: PickListDetailDialogProps) {
  const { toast } = useToast();
  const { pickList, loading, error, recordScan, complete, cancel, assignWorker, stageTransfer, stageScan, assignHandlingUnit } = usePickList(listId);
  const workers = useWorkers(open);
  const workerById = React.useMemo(() => new Map(workers.map((w) => [w.id, w])), [workers]);
  const [qrInput, setQrInput] = React.useState('');
  const [binInput, setBinInput] = React.useState('');
  const [stageInput, setStageInput] = React.useState('');
  const [huInput, setHuInput] = React.useState('');
  const [staging, setStaging] = React.useState(false);
  const [scannedBinId, setScannedBinId] = React.useState<string | null>(null);
  const [scannedBinLabel, setScannedBinLabel] = React.useState<string | null>(null);
  const [scanError, setScanError] = React.useState<string | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [qrOpen, setQrOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<'complete' | 'cancel' | null>(null);
  const [binDialogOpen, setBinDialogOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const assignedWorker = pickList?.assigned_to ? workerById.get(pickList.assigned_to) : undefined;
  const assignedWorkerName = pickList?.assigned_to
    ? workerDisplayName(assignedWorker) ?? pickList.assigned_to
    : null;
  const assignedEmployeeId = assignedWorker?.employee_id ?? null;
  const assignedWorkerQr = workerQrValue(assignedWorker);

  const handleAssign = React.useCallback(
    async (workerId: string) => {
      await assignWorker(workerId);
    },
    [assignWorker],
  );

  const handleScan = async () => {
    if (!qrInput.trim()) return;
    setScanError(null);
    setScanning(true);
    try {
      const result = await recordScan(qrInput.trim(), scannedBinId);
      setQrInput('');
      const serialPart = result.serial_no ? ` [${result.serial_no}]` : '';
      toast({ title: 'Item scanned', description: `${result.sku}${serialPart} — ${result.scanned_qty} units` });
      inputRef.current?.focus();
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleBinScan = () => {
    const raw = binInput.trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const locationId = parsed.location_id ?? null;
      if (!locationId) throw new Error('Bin QR is missing a location id');
      setScannedBinId(String(locationId));
      setScannedBinLabel(parsed.full_path ?? String(locationId));
      setBinInput('');
      setScanError(null);
      toast({ title: 'Bin scanned', description: parsed.full_path ?? String(locationId) });
      inputRef.current?.focus();
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Invalid bin QR');
    }
  };

  const handleStage = async () => {
    const raw = stageInput.trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      const locationId = parsed.location_id ?? null;
      if (!locationId) throw new Error('Staging lane QR is missing a location id');
      setStaging(true);
      setScanError(null);
      await stageTransfer(String(locationId));
      await stageScan(String(locationId));
      setStageInput('');
      toast({ title: 'Staged', description: parsed.full_path ?? String(locationId) });
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Staging failed');
    } finally {
      setStaging(false);
    }
  };

  const handleAssignHu = async () => {
    const huId = huInput.trim();
    if (!huId || !pickList) return;
    const item = pickList.items.find((i) => (i.qty - (i.picked_qty ?? 0)) > 0);
    if (!item) return;
    try {
      setScanError(null);
      await assignHandlingUnit(item.id, huId);
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

  const handleCancel = async () => {
    try {
      await cancel();
      toast({ title: 'Pick list cancelled' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  const progress = pickList?.progress ?? null;
  const canComplete = pickList?.status === 'in_progress' && (progress?.remaining_items ?? 0) === 0;
  const canScan = pickList?.status === 'draft' || pickList?.status === 'in_progress';
  const canCancel = !!pickList && pickList.status !== 'completed' && pickList.status !== 'cancelled';

  const footer = (
    <div className="flex items-center gap-2">
      {canComplete && (
        <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => setConfirmAction('complete')}>
          <CheckCircle2 className="h-4 w-4" />
          Mark Complete
        </Button>
      )}
      {canCancel && (
        <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => setConfirmAction('cancel')}>
          Cancel
        </Button>
      )}
      <Button size="sm" variant="outline" className="gap-2" onClick={() => setAssignOpen(true)}>
        <UserRound className="h-4 w-4" />
        {pickList?.assigned_to ? 'Re-assign Worker' : 'Assign Worker'}
      </Button>
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
        Close
      </Button>
    </div>
  );

  return (
    <>
      <DetailDialog
        open={open}
        onOpenChange={onOpenChange}
        title={pickList ? `Pick — ${pickList.pick_list_no}` : 'Loading...'}
        size="xl"
        loading={loading}
        loadingMessage="Loading pick list details..."
        footer={footer}
      >
        {error && <div className="text-sm text-destructive py-4">{error}</div>}

        {!loading && !error && pickList && (
          <div className="flex flex-col gap-4">
            {/* Summary row */}
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <WMSStatusBadge status={pickList.status} />
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
                    <p className="font-medium text-sm">{assignedWorkerName ?? '—'}</p>
                    {assignedEmployeeId && (
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{assignedEmployeeId}</p>
                    )}
                  </div>
                  {assignedWorkerQr && (
                    <button
                      type="button"
                      onClick={() => setQrOpen(true)}
                      className="shrink-0 rounded-md hover:ring-2 hover:ring-blue-400 transition"
                      title="View worker QR code"
                    >
                      <WorkerQrCode value={assignedWorkerQr} size={44} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Progress bar */}
            {progress && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{progress.picked_qty} of {progress.total_qty} items picked</span>
                  <span>{progress.completion_percentage}%</span>
                </div>
                <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${progress.completion_percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Qty: {progress.picked_qty} / {progress.total_qty}</span>
                  <span>Remaining: {progress.remaining_qty}</span>
                </div>
              </div>
            )}

            {/* Scan input */}
            {canScan && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={binInput}
                    onChange={(e) => setBinInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBinScan()}
                    placeholder="Scan source bin QR first..."
                    className="font-mono text-sm"
                  />
                  <Button onClick={handleBinScan} variant="outline" className="gap-2 shrink-0">
                    <ScanLine className="h-4 w-4" />
                    Bin
                  </Button>
                </div>
                {scannedBinId && (
                  <div className="text-xs text-muted-foreground font-mono">
                    Active bin: {scannedBinLabel ?? scannedBinId}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    placeholder="Scan item QR code..."
                    className="font-mono text-sm"
                    autoFocus
                  />
                  <Button onClick={handleScan} disabled={scanning} className="gap-2 shrink-0">
                    <ScanLine className="h-4 w-4" />
                    {scanning ? 'Scanning...' : 'Scan'}
                  </Button>
                </div>
                {scanError && (
                  <div className="flex items-start gap-2 p-2.5 bg-destructive/10 text-destructive rounded-md text-sm">
                    <X className="h-4 w-4 mt-0.5 shrink-0" />
                    {scanError}
                  </div>
                )}
              </div>
            )}

            {/* Staging lane scan */}
            {canScan && (
              <div className="flex gap-2">
                <Input
                  value={stageInput}
                  onChange={(e) => setStageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleStage()}
                  placeholder="Scan staging lane QR..."
                  className="font-mono text-sm"
                />
                <Button onClick={handleStage} variant="outline" disabled={staging} className="gap-2 shrink-0">
                  <ScanLine className="h-4 w-4" />
                  {staging ? 'Staging...' : 'Stage'}
                </Button>
              </div>
            )}

            {/* Handling unit association */}
            {canScan && (
              <div className="flex gap-2">
                <Input
                  value={huInput}
                  onChange={(e) => setHuInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAssignHu()}
                  placeholder="Handling unit ID (trolley/carton/pallet)..."
                  className="font-mono text-sm"
                />
                <Button onClick={handleAssignHu} variant="outline" className="gap-2 shrink-0">
                  Assign HU
                </Button>
              </div>
            )}

            {/* Items table */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Line Items ({new Set(pickList.items.map((i) => i.item_id)).size} SKUs · {progress?.total_qty ?? pickList.items.length} units)
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
                  {pickList.items.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-4 py-4 text-center text-muted-foreground text-xs">No items</td>
                    </tr>
                  )}
                  {groupPickItems(pickList.items).map((group) => (
                    <PickLineRow key={group.itemId} group={group} />
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              Created: {pickList.created_at ? new Date(pickList.created_at).toLocaleString() : '—'}
            </p>
          </div>
        )}
      </DetailDialog>
      <AssignWorkerDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        currentWorkerId={pickList?.assigned_to ?? null}
        onAssign={handleAssign}
      />
      <WorkerQrDialog open={qrOpen} onOpenChange={setQrOpen} worker={assignedWorker} />
      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmAction(null);
        }}
        title={confirmAction === 'complete' ? 'Mark pick list complete?' : 'Cancel pick list?'}
        description={
          confirmAction === 'complete'
            ? 'All items must be fully picked before the pick list can be completed.'
            : 'Cancelling will release any reserved stock. This action cannot be undone.'
        }
        confirmLabel={confirmAction === 'complete' ? 'Mark Complete' : 'Cancel Pick List'}
        destructive={confirmAction === 'cancel'}
        onConfirm={confirmAction === 'complete' ? handleComplete : handleCancel}
      />
    </>
  );
}

// ============================================
// PICK LIST LIST (mirrors PutAwayView)
// ============================================

interface PickListViewProps {
  warehouseId?: string;
}

function syncStatusBadge(status: ErpSyncMessage['status']) {
  if (status === 'sent') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
        <CheckCircle2 className="h-3 w-3" /> Sent
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600">
        <AlertTriangle className="h-3 w-3" /> Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
      <Loader2 className="h-3 w-3 animate-spin" /> Pending
    </span>
  );
}

function ErpSyncPanel() {
  const { data, loading, error, refetch, flush } = useErpSyncQueue({ page: 1, page_size: 10 });
  const { toast } = useToast();
  const [flushing, setFlushing] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const messages = data?.messages ?? [];
  const failedCount = messages.filter((m) => m.status === 'failed').length;

  const handleFlush = async () => {
    setFlushing(true);
    try {
      const res = await flush();
      toast({
        title: 'ERP sync flushed',
        description: `${res.sent} sent, ${res.retried} retried, ${res.failed} failed`,
      });
    } catch (err) {
      toast({
        title: 'Flush failed',
        description: err instanceof Error ? err.message : 'Failed to flush ERP sync queue',
        variant: 'destructive',
      });
    } finally {
      setFlushing(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex items-center gap-2 text-sm font-medium"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          ERP Sync Queue
          {failedCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600">
              <AlertTriangle className="h-3 w-3" /> {failedCount} failed
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleFlush} disabled={flushing} className="gap-2">
            <RefreshCw className={`h-3.5 w-3.5 ${flushing ? 'animate-spin' : ''}`} />
            {flushing ? 'Flushing…' : 'Flush retries'}
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3">
          {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading sync queue…</div>}
          {error && <div className="text-sm text-destructive">{error}</div>}
          {!loading && messages.length === 0 && (
            <p className="text-sm text-muted-foreground">No ERP sync messages yet.</p>
          )}
          {!loading && messages.length > 0 && (
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Entity</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Operation</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-3 py-2 font-medium text-muted-foreground">Attempts</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Last error</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {messages.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 font-mono text-xs">{m.entity_type}</td>
                    <td className="px-3 py-2 text-muted-foreground">{m.operation}</td>
                    <td className="px-3 py-2">{syncStatusBadge(m.status)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {m.attempt_count}/{m.max_attempts}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground max-w-[280px] truncate">
                      {m.last_error ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export function PickListView({ warehouseId }: PickListViewProps) {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('created_at');
  const [page, setPage] = React.useState(1);
  const [viewListId, setViewListId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const workers = useWorkers(true);
  const workerById = React.useMemo(() => new Map(workers.map((w) => [w.id, w])), [workers]);

  const { data, loading, error, refetch } = usePickLists({
    status: statusFilter === 'all' ? undefined : statusFilter,
    warehouse_id: warehouseId,
    sort_by: sortBy,
    page,
    page_size: 20,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">Newest first</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Pick lists are created from imported incoming orders (packing slip PDF/CSV) or invoices. Click View to see items and manage picking.
      </p>

      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading pick lists...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {!loading && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pick List #</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice Ref</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Priority</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Worker</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(!data || data.pick_lists.length === 0) && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No pick lists found. Import an incoming order to create one.
                  </td>
                </tr>
              )}
              {data?.pick_lists.map((pl) => (
                <tr key={pl.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium">{pl.pick_list_no}</td>
                  <td className="px-4 py-3 text-muted-foreground">{pl.invoice_reference ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <WMSStatusBadge status={pl.status} />
                      {pl.is_aging && (
                        <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-600">
                          Aged
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={pl.priority > 0 ? 'font-mono font-semibold text-foreground' : 'text-muted-foreground'}>
                      {pl.priority > 0 ? `P${pl.priority}` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{pl.progress?.total_qty ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {pl.assigned_to
                      ? workerDisplayName(workerById.get(pl.assigned_to)) ?? pl.assigned_to
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {pl.created_at ? new Date(pl.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 h-7 px-2 text-xs"
                      onClick={() => { setViewListId(pl.id); setDialogOpen(true); }}
                    >
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

      {data && data.pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {data.pagination.page} of {data.pagination.total_pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={!data.pagination.has_prev} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={!data.pagination.has_next} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <ErpSyncPanel />

      <PickListDetailDialog listId={viewListId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
