import * as React from 'react';

import { Loader2, ShieldCheck } from 'lucide-react';

import { toast } from '@horizon-sync/ui';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
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

import { useIdempotencyKey } from '../../hooks/useIdempotencyKey';
import { SubscriptionApiError, SubscriptionService } from '../../services/subscription.service';

const PROVIDERS = ['paystack', 'flutterwave', 'stripe', 'bank_transfer'];
const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

interface ActivateSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  expectedFee: string | null;
  currency: string;
  onActivated: () => void;
}

export function ActivateSubscriptionDialog({ open, onOpenChange, organizationId, expectedFee, currency, onActivated }: ActivateSubscriptionDialogProps) {
  const keyFor = useIdempotencyKey();
  const [provider, setProvider] = React.useState(PROVIDERS[0]);
  const [reference, setReference] = React.useState('');
  const [amount, setAmount] = React.useState(expectedFee ?? '');
  const [verified, setVerified] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setProvider(PROVIDERS[0]);
    setReference('');
    setAmount(expectedFee ?? '');
    setVerified(false);
    setError(null);
  }, [open, expectedFee]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reference.trim()) {
      setError('Payment reference is required.');
      return;
    }
    if (amount.trim() && !MONEY_PATTERN.test(amount.trim())) {
      setError('Amount must have up to 2 decimals.');
      return;
    }
    if (!verified) {
      setError('Confirm the payment was verified server-side before activating.');
      return;
    }

    const payload = { provider, payment_reference: reference.trim(), ...(amount.trim() ? { amount: amount.trim() } : {}) };
    setSubmitting(true);
    setError(null);
    try {
      await SubscriptionService.activateSubscription(organizationId, payload, keyFor({ organizationId, payload }));
      toast({ title: 'Subscription activated', description: 'Recurring billing now follows the configured anchor.' });
      onOpenChange(false);
      onActivated();
    } catch (err) {
      const message = err instanceof SubscriptionApiError ? err.message : 'Could not activate the subscription.';
      setError(message);
      toast({ variant: 'destructive', title: 'Activation failed', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mark activation paid</DialogTitle>
          <DialogDescription>
            Enter the verified provider reference for the activation payment. A subscription is never activated by a browser redirect or an unverified webhook.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="activate-provider">Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger id="activate-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDERS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="activate-reference">Provider payment reference</Label>
            <Input id="activate-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="pay_123456789"
              autoComplete="off" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="activate-amount">Amount received ({currency})</Label>
            <Input id="activate-amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={expectedFee ?? '2500.00'} />
          </div>

          <div className="flex items-start gap-2 rounded-md border px-3 py-2">
            <Checkbox id="activate-verified" checked={verified} onCheckedChange={(checked) => setVerified(checked === true)} />
            <div className="space-y-1">
              <Label htmlFor="activate-verified" className="text-sm">
                I verified this payment with the provider
              </Label>
              <p className="text-xs text-muted-foreground">Amount, currency and organization must match the invoice.</p>
            </div>
          </div>

          {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
              Verify and activate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
