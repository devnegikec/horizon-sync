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
import { SubscriptionApiError, SubscriptionService } from '../../services/subscription.service';
import type { OrganizationSubscription, SubscriptionPlanVersion } from '../../types/subscription.types';

import { Money, cadenceLabel, defaultEffectiveFrom, formatDecimal, toIsoTimestamp } from './SubscriptionUI';

interface ChangeVersionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  current: OrganizationSubscription;
  onChanged: (subscription: OrganizationSubscription) => void;
}

function DiffRow({ label, before, after }: { label: string; before: React.ReactNode; after: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b py-1.5 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs">{before}</span>
      <span className="text-xs font-medium">{after}</span>
    </div>
  );
}

export function ChangeVersionDialog({ open, onOpenChange, current, onChanged }: ChangeVersionDialogProps) {
  const keyFor = useIdempotencyKey();
  const planId = current.plan?.id;
  const [versions, setVersions] = React.useState<SubscriptionPlanVersion[]>([]);
  const [versionId, setVersionId] = React.useState('');
  const [effectiveFrom, setEffectiveFrom] = React.useState(defaultEffectiveFrom());
  const [reason, setReason] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !planId) return;
    setVersions([]);
    setVersionId('');
    setEffectiveFrom(defaultEffectiveFrom());
    setReason('');
    setError(null);
    let cancelled = false;
    setLoading(true);
    SubscriptionService.getPlan(planId)
      .then((plan) => {
        if (cancelled) return;
        setVersions((plan.versions ?? []).filter((version) => version.status === 'published'));
      })
      .catch(() => {
        if (!cancelled) setVersions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, planId]);

  const selected = versions.find((version) => version.id === versionId);
  const currency = current.plan_version?.currency ?? 'USD';

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) {
      setError('Select a published version.');
      return;
    }
    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters.');
      return;
    }
    const iso = toIsoTimestamp(effectiveFrom);
    if (!iso) {
      setError('A valid effective date is required.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const updated = await SubscriptionService.changeSubscription(
        current.organization_id,
        { plan_version_id: selected.id, effective_from: iso, reason: reason.trim() },
        keyFor({ organizationId: current.organization_id, versionId: selected.id, iso, reason: reason.trim() }),
      );
      toast({ title: 'Version change scheduled', description: `Effective ${new Date(iso).toLocaleDateString()}. Prior usage keeps its original weight.` });
      onOpenChange(false);
      onChanged(updated);
    } catch (err) {
      const message = err instanceof SubscriptionApiError ? err.message : 'Could not change the version.';
      setError(message);
      toast({ variant: 'destructive', title: 'Version change failed', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  const currentVersion = current.plan_version;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Change contract version</DialogTitle>
          <DialogDescription>
            Version changes are effective-dated. Usage before the effective date keeps its original weight and invoices are never recalculated.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="change-version">New published version</Label>
            <Select value={versionId} onValueChange={setVersionId} disabled={loading}>
              <SelectTrigger id="change-version">
                <SelectValue placeholder={loading ? 'Loading versions…' : 'Select a version'} />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id} disabled={version.id === currentVersion?.id}>
                    v{version.version} · {cadenceLabel(version.billing_cadence)} · {formatDecimal(version.base_price, 2)} · weight {formatDecimal(version.id_weight, 6)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {currentVersion && selected && (
            <div className="rounded-lg border p-3">
              <div className="grid grid-cols-3 gap-2 pb-1 text-xs font-medium text-muted-foreground">
                <span>Field</span>
                <span>Current v{currentVersion.version}</span>
                <span>New v{selected.version}</span>
              </div>
              <DiffRow label="Cadence" before={cadenceLabel(currentVersion.billing_cadence)} after={cadenceLabel(selected.billing_cadence)} />
              <DiffRow label="Base price"
                before={<Money value={currentVersion.base_price} currency={currency} />}
                after={<Money value={selected.base_price} currency={currency} />} />
              <DiffRow label="Included credits"
                before={formatDecimal(currentVersion.included_credits, 2)}
                after={formatDecimal(selected.included_credits, 2)} />
              <DiffRow label="ID weight"
                before={formatDecimal(currentVersion.id_weight, 6)}
                after={formatDecimal(selected.id_weight, 6)} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="change-effective-from">Effective from</Label>
            <Input id="change-effective-from"
              type="datetime-local"
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="change-reason">Reason</Label>
            <Textarea id="change-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={2}
              placeholder="Signed annual renewal" />
            <p className="text-xs text-muted-foreground">Minimum 10 characters — recorded in the audit trail.</p>
          </div>

          {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || versions.length === 0}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Schedule change
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
