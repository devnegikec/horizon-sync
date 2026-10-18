import * as React from 'react';

import { AlertTriangle, Coins, Info, ShieldAlert, ShieldCheck } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

import type { AccountCredits, AccountSubscription } from '../types';

import { CreditQuantity, StatusPill, formatDate, formatDateTime, formatDecimal } from './BillingFormat';

function cadenceCopy(cadence: string): string {
  if (cadence === 'annually') return 'Billed annually';
  if (cadence === 'quarterly') return 'Billed quarterly';
  if (cadence === 'monthly') return 'Billed monthly';
  return cadence;
}

export function StatusBanner({ subscription, onActivate }: { subscription: AccountSubscription; onActivate?: () => void }) {
  if (subscription.status === 'pending_activation_payment') {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
          <p>Activate your account to start generating IDs. Complete the activation payment to unlock issuance.</p>
          {onActivate && (
            <Button size="sm" onClick={onActivate}>
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
              Activate subscription
            </Button>
          )}
        </div>
      </div>
    );
  }
  if (subscription.status === 'overdue') {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Payment is overdue{subscription.grace_until ? ` — grace period ends ${formatDate(subscription.grace_until)}` : ''}. Credits stay visible, but issuance may pause.
        </p>
      </div>
    );
  }
  if (subscription.status === 'suspended') {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Issuance is paused while this subscription is suspended. Contact support to reinstate.</p>
      </div>
    );
  }
  if (subscription.status === 'closed') {
    return (
      <div className="flex items-start gap-2 rounded-lg border px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>This subscription is closed. You can still view invoices and credit history.</p>
      </div>
    );
  }
  return null;
}

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}

export function PlanFacts({ subscription }: { subscription: AccountSubscription }) {
  const version = subscription.plan_version;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Current plan</CardTitle>
        <StatusPill status={subscription.status} />
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Fact label="Plan" value={`${subscription.plan.name} · v${version.version}`} />
        <Fact label="Billing" value={cadenceCopy(subscription.billing_cadence)} />
        <Fact label="Next invoice" value={formatDate(subscription.next_invoice_date)} />
        <Fact label="Renews" value={formatDate(subscription.renewal_date)} />
        <Fact label="Credits per period" value={formatDecimal(subscription.included_credits_per_period, 2)} />
        <Fact label="ID weight" value={`1 ID = ${formatDecimal(subscription.id_weight, 6)} credits`} />
        <Fact label="Payment status" value={<span className="capitalize">{subscription.payment_status.replace(/_/g, ' ')}</span>} />
        <Fact label="Billing period"
          value={`${formatDate(subscription.current_period_start)} → ${formatDate(subscription.current_period_end)}`} />
        <Fact label="Billing anchor"
          value={`Day ${subscription.billing_anchor_day} · ${subscription.billing_timezone}`} />
        <Fact label="Top-ups" value={subscription.can_top_up ? 'Allowed' : 'Not allowed'} />
        <Fact label="Activated" value={formatDateTime(subscription.activated_at)} />
        <Fact label="Contract effective" value={formatDate(version.effective_from)} />
      </CardContent>
    </Card>
  );
}

function expirySummary(credits: AccountCredits): string {
  const buckets: Array<[string, string]> = [
    ['30 days', credits.expiring_30_days],
    ['60 days', credits.expiring_60_days],
    ['90 days', credits.expiring_90_days],
  ];
  const next = buckets.find(([, value]) => Number(value) > 0);
  if (!next) return credits.earliest_expiry ? `Next expiry ${formatDate(credits.earliest_expiry.expires_at)}` : 'No expiring credits';
  return `${formatDecimal(next[1], 2)} credits expire within ${next[0]}`;
}

function expiryLine(credits: AccountCredits | null): string {
  if (!credits) return 'Loading credit expiry…';
  return expirySummary(credits);
}

function CreditMetrics({ credits }: { credits: AccountCredits | null }) {
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-2">
      <div>
        <p className="text-xs text-muted-foreground">Available</p>
        <p className="text-3xl font-bold tabular-nums">
          <CreditQuantity value={credits?.available ?? '0'} />
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">≈ IDs available</p>
        <p className="text-lg font-semibold tabular-nums">{credits?.estimated_ids_available ?? 0}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Reserved</p>
        <p className="text-lg font-semibold tabular-nums">
          <CreditQuantity value={credits?.reserved ?? '0'} />
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Used this period</p>
        <p className="text-lg font-semibold tabular-nums">
          <CreditQuantity value={credits?.used_this_period ?? '0'} />
        </p>
      </div>
    </div>
  );
}

export function CreditsWidget({
  credits,
  canTopUp,
  onBuyCredits,
}: {
  credits: AccountCredits | null;
  canTopUp: boolean;
  onBuyCredits: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Credits</CardTitle>
        {canTopUp && (
          <Button size="sm" onClick={onBuyCredits}>
            <Coins className="mr-2 h-4 w-4" />
            Buy credits
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <CreditMetrics credits={credits} />
        <p className="text-xs text-muted-foreground">{expiryLine(credits)}</p>
      </CardContent>
    </Card>
  );
}
