import * as React from 'react';

import { Loader2 } from 'lucide-react';

import { toast } from '@horizon-sync/ui';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Switch } from '@horizon-sync/ui/components/ui/switch';

import { useIdempotencyKey } from '../../hooks/useIdempotencyKey';
import { SubscriptionApiError, SubscriptionService } from '../../services/subscription.service';
import type { BillingCadence, PlanVersionPayload, SubscriptionPlanVersion } from '../../types/subscription.types';

import { Money, defaultEffectiveFrom, formatDecimal, sampleIdDebit, toDateTimeLocal, toIsoTimestamp } from './SubscriptionUI';

const CADENCES: Array<{ value: BillingCadence; label: string }> = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];

const DECIMAL_PATTERN = /^\d+(\.\d{1,6})?$/;
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

interface PlanVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planCode: string;
  currency: string;
  /** When set, the dialog edits this DRAFT version instead of creating a new one. */
  version?: SubscriptionPlanVersion | null;
  onSaved: () => void;
}

interface VersionFormState {
  cadence: BillingCadence;
  basePrice: string;
  taxRate: string;
  includedCredits: string;
  idWeight: string;
  topupAllowed: boolean;
  effectiveFrom: string;
}

const EMPTY_FORM: VersionFormState = {
  cadence: 'monthly',
  basePrice: '',
  taxRate: '0',
  includedCredits: '0',
  idWeight: '1',
  topupAllowed: true,
  effectiveFrom: '',
};

function initialForm(version?: SubscriptionPlanVersion | null): VersionFormState {
  if (!version) return { ...EMPTY_FORM, effectiveFrom: defaultEffectiveFrom() };
  return {
    cadence: version.billing_cadence,
    basePrice: version.base_price,
    taxRate: version.tax_rate,
    includedCredits: version.included_credits,
    idWeight: version.id_weight,
    topupAllowed: version.topup_allowed,
    effectiveFrom: toDateTimeLocal(version.effective_from),
  };
}

function validate(form: VersionFormState, isCreate: boolean): string | null {
  if (!MONEY_PATTERN.test(form.basePrice.trim())) return 'Base price must be a non-negative amount with up to 2 decimals.';
  if (!DECIMAL_PATTERN.test(form.taxRate.trim()) || Number(form.taxRate) > 100) return 'Tax rate must be between 0 and 100.';
  if (!DECIMAL_PATTERN.test(form.includedCredits.trim())) return 'Included credits must be a non-negative decimal (max 6 dp).';
  if (!DECIMAL_PATTERN.test(form.idWeight.trim()) || !(Number(form.idWeight) > 0)) return 'ID weight must be a decimal greater than zero.';
  if (isCreate && !toIsoTimestamp(form.effectiveFrom)) return 'Effective from is required.';
  return null;
}

function toPayload(form: VersionFormState, isCreate: boolean): PlanVersionPayload {
  return {
    billing_cadence: form.cadence,
    base_price: form.basePrice.trim(),
    tax_rate: form.taxRate.trim(),
    included_credits: form.includedCredits.trim(),
    id_weight: form.idWeight.trim(),
    topup_allowed: form.topupAllowed,
    ...(isCreate ? { effective_from: toIsoTimestamp(form.effectiveFrom) } : {}),
  };
}

export function PlanVersionDialog({ open, onOpenChange, planId, planCode, currency, version, onSaved }: PlanVersionDialogProps) {
  const keyFor = useIdempotencyKey();
  const isCreate = !version;
  const [form, setForm] = React.useState<VersionFormState>(() => initialForm(version));
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setForm(initialForm(version));
    setError(null);
  }, [open, version]);

  const patch = (next: Partial<VersionFormState>) => setForm((current) => ({ ...current, ...next }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validate(form, isCreate);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = toPayload(form, isCreate);
    setSubmitting(true);
    setError(null);
    try {
      if (isCreate) {
        await SubscriptionService.createVersion(planId, payload, keyFor({ planId, payload }));
      } else {
        await SubscriptionService.updateVersion(planId, version.id, payload, keyFor({ planId, versionId: version.id, payload }));
      }
      toast({ title: isCreate ? 'Draft version created' : 'Draft version updated', description: planCode });
      onOpenChange(false);
      onSaved();
    } catch (err) {
      const message = err instanceof SubscriptionApiError ? err.message : 'Could not save the version.';
      setError(message);
      toast({ variant: 'destructive', title: 'Version not saved', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const preview = sampleIdDebit(form.idWeight);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isCreate ? 'New draft version' : 'Edit draft version'} — {planCode}</DialogTitle>
          <DialogDescription>
            Published versions are immutable. Saving this draft does not affect existing invoices, prior usage, or subscriptions until you publish.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="version-cadence">Billing cadence</Label>
              <Select value={form.cadence} onValueChange={(value) => patch({ cadence: value as BillingCadence })}>
                <SelectTrigger id="version-cadence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CADENCES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="version-base-price">Recurring fee ({currency}, before tax)</Label>
              <Input id="version-base-price"
                inputMode="decimal"
                value={form.basePrice}
                onChange={(event) => patch({ basePrice: event.target.value })}
                placeholder="12000.00" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="version-tax-rate">Tax rate (%)</Label>
              <Input id="version-tax-rate"
                inputMode="decimal"
                value={form.taxRate}
                onChange={(event) => patch({ taxRate: event.target.value })}
                placeholder="7.5000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="version-included-credits">Included credits per paid invoice</Label>
              <Input id="version-included-credits"
                inputMode="decimal"
                value={form.includedCredits}
                onChange={(event) => patch({ includedCredits: event.target.value })}
                placeholder="120000.000000" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="version-id-weight">ID weight (credits per generated ID)</Label>
              <Input id="version-id-weight"
                inputMode="decimal"
                value={form.idWeight}
                onChange={(event) => patch({ idWeight: event.target.value })}
                placeholder="0.500000" />
              <p className="text-xs text-muted-foreground">
                100 IDs × {formatDecimal(form.idWeight, 6) || '—'} ={' '}
                <span className="font-medium text-foreground">{preview ? formatDecimal(preview, 6) : '—'}</span> credits
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="version-effective-from">{isCreate ? 'Effective from' : 'Effective from (set on publish)'}</Label>
              <Input id="version-effective-from"
                type="datetime-local"
                value={form.effectiveFrom}
                disabled={!isCreate}
                onChange={(event) => patch({ effectiveFrom: event.target.value })} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Allow top-ups</p>
              <p className="text-xs text-muted-foreground">Customers on this version can buy extra credit packs.</p>
            </div>
            <Switch id="version-topup-allowed" checked={form.topupAllowed} onCheckedChange={(checked) => patch({ topupAllowed: checked })} />
          </div>

          {!isCreate && (
            <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              The effective date is only applied when this version is published, so it stays editable while the version is a draft.
            </p>
          )}

          {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <div className="mr-auto text-xs text-muted-foreground">
              {formatMoneyPreview(form.basePrice, currency)}
            </div>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreate ? 'Create draft' : 'Save draft'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatMoneyPreview(value: string, currency: string): React.ReactNode {
  if (!value) return null;
  return <Money value={value} currency={currency} />;
}
