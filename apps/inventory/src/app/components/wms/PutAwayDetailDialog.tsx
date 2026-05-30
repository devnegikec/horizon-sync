import * as React from 'react';

import { Loader2, CheckCircle2, SkipForward, Search, MapPin, PackageOpen } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { useToast } from '@horizon-sync/ui/hooks';

import { usePutAwayList } from '../../hooks/useWMS';
import type { PutAwayItem, PutAwayList, WarehouseLocation } from '../../types/wms.types';
import { layoutApi } from '../../utility/api/wms';
import { DetailDialogContainer } from '../common';

import { WMSStatusBadge } from './WMSStatusBadge';

// ─── Complete Item Dialog (bin position selection) ───────────────────────────

interface CompleteItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PutAwayItem;
  warehouseId: string;
  onConfirm: (itemId: string, binId: string) => Promise<void>;
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
            <label className="text-xs font-medium text-muted-foreground">Search Bin Location</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-10"
                placeholder="Type to search bins..."
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}/>
            </div>

            {searching && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {!searching && results.length > 0 && (
              <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                {results.map((loc) => (
                  <button key={loc.id}
                    type="button"
                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-muted transition-colors ${
                      selectedBin?.id === loc.id ? 'bg-accent text-accent-foreground' : ''
                    }`}
                    onClick={() => setSelectedBin(loc)}>
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="font-mono font-medium">{loc.code}</span>
                      {loc.full_path && (
                        <span className="text-xs text-muted-foreground ml-2 truncate">{loc.full_path}</span>
                      )}
                    </div>
                    {loc.available_capacity > 0 && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        Cap: {loc.available_capacity}/{loc.total_capacity}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {!searching && query.length >= 1 && results.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">No bins found matching "{query}"</p>
            )}
          </div>

          {selectedBin && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm">
              <span className="font-medium text-green-700">Selected: </span>
              <span className="text-green-600 font-mono">{selectedBin.code}</span>
              {selectedBin.full_path && (
                <span className="text-green-500 text-xs ml-1">({selectedBin.full_path})</span>
              )}
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

// ─── Item row with Complete / Skip actions ───────────────────────────────────

interface ItemRowProps {
  item: PutAwayItem;
  warehouseId: string;
  onComplete: (itemId: string, binId?: string) => Promise<PutAwayItem>;
  onSkip: (itemId: string, reason: string) => Promise<PutAwayItem>;
}

function PutAwayItemRow({ item, warehouseId, onComplete, onSkip }: ItemRowProps) {
  const [skipping, setSkipping] = React.useState(false);
  const [skipReason, setSkipReason] = React.useState('');
  const [completeDialogOpen, setCompleteDialogOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const { toast } = useToast();

  const handleCompleteConfirm = async (itemId: string, binId: string) => {
    setBusy(true);
    try {
      await onComplete(itemId, binId);
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = async () => {
    if (!skipReason.trim()) return;
    setBusy(true);
    try {
      await onSkip(item.id, skipReason);
      toast({ title: 'Item skipped', description: item.sku });
      setSkipping(false);
      setSkipReason('');
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const isDone = item.status === 'completed' || item.status === 'skipped';

  return (
    <>
      <tr className={isDone ? 'opacity-50' : 'hover:bg-muted/20'}>
        <td className="px-4 py-2 font-mono font-medium">{item.sku}</td>
        <td className="px-4 py-2 text-muted-foreground text-xs">{item.batch_number ?? '—'}</td>
        <td className="px-4 py-2 text-right">{item.quantity}</td>
        <td className="px-4 py-2 font-mono text-xs">{item.suggested_bin_code ?? '—'}</td>
        <td className="px-4 py-2">
          <WMSStatusBadge status={item.status} />
        </td>
        <td className="px-4 py-2 text-right">
          {!isDone && (
            <div className="flex items-center justify-end gap-1">
              <Button size="sm"
                variant="outline"
                className="text-green-600 border-green-200 hover:bg-green-50 gap-1 h-7 px-2 text-xs"
                disabled={busy}
                onClick={() => setCompleteDialogOpen(true)}>
                <CheckCircle2 className="h-3 w-3" />
                Complete
              </Button>
              <Button size="sm"
                variant="outline"
                className="text-muted-foreground gap-1 h-7 px-2 text-xs"
                disabled={busy}
                onClick={() => setSkipping((s) => !s)}>
                <SkipForward className="h-3 w-3" />
                Skip
              </Button>
            </div>
          )}
        </td>
      </tr>
      {skipping && (
        <tr>
          <td colSpan={6} className="px-4 py-2 bg-muted/30">
            <div className="flex items-center gap-2">
              <Input className="flex-1 h-8 text-sm"
                placeholder="Skip reason..."
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}/>
              <Button size="sm" variant="destructive" className="h-8" disabled={!skipReason.trim() || busy} onClick={handleSkip}>
                Confirm Skip
              </Button>
              <Button size="sm" variant="ghost" className="h-8" onClick={() => { setSkipping(false); setSkipReason(''); }}>
                Cancel
              </Button>
            </div>
          </td>
        </tr>
      )}

      <CompleteItemDialog open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        item={item}
        warehouseId={warehouseId}
        onConfirm={handleCompleteConfirm}/>
    </>
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

  return (
    <DetailDialogContainer open={open}
      onOpenChange={onOpenChange}
      icon={PackageOpen}
      title={list ? list.put_away_list_no : 'Loading...'}
      status={list?.status ?? 'pending'}
      statusBadge={list ? <WMSStatusBadge status={list.status} /> : undefined}
      contentClassName="w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] overflow-y-auto">
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && <div className="text-sm text-destructive py-4">{error}</div>}

      {!loading && !error && list && (
        <div className="flex flex-col gap-4">
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <WMSStatusBadge status={list.status} />
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Total Items</p>
              <p className="font-semibold text-lg">{list.total_items}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground mb-1">Assigned To</p>
              <p className="font-medium text-sm">{list.assigned_to ?? '—'}</p>
            </div>
          </div>

          {list.reference_type && (
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Reference: </span>
              {list.reference_type} — {list.reference_id ?? '—'}
            </div>
          )}

          {list.remarks && (
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Remarks: </span>{list.remarks}
            </div>
          )}

          {/* Items table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Line Items ({list.items.length})
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">SKU</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Batch</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Qty</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Suggested Bin</th>
                  <th className="text-left px-4 py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-muted-foreground text-xs">No items</td>
                  </tr>
                )}
                {list.items.map((item) => (
                  <PutAwayItemRow key={item.id}
                    item={item}
                    warehouseId={list.warehouse_id}
                    onComplete={completeItem}
                    onSkip={skipItem}/>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Created: {list.created_at ? new Date(list.created_at).toLocaleString() : '—'}
          </p>
        </div>
      )}
    </DetailDialogContainer>
  );
}
