import * as React from 'react';

import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronsUpDown, Loader2, Layers, Search } from 'lucide-react';

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
import { qrBlockService } from '../../features/qr-management/services/qrBlockService';
import type { QRBlockCreate, QRBlockFilterType, SerialNumberType } from '../../features/qr-management/types/qrBlock.types';
import { getApiErrorMessage } from '../../features/qr-management/utils/apiError';
import { useQRProductSettings } from '../../hooks/useQRProductSettings';
import { notificationService } from '../../services/notificationService';
import type { BatchListItem } from '../../types/batch.types';
import type { QSealProductListItem } from '../../types/qseal.types';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';

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

const SEQUENTIAL_WIDTHS: Record<'S8DN' | 'S10DN', number> = {
  S8DN: 8,
  S10DN: 10,
};

const CREATION_STEPS = [
  { number: 1, label: 'Block basics' },
  { number: 2, label: 'QR configuration' },
  { number: 3, label: 'Files & packing' },
  { number: 4, label: 'Review & save' },
] as const;

type SerialCollisionState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available'; checkedCount: number }
  | { status: 'conflict'; collisions: string[]; collisionCount: number }
  | { status: 'error'; message: string };

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

/** Normalize an optional string key for case-insensitive comparison. */
function normalizeKey(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();
  return trimmed || null;
}

/** True when the batch's product does not match the selected QR product. */
function batchProductMismatch(batch: BatchListItem, product: QSealProductListItem | null): boolean {
  if (!product) return false;

  const batchItemId = normalizeKey(batch.item_id);
  const productItemId = normalizeKey(product.item_id);
  if (batchItemId && productItemId) return batchItemId !== productItemId;

  const productSku = normalizeKey(product.sku);
  const batchSku = normalizeKey(batch.sku);
  if (productSku && batchSku) return productSku !== batchSku;

  const productName = normalizeKey(product.name);
  const batchName = normalizeKey(batch.product_name ?? batch.item_name);
  if (productName && batchName) return productName !== batchName;

  return false;
}

/** Returns an error message when a batch is expired or consumed, else null. */
function batchAvailabilityError(batch: BatchListItem): string | null {
  if (batch.status === 'expired' || isExpiredDate(batch.expiry_date)) {
    return 'This batch has expired. Select an active batch.';
  }
  if (batch.status === 'consumed') {
    return 'This batch has already been consumed. Select an active batch.';
  }
  return null;
}

function getBatchError(batch: BatchListItem | null, product: QSealProductListItem | null): string | null {
  if (!batch) return null;

  if (batchProductMismatch(batch, product)) {
    const label = batch.product_name ?? batch.item_name ?? batch.sku ?? 'a different product';
    return `This batch belongs to ${label}. Select the batch matching this product.`;
  }

  return batchAvailabilityError(batch);
}

function formatSequentialSerial(prefix: string, value: number, width: number): string {
  const serial = String(value).padStart(width, '0');
  return prefix ? `${prefix}-${serial}` : serial;
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
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="product-listbox"
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={cn('truncate min-w-0', !value && 'text-muted-foreground')}>{value ? selectedName || value : 'Search products…'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[340px]">
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by name or GTIN…"
            className="h-7 border-0 p-0 shadow-none focus-visible:ring-0"
          />
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
              <button
                key={p.id}
                type="button"
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  value === p.id && 'bg-accent text-accent-foreground',
                )}
                onClick={() => handleSelect(p)}
              >
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
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls="batch-listbox"
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={cn('truncate min-w-0', !value && 'text-muted-foreground')}>{value ? selectedLabel || value : 'Search batches…'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[340px]">
        <div className="flex items-center border-b px-3 py-2">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by batch number…"
            className="h-7 border-0 p-0 shadow-none focus-visible:ring-0"
          />
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
              <button
                key={batch.id}
                type="button"
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  value === batch.batch_no && 'bg-accent text-accent-foreground',
                )}
                onClick={() => handleSelect(batch)}
              >
                <Check className={cn('mr-2 h-4 w-4 shrink-0', value === batch.batch_no ? 'opacity-100' : 'opacity-0')} />
                <div className="min-w-0 text-left">
                  <p className="font-medium break-words">{batch.batch_no}</p>
                  {(batch.product_name || batch.item_name || batch.status || batch.expiry_date) && (
                    <p className="text-xs text-muted-foreground">
                      {[batch.product_name ?? batch.item_name, batch.status, batch.expiry_date ? `expiry ${batch.expiry_date.slice(0, 10)}` : null]
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
  const [step, setStep] = React.useState(1);
  const [stepError, setStepError] = React.useState<string | null>(null);
  const [serialCollision, setSerialCollision] = React.useState<SerialCollisionState>({ status: 'idle' });
  const [discardConfirmOpen, setDiscardConfirmOpen] = React.useState(false);
  const masterPackWarnedFor = React.useRef<number | null>(null);

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
    setStep(1);
    setStepError(null);
    setSerialCollision({ status: 'idle' });
    setDiscardConfirmOpen(false);
    masterPackWarnedFor.current = null;
  };

  // Reset the form every time the dialog opens so values left over from a
  // previous (or cancelled) session never leak into a new one.
  React.useEffect(() => {
    if (open) {
      reset();
    }
  }, [open]);

  // Submission maps credit and backend conflict errors to Product-facing notifications.
  // eslint-disable-next-line complexity
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step !== CREATION_STEPS.length) {
      return;
    }

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

  // Warn when the user overrides a product-configured master pack size. The
  // ref tracks the last configured value we warned about, so selecting a
  // different product (with a different configured value) re-arms the warning.
  const handleMasterPackSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Math.max(1, Number(e.target.value));
    const configured = selectedProduct?.items_per_master_pack;
    if (configured != null && configured > 0 && next !== configured && masterPackWarnedFor.current !== configured) {
      masterPackWarnedFor.current = configured;
      notificationService.masterPackOverridden();
    }
    setMasterPackSize(next);
  };

  // Determine if user has enough credits
  const hasEnoughCredits = credits === null || credits >= quantity;
  const showCreditWarning = credits !== null && credits < 500;
  const srType = normalizeSerialNumberType(selectedProduct?.sr_number_type ?? null);
  const serialPrefix = selectedProduct?.serial_prefix?.trim() ?? '';
  const isSequential = srType === 'S8DN' || srType === 'S10DN';
  const serialConfigurationReady = Boolean(srType && serialPrefix);
  const batchError = getBatchError(selectedBatch, selectedProduct);
  const quantityError = !Number.isInteger(quantity) || quantity < 1 || quantity > 5000 ? 'Enter a quantity between 1 and 5,000.' : null;
  const serialValidation = React.useMemo(() => {
    if (!isSequential) return { error: null, preview: null as string | null };

    const width = SEQUENTIAL_WIDTHS[srType as 'S8DN' | 'S10DN'];
    const value = startingSerial.trim();
    if (!value) return { error: 'Enter the first serial number for this sequential block.', preview: null };
    if (!/^\d+$/.test(value)) return { error: 'Starting serial must contain digits only.', preview: null };
    if (value.length > width) return { error: `Starting serial can contain at most ${width} digits.`, preview: null };

    const start = Number(value);
    const end = start + quantity - 1;
    const maxValue = 10 ** width - 1;
    if (!Number.isSafeInteger(start) || end > maxValue) {
      return { error: `The range exceeds the ${width}-digit serial capacity.`, preview: null };
    }

    return {
      error: null,
      preview: `${formatSequentialSerial(serialPrefix, start, width)} → ${formatSequentialSerial(serialPrefix, end, width)}`,
    };
  }, [isSequential, quantity, serialPrefix, srType, startingSerial]);
  const serialValidationError = serialValidation.error;

  React.useEffect(() => {
    if (!open || !isSequential || !productId || quantityError || serialValidationError) {
      setSerialCollision({ status: 'idle' });
      return;
    }

    let active = true;
    setSerialCollision({ status: 'checking' });
    const timeout = window.setTimeout(async () => {
      try {
        const result = await qrBlockService.checkSerialCollisions(productId, startingSerial.trim(), quantity);
        if (!active) return;
        if (result.available) {
          setSerialCollision({ status: 'available', checkedCount: result.checked_count });
        } else {
          setSerialCollision({
            status: 'conflict',
            collisions: result.collisions,
            collisionCount: result.collision_count,
          });
        }
      } catch (err: unknown) {
        if (active) setSerialCollision({ status: 'error', message: getApiErrorMessage(err, 'Serial availability could not be checked.') });
      }
    }, 450);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [isSequential, open, productId, quantity, quantityError, serialValidationError, startingSerial]);

  const serialCollisionError =
    serialCollision.status === 'conflict'
      ? `${serialCollision.collisionCount.toLocaleString()} serial number${serialCollision.collisionCount === 1 ? '' : 's'} already exist${serialCollision.collisionCount === 1 ? 's' : ''}.`
      : serialCollision.status === 'checking'
        ? 'Checking whether this serial range is available…'
        : null;
  const channelLabel = channels.find((setting) => setting.id === channelSettingId)?.label ?? 'Not specified';
  const destinationLabel = destinations.find((setting) => setting.id === destinationSettingId)?.label ?? 'Not specified';
  const masterPackValid = !masterPackEnabled || (Number.isInteger(masterPackSize) && masterPackSize > 0 && masterPackSize <= quantity);
  const formValid = Boolean(
    productId &&
      batch.trim() &&
      serialConfigurationReady &&
      !batchError &&
      !quantityError &&
      !serialValidationError &&
      !serialCollisionError &&
      masterPackValid &&
      hasEnoughCredits &&
      !creditsError,
  );

  const getStepError = (targetStep: number): string | null => {
    if (targetStep === 1) {
      if (!productId) return 'Select a product to continue.';
      if (!serialConfigurationReady) return 'This product needs a serial prefix and serial number type before a block can be generated.';
      if (!batch.trim()) return 'Select a batch to continue.';
      if (batchError) return batchError;
    }
    if (targetStep === 2) {
      if (quantityError) return quantityError;
      if (serialValidationError) return serialValidationError;
      if (serialCollisionError) return serialCollisionError;
      if (!qrType) return 'Select a QR type to continue.';
    }
    if (targetStep === 3) {
      if (!masterPackValid) return 'Master pack size must be between 1 and the block quantity.';
      if (!hasEnoughCredits) return `You need ${quantity.toLocaleString()} credits to generate this block.`;
      if (creditsError) return creditsError;
    }
    return null;
  };

  const handleNext = () => {
    const validationError = getStepError(step);
    if (validationError) {
      setStepError(validationError);
      return;
    }
    setStepError(null);
    setStep((current) => Math.min(CREATION_STEPS.length, current + 1));
  };

  const handleBack = () => {
    setStepError(null);
    setStep((current) => Math.max(1, current - 1));
  };

  const isDirty = Boolean(
    productId ||
      batch.trim() ||
      quantity !== 100 ||
      qrType !== 'dynamic' ||
      channelSettingId ||
      destinationSettingId ||
      startingSerial ||
      !includeQrImage ||
      masterPackEnabled,
  );

  const requestClose = (nextOpen: boolean) => {
    if (nextOpen || loading || !isDirty) {
      onOpenChange(nextOpen);
      return;
    }
    setDiscardConfirmOpen(true);
  };

  const discardChanges = () => {
    setDiscardConfirmOpen(false);
    reset();
    onOpenChange(false);
  };

  // Keep generation behind an explicit Step 4 action. The earlier steps only
  // validate and advance; they can never submit the form themselves.
  const handleSave = () => {
    if (step !== CREATION_STEPS.length) return;
    if (!formValid) {
      setStepError(getStepError(3) || 'Complete the block configuration before saving.');
      return;
    }
    const form = document.getElementById('qseal-block-form') as HTMLFormElement | null;
    form?.requestSubmit();
  };

  return (
    <>
      <DetailDialog
        open={open}
        onOpenChange={requestClose}
        size="lg"
        contentClassName="max-w-4xl max-h-[90vh] flex flex-col"
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
        loading={loading}
        loadingMessage="Loading Generate QR Block..."
        showCloseButton={false}
        footer={
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">{stepError && <p className="text-left text-xs text-destructive">{stepError}</p>}</div>
            <div className="flex shrink-0 items-center gap-2">
              <Button type="button" variant="outline" onClick={() => requestClose(false)} disabled={loading}>
                Cancel
              </Button>
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={loading}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              {step < CREATION_STEPS.length ? (
                <Button type="button" onClick={handleNext} disabled={loading || creditsLoading}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSave} disabled={loading || !formValid || creditsLoading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        }
      >
        <form id="qseal-block-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3 rounded-lg border bg-muted/20 p-3">
            <div className="flex items-center justify-between gap-2">
              {CREATION_STEPS.map((creationStep) => (
                <React.Fragment key={creationStep.number}>
                  <button
                    type="button"
                    className={cn(
                      'flex min-w-0 items-center gap-2 text-left text-xs',
                      creationStep.number <= step ? 'text-primary' : 'text-muted-foreground',
                    )}
                    onClick={() => creationStep.number < step && setStep(creationStep.number)}
                    disabled={creationStep.number >= step || loading}
                  >
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                        creationStep.number < step && 'border-primary bg-primary text-primary-foreground',
                        creationStep.number === step && 'border-primary text-primary',
                        creationStep.number > step && 'border-muted-foreground/30',
                      )}
                    >
                      {creationStep.number < step ? <Check className="h-3.5 w-3.5" /> : creationStep.number}
                    </span>
                    <span className="hidden sm:inline">{creationStep.label}</span>
                  </button>
                  {creationStep.number < CREATION_STEPS.length && <span className="h-px flex-1 bg-border" />}
                </React.Fragment>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Step {step} of {CREATION_STEPS.length} · {CREATION_STEPS[step - 1].label}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Product *</Label>
                <ProductSelect
                  value={productId}
                  onChange={(product) => {
                    setProductId(product.id);
                    setSelectedProduct(product);
                    setStartingSerial('');
                    setStepError(null);
                    const itemsPerMasterPack = product.items_per_master_pack;
                    setMasterPackSize(itemsPerMasterPack && itemsPerMasterPack > 0 ? itemsPerMasterPack : 10);
                  }}
                />
                {stepError && !productId && <p className="text-xs text-destructive">Select a product before continuing.</p>}
              </div>
              {selectedProduct && (
                <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label>Serial Prefix</Label>
                      <p className="text-sm font-medium">{serialPrefix || 'Not configured'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label>Serial format</Label>
                      <p className="text-sm font-medium">{srType ? SR_TYPE_LABELS[srType] : 'Not configured'}</p>
                    </div>
                  </div>
                  {!serialConfigurationReady && (
                    <p className="text-xs text-destructive">
                      Edit this product and configure its Serial Prefix and Serial Number Type before generating a block.
                    </p>
                  )}
                  {stepError && productId && !serialConfigurationReady && (
                    <p className="text-xs text-destructive">Serial configuration is required before continuing.</p>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                <Label>Batch *</Label>
                <BatchSelect
                  value={batch}
                  onChange={(selected) => {
                    setBatch(selected.batch_no);
                    setSelectedBatch(selected);
                    setStepError(null);
                  }}
                />
                {batchError && <p className="text-xs text-destructive">{batchError}</p>}
                {stepError && !batch.trim() && <p className="text-xs text-destructive">Select a batch before continuing.</p>}
                <p className="text-xs text-muted-foreground">Choose the production batch that will own these QR codes.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Distribution Channel</Label>
                  <Select
                    value={channelSettingId || 'none'}
                    onValueChange={(value) => setChannelSettingId(value === 'none' ? '' : value)}
                    disabled={channelsLoading}
                  >
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
                  <Select
                    value={destinationSettingId || 'none'}
                    onValueChange={(value) => setDestinationSettingId(value === 'none' ? '' : value)}
                    disabled={destinationsLoading}
                  >
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="quantity">Quantity * (1–5,000)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    min={1}
                    max={5000}
                    required
                  />
                  {quantityError && <p className="text-xs text-destructive">{quantityError}</p>}
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
              </div>
              {isSequential && (
                <div className="space-y-1.5 rounded-md border p-3">
                  <Label htmlFor="startingSerial">Starting Serial *</Label>
                  <Input
                    id="startingSerial"
                    value={startingSerial}
                    onChange={(e) => setStartingSerial(e.target.value)}
                    inputMode="numeric"
                    pattern="[0-9]+"
                    maxLength={srType === 'S8DN' ? 8 : 10}
                    placeholder={srType === 'S8DN' ? 'Enter up to 8 digits' : 'Enter up to 10 digits'}
                    required
                  />
                  {serialValidationError && <p className="text-xs text-destructive">{serialValidationError}</p>}
                  {!serialValidationError && serialValidation.preview && (
                    <p className="text-xs text-green-600">
                      This block will generate: <span className="font-mono font-medium">{serialValidation.preview}</span>
                    </p>
                  )}
                  {serialCollision.status === 'checking' && (
                    <p className="text-xs text-muted-foreground">Checking this range against existing serials…</p>
                  )}
                  {serialCollision.status === 'available' && (
                    <p className="text-xs text-green-600">All {serialCollision.checkedCount.toLocaleString()} serials in this range are available.</p>
                  )}
                  {serialCollision.status === 'conflict' && (
                    <div className="space-y-1 text-xs text-destructive">
                      <p>{serialCollisionError} Choose a different starting serial or quantity.</p>
                      {serialCollision.collisions.length > 0 && (
                        <p className="font-mono">
                          Examples: {serialCollision.collisions.join(', ')}
                          {serialCollision.collisionCount > serialCollision.collisions.length ? '…' : ''}
                        </p>
                      )}
                    </div>
                  )}
                  {serialCollision.status === 'error' && (
                    <p className="text-xs text-muted-foreground">
                      {serialCollision.message} The final generation check will still protect existing serials.
                    </p>
                  )}
                </div>
              )}
              {!isSequential && (
                <p className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
                  Random serials will be generated automatically using the product’s configured {srType ? SR_TYPE_LABELS[srType] : 'serial format'}{' '}
                  format.
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border p-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeQrImage"
                    checked={includeQrImage}
                    onChange={(e) => setIncludeQrImage(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="includeQrImage" className="cursor-pointer text-sm font-medium">
                    Include QR code images in Excel
                  </Label>
                </div>
                {includeQrImage && <p className="text-xs text-muted-foreground">Including QR images increases generation time and file size.</p>}
              </div>
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="masterPackEnabled"
                    checked={masterPackEnabled}
                    disabled={!selectedProduct}
                    onChange={(e) => setMasterPackEnabled(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Label
                    htmlFor="masterPackEnabled"
                    className={cn(
                      'flex cursor-pointer items-center gap-1.5 text-sm font-medium',
                      !selectedProduct && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <Layers className="h-4 w-4" />
                    Enable Master Pack (Cascade)
                  </Label>
                </div>
                {masterPackEnabled && (
                  <div className="space-y-3 pl-6">
                    <div className="space-y-1.5">
                      <Label htmlFor="masterPackSize">Items per Master Pack</Label>
                      <Input
                        id="masterPackSize"
                        type="number"
                        value={masterPackSize}
                        onChange={handleMasterPackSizeChange}
                        min={1}
                        max={quantity}
                        required
                      />
                      <p className="text-xs text-muted-foreground">Child QR codes grouped under each parent master pack.</p>
                      {!masterPackValid && <p className="text-xs text-destructive">Pack size must be between 1 and {quantity.toLocaleString()}.</p>}
                    </div>
                    {masterPackSize > 0 && masterPackParentCount > 0 && (
                      <div className="rounded-md bg-muted/50 p-3 text-sm">
                        <p className="font-medium">Master Pack Summary</p>
                        <ul className="mt-1 space-y-0.5 text-muted-foreground">
                          <li>• {quantity.toLocaleString()} child QR codes</li>
                          <li>• {masterPackParentCount.toLocaleString()} parent QR codes</li>
                          <li>• Parents will be linked to their children</li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {!hasEnoughCredits && (
                <p className="text-sm text-destructive">
                  Insufficient credits. You need {quantity.toLocaleString()} but only have {credits?.toLocaleString() || 0}.
                </p>
              )}
              {creditsError && <p className="text-sm text-destructive">{creditsError}</p>}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-4">
                <h3 className="font-semibold">Ready to generate</h3>
                <p className="mt-1 text-sm text-muted-foreground">Review the block configuration before reserving credits and starting generation.</p>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border p-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Product</p>
                  <p className="font-medium break-words">{selectedProduct?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Batch</p>
                  <p className="font-medium">{batch || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">QR type</p>
                  <p className="font-medium">{QR_TYPE_LABELS[qrType]}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Quantity</p>
                  <p className="font-medium">{quantity.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Channel</p>
                  <p className="font-medium">{channelLabel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Destination</p>
                  <p className="font-medium">{destinationLabel}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Serial format</p>
                  <p className="font-medium">{srType ? SR_TYPE_LABELS[srType] : '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">QR images</p>
                  <p className="font-medium">{includeQrImage ? 'Included' : 'Not included'}</p>
                </div>
                {isSequential && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Serial range</p>
                    <p className="font-mono font-medium">{serialValidation.preview || '—'}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-muted-foreground">Master Pack</p>
                  <p className="font-medium">
                    {masterPackEnabled ? `${masterPackParentCount.toLocaleString()} parent QR codes · ${masterPackSize} items per pack` : 'Disabled'}
                  </p>
                </div>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              {creditsError && <p className="text-sm text-destructive">{creditsError}</p>}
            </div>
          )}
        </form>
      </DetailDialog>
      <ConfirmationDialog
        open={discardConfirmOpen}
        onOpenChange={setDiscardConfirmOpen}
        title="Discard block configuration?"
        description="Your block configuration will be lost if you close this dialog."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        variant="destructive"
        onConfirm={discardChanges}
      />
    </>
  );
}
