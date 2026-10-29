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
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useIdempotencyKey } from '../../hooks/useIdempotencyKey';
import { AdminOrganizationService } from '../../services/admin-organization.service';
import { SubscriptionApiError, SubscriptionService } from '../../services/subscription.service';
import type { AdminOrgListItem } from '../../types/organization.types';
import type { CreatePlanPayload, SubscriptionPlan } from '../../types/subscription.types';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'NGN', 'INR', 'ZAR', 'KES'];
const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{1,59}$/;

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (plan: SubscriptionPlan) => void;
}

function validate(code: string, name: string, currency: string, scope: string, organizationId: string): string | null {
  if (!CODE_PATTERN.test(code)) return 'Code must be 2–60 characters: A–Z, 0–9, dashes and underscores only.';
  if (!name.trim()) return 'Name is required.';
  if (currency.trim().length !== 3) return 'Currency must be a 3-letter ISO-4217 code.';
  if (scope === 'organization' && !organizationId) return 'Select the organization this plan belongs to.';
  return null;
}

export function CreatePlanDialog({ open, onOpenChange, onCreated }: CreatePlanDialogProps) {
  const keyFor = useIdempotencyKey();
  const [code, setCode] = React.useState('');
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [currency, setCurrency] = React.useState('USD');
  const [scope, setScope] = React.useState<'global' | 'organization'>('global');
  const [organizationId, setOrganizationId] = React.useState('');
  const [organizations, setOrganizations] = React.useState<AdminOrgListItem[]>([]);
  const [loadingOrgs, setLoadingOrgs] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setCode('');
    setName('');
    setDescription('');
    setCurrency('USD');
    setScope('global');
    setOrganizationId('');
    setError(null);
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingOrgs(true);
    AdminOrganizationService.list({ page: 1, page_size: 100 })
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
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();
    const validationError = validate(normalizedCode, name, currency, scope, organizationId);
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: CreatePlanPayload = {
      code: normalizedCode,
      name: name.trim(),
      description: description.trim() || null,
      currency: currency.trim().toUpperCase(),
      organization_id: scope === 'organization' ? organizationId : null,
    };

    setSubmitting(true);
    setError(null);
    try {
      const plan = await SubscriptionService.createPlan(payload, keyFor(payload));
      toast({ title: 'Plan created', description: `${plan.code} is ready for its first version.` });
      onOpenChange(false);
      onCreated(plan);
    } catch (err) {
      const message = err instanceof SubscriptionApiError ? err.message : 'Could not create the plan.';
      setError(message);
      toast({ variant: 'destructive', title: 'Plan not created', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New plan</DialogTitle>
          <DialogDescription>
            A plan is the container. Pricing, credits and ID weight live in versioned contracts you publish afterwards.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-code">Code</Label>
              <Input id="plan-code"
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="ENT-GROWTH"
                autoComplete="off" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-name">Name</Label>
              <Input id="plan-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Enterprise Growth" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="plan-currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="plan-currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="plan-scope">Scope</Label>
              <Select value={scope} onValueChange={(value) => setScope(value as 'global' | 'organization')}>
                <SelectTrigger id="plan-scope">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global catalog</SelectItem>
                  <SelectItem value="organization">Organization-specific</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {scope === 'organization' && (
            <div className="space-y-1.5">
              <Label htmlFor="plan-organization">Organization</Label>
              <Select value={organizationId} onValueChange={setOrganizationId} disabled={loadingOrgs}>
                <SelectTrigger id="plan-organization">
                  <SelectValue placeholder={loadingOrgs ? 'Loading organizations…' : 'Select organization'} />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((organization) => (
                    <SelectItem key={organization.id} value={organization.id}>
                      {organization.display_name || organization.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="plan-description">Description</Label>
            <Textarea id="plan-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What this package includes"
              rows={3} />
          </div>

          {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create plan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
