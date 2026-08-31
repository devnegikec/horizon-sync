import * as React from 'react';

import { Check, ChevronsUpDown, Loader2, Layers, Search } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Badge, Button, DetailDialog } from '@horizon-sync/ui/components';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@horizon-sync/ui/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { cn } from '@horizon-sync/ui/lib/utils';

import { batchApi } from '../../api/batches';
import { qrProductApi } from '../../api/qr-products';
import { useCreateBlock } from '../../features/qr-management/hooks/useCreateBlock';
import { useQRCredits } from '../../features/qr-management/hooks/useQRCredits';
import type { QRBlockCreate, QRBlockFilterType, SerialNumberType } from '../../features/qr-management/types/qrBlock.types';
import { getApiErrorMessage } from '../../features/qr-management/utils/apiError';
import { useQRProductSettings } from '../../hooks/useQRProductSettings';
import { notificationService } from '../../services/notificationService';
import type { BatchListItem } from '../../types/batch.types';
import type { QSealProductListItem } from '../../types/qseal.types';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const QR_TYPE_LABELS: Record<QRBlockFilterType, string> = {
  dynamic: 'Dynamic — unique URL per item',
  dual: 'Dual — covert + overt QR per item',
  one_time: 'One Time — deactivates after first scan',
  secure_code: 'Secure — 12-char secret per item',
};

const SR_TYPE_LABELS: Record<SerialNumberType, string> = {
  R8DAN: 'Random-8 Digit Alpha Numeric',
  R6DAN: 'R6DAN — 6-char random alphanumeric',
  R4DAN: 'R4DAN — 4-char random alphanumeric',
  S8DN: 'S8DN — 8-digit sequential',
  S10DN: 'S10DN — 10-digit sequential',
};

function normalizeSerialNumberType(value: string | null): SerialNumberType | null {
  if (!value) return null;
  const normalized = value.toUpperCase();
  const legacyTypes: Record<string, SerialNumberType> = {
    RANDOM_8_ALPHA_NUMERIC: 'R8DAN',
    RANDOM_6_ALPHA_NUMERIC: 'R6DAN',
    RANDOM_4_ALPHA_NUMERIC: 'R4DAN',
    SEQUENTIAL: 'S8DN',
    SEQUENTIAL_8_DIGIT: 'S8DN',
    SEQUENTIAL_10_DIGIT: 'S10DN',
  };
  const canonical = legacyTypes[normalized] ?? normalized;
  return canonical in SR_TYPE_LABELS ? (canonical as SerialNumberType) : null;
}

function isExpiredDate(value: string | null): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

function getBatchError(batch: BatchListItem | null, product: QSealProductListItem | null): string | null {
  if (!batch) return null;
  if (product?.item_id && batch.item_id && product.item_id !== batch.item_id) {
    return `This batch belongs to a different item${batch.item_name ? ` (${batch.item_name})` : ''}. Select the batch matching this product.`;
  }
  if (batch.status === 'expired' || isExpiredDate(batch.expiry_date)) {
    return 'This batch has expired. Select an active batch.';
  }
  if (batch.status === 'consumed') return 'This batch has already been consumed. Select an active batch.';
  return null;
}

/* ------------------------------------------------------------------ */
/*  Searchable product select                                          */
/* ------------------------------------------------------------------ */

interface ProductSelectProps {
  value: string;
  onChange: (product: QSealProductListItem) => void;
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
  const fetchProducts = React.useCallback(
    async (q: string) => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const res = await qrProductApi.list(accessToken, 1, 30, {
          search: q || undefined,
          is_active: true,
        });
        // Keep this guard even though the API is filtered, so stale or malformed
        // responses can never expose an inactive product for block generation.
        setProducts(res.products.filter((product) => product.is_active));
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  React.useEffect(() => {
    if (!open) {
      setSearch('');
      return;
    }
    fetchProducts('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open, fetchProducts]);

  const handleSearch = (q: string) => {
    setSearch(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProducts(q), 300);
  };

  const handleSelect = (product: QSealProductListItem) => {
    onChange(product);
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
          <span className={cn('truncate min-w-0', !value && 'text-muted-foreground')}>{value ? selectedName || value : 'Search products…'}</span>
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
            className="h-7 border-0 p-0 shadow-none focus-visible:ring-0"/>
        </div>
        <div id="product-listbox" className="max-h-60 overflow-y-auto p-1">
          {loading && (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading…
            </div>
          )}
          {!loading && products.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No products found.</p>}
          {!loading &&
            products.map((p) => (
              <button key={p.id}
                type="button"
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  value === p.id && 'bg-accent text-accent-foreground',
                )}
                onClick={() => handleSelect(p)}>
                <Check className={cn('mr-2 h-4 w-4 shrink-0', value === p.id ? 'opacity-100' : 'opacity-0')} />
                <div className="min-w-0 text-left">
                  <p className="font-medium break-words">{p.name}</p>
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
/*  Searchable batch select                                            */
/* ------------------------------------------------------------------ */

interface BatchSelectProps {
  value: string;
  onChange: (batch: BatchListItem) => void;
}

function BatchSelect({ value, onChange }: BatchSelectProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [batches, setBatches] = React.useState<BatchListItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedLabel, setSelectedLabel] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBatches = React.useCallback(
    async (q: string) => {
      if (!accessToken) return;
      setLoading(true);
      try {
        const res = await batchApi.list(accessToken, 1, 50, { search: q || undefined });
        setBatches(res.batches ?? []);
      } catch {
        setBatches([]);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  React.useEffect(() => {
    if (!open) {
      setSearch('');
      return;
    }
    fetchBatches('');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open, fetchBatches]);

  const handleSearch = (q: string) => {
    setSearch(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchBatches(q), 300);
  };

  const handleSelect = (batch: BatchListItem) => {
    onChange(batch);
    setSelectedLabel(batch.batch_no);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="batch-listbox"
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
          <span className={cn('truncate min-w-0', !value && 'text-muted-foreground')}>{value ? selectedLabel || value : 'Search batches…'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[340px]">
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input ref={inputRef}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by batch number…"
            className="h-7 border-0 p-0 shadow-none focus-visible:ring-0"/>
        </div>
        <div id="batch-listbox" className="max-h-60 overflow-y-auto p-1">
          {loading && (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading…
            </div>
          )}
          {!loading && batches.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No batches found.</p>}
          {!loading &&
            batches.map((batch) => (
              <button key={batch.id}
                type="button"
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  value === batch.batch_no && 'bg-accent text-accent-foreground',
                )}
                onClick={() => handleSelect(batch)}>
                <Check className={cn('mr-2 h-4 w-4 shrink-0', value === batch.batch_no ? 'opacity-100' : 'opacity-0')} />
                <div className="min-w-0 text-left">
                  <p className="font-medium break-words">{batch.batch_no}</p>
                  {(batch.item_name || batch.status || batch.expiry_date) && (
                    <p className="text-xs text-muted-foreground">
                      {[batch.item_name, batch.status, batch.expiry_date ? `expiry ${batch.expiry_date.slice(0, 10)}` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
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

// The dialog coordinates Product configuration, credits, settings, and QR-type fields.
// eslint-disable-next-line complexity
export function CreateBlockDialog({ open, onOpenChange, onCreated }: CreateBlockDialogProps) {
  const { createBlock, loading, error } = useCreateBlock();
  const { credits, loading: creditsLoading, error: creditsError, refetch: refetchCredits } = useQRCredits();
  const { settings: channels, loading: channelsLoading, error: channelsError } = useQRProductSettings('channel');
  const { settings: destinations, loading: destinationsLoading, error: destinationsError } = useQRProductSettings('destination');
  const [productId, setProductId] = React.useState('');
  const [selectedProduct, setSelectedProduct] = React.useState<QSealProductListItem | null>(null);
  const [batch, setBatch] = React.useState('');
  const [selectedBatch, setSelectedBatch] = React.useState<BatchListItem | null>(null);
  const [quantity, setQuantity] = React.useState(100);
  const [qrType, setQrType] = React.useState<QRBlockFilterType>('dynamic');
  const [channelSettingId, setChannelSettingId] = React.useState('');
  const [destinationSettingId, setDestinationSettingId] = React.useState('');
  const [startingSerial, setStartingSerial] = React.useState('');
  const [includeQrImage, setIncludeQrImage] = React.useState(true);
  const [masterPackEnabled, setMasterPackEnabled] = React.useState(false);
  const [masterPackSize, setMasterPackSize] = React.useState(10);

  const reset = () => {
    setProductId('');
    setSelectedProduct(null);
    setBatch('');
    setSelectedBatch(null);
    setQuantity(100);
    setQrType('dynamic');
    setChannelSettingId('');
    setDestinationSettingId('');
    setStartingSerial('');
    setIncludeQrImage(true);
    setMasterPackEnabled(false);
    setMasterPackSize(10);
  };

  // Submission maps credit and backend conflict errors to Product-facing notifications.
  // eslint-disable-next-line complexity
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
        channel_setting_id: channelSettingId || undefined,
        destination_setting_id: destinationSettingId || undefined,
        qr_type: qrType,
        starting_serial: srType === 'S8DN' || srType === 'S10DN' ? startingSerial : undefined,
        sr_number_type: srType ?? undefined,
        qr_image: includeQrImage,
        ...(masterPackEnabled && masterPackSize > 0
          ? {
              master_pack_enabled: true,
              master_pack_size: masterPackSize,
            }
          : {}),
      } satisfies QRBlockCreate);

      notificationService.blockCompleted(block.batch);
      reset();
      onOpenChange(false);
      onCreated(block.id);
      refetchCredits(); // Refresh credits after successful creation
    } catch (err: unknown) {
      // Handle specific error codes
      const status = (err as { response?: { status?: number } }).response?.status;
      const detail = getApiErrorMessage(err, '');

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

  // Master pack calculations
  const masterPackParentCount = masterPackEnabled && masterPackSize > 0 ? Math.ceil(quantity / masterPackSize) : 0;

  // Determine if user has enough credits
  const hasEnoughCredits = credits === null || credits >= quantity;
  const showCreditWarning = credits !== null && credits < 500;
  const srType = normalizeSerialNumberType(selectedProduct?.sr_number_type ?? null);
  const serialPrefix = selectedProduct?.serial_prefix?.trim() ?? '';
  const isSequential = srType === 'S8DN' || srType === 'S10DN';
  const serialConfigurationReady = Boolean(srType && serialPrefix);
  const batchError = getBatchError(selectedBatch, selectedProduct);

  return (
    <DetailDialog open={open}
      onOpenChange={onOpenChange}
      title={
        <div className="flex items-center justify-between">
          <span>Generate QR Block</span>
          {!creditsLoading && credits !== null && (
            <Badge variant={showCreditWarning ? 'destructive' : 'secondary'} className="ml-2">
              {credits.toLocaleString()} credits
            </Badge>
          )}
        </div>
      }
      contentClassName="sm:max-w-md max-h-[90vh] flex flex-col"
      showCloseButton={false}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit"
            form="qseal-block-form"
            disabled={
              loading ||
              !batch.trim() ||
              !productId ||
              !serialConfigurationReady ||
              !hasEnoughCredits ||
              creditsLoading ||
              Boolean(creditsError) ||
              Boolean(batchError)
            }>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting…
              </>
            ) : (
              'Generate'
            )}
          </Button>
        </div>
      }>
      <form id="qseal-block-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Product *</Label>
          <ProductSelect value={productId}
            onChange={(product) => {
              setProductId(product.id);
              setSelectedProduct(product);
              setStartingSerial('');
            }}/>
        </div>
        {selectedProduct && (
          <>
            <div className="grid grid-cols-2 gap-4 rounded-md border bg-muted/30 p-3">
              <div className="space-y-1">
                <Label>Serial Prefix</Label>
                <p className="text-sm font-medium">{serialPrefix || 'Not configured'}</p>
              </div>
              <div className="space-y-1">
                <Label>Sr. Number</Label>
                <p className="text-sm font-medium">{srType ? SR_TYPE_LABELS[srType] : 'Not configured'}</p>
              </div>
            </div>
            {!serialConfigurationReady && (
              <p className="text-xs text-destructive">
                Edit this product and configure its Serial Prefix and Serial Number Type before generating a block.
              </p>
            )}
          </>
        )}
        <div className="space-y-1.5">
          <Label>Batch *</Label>
          <BatchSelect value={batch}
            onChange={(selected) => {
              setBatch(selected.batch_no);
              setSelectedBatch(selected);
            }}/>
          {batchError && <p className="text-xs text-destructive">{batchError}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Distribution Channel</Label>
            <Select value={channelSettingId || 'none'}
              onValueChange={(value) => setChannelSettingId(value === 'none' ? '' : value)}
              disabled={channelsLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {channels
                  .filter((setting) => setting.is_active)
                  .map((setting) => (
                    <SelectItem key={setting.id} value={setting.id}>
                      {setting.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Destination Market</Label>
            <Select value={destinationSettingId || 'none'}
              onValueChange={(value) => setDestinationSettingId(value === 'none' ? '' : value)}
              disabled={destinationsLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {destinations
                  .filter((setting) => setting.is_active)
                  .map((setting) => (
                    <SelectItem key={setting.id} value={setting.id}>
                      {setting.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        {(channelsError || destinationsError) && <p className="text-xs text-destructive">{channelsError || destinationsError}</p>}
        <div className="space-y-1.5">
          <Label htmlFor="quantity">Quantity * (1–5,000)</Label>
          <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1} max={5000} required />
          {!hasEnoughCredits && (
            <p className="text-xs text-destructive">
              Insufficient credits. You need {quantity.toLocaleString()} but only have {credits?.toLocaleString() || 0}.
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>QR Type</Label>
          <Select value={qrType} onValueChange={(v) => setQrType(v as QRBlockFilterType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(QR_TYPE_LABELS) as QRBlockFilterType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {QR_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {isSequential && (
          <div className="space-y-1.5">
            <Label htmlFor="startingSerial">Starting Serial *</Label>
            <Input id="startingSerial"
              value={startingSerial}
              onChange={(e) => setStartingSerial(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]+"
              maxLength={srType === 'S8DN' ? 8 : 10}
              placeholder={srType === 'S8DN' ? 'Up to 8 digits' : 'Up to 10 digits'}
              required/>
          </div>
        )}
        <div className="flex items-center space-x-2">
          <input type="checkbox"
            id="includeQrImage"
            checked={includeQrImage}
            onChange={(e) => setIncludeQrImage(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
          <Label htmlFor="includeQrImage" className="text-sm font-normal cursor-pointer">
            Include QR code images in Excel
          </Label>
        </div>
        {includeQrImage && (
          <p className="text-xs text-muted-foreground">
            <span role="img" aria-label="Warning">
              ⚠️
            </span>{' '}
            Including QR images will increase generation time and file size
          </p>
        )}

        {/* Master Pack (Cascade) */}
        <div className="border rounded-lg p-3 space-y-3">
          <div className="flex items-center space-x-2">
            <input type="checkbox"
              id="masterPackEnabled"
              checked={masterPackEnabled}
              onChange={(e) => setMasterPackEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
            <Label htmlFor="masterPackEnabled" className="text-sm font-medium cursor-pointer flex items-center gap-1.5">
              <Layers className="h-4 w-4" />
              Enable Master Pack (Cascade)
            </Label>
          </div>
          {masterPackEnabled && (
            <div className="pl-6 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="masterPackSize">Items per Master Pack</Label>
                <Input id="masterPackSize"
                  type="number"
                  value={masterPackSize}
                  onChange={(e) => setMasterPackSize(Math.max(1, Number(e.target.value)))}
                  min={1}
                  max={quantity}
                  required/>
                <p className="text-xs text-muted-foreground">Number of child QR codes grouped under each parent master pack</p>
              </div>
              {masterPackSize > 0 && masterPackParentCount > 0 && (
                <div className="bg-muted/50 rounded-md p-3 text-sm">
                  <p className="font-medium">Master Pack Summary</p>
                  <ul className="mt-1 space-y-0.5 text-muted-foreground">
                    <li>• {quantity.toLocaleString()} child QR codes</li>
                    <li>
                      • {masterPackParentCount.toLocaleString()} parent master pack QR codes ({quantity} ÷ {masterPackSize})
                    </li>
                    <li>• Parents will be cascaded (linked) to their children</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {creditsError && <p className="text-sm text-destructive">{creditsError}</p>}
      </form>
    </DetailDialog>
  );
}
