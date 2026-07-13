import * as React from 'react';

import { Check, ChevronsUpDown, Loader2, Search } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Badge, Button } from '@horizon-sync/ui/components';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@horizon-sync/ui/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { cn } from '@horizon-sync/ui/lib/utils';

import { qrProductApi } from '../../api/qr-products';
import { useCreateBlock } from '../../features/qr-management/hooks/useCreateBlock';
import { useQRCredits } from '../../features/qr-management/hooks/useQRCredits';
import type { QRBlockCreate, QRType, SerialNumberType } from '../../features/qr-management/types/qrBlock.types';
import { notificationService } from '../../services/notificationService';
import type { QSealProductListItem } from '../../types/qseal.types';

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

/* ------------------------------------------------------------------ */
/*  Searchable product select                                          */
/* ------------------------------------------------------------------ */

interface ProductSelectProps {
  value: string;
  onChange: (id: string, name: string) => void;
}

function ProductSelect({ value, onChange }: ProductSelectProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [products, setProducts] = React.useState<QSealProductListItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedName, setSelectedName] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch products, debounced on search
  const fetchProducts = React.useCallback(async (q: string) => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await qrProductApi.list(accessToken, 1, 30, { search: q || undefined });
      setProducts(res.products);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    if (!open) { setSearch(''); return; }
    fetchProducts('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open, fetchProducts]);

  const handleSearch = (q: string) => {
    setSearch(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProducts(q), 300);
  };

  const handleSelect = (product: QSealProductListItem) => {
    onChange(product.id, product.name);
    setSelectedName(product.name);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="product-listbox"
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value ? selectedName || value : 'Search products…'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[340px]">
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input ref={inputRef}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or GTIN…"
            className="h-7 border-0 p-0 shadow-none focus-visible:ring-0" />
        </div>
        <div id="product-listbox" className="max-h-60 overflow-y-auto p-1">
          {loading && (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading…
            </div>
          )}
          {!loading && products.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No products found.</p>
          )}
          {!loading && products.map((p) => (
            <button
              key={p.id}
              type="button"
              className={cn(
                'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                value === p.id && 'bg-accent text-accent-foreground',
              )}
              onClick={() => handleSelect(p)}>
              <Check className={cn('mr-2 h-4 w-4 shrink-0', value === p.id ? 'opacity-100' : 'opacity-0')} />
              <div className="text-left">
                <p className="font-medium">{p.name}</p>
                {p.gtin && <p className="text-xs text-muted-foreground font-mono">{p.gtin}</p>}
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/*  Dialog                                                             */
/* ------------------------------------------------------------------ */

export interface CreateBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (blockId: string) => void;
}

export function CreateBlockDialog({ open, onOpenChange, onCreated }: CreateBlockDialogProps) {
  const { createBlock, loading, error } = useCreateBlock();
  const { credits, loading: creditsLoading, refetch: refetchCredits } = useQRCredits();
  const [productId, setProductId] = React.useState('');
  const [batch, setBatch] = React.useState('');
  const [quantity, setQuantity] = React.useState(100);
  const [qrType, setQrType] = React.useState<QRType>('D');
  const [srType, setSrType] = React.useState<SerialNumberType>('R6DAN');
  const [includeQrImage, setIncludeQrImage] = React.useState(true);

  const reset = () => {
    setProductId('');
    setBatch('');
    setQuantity(100);
    setQrType('D');
    setSrType('R6DAN');
    setIncludeQrImage(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check credits before submission
    if (credits !== null && credits < quantity) {
      notificationService.insufficientCredits(credits, quantity);
      return;
    }

    try {
      notificationService.blockGenerating();
      const block = await createBlock(productId, { 
        batch, 
        quantity, 
        qr_type: qrType, 
        sr_number_type: srType,
        qr_image: includeQrImage
      } satisfies QRBlockCreate);
      
      notificationService.blockCompleted(block.batch);
      reset();
      onOpenChange(false);
      onCreated(block.id);
      refetchCredits(); // Refresh credits after successful creation
    } catch (err: any) {
      // Handle specific error codes
      const status = err.response?.status;
      const detail = err.response?.data?.detail || '';

      if (status === 422 && detail.includes('Insufficient credits')) {
        // Parse available/required from error message if possible
        const match = detail.match(/available=(\d+), required=(\d+)/);
        if (match) {
          notificationService.insufficientCredits(parseInt(match[1]), parseInt(match[2]));
        } else {
          notificationService.insufficientCredits(credits || 0, quantity);
        }
      } else if (status === 409) {
        notificationService.conflictError();
      } else {
        // Generic error already shown by hook
      }
    }
  };

  // Determine if user has enough credits
  const hasEnoughCredits = credits === null || credits >= quantity;
  const showCreditWarning = credits !== null && credits < 500;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Generate QR Block</span>
            {!creditsLoading && credits !== null && (
              <Badge 
                variant={showCreditWarning ? 'destructive' : 'secondary'}
                className="ml-2"
              >
                {credits.toLocaleString()} credits
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Product *</Label>
            <ProductSelect value={productId} onChange={(id) => setProductId(id)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="batch">Batch Name *</Label>
            <Input id="batch" value={batch} onChange={(e) => setBatch(e.target.value)} maxLength={50} placeholder="e.g. Batch-Jan-2025" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Quantity * (1–10,000)</Label>
            <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1} max={10000} required />
            {!hasEnoughCredits && (
              <p className="text-xs text-destructive">
                Insufficient credits. You need {quantity.toLocaleString()} but only have {credits?.toLocaleString() || 0}.
              </p>
            )}
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
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="includeQrImage"
              checked={includeQrImage}
              onChange={(e) => setIncludeQrImage(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="includeQrImage" className="text-sm font-normal cursor-pointer">
              Include QR code images in Excel
            </Label>
          </div>
          {includeQrImage && (
            <p className="text-xs text-muted-foreground">
              ⚠️ Including QR images will increase generation time and file size
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !batch.trim() || !productId || !hasEnoughCredits}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting…</> : 'Generate'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
