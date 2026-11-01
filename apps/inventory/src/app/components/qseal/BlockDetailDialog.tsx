import * as React from 'react';
import { useState } from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Check, CheckCircle2, Copy, Download, Layers, Loader2, AlertCircle, RefreshCw, QrCode } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DetailDialog } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Switch } from '@horizon-sync/ui/components/ui/switch';

import { environment } from '../../../environments/environment';
import { useBlockDownload } from '../../features/qr-management/hooks/useBlockDownload';
import { useBlockStatus } from '../../features/qr-management/hooks/useBlockStatus';
import { qrBlockService } from '../../features/qr-management/services/qrBlockService';
import type { BlockStatus, ProductItem, QRBlock, QRType } from '../../features/qr-management/types/qrBlock.types';
import { getApiErrorMessage } from '../../features/qr-management/utils/apiError';
import { formatDate } from '../../utility/formatDate';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const QR_TYPE_LABELS: Record<QRType, string> = {
  dynamic: 'Dynamic',
  static: 'Static',
  dual: 'Dual',
  secure_code: 'SecureCode',
  one_time: 'OneTime',
  post_activation: 'Post-activation',
};

const STATUS_BADGE: Record<BlockStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  in_progress: { label: 'Generating…', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
};

const ACTIVATION_BADGE = {
  activated: {
    label: 'Activated',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  deactivated: {
    label: 'Deactivated',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  },
  partially_activated: {
    label: 'Partially Activated',
    className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  },
};

function serialRangeLabel(block: QRBlock): string | null {
  if (!block.starting_serial || !block.sr_number_type || !['S8DN', 'S10DN'].includes(block.sr_number_type)) return null;
  const width = block.sr_number_type === 'S8DN' ? 8 : 10;
  const start = Number(block.starting_serial);
  if (!Number.isSafeInteger(start)) return null;
  const end = start + block.quantity - 1;
  const prefix = block.serial_prefix ? `${block.serial_prefix}-` : '';
  return `${prefix}${String(start).padStart(width, '0')} → ${prefix}${String(end).padStart(width, '0')}`;
}

function ActivationSummary({ block }: { block: QRBlock }) {
  if (!block.activation_status) return null;
  const config = ACTIVATION_BADGE[block.activation_status];

  return (
    <div className="col-span-2">
      <p className="text-muted-foreground">QR Activation State</p>
      <div className="flex items-center gap-2 mt-1">
        <Badge variant="secondary" className={config.className}>
          {config.label}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {(block.activated_count ?? 0).toLocaleString()} activated · {(block.deactivated_count ?? 0).toLocaleString()} deactivated
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Download button — always fetches fresh signed URL                 */
/* ------------------------------------------------------------------ */

function DownloadButton({ blockId, batch, disabled }: { blockId: string; batch: string; disabled?: boolean }) {
  const { download, loading, error } = useBlockDownload();
  return (
    <div className="space-y-1">
      <Button variant="outline" size="sm" onClick={() => download(blockId, `qr_${batch}.xlsx`)} disabled={disabled}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Preparing…
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download IC Excel
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">A fresh, short-lived download link is generated each time.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Parent (Master Pack) download — calls new /qseal/blocks API      */
/* ------------------------------------------------------------------ */

function ParentBlockDownloadButton({ blockId, block, disabled }: { blockId: string; block: QRBlock; disabled?: boolean }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  // const [isDisabled, setIsDisabled] = useState<boolean>(false);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${environment.apiCoreUrl}/api/v1/qseal/blocks/${blockId}/parents/download`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { detail?: string }).detail || 'Failed to download parent labels');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parent_${block.batch}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button variant="outline" size="sm" onClick={handleDownload} disabled={disabled}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Preparing…
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download MC Excel
          </>
        )}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Block info panel                                                   */
/* ------------------------------------------------------------------ */

function FailedBlockActions({
  block,
  onRetry,
  retrying,
  retryError,
}: {
  block: QRBlock;
  onRetry?: (block: QRBlock) => void;
  retrying: boolean;
  retryError: string | null;
}) {
  return (
    <div className="col-span-2 space-y-2">
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        Generation failed. Reserved credits were returned.
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" disabled={retrying} onClick={() => onRetry(block)}>
          {retrying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          {retrying ? 'Queueing retry…' : 'Retry with same settings'}
        </Button>
      )}
      {retryError && <p className="text-xs text-destructive">{retryError}</p>}
    </div>
  );
}

function BlockInfoPanel({
  block,
  onRetry,
  retrying,
  retryError,
}: {
  block: QRBlock;
  onRetry?: (block: QRBlock) => void;
  retrying: boolean;
  retryError: string | null;
}) {
  const cfg = STATUS_BADGE[block.status];
  const generatedCount = Math.min(block.generated_count ?? 0, block.quantity);
  const progress = Math.min(100, Math.max(0, block.progress ?? (block.quantity ? (generatedCount / block.quantity) * 100 : 0)));
  const serialRange = serialRangeLabel(block);
  return (
    <div className="space-y-5 text-sm">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Generation summary</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-md border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Generated</p>
            <p className="mt-1 font-semibold">
              {generatedCount.toLocaleString()} / {block.quantity.toLocaleString()}
            </p>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Progress</p>
            <p className="mt-1 font-semibold">{Math.round(progress)}%</p>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">IC file</p>
            <p className="mt-1 font-semibold">{block.download_available ? 'Ready' : 'Not ready'}</p>
          </div>
          <div className="rounded-md border bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">MC files</p>
            <p className="mt-1 font-semibold">
              {block.master_pack_enabled ? `${(block.qseal_parent_count ?? 0).toLocaleString()} parents` : 'Not enabled'}
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Configuration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-muted-foreground">Batch</p>
            <p className="font-medium">{block.batch}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <Badge variant="secondary" className={cfg.className}>
              {cfg.label}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground">QR Type</p>
            <p className="font-medium font-mono">{block.qr_type ? `${block.qr_type} — ${QR_TYPE_LABELS[block.qr_type]}` : '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Quantity</p>
            <p className="font-medium">{block.quantity.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Serial format</p>
            <p className="font-medium">{block.sr_number_type || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Serial prefix</p>
            <p className="font-medium font-mono">{block.serial_prefix || '—'}</p>
          </div>
          {serialRange && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Serial range</p>
              <p className="font-medium font-mono">{serialRange}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Distribution Channel</p>
            <p className="font-medium">{block.distribution_channel || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Destination Market</p>
            <p className="font-medium">{block.destination_market || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">{formatDate(block.created_at, 'DD-MMM-YY', { includeTime: true })}</p>
          </div>
          {block.completed_at && (
            <div>
              <p className="text-muted-foreground">Completed</p>
              <p className="font-medium">{formatDate(block.completed_at, 'DD-MMM-YY', { includeTime: true })}</p>
            </div>
          )}
        </div>
      </div>

      <ActivationSummary block={block} />

      {block.status === 'pending' && (
        <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Waiting for an available QR generation worker…
        </div>
      )}

      {block.status === 'in_progress' && (
        <div className="col-span-2 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating QR codes · {generatedCount.toLocaleString()} of {block.quantity.toLocaleString()} complete
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div className="h-2 rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      )}

      {block.status === 'failed' && block.error_message && (
        <div className="col-span-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <p className="font-medium">Generation error</p>
          <p className="mt-1">{block.error_message}</p>
          {block.error_code && (
            <p className="mt-1 text-xs">
              Code: <span className="font-mono">{block.error_code}</span>
            </p>
          )}
        </div>
      )}

      {block.status === 'completed' && (
        <div className="col-span-2 space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Generation complete · {generatedCount.toLocaleString()} QR codes ready
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DownloadButton blockId={block.id} batch={block.batch} />

            {/* Parent (Master Pack) download — shown when cascade was enabled */}
            {block.master_pack_enabled && (
              <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Layers className="h-4 w-4" />
                  Master Pack Parent Block
                </div>
                <p className="text-xs text-muted-foreground">
                  {block.qseal_parent_count?.toLocaleString() ?? '—'} parent QR codes
                  {block.master_pack_size ? ` (${block.master_pack_size} items per pack)` : ''}
                </p>
                <ParentBlockDownloadButton blockId={block.id} block={block} />
              </div>
            )}
          </div>
        </div>
      )}

      {block.status === 'failed' && (
        <div className="col-span-2 space-y-2">
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            Generation failed. Reserved credits were returned.
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DownloadButton blockId={block.id} batch={block.batch} disabled={true} />

            {block.master_pack_enabled && (
              <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Layers className="h-4 w-4" />
                  Master Pack Parent Block
                </div>
                <p className="text-xs text-muted-foreground">
                  {block.qseal_parent_count?.toLocaleString() ?? '—'} parent QR codes
                  {block.master_pack_size ? ` (${block.master_pack_size} items per pack)` : ` (0 items per pack)`}
                </p>
                <ParentBlockDownloadButton blockId={block.id} block={block} disabled={true} />
              </div>
            )}
            {onRetry && (
              <Button variant="outline" size="sm" disabled={retrying} onClick={() => onRetry(block)}>
                {retrying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                {retrying ? 'Queueing retry…' : 'Retry with same settings'}
              </Button>
            )}
            {retryError && <p className="text-xs text-destructive">{retryError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Block items table                                                  */
/* ------------------------------------------------------------------ */

function SerialStatusToggle({ blockId, item, onUpdated }: { blockId: string; item: ProductItem; onUpdated: (item: ProductItem) => void }) {
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const updateStatus = async (active: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const updated = await qrBlockService.updateBlockItemStatus(blockId, item.id, active);
      onUpdated(updated);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Could not update serial status.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Switch
          checked={item.qr_active}
          disabled={saving}
          onCheckedChange={updateStatus}
          aria-label={`Set ${item.serial_number} ${item.qr_active ? 'inactive' : 'active'}`}
        />
        <Badge
          variant="secondary"
          className={
            item.qr_active
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
          }
        >
          {saving ? 'Saving…' : item.qr_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      {error && <p className="max-w-[180px] text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SerialCopyButton({ serialNumber }: { serialNumber: string }) {
  const [copied, setCopied] = React.useState(false);

  const copySerial = async () => {
    try {
      await navigator.clipboard.writeText(serialNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={copySerial}
      aria-label={`Copy serial number ${serialNumber}`}
      title={copied ? 'Copied' : 'Copy serial number'}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function BlockItemsTable({ blockId, onStatusChanged }: { blockId: string; onStatusChanged?: () => Promise<void> | void }) {
  const [items, setItems] = React.useState<ProductItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [activeFilter, setActiveFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = React.useState(false);
  const [bulkError, setBulkError] = React.useState<string | null>(null);
  const [bulkMessage, setBulkMessage] = React.useState<string | null>(null);
  const PAGE_SIZE = 20;

  const fetchItems = React.useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await qrBlockService.getBlockItems(blockId, {
          page: p,
          page_size: PAGE_SIZE,
          qr_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
        });
        setItems(res.items);
        setTotalItems(res.pagination.total_items);
        setSelectedIds(new Set());
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, 'Failed to load items'));
      } finally {
        setLoading(false);
      }
    },
    [activeFilter, blockId],
  );

  React.useEffect(() => {
    fetchItems(page);
  }, [fetchItems, page]);

  const handleStatusUpdated = React.useCallback(
    (updated: ProductItem) => {
      setItems((current) => current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      void onStatusChanged?.();
    },
    [onStatusChanged],
  );

  const allVisibleSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
  const someVisibleSelected = items.some((item) => selectedIds.has(item.id));
  const selectedItems = items.filter((item) => selectedIds.has(item.id));

  const toggleSelected = React.useCallback((itemId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }, []);

  const toggleAllVisible = React.useCallback(
    (checked: boolean) => {
      setSelectedIds((current) => {
        const next = new Set(current);
        items.forEach((item) => {
          if (checked) next.add(item.id);
          else next.delete(item.id);
        });
        return next;
      });
    },
    [items],
  );

  const handleBulkStatus = async (active: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    setBulkError(null);
    setBulkMessage(null);
    try {
      const result = await qrBlockService.updateBlockItemsStatus(blockId, Array.from(selectedIds), active);
      setBulkMessage(`${result.updated_count} serial${result.updated_count === 1 ? '' : 's'} ${active ? 'activated' : 'deactivated'}.`);
      await fetchItems(page);
      await onStatusChanged?.();
    } catch (err: unknown) {
      setBulkError(getApiErrorMessage(err, 'Could not update the selected serials.'));
    } finally {
      setBulkSaving(false);
    }
  };

  const columns: ColumnDef<ProductItem, unknown>[] = React.useMemo(
    () => [
      {
        id: 'select',
        header: () => (
          <Checkbox
            checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
            onCheckedChange={(checked) => toggleAllVisible(checked === true)}
            aria-label="Select all serials on this page"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={(checked) => toggleSelected(row.original.id, checked === true)}
            aria-label={`Select ${row.original.serial_number}`}
          />
        ),
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        accessorKey: 'serial_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Serial Number" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm">{row.original.serial_number}</span>
            <SerialCopyButton serialNumber={row.original.serial_number} />
          </div>
        ),
      },
      {
        accessorKey: 'qr_active',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <SerialStatusToggle blockId={blockId} item={row.original} onUpdated={handleStatusUpdated} />,
      },
    ],
    [allVisibleSelected, blockId, handleStatusUpdated, selectedIds, someVisibleSelected, toggleAllVisible, toggleSelected],
  );

  if (error) {
    return <p className="text-sm text-destructive p-4">{error}</p>;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton columns={3} rows={5} showHeader />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <div className="flex justify-end">
          <div className="w-full min-w-0 md:w-[180px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Filter by status</label>
            <Select
              value={activeFilter}
              onValueChange={(value) => {
                setActiveFilter(value as 'all' | 'active' | 'inactive');
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="inactive">Inactive only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {(selectedIds.size > 0 || bulkError || bulkMessage) && (
          <div className="space-y-2 rounded-md border bg-muted/20 p-3">
            {selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {selectedIds.size} serial{selectedIds.size === 1 ? '' : 's'} selected
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleBulkStatus(true)}
                    disabled={bulkSaving || selectedItems.every((item) => item.qr_active)}
                  >
                    {bulkSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Activate selected
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void handleBulkStatus(false)}
                    disabled={bulkSaving || selectedItems.every((item) => !item.qr_active)}
                  >
                    Deactivate selected
                  </Button>
                </div>
              </div>
            )}
            {bulkMessage && <p className="text-xs text-green-600">{bulkMessage}</p>}
            {bulkError && <p className="text-xs text-destructive">{bulkError}</p>}
          </div>
        )}
        {items.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            {activeFilter !== 'all' ? 'No serial numbers match this status filter.' : 'No items generated yet.'}
          </p>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            config={{
              showSerialNumber: true,
              showPagination: true,
              enableRowSelection: false,
              enableColumnVisibility: false,
              enableSorting: false,
              enableFiltering: false,
              initialPageSize: PAGE_SIZE,
              serverPagination: {
                totalItems,
                currentPage: page,
                pageSize: PAGE_SIZE,
                onPageChange: (p: number) => setPage(p),
              },
            }}
            fixedHeader
            maxHeight="300px"
          />
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Auto-link (automatic cascade / aggregation)                        */
/* ------------------------------------------------------------------ */

function MasterPackAutoLink({ block, onLinked }: { block: QRBlock; onLinked: () => Promise<void> | void }) {
  const [linking, setLinking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [packSize, setPackSize] = React.useState<string>(block.master_pack_size ? String(block.master_pack_size) : '');

  const requestAutoLink = () => {
    const size = Number(packSize);
    if (!Number.isInteger(size) || size <= 0) {
      setError('Enter a valid master pack size (number of units per pack).');
      return;
    }
    setError(null);
    setMessage(null);
    setConfirmOpen(true);
  };

  const performAutoLink = async () => {
    setConfirmOpen(false);
    const size = Number(packSize);
    setLinking(true);
    setError(null);
    setMessage(null);
    try {
      const result = await qrBlockService.autoLinkBlock(block.id, size);
      setMessage(result.message);
      await onLinked();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to auto-link block'));
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <Layers className="h-4 w-4" />
          Master Pack Aggregation
        </div>
        <Button variant="outline" size="sm" onClick={requestAutoLink} disabled={linking}>
          {linking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Layers className="h-4 w-4 mr-2" />}
          {linking ? 'Linking…' : block.master_pack_enabled ? 'Re-run Auto-link' : 'Auto-link (Cascade)'}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          value={packSize}
          onChange={(e) => setPackSize(e.target.value)}
          placeholder="Pack size (units per parent)"
          className="h-8 max-w-[200px]"
        />
        <p className="text-xs text-muted-foreground">units per master pack</p>
      </div>
      {message && <p className="text-xs text-green-600">{message}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Re-run master pack aggregation?"
        description={`This will remove this block's existing parent links and re-aggregate its units into packs of ${Number(packSize) || '—'} items each.`}
        confirmLabel="Aggregate"
        variant="destructive"
        loading={linking}
        onConfirm={performAutoLink}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dialog                                                        */
/* ------------------------------------------------------------------ */

export interface BlockDetailDialogProps {
  blockId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: (block: QRBlock) => Promise<void>;
}

export function BlockDetailDialog({ blockId, open, onOpenChange, onRetry }: BlockDetailDialogProps) {
  // Use polling hook so status updates live while dialog is open
  const { block, loading, refetch } = useBlockStatus(open ? blockId : null);
  const [retrying, setRetrying] = React.useState(false);
  const [retryError, setRetryError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRetryError(null);
    setRetrying(false);
  }, [blockId, open]);

  const retry = async (failedBlock: QRBlock) => {
    if (!onRetry) return;
    setRetrying(true);
    setRetryError(null);
    try {
      await onRetry(failedBlock);
    } catch (error: unknown) {
      setRetryError(getApiErrorMessage(error, 'Failed to retry QR Block'));
    } finally {
      setRetrying(false);
    }
  };

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      contentClassName="max-w-4xl flex flex-col"
      style={{ height: 'min(85vh, 820px)' }}
      title={'Block Details'}
      loading={loading}
      loadingMessage="Loading details..."
    >
      {/* <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Block Details</DialogTitle>
        </DialogHeader> */}

      {loading && !block && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading block…
        </div>
      )}

      {block && (
        <div className="space-y-6">
          <BlockInfoPanel block={block} onRetry={onRetry ? retry : undefined} retrying={retrying} retryError={retryError} />

          {block.status === 'completed' && <MasterPackAutoLink block={block} onLinked={refetch} />}

          {block.status === 'completed' && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Generated Items ({Math.min(block.generated_count ?? 0, block.quantity).toLocaleString()})</h3>
              <BlockItemsTable blockId={block.id} onStatusChanged={refetch} />
            </div>
          )}
        </div>
      )}
      {/* </DialogContent> */}
    </DetailDialog>
  );
}
