import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { QrCode, Download, Plus, RefreshCw, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import { useAllQRBlocks } from '../../features/qr-management/hooks/useAllQRBlocks';
import { useBlockStatus } from '../../features/qr-management/hooks/useBlockStatus';
import { useCreateBlock } from '../../features/qr-management/hooks/useCreateBlock';
import type { BlockStatus, QRBlock, QRBlockCreate, QRType, SerialNumberType } from '../../features/qr-management/types/qrBlock.types';
import { formatDate } from '../../utility/formatDate';

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

const SR_TYPE_LABELS: Record<SerialNumberType, string> = {
  R6DAN: 'R6DAN — 6-char random alphanumeric',
  R4DAN: 'R4DAN — 4-char random alphanumeric',
  S8DN: 'S8DN — 8-digit sequential',
  S10DN: 'S10DN — 10-digit sequential',
};

const STATUS_BADGE: Record<BlockStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
  in_progress: { label: 'Generating…', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
};

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
/*  Create block dialog                                                */
/* ------------------------------------------------------------------ */

interface CreateBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (blockId: string) => void;
}

function CreateBlockDialog({ open, onOpenChange, onCreated }: CreateBlockDialogProps) {
  const { createBlock, loading, error } = useCreateBlock();
  const [productId, setProductId] = React.useState('');
  const [batch, setBatch] = React.useState('');
  const [quantity, setQuantity] = React.useState(100);
  const [qrType, setQrType] = React.useState<QRType>('D');
  const [srType, setSrType] = React.useState<SerialNumberType>('R6DAN');

  const reset = () => { setProductId(''); setBatch(''); setQuantity(100); setQrType('D'); setSrType('R6DAN'); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const block = await createBlock(productId, { batch, quantity, qr_type: qrType, sr_number_type: srType } satisfies QRBlockCreate);
      reset();
      onOpenChange(false);
      onCreated(block.id);
    } catch { /* error shown inline */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate QR Block</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="productId">Product ID *</Label>
            <Input id="productId" value={productId} onChange={(e) => setProductId(e.target.value)} placeholder="e.g. prod-uuid" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="batch">Batch Name *</Label>
            <Input id="batch" value={batch} onChange={(e) => setBatch(e.target.value)} maxLength={50} placeholder="e.g. Batch-Jan-2025" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity * (1–10,000)</Label>
            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1} max={10000} required />
          </div>
          <div className="space-y-1.5">
            <Label>QR Type</Label>
            <Select value={qrType} onValueChange={(v) => setQrType(v as QRType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(QR_TYPE_LABELS) as QRType[]).map((t) => (
                  <SelectItem key={t} value={t}>{t} — {QR_TYPE_LABELS[t].split(' — ')[1]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Serial Number Type</Label>
            <Select value={srType} onValueChange={(v) => setSrType(v as SerialNumberType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SR_TYPE_LABELS) as SerialNumberType[]).map((t) => (
                  <SelectItem key={t} value={t}>{SR_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !batch.trim() || !productId.trim()}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</> : 'Generate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  serverPagination?: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

function BlocksTable({ blocks, loading, error, onCreateBlock, serverPagination }: BlocksTableProps) {
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
  ], []);

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
        serverPagination={serverPaginationConfig}/>

      <CreateBlockDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => { setTrackedBlockId(id); refetch(page); }} />
    </div>
  );
}
