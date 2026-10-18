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

import { useIdempotencyKey } from '../../hooks/useIdempotencyKey';
import { SubscriptionApiError, SubscriptionService } from '../../services/subscription.service';
import type { SubscriptionPlanVersion } from '../../types/subscription.types';

import { defaultEffectiveFrom, toDateTimeLocal, toIsoTimestamp } from './SubscriptionUI';

interface VersionActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  planCode: string;
  version: SubscriptionPlanVersion | null;
  onDone: () => void;
}

export function PublishVersionDialog({ open, onOpenChange, planId, planCode, version, onDone }: VersionActionDialogProps) {
  const keyFor = useIdempotencyKey();
  const [effectiveFrom, setEffectiveFrom] = React.useState(defaultEffectiveFrom());
  const [confirmation, setConfirmation] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setEffectiveFrom(version ? toDateTimeLocal(version.effective_from) || defaultEffectiveFrom() : defaultEffectiveFrom());
    setConfirmation('');
    setError(null);
  }, [open, version]);

  const handlePublish = async () => {
    if (!version) return;
    if (confirmation.trim().toUpperCase() !== planCode.toUpperCase()) {
      setError(`Type ${planCode} to confirm.`);
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
      await SubscriptionService.publishVersion(planId, version.id, iso, keyFor({ planId, versionId: version.id, iso }));
      toast({ title: 'Version published', description: `${planCode} v${version.version} is effective from ${new Date(iso).toLocaleDateString()}.` });
      onOpenChange(false);
      onDone();
    } catch (err) {
      const message = err instanceof SubscriptionApiError ? err.message : 'Could not publish this version.';
      setError(message);
      toast({ variant: 'destructive', title: 'Publish failed', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish {planCode} v{version?.version ?? ''}</DialogTitle>
          <DialogDescription>
            Published versions are immutable and affect only subscriptions assigned this version from the effective date. Existing invoices and prior usage are not recalculated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="publish-effective-from">Effective from</Label>
            <Input id="publish-effective-from"
              type="datetime-local"
              value={effectiveFrom}
              onChange={(event) => setEffectiveFrom(event.target.value)} />
            <p className="text-xs text-muted-foreground">Must be in the future. Another published version may not overlap this window.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="publish-confirmation">Type {planCode} to confirm</Label>
            <Input id="publish-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              placeholder={planCode} />
          </div>

          {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" onClick={handlePublish} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Publish version
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RetireVersionDialog({ open, onOpenChange, planId, planCode, version, onDone }: VersionActionDialogProps) {
  const keyFor = useIdempotencyKey();
  const [effectiveTo, setEffectiveTo] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setEffectiveTo(toDateTimeLocal(new Date().toISOString()));
    setError(null);
  }, [open]);

  const handleRetire = async () => {
    if (!version) return;
    const iso = toIsoTimestamp(effectiveTo);
    setSubmitting(true);
    setError(null);
    try {
      await SubscriptionService.retireVersion(planId, version.id, iso, keyFor({ planId, versionId: version.id, iso }));
      toast({ title: 'Version retired', description: `${planCode} v${version.version} no longer applies to new assignments.` });
      onOpenChange(false);
      onDone();
    } catch (err) {
      const message = err instanceof SubscriptionApiError ? err.message : 'Could not retire this version.';
      setError(message);
      toast({ variant: 'destructive', title: 'Retire failed', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Retire {planCode} v{version?.version ?? ''}</DialogTitle>
          <DialogDescription>
            Retiring closes the effective window. Subscriptions keep their contract snapshot; no invoice or ledger entry is changed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="retire-effective-to">Effective to</Label>
            <Input id="retire-effective-to"
              type="datetime-local"
              value={effectiveTo}
              onChange={(event) => setEffectiveTo(event.target.value)} />
          </div>

          {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleRetire} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Retire version
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
