import * as React from 'react';

import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronsUpDown,
  ClipboardCheck,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Settings2,
} from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@horizon-sync/ui/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { cn } from '@horizon-sync/ui/lib/utils';

import { useQSealActivation, getActivationErrorCode } from '../../hooks/useQSealActivation';
import { useQSealProducts } from '../../hooks/useQSealProducts';
import type { QSealActivationSettings, QSealActivationSettingsInput, QSealActivationSummary } from '../../types/qseal-activation.types';
import type { QSealProductListItem } from '../../types/qseal.types';

const EMPTY_FORM: QSealActivationSettingsInput = {
  dispatch_batch: '',
  batch_size: 1,
  manufacturing_date: '',
  manufacturing_unit: '',
  destination_market: '',
  mrp: '',
  append_to_existing: false,
};

function todayInputValue(): string {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  return new Date(today.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function createEmptyForm(): QSealActivationSettingsInput {
  return {
    ...EMPTY_FORM,
    manufacturing_date: todayInputValue(),
    manufacturing_unit: typeof window !== 'undefined' ? window.localStorage.getItem('qseal.last_manufacturing_unit') || '' : '',
  };
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMrp(value: string | number | null | undefined, currency: string | null | undefined): string {
  if (value == null || value === '') return '—';
  return `${currency ? `${currency} ` : ''}${value}`;
}

function formatCreatedBy(value: string | null | undefined, name: string | null | undefined): string {
  if (!value) return 'System';
  return name || 'Unknown user';
}

function ProductSelector({
  products,
  value,
  onChange,
  loading,
}: {
  products: QSealProductListItem[];
  value: string;
  onChange: (value: string) => void;
  loading: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const selectedProduct = products.find((product) => product.id === value);
  const filteredProducts = products.filter((product) => {
    const query = search.trim().toLowerCase();
    return !query || `${product.name} ${product.sku || ''}`.toLowerCase().includes(query);
  });

  React.useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  return (
    <div className="space-y-3">
      <Label>Product</Label>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setSearch('');
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls="qseal-product-listbox"
            aria-label="Select product"
            disabled={loading}
            className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className={cn('min-w-0 truncate', !selectedProduct && 'text-muted-foreground')}>
              {selectedProduct
                ? `${selectedProduct.name}${selectedProduct.sku ? ` (${selectedProduct.sku})` : ''}`
                : loading
                  ? 'Loading products…'
                  : 'Select a product'}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] max-w-[calc(100vw-2rem)] p-0">
          <div className="flex items-center border-b px-3 py-2">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              ref={inputRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or SKU…"
              className="h-7 border-0 p-0 shadow-none focus-visible:ring-0"
              aria-label="Search products"
            />
          </div>
          <div id="qseal-product-listbox" role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                role="option"
                aria-selected={value === product.id}
                className={cn(
                  'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  value === product.id && 'bg-accent text-accent-foreground',
                )}
                onClick={() => {
                  onChange(product.id);
                  setSearch('');
                  setOpen(false);
                }}
              >
                <Check className={cn('mr-2 h-4 w-4 shrink-0', value === product.id ? 'opacity-100' : 'opacity-0')} />
                <span className="min-w-0 truncate">
                  {product.name}
                  {product.sku ? ` (${product.sku})` : ''}
                </span>
              </button>
            ))}
            {!filteredProducts.length && <p className="py-4 text-center text-sm text-muted-foreground">No matching products.</p>}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function SummaryCards({ summary }: { summary: QSealActivationSummary }) {
  const cards: [string, string | number][] = [
    ['Total blocks', summary.total_blocks.toLocaleString()],
    ['Activated', summary.activated_blocks.toLocaleString()],
    ['Available', summary.available_blocks.toLocaleString()],
    ['Activation rate', `${summary.activation_percentage.toFixed(1)}%`],
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(([label, value]) => (
        <Card key={label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ActivationSteps({ summary, configured }: { summary: QSealActivationSummary; configured: boolean }) {
  const steps = [
    {
      label: 'QR blocks',
      detail: summary.total_blocks ? `${summary.total_blocks.toLocaleString()} created` : 'Create blocks',
      complete: summary.total_blocks > 0,
    },
    { label: 'Settings', detail: configured ? 'Configured' : 'Configure details', complete: configured },
    {
      label: 'Mobile activation',
      detail:
        summary.available_blocks === 0 && summary.total_blocks > 0
          ? 'Complete'
          : configured && summary.available_blocks > 0
            ? 'Ready in mobile app'
            : 'Configure details',
      complete: summary.total_blocks > 0 && configured && summary.available_blocks === 0,
    },
  ];

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-0">
          {steps.map((step, index) => (
            <React.Fragment key={step.label}>
              <div className="flex items-center gap-3 sm:flex-1">
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                    step.complete ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-muted-foreground/30 text-muted-foreground',
                  )}
                >
                  {step.complete ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{step.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{step.detail}</p>
                </div>
              </div>
              {index < steps.length - 1 && <div className="hidden h-px flex-1 self-center bg-border sm:block" />}
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ReadinessItem({ label, detail, complete }: { label: string; detail: string; complete: boolean }) {
  return (
    <div className="flex items-start gap-2 rounded-md border bg-background/60 p-3">
      <CheckCircle2 className={cn('mt-0.5 h-4 w-4 shrink-0', complete ? 'text-emerald-600' : 'text-muted-foreground')} />
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function ActivationImpact({ summary, batchSize }: { summary: QSealActivationSummary; batchSize: number }) {
  const requested = Math.max(0, Number(batchSize) || 0);
  const availableAfter = Math.max(0, summary.available_blocks - Math.min(requested, summary.available_blocks));
  const projectedActivated = Math.min(summary.total_blocks, summary.activated_blocks + Math.min(requested, summary.available_blocks));
  const projectedPercentage = summary.total_blocks ? (projectedActivated / summary.total_blocks) * 100 : 0;

  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm">
      <p className="font-medium">Activation impact preview</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Saving settings does not activate blocks. The mobile app uses these settings when operators activate scanned QR serials.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs text-muted-foreground">Capacity</p>
          <p className="font-medium">{requested.toLocaleString()} blocks</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Available after full batch</p>
          <p className="font-medium">{availableAfter.toLocaleString()} blocks</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Rate if batch is full</p>
          <p className="font-medium">{projectedPercentage.toFixed(1)}%</p>
        </div>
      </div>
    </div>
  );
}

function ActivationProgress({
  summary,
  configured,
  actionLabel,
  onAction,
  actionHint,
}: {
  summary: QSealActivationSummary;
  configured: boolean;
  actionLabel?: string;
  onAction?: () => void;
  actionHint?: string;
}) {
  const percentage = Math.min(100, Math.max(0, summary.activation_percentage));
  const status =
    summary.total_blocks === 0
      ? 'No QR blocks'
      : !configured
        ? 'Needs setup'
        : summary.available_blocks === 0
          ? 'Fully activated'
          : summary.activated_blocks > 0
            ? 'Partially activated'
            : 'Ready for mobile activation';
  const statusClass =
    status === 'Fully activated'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : status === 'Needs setup'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Activation progress</CardTitle>
        <Badge className={statusClass}>{status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            {summary.activated_blocks.toLocaleString()} of {summary.total_blocks.toLocaleString()} QR blocks activated
          </span>
          <span className="font-semibold">{percentage.toFixed(1)}%</span>
        </div>
        <div
          className="h-3 overflow-hidden rounded-full bg-muted"
          aria-label={`${percentage.toFixed(1)}% activated`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percentage}
        >
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} />
        </div>
        <div className="grid gap-2 border-t pt-3 sm:grid-cols-3">
          <ReadinessItem
            label="QR blocks"
            detail={summary.total_blocks ? `${summary.total_blocks.toLocaleString()} created` : 'Create blocks first'}
            complete={summary.total_blocks > 0}
          />
          <ReadinessItem label="Settings" detail={configured ? 'Ready to use' : 'Configuration required'} complete={configured} />
          <ReadinessItem
            label="Activation"
            detail={summary.available_blocks ? `${summary.available_blocks.toLocaleString()} available` : 'No blocks available'}
            complete={configured && summary.available_blocks === 0 && summary.total_blocks > 0}
          />
        </div>
        {onAction && actionLabel && (
          <div className="flex justify-end">
            <Button size="sm" onClick={onAction} className="gap-2">
              {actionLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        {!onAction && actionHint && <p className="text-right text-xs text-muted-foreground">{actionHint}</p>}
      </CardContent>
    </Card>
  );
}

type ActivationSettingsFormUpdater = <K extends keyof QSealActivationSettingsInput>(key: K, value: QSealActivationSettingsInput[K]) => void;

interface ActivationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: QSealActivationSettingsInput;
  summary: QSealActivationSummary;
  settings: QSealActivationSettings | null;
  markets: { id: string; name: string; currency: string | null }[];
  marketsLoading: boolean;
  marketsError: string | null;
  onRetryMarkets: () => void;
  onOpenMarketSettings?: () => void;
  saving: boolean;
  validationError: string | null;
  fieldErrors: Partial<Record<keyof QSealActivationSettingsInput, string>>;
  update: ActivationSettingsFormUpdater;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

function ActivationSettingsDialog({
  open,
  onOpenChange,
  form,
  summary,
  settings,
  markets,
  marketsLoading,
  marketsError,
  onRetryMarkets,
  onOpenMarketSettings,
  saving,
  validationError,
  fieldErrors,
  update,
  onSubmit,
}: ActivationSettingsDialogProps) {
  const selectedMarket = markets.find((market) => market.name === form.destination_market);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Activation Settings
          </DialogTitle>
          <DialogDescription>Configure the dispatch batch used by the mobile activation workflow for this product.</DialogDescription>
        </DialogHeader>

        <form id="qseal-activation-settings-form" className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dispatch-batch">Dispatch batch *</Label>
              <Input
                id="dispatch-batch"
                value={form.dispatch_batch}
                onChange={(e) => update('dispatch_batch', e.target.value)}
                placeholder="DB-001"
                aria-invalid={Boolean(fieldErrors.dispatch_batch)}
              />
              {fieldErrors.dispatch_batch && <p className="text-xs text-destructive">{fieldErrors.dispatch_batch}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch-size">Batch size *</Label>
              <Input
                id="batch-size"
                type="number"
                min={1}
                value={form.batch_size}
                onChange={(e) => update('batch_size', Number(e.target.value))}
                aria-invalid={Boolean(fieldErrors.batch_size)}
              />
              <p className="text-xs text-muted-foreground">Available: {summary.available_blocks.toLocaleString()} blocks</p>
              {fieldErrors.batch_size && <p className="text-xs text-destructive">{fieldErrors.batch_size}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturing-date">Manufacturing date *</Label>
              <Input
                id="manufacturing-date"
                type="date"
                value={form.manufacturing_date}
                onChange={(e) => update('manufacturing_date', e.target.value)}
                aria-invalid={Boolean(fieldErrors.manufacturing_date)}
              />
              {fieldErrors.manufacturing_date && <p className="text-xs text-destructive">{fieldErrors.manufacturing_date}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturing-unit">Manufacturing unit *</Label>
              <Input
                id="manufacturing-unit"
                value={form.manufacturing_unit}
                onChange={(e) => update('manufacturing_unit', e.target.value)}
                placeholder="Plant-A"
                aria-invalid={Boolean(fieldErrors.manufacturing_unit)}
              />
              {fieldErrors.manufacturing_unit && <p className="text-xs text-destructive">{fieldErrors.manufacturing_unit}</p>}
            </div>
            <div className="space-y-2">
              <Label>Destination market *</Label>
              <Select value={form.destination_market} onValueChange={(value) => update('destination_market', value)}>
                <SelectTrigger aria-invalid={Boolean(fieldErrors.destination_market)} disabled={marketsLoading || Boolean(marketsError)}>
                  <SelectValue placeholder={marketsLoading ? 'Loading markets…' : 'Select market'} />
                </SelectTrigger>
                <SelectContent>
                  {markets.map((market) => (
                    <SelectItem key={market.id} value={market.name}>
                      {market.name} ({market.currency || '—'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {marketsError && (
                <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
                  <span>{marketsError}</span>
                  <Button type="button" variant="ghost" size="sm" className="h-7 shrink-0 px-2" onClick={onRetryMarkets} disabled={marketsLoading}>
                    <RefreshCw className={cn('mr-1 h-3 w-3', marketsLoading && 'animate-spin')} />
                    Retry
                  </Button>
                </div>
              )}
              {!marketsLoading && !marketsError && !markets.length && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 text-xs text-amber-700 dark:text-amber-300">
                  <p>No active destination markets are configured.</p>
                  {onOpenMarketSettings && (
                    <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={onOpenMarketSettings}>
                      Open Settings
                    </Button>
                  )}
                </div>
              )}
              {fieldErrors.destination_market && <p className="text-xs text-destructive">{fieldErrors.destination_market}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mrp">MRP {selectedMarket?.currency ? `(${selectedMarket.currency}) ` : ''}*</Label>
              <Input
                id="mrp"
                type="number"
                min={0}
                step="0.01"
                value={form.mrp}
                onChange={(e) => update('mrp', e.target.value)}
                placeholder="499.00"
                aria-invalid={Boolean(fieldErrors.mrp)}
              />
              {fieldErrors.mrp && <p className="text-xs text-destructive">{fieldErrors.mrp}</p>}
            </div>
          </div>

          <div className="grid gap-4 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Calculated expiry</span>
              <p className="font-medium">{settings?.expiry_date?.slice(0, 10) || 'Calculated by server after save'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Currency</span>
              <p className="font-medium">{selectedMarket?.currency || settings?.currency || 'Select a destination market'}</p>
            </div>
          </div>

          <ActivationImpact summary={summary} batchSize={form.batch_size} />

          {validationError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {validationError}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface ActivationReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: QSealActivationSettingsInput;
  summary: QSealActivationSummary;
  market: { name: string; currency: string | null } | undefined;
  updating: boolean;
  hasExistingSettings: boolean;
  onConfirm: () => void;
}

function ActivationReviewDialog({
  open,
  onOpenChange,
  form,
  summary,
  market,
  updating,
  hasExistingSettings,
  onConfirm,
}: ActivationReviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Review activation settings
          </DialogTitle>
          <DialogDescription>
            Confirm these details before saving. The mobile app will use them when activating QR serials, and the server will calculate the final
            expiry date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 text-sm">
            <p className="font-medium">
              {form.batch_size.toLocaleString()} QR blocks for {market?.name || form.destination_market}
            </p>
            <p className="mt-1 text-muted-foreground">
              {market?.currency || 'Currency resolved by server'} · {form.dispatch_batch || 'Unnamed batch'}
            </p>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Manufacturing date</p>
              <p className="font-medium">{formatDate(form.manufacturing_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Manufacturing unit</p>
              <p className="font-medium">{form.manufacturing_unit}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Batch size</p>
              <p className="font-medium">
                {Number(form.batch_size).toLocaleString()} of {summary.available_blocks.toLocaleString()} available
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">MRP</p>
              <p className="font-medium">{formatMrp(form.mrp, market?.currency)}</p>
            </div>
          </div>
          {hasExistingSettings && (
            <p className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-300">
              Saving this update will archive the current settings version.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={updating}>
            Back to edit
          </Button>
          <Button type="button" onClick={onConfirm} disabled={updating}>
            <Save className="mr-2 h-4 w-4" />
            {updating ? 'Saving…' : 'Confirm and save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// The component intentionally coordinates product selection, settings
// validation, save confirmation, and loading/error states in one screen.
/* eslint-disable complexity */
export function QSealActivationManagement({ onOpenBlocks, onOpenMarketSettings }: { onOpenBlocks?: () => void; onOpenMarketSettings?: () => void }) {
  const { products, loading: productsLoading, error: productsError } = useQSealProducts(1, { status: 'active' });
  const [productId, setProductId] = React.useState('');
  const { summary, settings, history, markets, marketsLoading, marketsError, refetchMarkets, loading, saving, error, refetch, saveSettings } =
    useQSealActivation(productId || null);
  const [form, setForm] = React.useState(createEmptyForm);
  const [confirmBatchUpdate, setConfirmBatchUpdate] = React.useState(false);
  const [pendingForm, setPendingForm] = React.useState<QSealActivationSettingsInput | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [showFieldErrors, setShowFieldErrors] = React.useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);
  const [showPreviousSettings, setShowPreviousSettings] = React.useState(false);
  const [dialogInitialForm, setDialogInitialForm] = React.useState<QSealActivationSettingsInput>(createEmptyForm);
  const [discardChangesOpen, setDiscardChangesOpen] = React.useState(false);
  const [discardChangesDestination, setDiscardChangesDestination] = React.useState(false);

  React.useEffect(() => {
    if (!productId && products.length) setProductId(products[0].id);
  }, [productId, products]);
  React.useEffect(() => {
    if (!settings) {
      const nextForm = createEmptyForm();
      setForm(nextForm);
      setDialogInitialForm(nextForm);
      return;
    }
    const nextForm = {
      dispatch_batch: settings.dispatch_batch || '',
      batch_size: settings.batch_size || 1,
      manufacturing_date: settings.manufacturing_date?.slice(0, 10) || '',
      manufacturing_unit: settings.manufacturing_unit || '',
      destination_market: settings.destination_market || '',
      mrp: settings.mrp == null ? '' : String(settings.mrp),
      append_to_existing: false,
    };
    setForm(nextForm);
    setDialogInitialForm(nextForm);
  }, [settings, productId]);

  const update = <K extends keyof QSealActivationSettingsInput>(key: K, value: QSealActivationSettingsInput[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  const fieldErrors = React.useMemo<Partial<Record<keyof QSealActivationSettingsInput, string>>>(() => {
    if (!showFieldErrors) return {};
    const errors: Partial<Record<keyof QSealActivationSettingsInput, string>> = {};
    if (!form.dispatch_batch.trim()) errors.dispatch_batch = 'Dispatch batch is required.';
    if (!Number.isInteger(Number(form.batch_size)) || Number(form.batch_size) <= 0) errors.batch_size = 'Enter a positive whole number.';
    if (summary && Number(form.batch_size) > summary.available_blocks && !settings)
      errors.batch_size = `Maximum ${summary.available_blocks.toLocaleString()} available blocks.`;
    if (!form.manufacturing_date) errors.manufacturing_date = 'Manufacturing date is required.';
    else if (form.manufacturing_date > todayInputValue()) errors.manufacturing_date = 'Manufacturing date cannot be in the future.';
    if (!form.manufacturing_unit.trim()) errors.manufacturing_unit = 'Manufacturing unit is required.';
    if (!form.destination_market) errors.destination_market = 'Destination market is required.';
    if (!form.mrp) errors.mrp = 'MRP is required.';
    else if (Number.isNaN(Number(form.mrp)) || Number(form.mrp) < 0) errors.mrp = 'MRP must be zero or greater.';
    return errors;
  }, [form, settings, showFieldErrors, summary]);
  const persistSettings = async (input: QSealActivationSettingsInput, appendToExisting = false) => {
    try {
      await saveSettings({ ...input, batch_size: Number(input.batch_size), append_to_existing: appendToExisting });
      if (typeof window !== 'undefined' && input.manufacturing_unit.trim()) {
        try {
          window.localStorage.setItem('qseal.last_manufacturing_unit', input.manufacturing_unit.trim());
        } catch {
          // Remembering the last unit is a convenience only; never fail the save for it.
        }
      }
      setReviewDialogOpen(false);
      setSettingsDialogOpen(false);
      setPendingForm(null);
      setShowFieldErrors(false);
      setSaveSuccess(
        appendToExisting ? 'Activation settings updated and the previous version was archived.' : 'Activation settings saved successfully.',
      );
    } catch (err) {
      if (getActivationErrorCode(err) === 'BATCH_EXISTS' && !appendToExisting) {
        setPendingForm(input);
        setReviewDialogOpen(false);
        setConfirmBatchUpdate(true);
      } else {
        setReviewDialogOpen(false);
        setValidationError((err as Error).message || 'Failed to save activation settings.');
      }
    }
  };
  const reviewSave = (input: QSealActivationSettingsInput) => {
    setShowFieldErrors(true);
    setValidationError(null);
    if (!input.dispatch_batch.trim() || !input.manufacturing_date || !input.manufacturing_unit.trim() || !input.destination_market || !input.mrp) {
      setValidationError('Complete all required activation settings before saving.');
      return;
    }
    if (input.manufacturing_date > todayInputValue()) {
      setValidationError('Manufacturing date cannot be in the future.');
      return;
    }
    if (!Number.isInteger(Number(input.batch_size)) || Number(input.batch_size) <= 0) {
      setValidationError('Batch size must be a positive whole number.');
      return;
    }
    if (Number.isNaN(Number(input.mrp)) || Number(input.mrp) < 0) {
      setValidationError('MRP must be zero or greater.');
      return;
    }
    if (summary && Number(input.batch_size) > summary.available_blocks && !settings) {
      setValidationError(`Batch size cannot exceed ${summary.available_blocks.toLocaleString()} available blocks.`);
      return;
    }
    setPendingForm({ ...input, batch_size: Number(input.batch_size), append_to_existing: false });
    setReviewDialogOpen(true);
  };
  const confirmUpdate = async () => {
    if (!pendingForm) return;
    setConfirmBatchUpdate(false);
    await persistSettings(pendingForm, true);
  };

  const displayError = productsError || error;
  const previousSettings = history?.items.filter((item) => item.history) || [];
  const selectedProduct = products.find((product) => product.id === productId);
  const selectedMarket = markets.find((market) => market.name === form.destination_market);
  const activationStatus = !summary
    ? null
    : summary.total_blocks === 0
      ? 'No QR blocks'
      : !settings
        ? 'Needs setup'
        : summary.available_blocks === 0
          ? 'Fully activated'
          : summary.activated_blocks > 0
            ? 'Partially activated'
            : 'Ready for mobile activation';
  const formIsDirty = React.useMemo(() => JSON.stringify(form) !== JSON.stringify(dialogInitialForm), [dialogInitialForm, form]);
  const closeSettingsDialog = (restoreForm = false) => {
    const nextForm = restoreForm ? dialogInitialForm : form;
    if (restoreForm) setForm(nextForm);
    setSettingsDialogOpen(false);
    setValidationError(null);
    setShowFieldErrors(false);
    setReviewDialogOpen(false);
    setDialogInitialForm(nextForm);
  };
  const openSettingsDialog = () => {
    setValidationError(null);
    setShowFieldErrors(false);
    setSaveSuccess(null);
    setDialogInitialForm(form);
    setSettingsDialogOpen(true);
  };
  const openMarketSettings = () => {
    if (!onOpenMarketSettings) return;
    if (formIsDirty) {
      setDiscardChangesDestination(true);
      setDiscardChangesOpen(true);
      return;
    }
    closeSettingsDialog();
    onOpenMarketSettings();
  };
  const activationAction = !summary
    ? null
    : summary.total_blocks === 0
      ? { label: 'Create QR blocks', onAction: onOpenBlocks }
      : !settings
        ? { label: 'Configure settings', onAction: openSettingsDialog }
        : summary.available_blocks === 0
          ? { label: 'View QR Blocks', onAction: onOpenBlocks }
          : { label: 'Ready for mobile activation', hint: 'Use the mobile app to scan and activate QR serials.' };
  const handleSettingsDialogChange = (open: boolean) => {
    if (open) {
      setSettingsDialogOpen(true);
      return;
    }
    if (formIsDirty && !saving) {
      setDiscardChangesOpen(true);
      return;
    }
    closeSettingsDialog();
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activation</h2>
          <p className="text-muted-foreground">Configure activation rules here, then activate QR serials in the mobile app.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={!productId || loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      {productId && !loading && summary && <SummaryCards summary={summary} />}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr] md:items-end">
            <ProductSelector products={products} value={productId} onChange={setProductId} loading={productsLoading} />
            {selectedProduct && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{selectedProduct.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selectedProduct.sku ? `SKU: ${selectedProduct.sku}` : 'No SKU'}
                      {selectedProduct.qr_type ? ` · ${selectedProduct.qr_type}` : ''}
                    </p>
                  </div>
                  {activationStatus && <Badge variant="outline">{activationStatus}</Badge>}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {displayError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {displayError}
        </div>
      )}
      {saveSuccess && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {saveSuccess}
        </div>
      )}
      {!productId && !productsLoading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium">{products.length ? 'Select a product to view activation.' : 'No active products found.'}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {products.length ? 'Choose a product above to continue.' : 'Create and activate a product before configuring QR activation.'}
            </p>
          </CardContent>
        </Card>
      )}
      {productId && loading && (
        <Card>
          <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading activation data…
          </CardContent>
        </Card>
      )}
      {productId && !loading && summary && (
        <>
          <ActivationSteps summary={summary} configured={Boolean(settings)} />
          <ActivationProgress
            summary={summary}
            configured={Boolean(settings)}
            actionLabel={activationAction?.label}
            onAction={activationAction?.onAction}
            actionHint={activationAction?.hint}
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Activation settings
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  {settings
                    ? `Last updated ${formatDate(settings.created_on)} by ${formatCreatedBy(settings.created_by, settings.created_by_name)}`
                    : 'Required before mobile activation.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {activationStatus && (
                  <Badge
                    className={
                      activationStatus === 'Fully activated'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : activationStatus === 'Needs setup'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }
                  >
                    {activationStatus}
                  </Badge>
                )}
                {settings && (
                  <Button onClick={openSettingsDialog}>
                    <Settings2 className="mr-2 h-4 w-4" />
                    Edit settings
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {settings ? (
                <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['Batch', settings.dispatch_batch],
                    ['Batch size', settings.batch_size],
                    ['Manufacturing unit', settings.manufacturing_unit],
                    ['Market', settings.destination_market],
                    ['Currency', settings.currency],
                    ['Expiry', formatDate(settings.expiry_date)],
                    ['MRP', formatMrp(settings.mrp, settings.currency)],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <p className="text-muted-foreground">{label}</p>
                      <p className="font-medium">{value || '—'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  No activation settings configured yet.
                </div>
              )}
            </CardContent>
          </Card>
          <ActivationSettingsDialog
            open={settingsDialogOpen}
            onOpenChange={handleSettingsDialogChange}
            form={form}
            summary={summary}
            settings={settings}
            markets={markets}
            marketsLoading={marketsLoading}
            marketsError={marketsError}
            onRetryMarkets={() => void refetchMarkets()}
            onOpenMarketSettings={openMarketSettings}
            saving={saving}
            validationError={validationError}
            fieldErrors={fieldErrors}
            update={update}
            onSubmit={(event) => {
              event.preventDefault();
              reviewSave(form);
            }}
          />
          <ActivationReviewDialog
            open={reviewDialogOpen}
            onOpenChange={setReviewDialogOpen}
            form={pendingForm || form}
            summary={summary}
            market={pendingForm ? markets.find((market) => market.name === pendingForm.destination_market) : selectedMarket}
            updating={saving}
            hasExistingSettings={Boolean(settings)}
            onConfirm={() => {
              if (pendingForm) void persistSettings(pendingForm);
            }}
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle>Previous settings</CardTitle>
              {previousSettings.length > 0 && (
                <Button variant="ghost" size="sm" className="gap-1" onClick={() => setShowPreviousSettings((current) => !current)}>
                  {showPreviousSettings ? 'Hide history' : `View history (${previousSettings.length})`}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showPreviousSettings ? 'rotate-180' : ''}`} />
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {!previousSettings.length ? (
                <p className="p-6 text-sm text-muted-foreground">No previous settings available.</p>
              ) : !showPreviousSettings ? (
                <p className="p-6 text-sm text-muted-foreground">
                  {previousSettings.length} archived version{previousSettings.length === 1 ? '' : 's'} available.
                </p>
              ) : (
                <div className="space-y-4 p-6">
                  {previousSettings.map((item, index) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="flex w-3 flex-col items-center">
                        <span className="mt-1 h-3 w-3 rounded-full bg-muted-foreground" />
                        {index < previousSettings.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                      </div>
                      <div className="min-w-0 flex-1 rounded-lg border p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{item.dispatch_batch || 'Unnamed batch'}</p>
                            <p className="text-xs text-muted-foreground">
                              Archived on {formatDate(item.created_on)} ·{' '}
                              <span title={item.created_by || undefined}>Created by {formatCreatedBy(item.created_by, item.created_by_name)}</span>
                            </p>
                          </div>
                          <Badge variant="secondary">Previous version</Badge>
                        </div>
                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-muted-foreground">Batch size</p>
                            <p className="font-medium">{item.batch_size || '—'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Market</p>
                            <p className="font-medium">{item.destination_market || '—'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Expiry</p>
                            <p className="font-medium">{formatDate(item.expiry_date)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">MRP</p>
                            <p className="font-medium">{formatMrp(item.mrp, item.currency)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      <ConfirmationDialog
        open={confirmBatchUpdate}
        onOpenChange={setConfirmBatchUpdate}
        title="Update existing dispatch batch?"
        description="This dispatch batch already has active settings. Confirming will archive the current settings and save the new values."
        confirmLabel="Update Batch"
        loading={saving}
        onConfirm={() => void confirmUpdate()}
      />
      <ConfirmationDialog
        open={discardChangesOpen}
        onOpenChange={(open) => {
          setDiscardChangesOpen(open);
          if (!open) setDiscardChangesDestination(false);
        }}
        title="Discard unsaved changes?"
        description="Your changes have not been saved. Closing this form will discard them."
        confirmLabel="Discard changes"
        variant="destructive"
        onConfirm={() => {
          setDiscardChangesOpen(false);
          const shouldNavigate = discardChangesDestination;
          setDiscardChangesDestination(false);
          closeSettingsDialog(true);
          if (shouldNavigate) onOpenMarketSettings?.();
        }}
      />
    </div>
  );
}
/* eslint-enable complexity */
