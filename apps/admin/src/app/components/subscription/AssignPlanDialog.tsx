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
import { AdminOrganizationService } from '../../services/admin-organization.service';
import { SubscriptionApiError, SubscriptionService } from '../../services/subscription.service';
import type { AdminOrgListItem } from '../../types/organization.types';
import type { CreateSubscriptionPayload, OrganizationSubscription, SubscriptionPlan } from '../../types/subscription.types';

import { Money, cadenceLabel, formatDecimal } from './SubscriptionUI';

const TIMEZONES = ['UTC', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Cairo', 'Europe/London', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata', 'America/New_York'];
const ANCHOR_DAYS = Array.from({ length: 28 }, (_, index) => index + 1);
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

interface AssignPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected organization. When omitted, the dialog renders an organization picker. */
  organizationId?: string;
  organizationLabel?: string;
  onCreated: (subscription: OrganizationSubscription) => void;
}

interface OrganizationPickerProps {
  organizations: AdminOrgListItem[];
  loading: boolean;
  value: string;
  onChange: (organizationId: string) => void;
}

function OrganizationPicker({ organizations, loading, value, onChange }: OrganizationPickerProps) {
  const [search, setSearch] = React.useState('');
  const needle = search.trim().toLowerCase();
  const filtered = organizations.filter((organization) =>
    (organization.display_name || organization.name).toLowerCase().includes(needle),
  );

  return (
    <div className="space-y-1.5">
      <Label htmlFor="assign-organization">Organization</Label>
      <Input aria-label="Search organizations"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search organizations" />
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger id="assign-organization">
          <SelectValue placeholder={loading ? 'Loading organizations…' : 'Select an organization'} />
        </SelectTrigger>
        <SelectContent>
          {filtered.map((organization) => (
            <SelectItem key={organization.id} value={organization.id}>
              {organization.display_name || organization.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">Provision an organization that has no subscription yet.</p>
    </div>
  );
}

function PlanPreview({ plan }: { plan: SubscriptionPlan | undefined }) {
  if (!plan?.published_version) return null;
  const version = plan.published_version;
  return (
    <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-4">
      <div>
        <p className="text-xs text-muted-foreground">Cadence</p>
        <p className="font-medium">{cadenceLabel(version.billing_cadence)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Fee</p>
        <p className="font-medium">
          <Money value={version.base_price} currency={plan.currency} />
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Credits</p>
        <p className="font-medium">{formatDecimal(version.included_credits, 2)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">ID weight</p>
        <p className="font-medium">{formatDecimal(version.id_weight, 6)}</p>
      </div>
    </div>
  );
}

export function AssignPlanDialog({ open, onOpenChange, organizationId, organizationLabel, onCreated }: AssignPlanDialogProps) {
  const keyFor = useIdempotencyKey();
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);
  const [organizations, setOrganizations] = React.useState<AdminOrgListItem[]>([]);
  const [selectedOrgId, setSelectedOrgId] = React.useState('');
  const [planId, setPlanId] = React.useState('');
  const [anchorDay, setAnchorDay] = React.useState('1');
  const [timezone, setTimezone] = React.useState('UTC');
  const [activationFee, setActivationFee] = React.useState('0');
  const [activationRequired, setActivationRequired] = React.useState(true);
  const [loadingPlans, setLoadingPlans] = React.useState(false);
  const [loadingOrgs, setLoadingOrgs] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const targetOrganizationId = organizationId || selectedOrgId;

  React.useEffect(() => {
    if (!open) return;
    setSelectedOrgId(organizationId ?? '');
    setPlanId('');
    setAnchorDay('1');
    setTimezone('UTC');
    setActivationFee('0');
    setActivationRequired(true);
    setError(null);
    let cancelled = false;
    setLoadingPlans(true);
    SubscriptionService.listPlans({ active: true, page: 1, page_size: 100 })
      .then((response) => {
        if (!cancelled) setPlans((response.items ?? []).filter((plan) => plan.published_version));
      })
      .catch(() => {
        if (!cancelled) setPlans([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPlans(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, organizationId]);

  React.useEffect(() => {
    if (!open || organizationId) return;
    let cancelled = false;
    setLoadingOrgs(true);
    AdminOrganizationService.list({ page: 1, page_size: 200 })
      .then((response) => {
        if (!cancelled) setOrganizations(response.organizations ?? []);
      })
      .catch(() => {
        if (!cancelled) setOrganizations([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingOrgs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, organizationId]);

  const selectedPlan = plans.find((plan) => plan.id === planId);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!targetOrganizationId) {
      setError('Select the organization to provision.');
      return;
    }
    if (!selectedPlan?.published_version) {
      setError('Select a plan with a published version.');
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

    const payload: CreateSubscriptionPayload = {
      plan_version_id: selectedPlan.published_version.id,
      billing_anchor_day: Number(anchorDay),
      billing_timezone: timezone.trim(),
      activation_fee: activationFee.trim(),
      activation_fee_required: activationRequired,
    };

    setSubmitting(true);
    setError(null);
    try {
      const subscription = await SubscriptionService.createSubscription(targetOrganizationId, payload, keyFor({ organizationId: targetOrganizationId, payload }));
      toast({ title: 'Subscription created', description: 'The activation invoice and payment link are now available.' });
      onOpenChange(false);
      onCreated(subscription);
    } catch (err) {
      const message = err instanceof SubscriptionApiError ? err.message : 'Could not create the subscription.';
      setError(message);
      toast({ variant: 'destructive', title: 'Subscription not created', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Assign a plan</DialogTitle>
          <DialogDescription>
            Only published versions can be assigned. The subscription starts as a draft until any required activation fee is verified.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {organizationId ? (
            <div className="rounded-lg border bg-muted/30 px-3 py-2">
              <p className="text-xs text-muted-foreground">Organization</p>
              <p className="text-sm font-medium">{organizationLabel || organizationId}</p>
            </div>
          ) : (
            <OrganizationPicker organizations={organizations}
              loading={loadingOrgs}
              value={selectedOrgId}
              onChange={setSelectedOrgId} />
          )}

          <div className="space-y-1.5">
            <Label htmlFor="assign-plan">Plan</Label>
            <Select value={planId} onValueChange={setPlanId} disabled={loadingPlans}>
              <SelectTrigger id="assign-plan">
                <SelectValue placeholder={loadingPlans ? 'Loading plans…' : 'Select a published plan'} />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.code} · {plan.name} · v{plan.published_version?.version}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <PlanPreview plan={selectedPlan} />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="assign-anchor-day">Billing anchor day</Label>
              <Select value={anchorDay} onValueChange={setAnchorDay}>
                <SelectTrigger id="assign-anchor-day">
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
              <p className="text-xs text-muted-foreground">Days 29–31 are clamped to month end.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="assign-timezone">Billing timezone</Label>
              <Input id="assign-timezone"
                list="billing-timezones"
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                placeholder="Africa/Lagos" />
              <datalist id="billing-timezones">
                {TIMEZONES.map((zone) => (
                  <option key={zone} value={zone} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="assign-activation-fee">Activation fee</Label>
            <Input id="assign-activation-fee"
              inputMode="decimal"
              value={activationFee}
              onChange={(event) => setActivationFee(event.target.value)}
              placeholder="2500.00" />
          </div>

          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <p className="text-sm font-medium">Activation fee required</p>
              <p className="text-xs text-muted-foreground">The tenant stays PENDING_ACTIVATION_PAYMENT until a verified payment is recorded.</p>
            </div>
            <Switch id="assign-activation-required" checked={activationRequired} onCheckedChange={setActivationRequired} />
          </div>

          {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || plans.length === 0}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create subscription
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
