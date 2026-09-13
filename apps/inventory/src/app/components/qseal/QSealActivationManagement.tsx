import * as React from 'react';

import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Save, Settings2 } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@horizon-sync/ui/components/ui/table';

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
  return (
    <div className="space-y-2">
      <Label>Product</Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Loading products…' : 'Select a product'} />
        </SelectTrigger>
        <SelectContent>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.name}
              {product.sku ? ` (${product.sku})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SummaryCards({ summary }: { summary: QSealActivationSummary }) {
  const cards: [string, string | number][] = [
    ['Total QR Blocks', summary.total_blocks.toLocaleString()],
    ['Activated QR Blocks', summary.activated_blocks.toLocaleString()],
    ['Available QR Blocks', summary.available_blocks.toLocaleString()],
    ['Activation Percentage', `${summary.activation_percentage}%`],
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

type ActivationSettingsFormUpdater = <K extends keyof QSealActivationSettingsInput>(key: K, value: QSealActivationSettingsInput[K]) => void;

interface ActivationSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: QSealActivationSettingsInput;
  summary: QSealActivationSummary;
  settings: QSealActivationSettings | null;
  markets: { id: string; name: string; currency: string | null }[];
  saving: boolean;
  validationError: string | null;
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
  saving,
  validationError,
  update,
  onSubmit,
}: ActivationSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Activation Settings
          </DialogTitle>
          <DialogDescription>Configure the dispatch batch and activation details for this product.</DialogDescription>
        </DialogHeader>

        <form id="qseal-activation-settings-form" className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Dispatch Batch *</Label>
              <Input value={form.dispatch_batch} onChange={(e) => update('dispatch_batch', e.target.value)} placeholder="DB-001" />
            </div>
            <div className="space-y-2">
              <Label>Batch Size *</Label>
              <Input type="number" min={1} value={form.batch_size} onChange={(e) => update('batch_size', Number(e.target.value))} />
              <p className="text-xs text-muted-foreground">Available: {summary.available_blocks.toLocaleString()} blocks</p>
            </div>
            <div className="space-y-2">
              <Label>Manufacturing Date *</Label>
              <Input type="date" value={form.manufacturing_date} onChange={(e) => update('manufacturing_date', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Manufacturing Unit *</Label>
              <Input value={form.manufacturing_unit} onChange={(e) => update('manufacturing_unit', e.target.value)} placeholder="Plant-A" />
            </div>
            <div className="space-y-2">
              <Label>Destination Market *</Label>
              <Select value={form.destination_market} onValueChange={(value) => update('destination_market', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select market" />
                </SelectTrigger>
                <SelectContent>
                  {markets.map((market) => (
                    <SelectItem key={market.id} value={market.name}>
                      {market.name} ({market.currency || '—'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>MRP *</Label>
              <Input type="number" min={0} step="0.01" value={form.mrp} onChange={(e) => update('mrp', e.target.value)} placeholder="499.00" />
            </div>
          </div>

          <div className="grid gap-4 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Calculated expiry</span>
              <p className="font-medium">{settings?.expiry_date?.slice(0, 10) || 'Calculated by server after save'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Currency</span>
              <p className="font-medium">{settings?.currency || 'Resolved by server after save'}</p>
            </div>
          </div>

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

// The component intentionally coordinates product selection, settings
// validation, save confirmation, and loading/error states in one screen.
/* eslint-disable complexity */
export function QSealActivationManagement() {
  const { products, loading: productsLoading, error: productsError } = useQSealProducts(1, { status: 'active' });
  const [productId, setProductId] = React.useState('');
  const { summary, settings, history, markets, loading, saving, error, refetch, saveSettings } = useQSealActivation(productId || null);
  const [form, setForm] = React.useState(EMPTY_FORM);
  const [confirmBatchUpdate, setConfirmBatchUpdate] = React.useState(false);
  const [pendingForm, setPendingForm] = React.useState<QSealActivationSettingsInput | null>(null);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (!productId && products.length) setProductId(products[0].id);
  }, [productId, products]);
  React.useEffect(() => {
    if (!settings) {
      setForm(EMPTY_FORM);
      return;
    }
    setForm({
      dispatch_batch: settings.dispatch_batch || '',
      batch_size: settings.batch_size || 1,
      manufacturing_date: settings.manufacturing_date?.slice(0, 10) || '',
      manufacturing_unit: settings.manufacturing_unit || '',
      destination_market: settings.destination_market || '',
      mrp: settings.mrp == null ? '' : String(settings.mrp),
      append_to_existing: false,
    });
  }, [settings, productId]);

  const update = <K extends keyof QSealActivationSettingsInput>(key: K, value: QSealActivationSettingsInput[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));
  const save = async (input: QSealActivationSettingsInput) => {
    setValidationError(null);
    if (!input.dispatch_batch.trim() || !input.manufacturing_date || !input.manufacturing_unit.trim() || !input.destination_market || !input.mrp) {
      setValidationError('Complete all required activation settings before saving.');
      return;
    }
    if (!Number.isInteger(Number(input.batch_size)) || Number(input.batch_size) <= 0) {
      setValidationError('Batch size must be a positive whole number.');
      return;
    }
    if (summary && Number(input.batch_size) > summary.available_blocks && !settings) {
      setValidationError(`Batch size cannot exceed ${summary.available_blocks.toLocaleString()} available blocks.`);
      return;
    }
    try {
      await saveSettings({ ...input, batch_size: Number(input.batch_size), append_to_existing: false });
      setSettingsDialogOpen(false);
    } catch (err) {
      if (getActivationErrorCode(err) === 'BATCH_EXISTS') {
        setPendingForm(input);
        setConfirmBatchUpdate(true);
      } else setValidationError((err as Error).message || 'Failed to save activation settings.');
    }
  };
  const confirmUpdate = async () => {
    if (!pendingForm) return;
    try {
      await saveSettings({ ...pendingForm, append_to_existing: true });
      setConfirmBatchUpdate(false);
      setPendingForm(null);
      setSettingsDialogOpen(false);
    } catch (err) {
      setValidationError((err as Error).message || 'Failed to update activation settings.');
    }
  };

  const displayError = productsError || error;
  const handleSettingsDialogChange = (open: boolean) => {
    setSettingsDialogOpen(open);
    if (!open) setValidationError(null);
  };
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">QSeal Activation</h2>
          <p className="text-muted-foreground">Configure and monitor mobile QR activation settings.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={!productId || loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <ProductSelector products={products} value={productId} onChange={setProductId} loading={productsLoading} />
        </CardContent>
      </Card>
      {displayError && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {displayError}
        </div>
      )}
      {!productId && !productsLoading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Select a product to view activation settings.</CardContent>
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
          <SummaryCards summary={summary} />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Activation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-4">
                <div className="text-sm text-muted-foreground">
                  {settings ? 'Activation settings are configured for this product.' : 'Configure activation details before activating QR blocks.'}
                </div>
                <Button onClick={() => {
                    setValidationError(null);
                    setSettingsDialogOpen(true);
                  }}>
                  <Settings2 className="mr-2 h-4 w-4" />
                  {settings ? 'Edit Settings' : 'Configure Settings'}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Current Activation Settings</CardTitle>
              </CardHeader>
              <CardContent>
                {settings ? (
                  <div className="grid gap-3 text-sm sm:grid-cols-2">
                    {[
                      ['Batch', settings.dispatch_batch],
                      ['Batch Size', settings.batch_size],
                      ['Manufacturing Unit', settings.manufacturing_unit],
                      ['Market', settings.destination_market],
                      ['Currency', settings.currency],
                      ['Expiry', settings.expiry_date?.slice(0, 10)],
                      ['MRP', settings.mrp],
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
          </div>
          <ActivationSettingsDialog open={settingsDialogOpen}
            onOpenChange={handleSettingsDialogChange}
            form={form}
            summary={summary}
            settings={settings}
            markets={markets}
            saving={saving}
            validationError={validationError}
            update={update}
            onSubmit={(event) => {
              event.preventDefault();
              void save(form);
            }}/>
          <Card>
            <CardHeader>
              <CardTitle>Activation Settings History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!history?.items.length ? (
                <p className="p-6 text-sm text-muted-foreground">No settings history available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch</TableHead>
                        <TableHead>Batch Size</TableHead>
                        <TableHead>Market</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.dispatch_batch || '—'}</TableCell>
                          <TableCell>{item.batch_size || '—'}</TableCell>
                          <TableCell>{item.destination_market || '—'}</TableCell>
                          <TableCell>{item.expiry_date?.slice(0, 10) || '—'}</TableCell>
                          <TableCell>
                            <Badge variant={item.history ? 'secondary' : 'default'}>{item.history ? 'Archived' : 'Current'}</Badge>
                          </TableCell>
                          <TableCell>{item.created_on ? new Date(item.created_on).toLocaleDateString() : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
      <ConfirmationDialog open={confirmBatchUpdate}
        onOpenChange={setConfirmBatchUpdate}
        title="Update existing dispatch batch?"
        description="This dispatch batch already has active settings. Confirming will archive the current settings and save the new values."
        confirmLabel="Update Batch"
        loading={saving}
        onConfirm={() => void confirmUpdate()}/>
    </div>
  );
}
/* eslint-enable complexity */
