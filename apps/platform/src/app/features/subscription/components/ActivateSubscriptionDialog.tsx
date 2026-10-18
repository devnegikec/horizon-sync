import * as React from 'react';

import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { DummyPaymentService } from '../services/dummy-payment.service';
import type { AccountSubscription } from '../types';

import { Money } from './BillingFormat';

const METHODS = [
  { value: 'test_card', label: 'Test card (instant)' },
  { value: 'bank_transfer', label: 'Bank transfer (simulated)' },
];

/**
 * TEMPORARY activation payment.
 *
 * Uses `DummyPaymentService` — no card is charged and no provider is called. It
 * exists so the activation state can be exercised until Core ships a customer
 * activation endpoint and verified provider webhooks.
 */
export function ActivateSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  onActivated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: AccountSubscription;
  onActivated: () => void;
}) {
  const { toast } = useToast();
  const [method, setMethod] = React.useState(METHODS[0].value);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const currency = subscription.plan_version.currency ?? 'USD';

  React.useEffect(() => {
    if (!open) return;
    setMethod(METHODS[0].value);
    setBusy(false);
    setError(null);
  }, [open]);

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      const record = await DummyPaymentService.processActivationPayment({
        organizationId: subscription.organization_id,
        amount: subscription.activation_fee,
        currency,
        method,
      });
      toast({ title: 'Payment successful', description: `Activation complete (test reference ${record.reference}).` });
      onOpenChange(false);
      onActivated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Activation payment failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Activate subscription</DialogTitle>
            <Badge variant="warning">Test mode</Badge>
          </div>
          <DialogDescription>
            Complete the activation payment to start generating IDs. This is a simulated payment — no card is charged and
            nothing is sent to the provider.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 rounded-lg border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">
                {subscription.plan.name} · v{subscription.plan_version.version}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Activation fee</span>
              <span className="font-medium">
                <Money value={subscription.activation_fee} currency={currency} />
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="activation-method">Payment method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="activation-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHODS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            Activation is recorded locally for testing only. Real provider verification and webhooks are still pending.
          </p>

          {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void pay()} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
              Pay & activate
              <ShieldCheck className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
