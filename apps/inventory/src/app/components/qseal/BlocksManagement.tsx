import * as React from 'react';

import { QrCode, Download, Plus, RefreshCw, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import { useBlockStatus } from '../../features/qr-management/hooks/useBlockStatus';
import { useCreateBlock } from '../../features/qr-management/hooks/useCreateBlock';
import { useQRBlocks } from '../../features/qr-management/hooks/useQRBlocks';
import type { BlockStatus, QRBlockCreate, QRType, SerialNumberType } from '../../features/qr-management/types/qrBlock.types';

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

const STATUS_BADGE: Record<BlockStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pending', variant: 'outline' },
  in_progress: { label: 'Generating…', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

/* ------------------------------------------------------------------ */
/*  Block status tracker                                               */
/* ------------------------------------------------------------------ */

function BlockStatusCompleted({ downloadUrl }: { downloadUrl: string | null }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        Generation complete
      </div>
      {downloadUrl && (
        <Button variant="outline" size="sm" asChild>
          <a href={downloadUrl} target="_blank" rel="noreferrer">
            <Download className="h-4 w-4 mr-2" />
            Download QR Codes
          </a>
        </Button>
      )}
    </div>
  );
}

function BlockStatusTracker({ blockId, onDone }: { blockId: string; onDone: () => void }) {
  const { block, loading } = useBlockStatus(blockId);

  if (loading && !block) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Waiting for block status…
      </div>
    );
  }

  if (!block) return null;

  const statusCfg = STATUS_BADGE[block.status] ?? { label: block.status, variant: 'outline' as const };

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Block: {block.id.slice(0, 8)}…</span>
        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
      </div>

      {block.status === 'in_progress' && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Generating {block.quantity.toLocaleString()} QR codes…
        </div>
      )}

      {block.status === 'completed' && <BlockStatusCompleted downloadUrl={block.download_url} />}

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
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (blockId: string) => void;
}

function CreateBlockDialog({ productId, open, onOpenChange, onCreated }: CreateBlockDialogProps) {
  const { createBlock, loading, error } = useCreateBlock();
  const [batch, setBatch] = React.useState('');
  const [quantity, setQuantity] = React.useState(100);
  const [qrType, setQrType] = React.useState<QRType>('D');
  const [srType, setSrType] = React.useState<SerialNumberType>('R6DAN');

  const reset = () => { setBatch(''); setQuantity(100); setQrType('D'); setSrType('R6DAN'); };

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
            <Button type="submit" disabled={loading || !batch.trim()}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</> : 'Generate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

interface BlocksManagementProps {
  productId?: string;
}

export function BlocksManagement({ productId = 'prod-001' }: BlocksManagementProps) {
  const { data, loading, error, refetch } = useQRBlocks(productId);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [trackedBlockId, setTrackedBlockId] = React.useState<string | null>(null);

  const blocks = data?.blocks ?? [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">QR Blocks</h2>
          <p className="text-muted-foreground">Manage QR code generation batches per product</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
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
        <BlockStatusTracker blockId={trackedBlockId} onDone={() => { setTrackedBlockId(null); refetch(); }} />
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive text-sm">{error}</CardContent>
        </Card>
      )}

      {loading && blocks.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-4 bg-muted rounded w-3/4" /></CardHeader>
              <CardContent><div className="h-20 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : blocks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <QrCode className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No blocks yet</p>
            <p className="text-muted-foreground mb-4">Create a block to generate QR codes for this product</p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Block
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block) => {
            const statusCfg = STATUS_BADGE[block.status] ?? { label: block.status, variant: 'outline' as const };
            return (
              <Card key={block.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{block.batch}</CardTitle>
                  <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">QR Type</span>
                    <span className="font-medium font-mono">{block.qr_type ?? '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-medium">{block.quantity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{new Date(block.created_at).toLocaleDateString()}</span>
                  </div>
                  {block.download_url && block.status === 'completed' && (
                    <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                      <a href={block.download_url} target="_blank" rel="noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        Download QR Codes
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <CreateBlockDialog productId={productId} open={createOpen} onOpenChange={setCreateOpen} onCreated={(id) => { setTrackedBlockId(id); refetch(); }} />
    </div>
  );
}
