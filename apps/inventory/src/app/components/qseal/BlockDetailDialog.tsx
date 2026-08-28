import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Download, Loader2, AlertCircle, CheckCircle2, RefreshCw, Layers } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';

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

function DownloadButton({ blockId, batch }: { blockId: string; batch: string }) {
  const { download, loading, error } = useBlockDownload();
  return (
    <div className="space-y-1">
      <Button variant="outline" size="sm" onClick={() => download(blockId, `qr_${batch}.xlsx`)} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Preparing…
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download Excel
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

function ParentBlockDownloadButton({ blockId, block }: { blockId: string; block: QRBlock }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
      <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Preparing…
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download Parent Excel
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
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
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
            Generating {block.quantity.toLocaleString()} QR codes…
          </div>
          {block.progress !== undefined && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{block.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${block.progress}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {block.status === 'completed' && (
        <div className="col-span-2 space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Generation complete
          </div>
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
      )}

      {block.status === 'failed' && <FailedBlockActions block={block} onRetry={onRetry} retrying={retrying} retryError={retryError} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Block items table                                                  */
/* ------------------------------------------------------------------ */

function BlockItemsTable({ blockId }: { blockId: string }) {
  const [items, setItems] = React.useState<ProductItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const PAGE_SIZE = 20;

  const fetchItems = React.useCallback(
    async (p: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await qrBlockService.getBlockItems(blockId, { page: p, page_size: PAGE_SIZE });
        setItems(res.items);
        setTotalItems(res.pagination.total_items);
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, 'Failed to load items'));
      } finally {
        setLoading(false);
      }
    },
    [blockId],
  );

  React.useEffect(() => {
    fetchItems(page);
  }, [fetchItems, page]);

  const columns: ColumnDef<ProductItem, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'serial_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Serial Number" />,
        cell: ({ row }) => <span className="font-mono text-sm">{row.original.serial_number}</span>,
      },
      {
        accessorKey: 'qr_active',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Active" />,
        cell: ({ row }) => (
          <Badge
            variant="secondary"
            className={
              row.original.qr_active
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
            }
          >
            {row.original.qr_active ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        accessorKey: 'scan_count',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Scans" />,
        cell: ({ row }) => <span className="font-medium">{row.original.scan_count}</span>,
      },
      {
        accessorKey: 'last_scanned_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last Scanned" />,
        cell: ({ row }) =>
          row.original.last_scanned_at ? (
            <span className="text-sm text-muted-foreground">{formatDate(row.original.last_scanned_at, 'DD-MMM-YY', { includeTime: true })}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'secret_code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Secret Code" />,
        cell: ({ row }) =>
          row.original.secret_code ? (
            <span className="font-mono text-sm">{row.original.secret_code}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
    ],
    [],
  );

  if (error) {
    return <p className="text-sm text-destructive p-4">{error}</p>;
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton columns={5} rows={5} showHeader />
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground p-4">No items generated yet.</p>;
  }

  return (
    <Card>
      <CardContent className="p-0">
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
  const [packSize, setPackSize] = React.useState<string>(
    block.master_pack_size ? String(block.master_pack_size) : '',
  );

  const handleAutoLink = async () => {
    const size = Number(packSize);
    if (!Number.isInteger(size) || size <= 0) {
      setError('Enter a valid master pack size (number of units per pack).');
      return;
    }
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
        <Button variant="outline" size="sm" onClick={handleAutoLink} disabled={linking}>
          {linking ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Layers className="h-4 w-4 mr-2" />}
          {linking ? 'Linking…' : block.master_pack_enabled ? 'Re-run Auto-link' : 'Auto-link (Cascade)'}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Input type="number" min={1} value={packSize} onChange={(e) => setPackSize(e.target.value)} placeholder="Pack size (units per parent)" className="h-8 max-w-[200px]" />
        <p className="text-xs text-muted-foreground">units per master pack</p>
      </div>
      {message && <p className="text-xs text-green-600">{message}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Block Details</DialogTitle>
        </DialogHeader>

        {loading && !block && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading block…
          </div>
        )}

        {block && (
          <div className="space-y-6">
            <BlockInfoPanel block={block} onRetry={onRetry ? retry : undefined} retrying={retrying} retryError={retryError} />

            {block.status === 'completed' && (
              <MasterPackAutoLink block={block} onLinked={refetch} />
            )}

            {block.status === 'completed' && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Generated Items ({block.quantity.toLocaleString()})</h3>
                <BlockItemsTable blockId={block.id} />
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
