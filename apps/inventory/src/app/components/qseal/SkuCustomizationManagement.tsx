import * as React from 'react';

import { Palette, RefreshCw, Save } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

interface QrDesign {
  logo_url: string | null;
  foreground_color: string;
  background_color: string;
}

interface Product {
  id: string;
  name: string;
  qr_design: QrDesign;
}

interface ProductsResponse {
  items?: Product[];
}

export function SkuCustomizationManagement() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState<string | null>(null);
  const [designs, setDesigns] = React.useState<Record<string, QrDesign>>({});

  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/products', {
        headers: { Authorization: 'Bearer mock-token', 'X-Tenant-ID': 'tenant-001' },
      });
      const data = await res.json() as ProductsResponse;
      const fetched: Product[] = data.items ?? [];
      setProducts(fetched);
      const initial: Record<string, QrDesign> = {};
      fetched.forEach((p) => { initial[p.id] = { ...p.qr_design }; });
      setDesigns(initial);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleChange = (productId: string, field: keyof QrDesign, value: string) => {
    setDesigns((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: value },
    }));
  };

  const handleSave = async (productId: string) => {
    setSaving(productId);
    try {
      await fetch(`/api/v1/products/${productId}`, {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer mock-token',
          'X-Tenant-ID': 'tenant-001',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_design: designs[productId] }),
      });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">SKU QR Customization</h2>
          <p className="text-muted-foreground">Customize QR code appearance per product — logo, colors</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-4 bg-muted rounded w-1/2" /></CardHeader>
              <CardContent><div className="h-40 bg-muted rounded" /></CardContent>
            </Card>
          ))}
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Palette className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No products found</p>
            <p className="text-muted-foreground">Create products first to customize their QR appearance</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {products.map((product) => {
            const design = designs[product.id];
            if (!design) return null;
            return (
              <Card key={product.id}>
                <CardHeader>
                  <CardTitle className="text-base">{product.name}</CardTitle>
                  <CardDescription>QR code visual settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-6 items-center">
                    <div className="w-20 h-20 rounded border flex items-center justify-center shrink-0" style={{ backgroundColor: design.background_color }}>
                      <svg viewBox="0 0 24 24" width="48" height="48" fill={design.foreground_color}>
                        <path d="M3 3h7v7H3V3zm1 1v5h5V4H4zm1 1h3v3H5V5zM14 3h7v7h-7V3zm1 1v5h5V4h-5zm1 1h3v3h-3V5zM3 14h7v7H3v-7zm1 1v5h5v-5H4zm1 1h3v3H5v-3zM14 14h2v2h-2v-2zm3 0h2v2h-2v-2zm-3 3h2v2h-2v-2zm3 0h2v2h-2v-2z" />
                      </svg>
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Foreground</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color" value={design.foreground_color} onChange={(e) => handleChange(product.id, 'foreground_color', e.target.value)} className="h-8 w-8 rounded cursor-pointer border" />
                            <Input value={design.foreground_color} onChange={(e) => handleChange(product.id, 'foreground_color', e.target.value)} className="h-8 text-xs font-mono" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Background</Label>
                          <div className="flex gap-2 items-center">
                            <input type="color" value={design.background_color} onChange={(e) => handleChange(product.id, 'background_color', e.target.value)} className="h-8 w-8 rounded cursor-pointer border" />
                            <Input value={design.background_color} onChange={(e) => handleChange(product.id, 'background_color', e.target.value)} className="h-8 text-xs font-mono" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Logo URL (optional)</Label>
                        <Input value={design.logo_url ?? ''} onChange={(e) => handleChange(product.id, 'logo_url', e.target.value)} placeholder="https://..." className="h-8 text-xs" />
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="w-full" onClick={() => handleSave(product.id)} disabled={saving === product.id}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving === product.id ? 'Saving...' : 'Save Design'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
