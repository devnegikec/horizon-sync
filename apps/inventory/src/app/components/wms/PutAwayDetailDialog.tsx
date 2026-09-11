import * as React from 'react';

import { Loader2, CheckCircle2, SkipForward, Search, MapPin } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { useToast } from '@horizon-sync/ui/hooks';

import { usePutAwayList } from '../../hooks/useWMS';
import type { PutAwayItem, PutAwayList, WarehouseLocation } from '../../types/wms.types';
import { layoutApi } from '../../utility/api/wms';

import { QRDetailDialog, type QRDetailColumn, type QRDetailRow } from './QRDetailDialog';
import { WMSStatusBadge } from './WMSStatusBadge';

// ─── Complete Item Dialog (bin position selection) ───────────────────────────

interface CompleteItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PutAwayItem;
  warehouseId: string;
  onConfirm: (itemId: string, binId: string) => Promise<unknown>;
}

function BinSearchResults({
  searching,
  query,
  results,
  selectedBin,
  onSelect,
}: {
  searching: boolean;
  query: string;
  results: WarehouseLocation[];
  selectedBin: WarehouseLocation | null;
  onSelect: (location: WarehouseLocation) => void;
}) {
  if (searching) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (results.length > 0) {
    return (
      <div className="border rounded-lg max-h-[200px] overflow-y-auto">
        {results.map((loc) => (
          <button key={loc.id}
            type="button"
            className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-muted transition-colors ${selectedBin?.id === loc.id ? 'bg-accent text-accent-foreground' : ''}`}
            onClick={() => onSelect(loc)}>
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="font-mono font-medium">{loc.code}</span>
              {loc.full_path && <span className="text-xs text-muted-foreground ml-2 truncate">{loc.full_path}</span>}
            </div>
            {loc.available_capacity > 0 && (
              <span className="text-xs text-muted-foreground shrink-0">
                Cap: {loc.available_capacity}/{loc.total_capacity}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  if (query.length >= 1) {
    return <p className="text-xs text-muted-foreground py-2">No bins found matching &quot;{query}&quot;</p>;
  }

  return null;
}

function CompleteItemDialog({ open, onOpenChange, item, warehouseId, onConfirm }: CompleteItemDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [query, setQuery] = React.useState(item.suggested_bin_code ?? '');
  const [results, setResults] = React.useState<WarehouseLocation[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [selectedBin, setSelectedBin] = React.useState<WarehouseLocation | null>(null);
  const [busy, setBusy] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchBins = React.useCallback(
    (q: string) => {
      if (!accessToken || !warehouseId || q.trim().length < 1) {
        setResults([]);
        return;
      }
      setSearching(true);
      layoutApi
        .searchLocations(accessToken, warehouseId, q, 10)
        .then((data) => {
          // filter to only bin-level locations
          setResults(data.filter((loc) => loc.location_type === 'bin'));
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    },
    [accessToken, warehouseId],
  );

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedBin(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchBins(value), 300);
  };

  const handleConfirm = async () => {
    if (!selectedBin) return;
    setBusy(true);
    try {
      await onConfirm(item.id, selectedBin.id);
      toast({ title: 'Item completed', description: `${item.sku} put away to ${selectedBin.code}.` });
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  // Reset state when opening
  React.useEffect(() => {
    if (open) {
      setQuery(item.suggested_bin_code ?? '');
      setSelectedBin(null);
      setResults([]);
      if (item.suggested_bin_code) searchBins(item.suggested_bin_code);
    }
  }, [open, item.suggested_bin_code, searchBins]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Complete Put-Away — {item.sku}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Quantity</p>
              <p className="font-semibold">{item.quantity}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Batch</p>
              <p className="font-medium font-mono text-xs">{item.batch_number ?? '—'}</p>
            </div>
          </div>

          {item.suggested_bin_code && (
            <div className="rounded-lg border bg-blue-50/50 border-blue-200 px-3 py-2 text-sm">
              <span className="font-medium text-blue-700">Suggested Bin: </span>
              <span className="text-blue-600 font-mono">{item.suggested_bin_code}</span>
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Search Bin Location</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10" placeholder="Type to search bins..." value={query} onChange={(e) => handleQueryChange(e.target.value)} />
            </div>

            <BinSearchResults searching={searching} query={query} results={results} selectedBin={selectedBin} onSelect={setSelectedBin} />
          </div>

          {selectedBin && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">
              <span className="font-medium text-green-700">Selected: </span>
              <span className="text-green-600 font-mono">{selectedBin.code}</span>
              {selectedBin.full_path && <span className="text-green-500 text-xs ml-1">({selectedBin.full_path})</span>}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm} disabled={!selectedBin || busy}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
              Confirm Put-Away
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Item row with Complete / Skip actions (serial sub-row) ──────────────────

interface PutAwayLineGroup {
  itemId: string;
  rows: PutAwayItem[];
}

function groupPutAwayItems(items: PutAwayItem[]): PutAwayLineGroup[] {
  const groups = new Map<string, PutAwayLineGroup>();
  for (const it of items) {
    const g = groups.get(it.item_id) ?? { itemId: it.item_id, rows: [] };
    g.rows.push(it);
    groups.set(it.item_id, g);
  }
  return Array.from(groups.values());
}

const EMPTY = '\u2014';

/** Prefer the full serial list when present, else the single serial/batch. */
function serialLabel(item: PutAwayItem): string | null {
  if (item.serial_nos && item.serial_nos.length > 0) return item.serial_nos.join(', ');
  return item.serial_number ?? item.batch_number ?? null;
}

/** The group's batch when every unit shares it, otherwise null (units differ). */
function commonBatch(rows: PutAwayItem[]): string | null {
  const batches = rows.map((r) => r.batch_number).filter((b): b is string => Boolean(b));
  const unique = [...new Set(batches)];
  return unique.length === 1 ? unique[0] : null;
}

/** Aggregate a group's units into a put-away status. */
function groupStatus(rows: PutAwayItem[]): string {
  const done = rows.filter((r) => r.status === 'completed' || r.status === 'skipped').length;
  if (done === 0) return 'pending';
  if (done >= rows.length) return 'completed';
  return 'in_progress';
}

function itemToChildRow(item: PutAwayItem, productName: string): QRDetailRow {
  return {
    id: item.id,
    name: item.item_name ?? productName,
    sku: item.sku,
    batch: item.batch_number,
    serialNumber: serialLabel(item),
    manufacturingDate: item.manufacturing_date ?? null,
    expiryDate: item.expiry_date ?? null,
    quantity: item.quantity,
    meta: { item },
  };
}

function groupToRow(group: PutAwayLineGroup): QRDetailRow {
  const first = group.rows[0];
  const productName = first.item_name ?? first.sku;
  return {
    id: group.itemId,
    name: productName,
    sku: first.sku,
    batch: commonBatch(group.rows),
    serialNumber: null,
    quantity: group.rows.reduce((sum, r) => sum + (r.quantity || 0), 0),
    meta: { status: groupStatus(group.rows) },
    children: group.rows.map((item) => itemToChildRow(item, productName)),
  };
}

/** One parent row per product (item_id) with each unit as a child row. */
function listToRows(items: PutAwayItem[]): QRDetailRow[] {
  return groupPutAwayItems(items).map(groupToRow);
}

// ─── Extra columns / actions ─────────────────────────────────────────────────

function BinCell({ row }: { row: QRDetailRow }) {
  const item = row.meta?.item as PutAwayItem | undefined;
  if (!item) return null;
  return <span className="font-mono text-[11px]">{item.suggested_bin_code ?? item.bin_location_code ?? EMPTY}</span>;
}

function StatusCell({ row }: { row: QRDetailRow }) {
  const item = row.meta?.item as PutAwayItem | undefined;
  const status = item?.status ?? (row.meta?.status as string | undefined);
  if (!status) return null;
  return <WMSStatusBadge status={status} />;
}

function ActionsCell({
  row,
  onComplete,
  onSkip,
}: {
  row: QRDetailRow;
  onComplete: (item: PutAwayItem) => void;
  onSkip: (item: PutAwayItem) => void;
}) {
  const item = row.meta?.item as PutAwayItem | undefined;
  // Parent (product) rows and already-finished units carry no actions.
  if (!item || item.status === 'completed' || item.status === 'skipped') return null;

  return (
    <div className="flex items-center justify-end gap-1">
      <Button size="sm"
        variant="outline"
        className="h-7 gap-1 border-green-200 px-2 text-xs text-green-600 hover:bg-green-50"
        onClick={() => onComplete(item)}>
        <CheckCircle2 className="h-3 w-3" />
        Complete
      </Button>
      <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs text-muted-foreground" onClick={() => onSkip(item)}>
        <SkipForward className="h-3 w-3" />
        Skip
      </Button>
    </div>
  );
}

// ─── Skip item dialog (replaces the old inline skip input row) ───────────────

interface SkipItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PutAwayItem;
  onConfirm: (itemId: string, reason: string) => Promise<PutAwayItem>;
}

function SkipItemDialog({ open, onOpenChange, item, onConfirm }: SkipItemDialogProps) {
  const { toast } = useToast();
  const [reason, setReason] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setReason('');
      setBusy(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await onConfirm(item.id, reason);
      toast({ title: 'Item skipped', description: item.sku });
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Skip Put-Away — {item.sku}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">This unit will not be put away. Provide a reason for skipping it.</p>
          <Input placeholder="Skip reason..." value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" disabled={!reason.trim() || busy} onClick={handleConfirm}>
              Confirm Skip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Summary block ───────────────────────────────────────────────────────────

function PutAwaySummary({ list }: { list: PutAwayList }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-3 text-sm">
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs text-muted-foreground">Status</p>
          <WMSStatusBadge status={list.status} />
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs text-muted-foreground">Progress</p>
          <p className="text-sm font-medium">
            {list.completed_items} / {list.total_items} units
          </p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs text-muted-foreground">Worker</p>
          <p className="text-sm font-medium">{list.worker_name ?? list.assigned_to ?? EMPTY}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="mb-1 text-xs text-muted-foreground">Receiving Slip</p>
          <p className="font-mono text-sm font-medium">{list.receiving_slip_no ?? EMPTY}</p>
        </div>
      </div>

      {list.remarks && (
        <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Remarks: </span>
          {list.remarks}
        </div>
      )}

      {list.warnings && list.warnings.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 px-3 py-2 text-sm">
          <span className="font-medium text-amber-700">Warnings: </span>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-amber-600">
            {list.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted-foreground">Created: {list.created_at ? new Date(list.created_at).toLocaleString() : EMPTY}</p>
    </div>
  );
}

// ─── Detail dialog for a single put-away list ────────────────────────────────

interface PutAwayDetailDialogProps {
  listId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PutAwayDetailDialog({ listId, open, onOpenChange }: PutAwayDetailDialogProps) {
  const { list, loading, error, completeItem, skipItem } = usePutAwayList(listId);
  const [completeTarget, setCompleteTarget] = React.useState<PutAwayItem | null>(null);
  const [skipTarget, setSkipTarget] = React.useState<PutAwayItem | null>(null);

  const rows = React.useMemo(() => (list ? listToRows(list.items) : []), [list]);

  const columns = React.useMemo<QRDetailColumn[]>(
    () => [
      { id: 'bin', header: 'Bin', cell: (row) => <BinCell row={row} /> },
      { id: 'status', header: 'Status', cell: (row) => <StatusCell row={row} /> },
      {
        id: 'actions',
        header: 'Actions',
        align: 'right',
        cell: (row) => <ActionsCell row={row} onComplete={setCompleteTarget} onSkip={setSkipTarget} />,
      },
    ],
    [],
  );

  // Drop any open item dialogs when a different list is loaded.
  React.useEffect(() => {
    setCompleteTarget(null);
    setSkipTarget(null);
  }, [listId]);

  return (
    <>
      <QRDetailDialog open={open}
        onOpenChange={onOpenChange}
        title={list ? `Put-Away — ${list.put_away_list_no}` : 'Loading...'}
        loading={loading}
        loadingMessage="Loading put-away details..."
        rows={rows}
        columns={columns}
        emptyMessage="No items"
        subtitle={error ? <p className="text-sm text-destructive">{error}</p> : undefined}
        summary={list ? <PutAwaySummary list={list} /> : undefined}/>

      {list && completeTarget && (
        <CompleteItemDialog open
          onOpenChange={(next) => {
            if (!next) setCompleteTarget(null);
          }}
          item={completeTarget}
          warehouseId={list.warehouse_id}
          onConfirm={completeItem}/>
      )}

      {skipTarget && (
        <SkipItemDialog open
          onOpenChange={(next) => {
            if (!next) setSkipTarget(null);
          }}
          item={skipTarget}
          onConfirm={skipItem}/>
      )}
    </>
  );
}
