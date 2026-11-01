import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { QrCode, Download, Plus, RefreshCw, X, CheckCircle2, AlertCircle, Loader2, MoreHorizontal, Eye, Layers } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import { environment } from '../../../environments/environment';
import { useAllQRBlocks } from '../../features/qr-management/hooks/useAllQRBlocks';
import { useBlockDownload } from '../../features/qr-management/hooks/useBlockDownload';
import { useBlockStatus } from '../../features/qr-management/hooks/useBlockStatus';
import { qrBlockService } from '../../features/qr-management/services/qrBlockService';
import type { BlockStatus, QRBlock, QRBlockFilters as QRBlockFilterValues, QRType } from '../../features/qr-management/types/qrBlock.types';
import { formatDate } from '../../utility/formatDate';

import { BlockDetailDialog } from './BlockDetailDialog';
import { BlockFilters } from './BlockFilters';
import { CreateBlockDialog } from './CreateBlockDialog';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const QR_TYPE_LABELS: Record<QRType, string> = {
  dynamic: 'Dynamic',
  static: 'Static',
  dual: 'Dual',
  secure_code: 'Secure Code',
  one_time: 'One Time',
  post_activation: 'Post Activation',
};

const STATUS_BADGE: Record<BlockStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  in_progress: { label: 'Generating…', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
};

/**
 * Whether a block has master-pack (parent) QR codes to download.
 *
 * The blocks LIST payload does not reliably include `master_pack_enabled` (it is
 * only guaranteed on the block detail endpoint), so the MC QR action is hidden
 * only when the API explicitly reports that no master pack exists — otherwise
 * the button stays available for blocks we cannot classify.
 */
function hasMasterPackQr(block: QRBlock): boolean {
  if (block.master_pack_enabled) return true;
  if ((block.qseal_parent_count ?? 0) > 0) return true;
  return block.master_pack_enabled !== false;
}

/** Download menu for child (IC) and optional master-pack (MC) files. */
function BlockDownloadMenu({ block, hasParent }: { block: QRBlock; hasParent: boolean }) {
  const { download, loading, error } = useBlockDownload();
  const accessToken = useUserStore((s) => s.accessToken);
  const [parentLoading, setParentLoading] = React.useState(false);
  const [parentError, setParentError] = React.useState<string | null>(null);

  const downloadParent = async () => {
    setParentLoading(true);
    setParentError(null);
    try {
      const res = await fetch(`${environment.apiCoreUrl}/api/v1/qseal/blocks/${block.id}/parents/download`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        if (res.status === 404) {
          setParentError('No master-pack QR file is available for this block.');
          return;
        }
        const body = await res.json().catch(() => ({}));
        const detail = (body as { detail?: unknown }).detail;
        setParentError(typeof detail === 'string' ? detail : 'Master-pack download failed.');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `parent_${block.batch}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      setParentError('Master-pack download failed. Please try again.');
    } finally {
      setParentLoading(false);
    }
  };

  const downloadBoth = async () => {
    await download(block.id, `qr_${block.batch}.xlsx`);
    if (hasParent) await downloadParent();
  };

  return (
    <div className="space-y-1">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={loading || parentLoading}>
            {loading || parentLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {loading || parentLoading ? 'Preparing…' : 'Downloads'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={!block.download_available || loading} onClick={() => void download(block.id, `qr_${block.batch}.xlsx`)}>
            <Download className="mr-2 h-4 w-4" />
            Download IC file
            {!block.download_available && <span className="ml-2 text-xs text-muted-foreground">Not ready</span>}
          </DropdownMenuItem>
          {hasParent && (
            <DropdownMenuItem disabled={parentLoading} onClick={() => void downloadParent()}>
              <Layers className="mr-2 h-4 w-4" />
              Download MC file
            </DropdownMenuItem>
          )}
          {hasParent && (
            <DropdownMenuItem disabled={loading || parentLoading || !block.download_available} onClick={() => void downloadBoth()}>
              <Download className="mr-2 h-4 w-4" />
              Download IC + MC
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {parentError && <p className="text-xs text-destructive">{parentError}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Block status tracker (inline banner after creation)               */
/* ------------------------------------------------------------------ */

function formatElapsed(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function BlockGenerationProgress({ block }: { block: QRBlock }) {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!['pending', 'in_progress'].includes(block.status)) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [block.status]);

  if (!['pending', 'in_progress'].includes(block.status)) return null;

  const generated = Math.min(block.generated_count ?? 0, block.quantity);
  const progress = Math.min(100, Math.max(0, block.progress ?? (block.quantity ? (generated / block.quantity) * 100 : 0)));
  const createdAt = new Date(block.created_at).getTime();
  const elapsed = Number.isNaN(createdAt) ? 0 : Math.max(0, now - createdAt);
  const estimatedRemaining = progress > 0 && progress < 100 ? elapsed * ((100 - progress) / progress) : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {block.status === 'pending'
          ? `Queued for ${formatElapsed(elapsed)}`
          : `Generating QR codes · ${generated.toLocaleString()} of ${block.quantity.toLocaleString()} complete`}
      </div>
      {block.status === 'in_progress' && (
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-medium">{Math.round(progress)}%</span>
        </div>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Last updated: {formatDate(block.updated_at, 'DD-MMM-YY', { includeTime: true })}</span>
        {block.status === 'in_progress' && <span>Elapsed: {formatElapsed(elapsed)}</span>}
        {estimatedRemaining !== null ? (
          <span>Estimated remaining: ~{formatElapsed(estimatedRemaining)}</span>
        ) : block.status === 'in_progress' ? (
          <span>Estimate available after progress starts</span>
        ) : null}
      </div>
    </div>
  );
}

function BlockStatusTracker({
  blockId,
  onDone,
  onTerminal,
  onRetry,
}: {
  blockId: string;
  onDone: () => void;
  onTerminal: () => void;
  onRetry?: (block: QRBlock) => Promise<void>;
}) {
  const { block, loading } = useBlockStatus(blockId);
  const terminalNotified = React.useRef(false);
  const [retrying, setRetrying] = React.useState(false);
  const [retryError, setRetryError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!block || !['completed', 'failed'].includes(block.status) || terminalNotified.current) return;
    terminalNotified.current = true;
    onTerminal();
  }, [block, onTerminal]);

  if (loading && !block) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm rounded-md border p-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Waiting for block status…
      </div>
    );
  }

  if (!block) return null;

  const cfg = STATUS_BADGE[block.status];

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Block: {block.id.slice(0, 8)}…</span>
        <Badge variant="secondary" className={cfg.className}>
          {cfg.label}
        </Badge>
      </div>

      <BlockGenerationProgress block={block} />

      {block.status === 'completed' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Generation complete · {block.generated_count.toLocaleString()} QR codes ready
          </div>
          {block.download_available && <BlockDownloadMenu block={block} hasParent={Boolean(block.master_pack_enabled)} />}
        </div>
      )}

      {block.status === 'failed' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Generation failed. Reserved credits were returned.
          </div>
          {block.error_message && <p className="text-xs text-destructive">{block.error_message}</p>}
          {block.error_code && (
            <p className="text-xs text-muted-foreground">
              Error code: <span className="font-mono">{block.error_code}</span>
            </p>
          )}
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              disabled={retrying}
              onClick={async () => {
                setRetrying(true);
                setRetryError(null);
                try {
                  await onRetry(block);
                } catch (err) {
                  setRetryError(err instanceof Error ? err.message : 'Retry failed. Please try again.');
                } finally {
                  setRetrying(false);
                }
              }}
            >
              {retrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {retrying ? 'Queueing retry…' : 'Retry generation'}
            </Button>
          )}
          {retryError && <p className="text-xs text-destructive">{retryError}</p>}
        </div>
      )}

      {(block.status === 'completed' || block.status === 'failed') && (
        <Button variant="ghost" size="sm" onClick={onDone}>
          <X className="h-4 w-4 mr-1" />
          Dismiss
        </Button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Blocks table                                                       */
/* ------------------------------------------------------------------ */

interface BlocksTableProps {
  blocks: QRBlock[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onCreateBlock: () => void;
  onViewBlock: (block: QRBlock) => void;
  serverPagination?: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

function BlocksTable({ blocks, loading, error, hasActiveFilters, onCreateBlock, onViewBlock, serverPagination }: BlocksTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<QRBlock> | null>(null);

  const serverPaginationConfig = React.useMemo(() => {
    if (!serverPagination) return undefined;
    return {
      totalItems: serverPagination.totalItems,
      currentPage: serverPagination.currentPage,
      pageSize: serverPagination.pageSize,
      onPageChange: (page: number) => serverPagination.onPageChange(page),
    };
  }, [serverPagination]);

  const columns: ColumnDef<QRBlock, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'batch',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Batch" />,
        cell: ({ row }) => {
          const b = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{b.batch}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'product_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
        cell: ({ row }) => <span className="text-sm">{row.original.product_name || '—'}</span>,
      },
      {
        accessorKey: 'qr_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="QR Type" />,
        cell: ({ row }) => {
          const t = row.original.qr_type;
          if (!t) return <span className="text-muted-foreground">—</span>;
          return <span className="text-sm font-medium">{QR_TYPE_LABELS[t] ?? t}</span>;
        },
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Quantity" />,
        cell: ({ row }) => <span className="font-medium">{row.original.quantity.toLocaleString()}</span>,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const s = row.original.status;
          const cfg = STATUS_BADGE[s];
          return (
            <Badge variant="secondary" className={cfg.className}>
              {cfg.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.created_at, 'DD-MMM-YY')}</span>,
      },
      {
        id: 'download',
        header: () => <span>QR Files</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const b = row.original;
          if (b.status !== 'completed') return null;
          return <BlockDownloadMenu block={b} hasParent={hasMasterPackQr(b)} />;
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewBlock(row.original)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onViewBlock],
  );

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-destructive text-sm">{error}</CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton columns={6} rows={10} showHeader />
        </CardContent>
      </Card>
    );
  }

  if (blocks.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={<QrCode className="h-12 w-12" />}
            title={hasActiveFilters ? 'No Blocks match your filters' : 'No QR blocks found'}
            description={hasActiveFilters ? 'Change or reset the filters to see more Blocks.' : 'Generate a Block to create QR codes for a Product'}
            action={
              !hasActiveFilters ? (
                <Button onClick={onCreateBlock} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Block
                </Button>
              ) : undefined
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={blocks}
          config={{
            showSerialNumber: true,
            showPagination: true,
            enableRowSelection: false,
            enableColumnVisibility: true,
            enableSorting: true,
            enableFiltering: false,
            initialPageSize: serverPagination?.pageSize ?? 20,
            serverPagination: serverPaginationConfig,
          }}
          renderViewOptions={(table) => {
            if (table !== tableInstance) setTableInstance(table);
            return null;
          }}
          fixedHeader
          maxHeight="auto"
        />
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function BlocksManagement({ initialProductId }: { initialProductId?: string } = {}) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [trackedBlockId, setTrackedBlockId] = React.useState<string | null>(null);
  const [detailBlockId, setDetailBlockId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<QRBlockFilterValues>(() => (initialProductId ? { product_id: initialProductId } : {}));
  const { data, loading, error, refetch } = useAllQRBlocks({ page, filters });

  React.useEffect(() => {
    setFilters((current) => ({ ...current, product_id: initialProductId }));
    setPage(1);
  }, [initialProductId]);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setFilters((current) => ({
        ...current,
        search: search.trim() || undefined,
      }));
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const updateFilters = (nextFilters: QRBlockFilterValues) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setFilters({});
    setPage(1);
  };

  const blocks = data?.blocks ?? [];
  const pagination = data?.pagination;

  const serverPaginationConfig = pagination
    ? {
        totalItems: pagination.total_items,
        currentPage: pagination.page,
        pageSize: pagination.page_size,
        onPageChange: (p: number) => setPage(p),
      }
    : undefined;
  const hasActiveFilters = Boolean(search || Object.values(filters).some(Boolean));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">QR Blocks</h2>
          <p className="text-muted-foreground">Manage QR code generation batches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Block
          </Button>
        </div>
      </div>

      <BlockFilters filters={filters} search={search} onSearchChange={setSearch} onChange={updateFilters} onReset={resetFilters} />

      {trackedBlockId && (
        <BlockStatusTracker
          blockId={trackedBlockId}
          onTerminal={() => {
            refetch();
          }}
          onRetry={async (block) => {
            const retried = await qrBlockService.retryBlock(block.id);
            setTrackedBlockId(retried.id);
            await refetch();
          }}
          onDone={() => {
            setTrackedBlockId(null);
            refetch();
          }}
        />
      )}

      <BlocksTable
        blocks={blocks}
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        onCreateBlock={() => setCreateOpen(true)}
        onViewBlock={(b) => setDetailBlockId(b.id)}
        serverPagination={serverPaginationConfig}
      />

      <CreateBlockDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          setTrackedBlockId(id);
          refetch();
        }}
      />

      <BlockDetailDialog
        blockId={detailBlockId}
        open={!!detailBlockId}
        onOpenChange={(open) => {
          if (!open) setDetailBlockId(null);
        }}
        onRetry={async (block) => {
          const retried = await qrBlockService.retryBlock(block.id);
          setDetailBlockId(null);
          setTrackedBlockId(retried.id);
          await refetch();
        }}
      />
    </div>
  );
}
