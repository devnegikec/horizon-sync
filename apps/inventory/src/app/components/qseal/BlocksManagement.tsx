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
import { useBlockStatus } from '../../features/qr-management/hooks/useBlockStatus';
import type { BlockStatus, QRBlock, QRType } from '../../features/qr-management/types/qrBlock.types';
import { formatDate } from '../../utility/formatDate';

import { BlockDetailDialog } from './BlockDetailDialog';
import { CreateBlockDialog } from './CreateBlockDialog';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const QR_TYPE_LABELS: Record<QRType, string> = {
  D: 'Dynamic — unique URL per item',
  S: 'Static — same serial for all items',
  B: 'Dual — covert + overt QR per item',
  O: 'OneTime — deactivates after first scan',
  SC: 'SecureCode — 12-char secret per item',
};

const STATUS_BADGE: Record<BlockStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  in_progress: { label: 'Generating…', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
};

/* ------------------------------------------------------------------ */
/*  Parent (Master Pack) download helper                              */
/* ------------------------------------------------------------------ */

function ParentBlockDownloadLink({ block }: { block: QRBlock }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = React.useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${environment.apiCoreUrl}/api/v1/qseal/blocks/${block.id}/parents/download`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
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
        {loading
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Preparing…</>
          : <><Download className="h-4 w-4 mr-2" />Download Parent Block</>}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Block status tracker (inline banner after creation)               */
/* ------------------------------------------------------------------ */

function BlockStatusTracker({ blockId, onDone }: { blockId: string; onDone: () => void }) {
  const { block, loading } = useBlockStatus(blockId);

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
        <Badge variant="secondary" className={cfg.className}>{cfg.label}</Badge>
      </div>

      {block.status === 'in_progress' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Generating {block.quantity.toLocaleString()} QR codes…
        </div>
      )}

      {block.status === 'completed' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            Generation complete
          </div>
          {block.download_url && (
            <Button variant="outline" size="sm" asChild>
              <a href={block.download_url} target="_blank" rel="noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download QR Codes
              </a>
            </Button>
          )}

          {/* Parent (Master Pack) download */}
          {block.master_pack_enabled && (
            <ParentBlockDownloadLink block={block} />
          )}
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
  onCreateBlock: () => void;
  onViewBlock: (block: QRBlock) => void;
  serverPagination?: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

function BlocksTable({ blocks, loading, error, onCreateBlock, onViewBlock, serverPagination }: BlocksTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<QRBlock> | null>(null);

  const serverPaginationConfig = React.useMemo(() => {
    if (!serverPagination) return undefined;
    return {
      totalItems: serverPagination.totalItems,
      currentPage: serverPagination.currentPage,
      pageSize: serverPagination.pageSize,
      onPageChange: (page: number, _pageSize: number) => serverPagination.onPageChange(page),
    };
  }, [serverPagination]);

  const columns: ColumnDef<QRBlock, unknown>[] = React.useMemo(() => [
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
      cell: ({ row }) => (
        <span className="font-medium">{row.original.quantity.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const s = row.original.status;
        const cfg = STATUS_BADGE[s];
        return (
          <Badge variant="secondary" className={cfg.className}>{cfg.label}</Badge>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.created_at, 'DD-MMM-YY')}
        </span>
      ),
    },
    {
      id: 'download',
      header: () => <span className="sr-only">Download</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const b = row.original;
        if (b.status !== 'completed' || !b.download_url) return null;
        return (
          <Button variant="outline" size="sm" asChild>
            <a href={b.download_url} target="_blank" rel="noreferrer">
              <Download className="h-4 w-4 mr-2" />
              Download
            </a>
          </Button>
        );
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
  ], [onViewBlock]);

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
            title="No QR blocks found"
            description="Generate a block to create QR codes for a product"
            action={
              <Button onClick={onCreateBlock} className="gap-2">
                <Plus className="h-4 w-4" />
                New Block
              </Button>
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
  const { data, loading, error, refetch } = useAllQRBlocks();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [trackedBlockId, setTrackedBlockId] = React.useState<string | null>(null);
  const [detailBlockId, setDetailBlockId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);

  const blocks = data?.blocks ?? [];
  const pagination = data?.pagination;

  const serverPaginationConfig = pagination ? {
    totalItems: pagination.total_items,
    currentPage: pagination.page,
    pageSize: pagination.page_size,
    onPageChange: (p: number) => { setPage(p); refetch(p); },
  } : undefined;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">QR Blocks</h2>
          <p className="text-muted-foreground">Manage QR code generation batches</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch(page)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Block
          </Button>
        </div>
      </div>

      {trackedBlockId && (
        <BlockStatusTracker blockId={trackedBlockId} onDone={() => { setTrackedBlockId(null); refetch(page); }} />
      )}

      <BlocksTable blocks={blocks}
        loading={loading}
        error={error}
        onCreateBlock={() => setCreateOpen(true)}
        onViewBlock={(b) => setDetailBlockId(b.id)}
        serverPagination={serverPaginationConfig}/>

      <CreateBlockDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => { setTrackedBlockId(id); refetch(page); }} />

      <BlockDetailDialog blockId={detailBlockId}
        open={!!detailBlockId}
        onOpenChange={(open) => { if (!open) setDetailBlockId(null); }}
        onRetry={() => { setDetailBlockId(null); setCreateOpen(true); }} />
    </div>
  );
}
