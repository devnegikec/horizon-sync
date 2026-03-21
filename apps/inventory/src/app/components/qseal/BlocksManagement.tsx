import * as React from 'react';

import { QrCode, Download, Plus, RefreshCw } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

const QR_TYPE_LABELS: Record<string, string> = {
  dynamic: 'Dynamic',
  secure_qr_runtime: 'Secure QR Runtime',
  static_qr: 'Static QR',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  completed: 'default',
  processing: 'secondary',
  failed: 'destructive',
};

interface Block {
  id: string;
  product_id: string;
  qr_type: string;
  quantity: number;
  credits_used: number;
  status: string;
  generated_at: string | null;
  download_url: string | null;
  qr_items_count: number;
}

export function BlocksManagement() {
  const [blocks, setBlocks] = React.useState<Block[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchBlocks = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/products/prod-001/blocks', {
        headers: { Authorization: 'Bearer mock-token', 'X-Tenant-ID': 'tenant-001' },
      });
      if (!res.ok) throw new Error('Failed to fetch blocks');
      const data = await res.json() as { items?: Block[] };
      setBlocks(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blocks');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">QR Blocks</h2>
          <p className="text-muted-foreground">Manage QR code generation batches per product</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchBlocks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Block
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading ? (
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
            <p className="text-muted-foreground mb-4">Create a block to generate QR codes for a product</p>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />New Block</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block) => (
            <Card key={block.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{QR_TYPE_LABELS[block.qr_type] ?? block.qr_type}</CardTitle>
                <Badge variant={STATUS_VARIANTS[block.status] ?? 'outline'}>{block.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">{block.quantity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Credits Used</span>
                  <span className="font-medium">{block.credits_used.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Generated</span>
                  <span className="font-medium">
                    {block.generated_at ? new Date(block.generated_at).toLocaleDateString() : '—'}
                  </span>
                </div>
                {block.download_url && (
                  <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                    <a href={block.download_url} target="_blank" rel="noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Codes
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
