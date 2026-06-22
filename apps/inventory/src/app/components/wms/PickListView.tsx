import * as React from 'react';

import { RefreshCw, ScanLine, CheckCircle2, X } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import { usePickList, usePickLists } from '../../hooks/useWMS';
import type { PickList } from '../../types/wms.types';
import { WMSStatusBadge } from './WMSStatusBadge';

// ============================================
// PICK LIST DETAIL
// ============================================

interface PickListDetailProps {
  pickListId: string;
  onBack: () => void;
}

function PickListDetail({ pickListId, onBack }: PickListDetailProps) {
  const { toast } = useToast();
  const { pickList, loading, error, recordScan, complete, cancel } = usePickList(pickListId);
  const [qrInput, setQrInput] = React.useState('');
  const [scanError, setScanError] = React.useState<string | null>(null);
  const [scanning, setScanning] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleScan = async () => {
    if (!qrInput.trim()) return;
    setScanError(null);
    setScanning(true);
    try {
      const result = await recordScan(qrInput.trim());
      setQrInput('');
      toast({ title: 'Item scanned', description: `${result.sku} — ${result.scanned_qty} units` });
      inputRef.current?.focus();
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Mark this pick list as complete?')) return;
    try {
      await complete();
      toast({ title: 'Pick list completed' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel this pick list? This will release reserved stock.')) return;
    try {
      await cancel();
      toast({ title: 'Pick list cancelled' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  if (loading && !pickList) return <div className="text-sm text-muted-foreground animate-pulse p-4">Loading...</div>;
  if (error) return <div className="text-sm text-destructive p-4">{error}</div>;
  if (!pickList) return null;

  const { progress } = pickList;
  const canComplete = pickList.status === 'in_progress' && progress?.remaining_items === 0;
  const canScan = pickList.status === 'draft' || pickList.status === 'in_progress';
  const canCancel = pickList.status !== 'completed' && pickList.status !== 'cancelled';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-lg">{pickList.pick_list_no}</h3>
            <WMSStatusBadge status={pickList.status} />
          </div>
          {pickList.invoice_reference && (
            <p className="text-sm text-muted-foreground">Invoice: {pickList.invoice_reference}</p>
          )}
        </div>
        <div className="flex gap-2">
          {canComplete && (
            <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={handleComplete}>
              <CheckCircle2 className="h-4 w-4" />
              Mark Complete
            </Button>
          )}
          {canCancel && (
            <Button size="sm" variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={handleCancel}>
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {progress && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{progress.picked_items} of {progress.total_items} items picked</span>
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

      {/* Items table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">#</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Item</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Bin</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Required</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Picked</th>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pickList.items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-muted/20">
                <td className="px-4 py-2.5 text-muted-foreground">{item.sort_order || idx + 1}</td>
                <td className="px-4 py-2.5 text-xs">{item.item_name || item.sku || item.item_id}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{item.bin_location_path || item.bin_location_id || '—'}</td>
                <td className="px-4 py-2.5 text-right">{item.qty}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{item.picked_qty}</td>
                <td className="px-4 py-2.5">
                  {item.picked_qty >= item.qty ? (
                    <span className="text-green-600 text-xs font-medium">✓ Done</span>
                  ) : item.picked_qty > 0 ? (
                    <span className="text-blue-600 text-xs font-medium">Partial</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Pending</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// PICK LIST LIST
// ============================================

interface PickListViewProps {
  warehouseId?: string;
}

export function PickListView({ warehouseId }: PickListViewProps) {
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  const { data, loading, error, refetch } = usePickLists({
    status: statusFilter === 'all' ? undefined : statusFilter,
    warehouse_id: warehouseId,
    page,
    page_size: 20,
  });

  if (selectedId) {
    return <PickListDetail pickListId={selectedId} onBack={() => setSelectedId(null)} />;
  }

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
        <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground animate-pulse">Loading pick lists...</div>}
      {error && <div className="text-sm text-destructive">{error}</div>}

      {!loading && data && (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Pick List #</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice Ref</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Progress</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.pick_lists.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No pick lists found</td>
                  </tr>
                )}
                {data.pick_lists.map((pl) => (
                  <tr key={pl.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium">{pl.pick_list_no}</td>
                    <td className="px-4 py-3 text-muted-foreground">{pl.invoice_reference ?? '—'}</td>
                    <td className="px-4 py-3"><WMSStatusBadge status={pl.status} /></td>
                    <td className="px-4 py-3 text-right">
                      {pl.progress ? (
                        <span className="text-sm">{pl.progress.completion_percentage}%</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {pl.created_at ? new Date(pl.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(pl.id)}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.pagination.total_pages > 1 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Page {data.pagination.page} of {data.pagination.total_pages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={!data.pagination.has_prev} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={!data.pagination.has_next} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
