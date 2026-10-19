import * as React from 'react';

import { AlertTriangle, Loader2 } from 'lucide-react';

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
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useIdempotencyKey } from '../../hooks/useIdempotencyKey';
import { SubscriptionApiError, SubscriptionService } from '../../services/subscription.service';

export type SubscriptionLifecycleAction = 'suspend' | 'reinstate' | 'close';

const ACTION_COPY: Record<SubscriptionLifecycleAction, { title: string; description: string; confirm: string; destructive: boolean }> = {
  suspend: {
    title: 'Suspend subscription',
    description: 'Service is blocked for this organization until it is reinstated. Existing credit batches are not deleted.',
    confirm: 'Suspend',
    destructive: true,
  },
  reinstate: {
    title: 'Reinstate subscription',
    description: 'Restores active service. Any outstanding invoices stay outstanding.',
    confirm: 'Reinstate',
    destructive: false,
  },
  close: {
    title: 'Close subscription',
    description: 'Closing is destructive and ends the contract. Credits and invoices remain on the ledger for audit.',
    confirm: 'Close subscription',
    destructive: true,
  },
};

interface SubscriptionActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: SubscriptionLifecycleAction;
  organizationId: string;
  organizationLabel: string;
  onDone: () => void;
}

export function SubscriptionActionDialog({ open, onOpenChange, action, organizationId, organizationLabel, onDone }: SubscriptionActionDialogProps) {
  const keyFor = useIdempotencyKey();
  const copy = ACTION_COPY[action];
  const [reason, setReason] = React.useState('');
  const [confirmation, setConfirmation] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setReason('');
    setConfirmation('');
    setError(null);
  }, [open, action]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters.');
      return;
    }
    if (action === 'close' && confirmation.trim() !== organizationLabel) {
      setError(`Type ${organizationLabel} to confirm.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = { organizationId, reason: reason.trim() };
      const key = keyFor({ action, payload });
      if (action === 'suspend') await SubscriptionService.suspendSubscription(organizationId, reason.trim(), key);
      if (action === 'reinstate') await SubscriptionService.reinstateSubscription(organizationId, reason.trim(), key);
      if (action === 'close') await SubscriptionService.closeSubscription(organizationId, reason.trim(), key);
      toast({ title: copy.title.replace(' subscription', '') + 'ed', description: `${organizationLabel} updated.` });
      onOpenChange(false);
      onDone();
    } catch (err) {
      const message = err instanceof SubscriptionApiError ? err.message : 'The subscription could not be updated.';
      setError(message);
      toast({ variant: 'destructive', title: 'Action failed', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {copy.destructive && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>This action is recorded in the audit trail and requires a reason.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="subscription-action-reason">Reason</Label>
            <Textarea id="subscription-action-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Minimum 10 characters" />
          </div>

          {action === 'close' && (
            <div className="space-y-1.5">
              <Label htmlFor="subscription-action-confirmation">Type {organizationLabel} to confirm</Label>
              <Input id="subscription-action-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                autoComplete="off"
                placeholder={organizationLabel} />
            </div>
          )}

          {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant={copy.destructive ? 'destructive' : 'default'} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {copy.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
