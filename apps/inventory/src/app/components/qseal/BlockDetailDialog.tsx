import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Download, Loader2, AlertCircle, CheckCircle2, RefreshCw, Layers } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';

import { environment } from '../../../environments/environment';
import { useBlockDownload } from '../../features/qr-management/hooks/useBlockDownload';
import { useBlockStatus } from '../../features/qr-management/hooks/useBlockStatus';
import { qrBlockService } from '../../features/qr-management/services/qrBlockService';
import type { BlockStatus, ProductItem, QRBlock, QRType } from '../../features/qr-management/types/qrBlock.types';
import { formatDate } from '../../utility/formatDate';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const QR_TYPE_LABELS: Record<QRType, string> = {
  D: 'Dynamic',
  S: 'Static',
  B: 'Dual',
  O: 'OneTime',
  SC: 'SecureCode',
};

const STATUS_BADGE: Record<BlockStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  in_progress: { label: 'Generating…', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
};

/* ------------------------------------------------------------------ */
/*  Download button — always fetches fresh signed URL                 */
/* ------------------------------------------------------------------ */

function DownloadButton({ blockId, batch }: { blockId: string; batch: string }) {
  const { download, loading, error } = useBlockDownload();
  return (
    <div className="space-y-1">
      <Button variant="outline" size="sm" onClick={() => download(blockId, `qr_${batch}.xlsx`)} disabled={loading}>
        {loading
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Preparing…</>
          : <><Download className="h-4 w-4 mr-2" />Download Excel</>}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Signed URL — valid for 60 min</p>
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
      const res = await fetch(
        `${environment.apiCoreUrl}/api/v1/qseal/blocks/${blockId}/parents/download`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

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
        {loading
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Preparing…</>
          : <><Download className="h-4 w-4 mr-2" />Download Parent Excel</>}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Block info panel                                                   */
/* ------------------------------------------------------------------ */

function BlockInfoPanel({ block, onRetry }: { block: QRBlock; onRetry?: (block: QRBlock) => void }) {
  const cfg = STATUS_BADGE[block.status];
  return (
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="text-muted-foreground">Batch</p>
        <p className="font-medium">{block.batch}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Status</p>
        <Badge variant="secondary" className={cfg.className}>{cfg.label}</Badge>
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
        <p className="text-muted-foreground">Created</p>
        <p className="font-medium">{formatDate(block.created_at, 'DD-MMM-YY', { includeTime: true })}</p>
      </div>
      {block.completed_at && (
        <div>
          <p className="text-muted-foreground">Completed</p>
          <p className="font-medium">{formatDate(block.completed_at, 'DD-MMM-YY', { includeTime: true })}</p>
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
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${block.progress}%` }}/>
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

      {block.status === 'failed' && (
        <div className="col-span-2 space-y-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Generation failed. Credits were not deducted.
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={() => onRetry(block)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry with same settings
            </Button>
          )}
        </div>
      )}
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

  const fetchItems = React.useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await qrBlockService.getBlockItems(blockId, { page: p, page_size: PAGE_SIZE });
      setItems(res.items);
      setTotalItems(res.pagination.total_items);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || 'Failed to load items');
    } finally {
      setLoading(false);
    }
  }, [blockId]);

  React.useEffect(() => { fetchItems(page); }, [fetchItems, page]);

  const columns: ColumnDef<ProductItem, unknown>[] = React.useMemo(() => [
    {
      accessorKey: 'serial_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Serial Number" />,
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.serial_number}</span>,
    },
    {
      accessorKey: 'qr_active',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Active" />,
      cell: ({ row }) => (
        <Badge variant="secondary"
className={row.original.qr_active
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}>
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
      cell: ({ row }) => row.original.last_scanned_at
        ? <span className="text-sm text-muted-foreground">{formatDate(row.original.last_scanned_at, 'DD-MMM-YY', { includeTime: true })}</span>
        : <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'secret_code',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Secret Code" />,
      cell: ({ row }) => row.original.secret_code
        ? <span className="font-mono text-sm">{row.original.secret_code}</span>
        : <span className="text-muted-foreground">—</span>,
    },
  ], []);

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
        <DataTable columns={columns}
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
          maxHeight="300px" />
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main dialog                                                        */
/* ------------------------------------------------------------------ */

export interface BlockDetailDialogProps {
  blockId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetry?: (block: QRBlock) => void;
}

export function BlockDetailDialog({ blockId, open, onOpenChange, onRetry }: BlockDetailDialogProps) {
  // Use polling hook so status updates live while dialog is open
  const { block, loading } = useBlockStatus(open ? blockId : null);

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
            <BlockInfoPanel block={block} onRetry={onRetry} />

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
