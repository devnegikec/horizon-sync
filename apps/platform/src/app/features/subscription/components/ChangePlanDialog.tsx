import * as React from 'react';

import { Loader2, Mail } from 'lucide-react';

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
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { AccountBillingService, BillingApiError, createIdempotencyKey } from '../services/account-billing.service';
import type { AccountSubscription } from '../types';

import { Money, formatDecimal } from './BillingFormat';

const SUPPORT_EMAIL = 'billing@ciphercode.ai';

interface PlanOption {
  id: string;
  code: string;
  name: string;
  currency: string;
  published_version: { id: string; version: number; billing_cadence: string; base_price: string; id_weight: string } | null;
}

function defaultEffectiveFrom(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(0, 0, 0, 0);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Ops-only form: switch the org to another published plan version (effective-dated). */
function AdminPlanChangeForm({ subscription, onDone, onClose }: { subscription: AccountSubscription; onDone: () => void; onClose: () => void }) {
  const { toast } = useToast();
  const [plans, setPlans] = React.useState<PlanOption[]>([]);
  const [versionId, setVersionId] = React.useState('');
  const [options, setOptions] = React.useState<Array<{ versionId: string; label: string }>>([]);
  const [effectiveFrom, setEffectiveFrom] = React.useState(defaultEffectiveFrom());
  const [reason, setReason] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    AccountBillingService.listPlans()
      .then((response) => {
        if (cancelled) return;
        const items = response.items ?? [];
        setPlans(items);
        setOptions(
          items.flatMap((plan) =>
            plan.published_version
              ? [
                  {
                    versionId: plan.published_version.id,
                    label: `${plan.code} · v${plan.published_version.version} · ${formatDecimal(plan.published_version.base_price, 2)} ${plan.currency}`,
                  },
                ]
              : [],
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!versionId) {
      setError('Select a published plan version.');
      return;
    }
    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters.');
      return;
    }
    const effective = new Date(effectiveFrom);
    if (Number.isNaN(effective.getTime())) {
      setError('Choose a valid effective date.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await AccountBillingService.changePlan(
        subscription.organization_id,
        { plan_version_id: versionId, effective_from: effective.toISOString(), reason: reason.trim() },
        createIdempotencyKey(),
      );
      toast({ title: 'Plan change scheduled', description: 'The new version applies from the effective date.' });
      onClose();
      onDone();
    } catch (err) {
      setError(err instanceof BillingApiError ? err.message : 'Could not change the plan.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-1.5">
        <Label htmlFor="plan-change-version">New published version</Label>
        <Select value={versionId} onValueChange={setVersionId} disabled={loading || options.length === 0}>
          <SelectTrigger id="plan-change-version">
            <SelectValue placeholder={loading ? 'Loading plans…' : options.length === 0 ? 'No published plans available' : 'Select a plan version'} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.versionId} value={option.versionId}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {plans.length === 0 && !loading && <p className="text-xs text-muted-foreground">There are no published plans to switch to.</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="plan-change-effective">Effective from</Label>
        <Input id="plan-change-effective" type="datetime-local" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} />
        <p className="text-xs text-muted-foreground">Usage before the effective date keeps its original ID weight.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="plan-change-reason">Reason</Label>
        <Textarea id="plan-change-reason" rows={2} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Signed annual renewal" />
      </div>

      {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy || options.length === 0}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Schedule change
        </Button>
      </DialogFooter>
    </form>
  );
}

function PlanChangeRequest({ subscription }: { subscription: AccountSubscription }) {
  const version = subscription.plan_version;
  const subject = encodeURIComponent(`Plan change request — ${subscription.plan.code}`);
  const body = encodeURIComponent(
    `Organization: ${subscription.organization_id}\nCurrent plan: ${subscription.plan.name} (${subscription.plan.code}) v${version.version}\nRequested change: `,
  );
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-3 text-sm">
        <p className="text-xs text-muted-foreground">Current plan</p>
        <p className="font-medium">
          {subscription.plan.name} · v{version.version}
        </p>
        <p className="text-xs text-muted-foreground">
          <Money value={version.base_price} currency={version.currency ?? 'USD'} /> · {formatDecimal(version.id_weight, 6)} credits per ID
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Plan changes are applied by Ciphercode operations so pricing, credits and activation rules stay consistent. Send a request and the team will arrange the effective date.
      </p>
      <DialogFooter>
        <Button type="button" asChild>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}>
            <Mail className="mr-2 h-4 w-4" />
            Request plan change
          </a>
        </Button>
      </DialogFooter>
    </div>
  );
}

export function ChangePlanDialog({
  open,
  onOpenChange,
  subscription,
  adminMode,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: AccountSubscription;
  adminMode: boolean;
  onDone: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Change plan</DialogTitle>
          <DialogDescription>
            Published versions are immutable. Existing invoices and prior usage are never recalculated.
          </DialogDescription>
        </DialogHeader>
        {adminMode ? (
          <AdminPlanChangeForm subscription={subscription} onDone={onDone} onClose={() => onOpenChange(false)} />
        ) : (
          <PlanChangeRequest subscription={subscription} />
        )}
      </DialogContent>
    </Dialog>
  );
}
