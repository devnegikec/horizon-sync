import { Link, useLocation } from 'react-router-dom';

import { cn } from '@horizon-sync/ui/lib';

const ITEMS = [
  { label: 'Plans', to: '/subscriptions/plans' },
  { label: 'Customers', to: '/subscriptions/customers' },
  { label: 'Credit exposure', to: '/subscriptions/exposure' },
  { label: 'Reconciliation', to: '/subscriptions/reconciliation' },
];

/** In-page tabs shared by the subscription screens. */
export function SubscriptionNav() {
  const { pathname } = useLocation();

  return (
    <nav aria-label="Subscription sections" className="flex flex-wrap items-center gap-1 rounded-lg border bg-muted/40 p-1">
      {ITEMS.map((item) => {
        const active = pathname.startsWith(item.to);
        return (
          <Link key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm transition-colors',
              active ? 'bg-background font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
