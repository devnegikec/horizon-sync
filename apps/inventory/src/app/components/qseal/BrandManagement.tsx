import * as React from 'react';

import { KeyRound, Plus, RefreshCw, Loader2 } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@horizon-sync/ui/components/ui/table';

import { useBrands } from '../../features/qr-management/hooks/useBrands';
import { useCreateBrand } from '../../features/qr-management/hooks/useCreateBrand';

/* ------------------------------------------------------------------ */
/*  Create brand dialog                                                */
/* ------------------------------------------------------------------ */

interface CreateBrandDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}

function CreateBrandDialog({ open, onOpenChange, onCreated }: CreateBrandDialogProps) {
  const { createBrand, loading, error } = useCreateBrand();
  const [name, setName] = React.useState('');
  const [shortCode, setShortCode] = React.useState('');

  const reset = () => { setName(''); setShortCode(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBrand({ name, short_code: shortCode });
      reset();
      onOpenChange(false);
      onCreated();
    } catch { /* error shown inline */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Brand</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="brand-name">Brand Name *</Label>
            <Input id="brand-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={256} placeholder="e.g. Acme Corp" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="short-code">Short Code *</Label>
            <Input id="short-code" value={shortCode} onChange={(e) => setShortCode(e.target.value)} maxLength={256} placeholder="e.g. acme" required />
            <p className="text-xs text-muted-foreground">Used in QR URLs: https://{'{short_code}'}.domain/…</p>
          </div>
          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
            <KeyRound className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            An ECDSA P-256 key pair will be auto-generated and securely stored.
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !name.trim() || !shortCode.trim()}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Creating…</> : 'Create Brand'}
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

export function BrandManagement() {
  const { data, loading, error, refetch } = useBrands();
  const [createOpen, setCreateOpen] = React.useState(false);

  const brands = data?.brands ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Brands & Signing Keys
          </h3>
          <p className="text-sm text-muted-foreground">
            Each brand has an auto-generated ECDSA P-256 key pair used to digitally sign QR codes.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Brand
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {loading && brands.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading brands…
            </div>
          ) : brands.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <KeyRound className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium">No brands yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create a brand to generate ECDSA signing keys for QR codes</p>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Brand
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Short Code</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">{brand.short_code}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(brand.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateBrandDialog open={createOpen} onOpenChange={setCreateOpen} onCreated={refetch} />
    </div>
  );
}
