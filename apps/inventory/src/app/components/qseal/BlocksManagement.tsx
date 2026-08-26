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
  dynamic: 'Dynamic — unique URL per item',
  static: 'Static — one shared batch QR',
  dual: 'Dual — covert + overt QR per item',
  secure_code: 'SecureCode — 12-char secret per item',
  one_time: 'OneTime — deactivates after first scan',
  post_activation: 'Post-activation — activated after production',
};

const STATUS_BADGE: Record<BlockStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  in_progress: { label: 'Generating…', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
};

function BlockDownloadButton({ block }: { block: QRBlock }) {
  const { download, loading, error } = useBlockDownload();

  return (
    <div className="space-y-1">
      <Button variant="outline" size="sm" disabled={loading} onClick={() => download(block.id, `qr_${block.batch}.xlsx`)}>
        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
        {loading ? 'Preparing…' : 'Download'}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Parent (Master Pack) download helper                              */
/* ------------------------------------------------------------------ */

function ParentBlockDownloadLink({ block }: { block: QRBlock }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = React.useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${environment.apiCoreUrl}/api/v1/qseal/blocks/${block.id}/parents/download`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch parent labels');

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
      // Silently fail — the main download is the child block
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1 pt-1 border-t">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Layers className="h-3.5 w-3.5" />
        Master Pack{block.qseal_parent_count ? ` (${block.qseal_parent_count})` : ''}
      </div>
      <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Preparing…
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download Parent Block
          </>
        )}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Block status tracker (inline banner after creation)               */
/* ------------------------------------------------------------------ */

function BlockGenerationProgress({ block }: { block: QRBlock }) {
  if (block.status === 'pending') {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Waiting for an available QR generation worker…
      </div>
    );
  }
  if (block.status !== 'in_progress') return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Generating {block.quantity.toLocaleString()} QR codes…
      </div>
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${block.progress}%` }} />
        </div>
        <span className="text-xs font-medium">{block.progress}%</span>
      </div>
    </div>
  );
}

function BlockStatusTracker({ blockId, onDone, onTerminal }: { blockId: string; onDone: () => void; onTerminal: () => void }) {
  const { block, loading } = useBlockStatus(blockId);
  const terminalNotified = React.useRef(false);

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
            Generation complete
          </div>
          {block.download_available && <BlockDownloadButton block={block} />}

          {/* Parent (Master Pack) download */}
          {block.master_pack_enabled && <ParentBlockDownloadLink block={block} />}
        </div>
      )}

      {block.status === 'failed' && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Generation failed. Credits were not deducted.
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
                <p className="text-xs text-muted-foreground font-mono">{b.id.slice(0, 8)}…</p>
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
          return (
            <div>
              <span className="font-mono font-medium text-sm">{t}</span>
              <p className="text-xs text-muted-foreground">{QR_TYPE_LABELS[t]?.split(' — ')[1]}</p>
            </div>
          );
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
        header: () => <span className="sr-only">Download</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const b = row.original;
          if (b.status !== 'completed' || !b.download_available) return null;
          return <BlockDownloadButton block={b} />;
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
          <EmptyState icon={<QrCode className="h-12 w-12" />}
            title={hasActiveFilters ? 'No Blocks match your filters' : 'No QR blocks found'}
            description={hasActiveFilters ? 'Change or reset the filters to see more Blocks.' : 'Generate a Block to create QR codes for a Product'}
            action={
              !hasActiveFilters ? (
                <Button onClick={onCreateBlock} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Block
                </Button>
              ) : undefined
            }/>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable columns={columns}
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
          maxHeight="auto"/>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function BlocksManagement() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [trackedBlockId, setTrackedBlockId] = React.useState<string | null>(null);
  const [detailBlockId, setDetailBlockId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [filters, setFilters] = React.useState<QRBlockFilterValues>({});
  const { data, loading, error, refetch } = useAllQRBlocks({ page, filters });

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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        <BlockStatusTracker blockId={trackedBlockId}
          onTerminal={() => {
            refetch();
          }}
          onDone={() => {
            setTrackedBlockId(null);
            refetch();
          }}/>
      )}

      <BlocksTable blocks={blocks}
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        onCreateBlock={() => setCreateOpen(true)}
        onViewBlock={(b) => setDetailBlockId(b.id)}
        serverPagination={serverPaginationConfig}/>

      <CreateBlockDialog open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          setTrackedBlockId(id);
          refetch();
        }}/>

      <BlockDetailDialog blockId={detailBlockId}
        open={!!detailBlockId}
        onOpenChange={(open) => {
          if (!open) setDetailBlockId(null);
        }}
        onRetry={async (block) => {
          const retried = await qrBlockService.retryBlock(block.id);
          setDetailBlockId(null);
          setTrackedBlockId(retried.id);
          await refetch();
        }}/>
    </div>
  );
}
