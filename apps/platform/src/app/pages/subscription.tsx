import { SubscriptionSettings } from '../features/subscription/components/SubscriptionSettings';

/** Customer-facing subscription & credit management page (also embedded in Settings). */
export function SubscriptionPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subscription & Credits</h1>
        <p className="mt-1 text-muted-foreground">
          Review your plan, monitor credit balances and expiry, manage invoices and buy top-ups.
        </p>
      </div>
      <SubscriptionSettings />
    </div>
  );
}
