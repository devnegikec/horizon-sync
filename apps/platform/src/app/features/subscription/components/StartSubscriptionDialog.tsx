import * as React from 'react';

import { Loader2, Mail, ShieldCheck } from 'lucide-react';

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
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { AccountBillingService, BillingApiError, createIdempotencyKey } from '../services/account-billing.service';

import { Money, formatDecimal } from './BillingFormat';

const SUPPORT_EMAIL = 'billing@ciphercode.ai';
const TIMEZONES = ['UTC', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Cairo', 'Europe/London', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata', 'America/New_York'];
const ANCHOR_DAYS = Array.from({ length: 28 }, (_, index) => index + 1);
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

interface PlanOption {
  versionId: string;
  label: string;
  currency: string;
  basePrice: string;
  idWeight: string;
}

function toPlanOptions(items: Awaited<ReturnType<typeof AccountBillingService.listPlans>>['items']): PlanOption[] {
  return items.flatMap((plan) =>
    plan.published_version
      ? [
          {
            versionId: plan.published_version.id,
            label: `${plan.code} · ${plan.name} · v${plan.published_version.version}`,
            currency: plan.currency,
            basePrice: plan.published_version.base_price,
            idWeight: plan.published_version.id_weight,
          },
        ]
      : [],
  );
}

function StartSubscriptionForm({ organizationId, onCreated }: { organizationId: string; onCreated: () => void }) {
  const { toast } = useToast();
  const [options, setOptions] = React.useState<PlanOption[]>([]);
  const [versionId, setVersionId] = React.useState('');
  const [anchorDay, setAnchorDay] = React.useState('1');
  const [timezone, setTimezone] = React.useState('UTC');
  const [activationFee, setActivationFee] = React.useState('0');
  const [activationRequired, setActivationRequired] = React.useState(true);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    AccountBillingService.listPlans()
      .then((response) => {
        if (!cancelled) setOptions(toPlanOptions(response.items ?? []));
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

  const selected = options.find((option) => option.versionId === versionId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!versionId) {
      setError('Choose a plan.');
      return;
    }
    if (!MONEY_PATTERN.test(activationFee.trim())) {
      setError('Activation fee must be a non-negative amount with up to 2 decimals.');
      return;
    }
    if (!timezone.trim()) {
      setError('Billing timezone is required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await AccountBillingService.createSubscription(
        organizationId,
        {
          plan_version_id: versionId,
          billing_anchor_day: Number(anchorDay),
          billing_timezone: timezone.trim(),
          activation_fee: activationFee.trim(),
          activation_fee_required: activationRequired,
        },
        createIdempotencyKey(),
      );
      toast({
        title: 'Subscription created',
        description: activationRequired ? 'An activation invoice was issued — mark it paid once verified.' : 'Your plan is now active.',
      });
      onCreated();
    } catch (err) {
      setError(err instanceof BillingApiError ? err.message : 'Could not create the subscription.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-1.5">
        <Label htmlFor="start-plan">Plan</Label>
        <Select value={versionId} onValueChange={setVersionId} disabled={loading || options.length === 0}>
          <SelectTrigger id="start-plan">
            <SelectValue placeholder={loading ? 'Loading plans…' : options.length === 0 ? 'No published plans available' : 'Select a plan'} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.versionId} value={option.versionId}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!loading && options.length === 0 && <p className="text-xs text-muted-foreground">No published plans exist yet — ask operations to publish one.</p>}
      </div>

      {selected && (
        <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Recurring fee</p>
            <p className="font-medium">
              <Money value={selected.basePrice} currency={selected.currency} />
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ID weight</p>
            <p className="font-medium">{formatDecimal(selected.idWeight, 6)} credits per ID</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="start-anchor">Billing anchor day</Label>
          <Select value={anchorDay} onValueChange={setAnchorDay}>
            <SelectTrigger id="start-anchor">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANCHOR_DAYS.map((day) => (
                <SelectItem key={day} value={String(day)}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="start-timezone">Billing timezone</Label>
          <Input id="start-timezone" list="start-timezones" value={timezone} onChange={(event) => setTimezone(event.target.value)} />
          <datalist id="start-timezones">
            {TIMEZONES.map((zone) => (
              <option key={zone} value={zone} />
            ))}
          </datalist>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="start-activation-fee">Activation fee</Label>
        <Input id="start-activation-fee" inputMode="decimal" value={activationFee} onChange={(event) => setActivationFee(event.target.value)} />
      </div>

      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
        <div>
          <p className="text-sm font-medium">Activation fee required</p>
          <p className="text-xs text-muted-foreground">The subscription stays pending until a verified activation payment is recorded.</p>
        </div>
        <Switch id="start-activation-required" checked={activationRequired} onCheckedChange={setActivationRequired} />
      </div>

      {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="submit" disabled={busy || options.length === 0}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
          Create subscription
        </Button>
      </DialogFooter>
    </form>
  );
}

function ActivationRequest({ organizationId }: { organizationId: string }) {
  const subject = encodeURIComponent('Subscription activation request');
  const body = encodeURIComponent(
    `Organization ID: ${organizationId}\nRequested plan: \nBilling contact: \n\nPlease activate a subscription for this organization.`,
  );
  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-3 text-sm">
        <p className="text-xs text-muted-foreground">Organization</p>
        <p className="font-mono text-xs">{organizationId}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Plans are assigned by Ciphercode operations so pricing, credits and the activation fee are recorded correctly. Send a request with your preferred plan and billing contact —
        you will receive an activation invoice and payment link.
      </p>
      <p className="text-xs text-muted-foreground">Already paid? Mention your payment reference in the email so the team can match it.</p>
      <DialogFooter>
        <Button type="button" asChild>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}>
            <Mail className="mr-2 h-4 w-4" />
            Request activation
          </a>
        </Button>
      </DialogFooter>
    </div>
  );
}

export function StartSubscriptionDialog({
  open,
  onOpenChange,
  organizationId,
  canSelfServe,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  canSelfServe: boolean;
  onCreated: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{canSelfServe ? 'Set up a subscription' : 'Request a subscription'}</DialogTitle>
          <DialogDescription>
            {canSelfServe
              ? 'Assign a published plan version to this organization. Only ops users with billing permissions can complete this step.'
              : 'Your organization has no subscription yet. Request activation from Ciphercode operations.'}
          </DialogDescription>
        </DialogHeader>
        {canSelfServe ? (
          <StartSubscriptionForm organizationId={organizationId}
            onCreated={() => {
              onOpenChange(false);
              onCreated();
            }} />
        ) : (
          <ActivationRequest organizationId={organizationId} />
        )}
      </DialogContent>
    </Dialog>
  );
}
