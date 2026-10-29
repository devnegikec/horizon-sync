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
import type { AdjustmentDirection, CreditAdjustmentPayload } from '../../types/subscription.types';

import { CreditQuantity, formatDecimal } from './SubscriptionUI';

const DECIMAL_PATTERN = /^\d+(\.\d{1,6})?$/;

function defaultExpiry(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 12);
  return date.toISOString().slice(0, 10);
}

function previewClass(resulting: number | null): string {
  return resulting !== null && resulting < 0 ? 'text-destructive' : 'font-medium';
}

function validateAdjustment(input: {
  validQuantity: boolean;
  isNegative: boolean;
  expiresAt: string;
  reason: string;
  quantityValue: number;
  balanceValue: number;
}): string | null {
  if (!input.validQuantity) return 'Quantity must be a positive decimal with up to 6 dp.';
  if (!input.isNegative && !input.expiresAt) return 'An expiry date is required for positive adjustments.';
  if (input.reason.trim().length < 10) return 'Reason must be at least 10 characters.';
  if (input.isNegative && input.quantityValue > input.balanceValue) return 'This adjustment would take the balance below zero.';
  return null;
}

interface CreditAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  availableBalance: string;
  onDone: () => void;
}

export function CreditAdjustmentDialog({ open, onOpenChange, organizationId, availableBalance, onDone }: CreditAdjustmentDialogProps) {
  const keyFor = useIdempotencyKey();
  const [direction, setDirection] = React.useState<AdjustmentDirection>('adjust_positive');
  const [quantity, setQuantity] = React.useState('');
  const [expiresAt, setExpiresAt] = React.useState(defaultExpiry());
  const [reason, setReason] = React.useState('');
  const [approvalId, setApprovalId] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setDirection('adjust_positive');
    setQuantity('');
    setExpiresAt(defaultExpiry());
    setReason('');
    setApprovalId('');
    setError(null);
  }, [open]);

  // Display-only preview. The server remains authoritative and rejects negative balances with 422 INSUFFICIENT_BALANCE.
  const quantityValue = Number(quantity.trim());
  const balanceValue = Number(availableBalance) || 0;
  const validQuantity = DECIMAL_PATTERN.test(quantity.trim()) && quantityValue > 0;
  const isNegative = direction === 'adjust_negative';
  const resulting = validQuantity ? (isNegative ? balanceValue - quantityValue : balanceValue + quantityValue) : null;

  const validate = (): string | null =>
    validateAdjustment({ validQuantity, isNegative, expiresAt, reason, quantityValue, balanceValue });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: CreditAdjustmentPayload = {
      organization_id: organizationId,
      direction,
      quantity: quantity.trim(),
      expires_at: isNegative ? null : new Date(expiresAt).toISOString(),
      reason: reason.trim(),
      approval_id: approvalId.trim() || null,
    };

    setSubmitting(true);
    setError(null);
    try {
      await SubscriptionService.adjustCredits(payload, keyFor(payload));
      toast({ title: 'Adjustment recorded', description: 'A compensating ledger entry was written.' });
      onOpenChange(false);
      onDone();
    } catch (err) {
      const message = err instanceof SubscriptionApiError ? err.message : 'Could not record the adjustment.';
      setError(message);
      toast({ variant: 'destructive', title: 'Adjustment failed', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjust credits</DialogTitle>
          <DialogDescription>
            Adjustments are append-only ledger entries, never direct balance updates. Above the organization threshold an approval is required.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="adjustment-direction">Direction</Label>
              <Select value={direction} onValueChange={(value) => setDirection(value as AdjustmentDirection)}>
                <SelectTrigger id="adjustment-direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="adjust_positive">Add credits</SelectItem>
                  <SelectItem value="adjust_negative">Remove credits</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adjustment-quantity">Quantity</Label>
              <Input id="adjustment-quantity"
                inputMode="decimal"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="500.000000" />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Current available</span>
              <span><CreditQuantity value={availableBalance} /></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Resulting balance</span>
              <span className={previewClass(resulting)}>
                {resulting === null ? '—' : formatDecimal(resulting.toFixed(6), 6)}
              </span>
            </div>
          </div>

          {!isNegative && (
            <div className="space-y-1.5">
              <Label htmlFor="adjustment-expiry">Expires on</Label>
              <Input id="adjustment-expiry"
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)} />
              <p className="text-xs text-muted-foreground">Default validity is 12 calendar months from issuance.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="adjustment-reason">Reason</Label>
            <Textarea id="adjustment-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={2}
              placeholder="Goodwill — Q3 outage" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="adjustment-approval">Approval ID (above threshold)</Label>
            <Input id="adjustment-approval"
              value={approvalId}
              onChange={(event) => setApprovalId(event.target.value)}
              placeholder="Dual-approval request id"
              autoComplete="off" />
          </div>

          {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record adjustment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
