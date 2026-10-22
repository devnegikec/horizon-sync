import * as React from 'react';

import { CheckCircle2, CreditCard, ExternalLink, Loader2, RefreshCw, XCircle } from 'lucide-react';

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
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { AccountBillingService, BillingApiError, createIdempotencyKey } from '../services/account-billing.service';
import { openRazorpayCheckout, type RazorpayPaymentResult } from '../services/razorpay-checkout';
import type { TopupOrder, TopupQuote } from '../types';

import { Money, formatDate, formatDateTime, formatDecimal } from './BillingFormat';

const QUICK_AMOUNTS = ['1000', '5000', '10000', '25000'];
const DECIMAL_PATTERN = /^\d+(\.\d{1,6})?$/;
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 60000;
/** Payment provider used for top-ups (the backend creates the Razorpay order). */
const PROVIDER = 'razorpay';

interface BuyCreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
  onPaid: () => void;
}

function orderStatusCopy(order: TopupOrder): string {
  if (order.status === 'paid') return 'Payment confirmed — credits added.';
  if (order.status === 'failed') return 'Payment failed — no credits were added.';
  if (order.status === 'cancelled') return 'Order cancelled — no credits were added.';
  return 'Waiting for payment confirmation…';
}

type Step = 'amount' | 'quote' | 'order';

function dialogStep(quote: TopupQuote | null, order: TopupOrder | null): Step {
  if (order) return 'order';
  if (quote) return 'quote';
  return 'amount';
}

function AmountStep({ amount, busy, onChange, onContinue }: { amount: string; busy: boolean; onChange: (value: string) => void; onContinue: () => void }) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="topup-credits">Credits to purchase</Label>
        <Input id="topup-credits"
          inputMode="decimal"
          value={amount}
          onChange={(event) => onChange(event.target.value)}
          placeholder="5000.000000" />
        <div className="flex flex-wrap gap-2 pt-1">
          {QUICK_AMOUNTS.map((value) => (
            <Button key={value} type="button" size="sm" variant="outline" onClick={() => onChange(value)}>
              {formatDecimal(value, 2)}
            </Button>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Credits expire 12 months after they are issued.</p>
      <Button type="button" className="w-full" onClick={onContinue} disabled={busy}>
        {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Continue
      </Button>
    </>
  );
}

function QuoteStep({ quote, busy, onBack, onPay }: { quote: TopupQuote; busy: boolean; onBack: () => void; onPay: () => void }) {
  return (
    <>
      <div className="space-y-2 rounded-lg border p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Credits</span>
          <span className="font-medium tabular-nums">{formatDecimal(quote.credits, 2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <Money value={quote.subtotal} currency={quote.currency} />
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tax</span>
          <Money value={quote.tax_amount} currency={quote.currency} />
        </div>
        <div className="flex justify-between border-t pt-2 font-medium">
          <span>Total payable</span>
          <Money value={quote.total} currency={quote.currency} />
        </div>
        <p className="pt-1 text-xs text-muted-foreground">
          Credits valid until {formatDate(quote.credit_expires_at)} · quote expires {formatDateTime(quote.expires_at)}
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onBack} disabled={busy}>
          Back
        </Button>
        <Button type="button" onClick={onPay} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
          Pay now
        </Button>
      </div>
    </>
  );
}

function OrderStep({ order, currency, polling, onRefresh }: { order: TopupOrder; currency: string; polling: boolean; onRefresh: () => void }) {
  const settled = order.status === 'paid' || order.status === 'failed' || order.status === 'cancelled';
  return (
    <>
      <div className="space-y-3 rounded-lg border p-3 text-sm">
        <div className="flex items-center gap-2">
          {order.status === 'paid' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : settled ? (
            <XCircle className="h-4 w-4 text-destructive" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <p className="font-medium">{orderStatusCopy(order)}</p>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Credits</span>
          <span className="tabular-nums">{formatDecimal(order.credits, 2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Amount</span>
          <Money value={order.amount} currency={order.currency || currency} />
        </div>
        <p className="text-xs text-muted-foreground">Order {order.order_id.slice(0, 8)}…</p>
        {order.checkout_url && (
          <Button type="button" variant="outline" size="sm" onClick={() => window.open(order.checkout_url ?? '', '_blank', 'noopener,noreferrer')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Reopen checkout
          </Button>
        )}
      </div>
      {!settled && (
        <Button type="button" variant="outline" className="w-full" onClick={onRefresh} disabled={polling}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh status
        </Button>
      )}
    </>
  );
}

export function BuyCreditsDialog({ open, onOpenChange, currency, onPaid }: BuyCreditsDialogProps) {
  const { toast } = useToast();
  const [amount, setAmount] = React.useState('1000');
  const [quote, setQuote] = React.useState<TopupQuote | null>(null);
  const [order, setOrder] = React.useState<TopupOrder | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [polling, setPolling] = React.useState(false);
  const idempotencyRef = React.useRef<{ quoteId: string; key: string } | null>(null);
  const pollRef = React.useRef<number | null>(null);

  const stopPolling = React.useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  }, []);

  React.useEffect(() => {
    if (open) return;
    stopPolling();
    setAmount('1000');
    setQuote(null);
    setOrder(null);
    setError(null);
    setBusy(false);
  }, [open, stopPolling]);

  React.useEffect(() => stopPolling, [stopPolling]);

  const applyOrder = React.useCallback(
    (latest: TopupOrder) => {
      setOrder(latest);
      if (latest.status === 'paid') {
        stopPolling();
        toast({ title: 'Credits added', description: `${formatDecimal(latest.credits, 2)} credits were added to your balance.` });
        onPaid();
      }
      if (latest.status === 'failed' || latest.status === 'cancelled') {
        stopPolling();
        setError(orderStatusCopy(latest));
      }
    },
    [onPaid, stopPolling, toast],
  );

  const startPolling = React.useCallback(
    (orderId: string) => {
      if (pollRef.current !== null) window.clearInterval(pollRef.current);
      let elapsed = 0;
      setPolling(true);
      pollRef.current = window.setInterval(async () => {
        elapsed += POLL_INTERVAL_MS;
        try {
          applyOrder(await AccountBillingService.getOrder(orderId));
        } catch {
          // Transient poll failure — keep waiting until the timeout.
        }
        if (elapsed >= POLL_TIMEOUT_MS) stopPolling();
      }, POLL_INTERVAL_MS);
    },
    [applyOrder, stopPolling],
  );

  /** Verifies the Checkout signature with the server, then falls back to polling. */
  const verifyAndFinish = React.useCallback(
    async (orderId: string, payment: RazorpayPaymentResult) => {
      try {
        const verified = await AccountBillingService.verifyTopupOrder(orderId, payment);
        if (verified) {
          applyOrder(verified);
          if (verified.status === 'paid') return;
        }
      } catch {
        // Verify endpoint may not be deployed yet — the webhook remains the source of truth.
      }
      startPolling(orderId);
    },
    [applyOrder, startPolling],
  );

  /** Opens the Razorpay Checkout modal for an order created by the backend. */
  const startRazorpayCheckout = React.useCallback(
    async (created: TopupOrder) => {
      if (!created.razorpay) return;
      const outcome = await openRazorpayCheckout({
        key: created.razorpay.key_id,
        amount: created.razorpay.amount,
        currency: created.razorpay.currency,
        name: created.razorpay.name ?? 'Ciphercode',
        description: created.razorpay.description ?? 'QR credits top-up',
        order_id: created.razorpay.order_id,
        prefill: created.razorpay.prefill,
        theme: { color: '#7c3aed' },
      });
      if (outcome.status === 'success') {
        await verifyAndFinish(created.order_id, outcome.payment);
        return;
      }
      if (outcome.status === 'failed') {
        setError(outcome.message);
        return;
      }
      setError('Payment window closed before completion.');
    },
    [verifyAndFinish],
  );

  const requestQuote = async () => {
    if (!DECIMAL_PATTERN.test(amount.trim()) || Number(amount) <= 0) {
      setError('Enter a credit amount greater than zero (up to 6 decimals).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setQuote(await AccountBillingService.createQuote(amount.trim()));
    } catch (err) {
      setError(err instanceof BillingApiError ? err.message : 'Could not create a quote.');
    } finally {
      setBusy(false);
    }
  };

  const pay = async () => {
    if (!quote) return;
    setBusy(true);
    setError(null);
    // One key per quote: retrying the same checkout reuses it, a new quote gets a new key.
    if (idempotencyRef.current?.quoteId !== quote.quote_id) {
      idempotencyRef.current = { quoteId: quote.quote_id, key: createIdempotencyKey() };
    }
    try {
      const created = await AccountBillingService.createOrder(quote.quote_id, idempotencyRef.current.key, PROVIDER);
      setOrder(created);
      if (created.razorpay) {
        startPolling(created.order_id);
        await startRazorpayCheckout(created);
        return;
      }
      if (created.checkout_url) window.open(created.checkout_url, '_blank', 'noopener,noreferrer');
      startPolling(created.order_id);
    } catch (err) {
      setError(err instanceof BillingApiError ? err.message : 'Could not start the payment.');
    } finally {
      setBusy(false);
    }
  };

  const refreshOrder = async () => {
    if (!order) return;
    try {
      applyOrder(await AccountBillingService.getOrder(order.order_id));
    } catch (err) {
      setError(err instanceof BillingApiError ? err.message : 'Could not refresh the order.');
    }
  };

  const step = dialogStep(quote, order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Buy credits</DialogTitle>
          <DialogDescription>
            Server-priced top-up. Credits are granted only after the provider confirms payment; the redirect alone never adds credits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'amount' && (
            <AmountStep amount={amount} busy={busy} onChange={setAmount} onContinue={() => void requestQuote()} />
          )}
          {step === 'quote' && quote && (
            <QuoteStep quote={quote} busy={busy} onBack={() => setQuote(null)} onPay={() => void pay()} />
          )}
          {step === 'order' && order && (
            <OrderStep order={order} currency={currency} polling={polling} onRefresh={() => void refreshOrder()} />
          )}

          {error && <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
