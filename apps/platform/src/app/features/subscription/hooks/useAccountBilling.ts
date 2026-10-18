import * as React from 'react';

import { AccountBillingService, BillingApiError } from '../services/account-billing.service';
import type { AccountCredits, AccountSubscription } from '../types';

interface AccountBillingState {
  subscription: AccountSubscription | null;
  credits: AccountCredits | null;
  loading: boolean;
  error: string | null;
}

function valueOf<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null;
}

function errorText(result: PromiseSettledResult<unknown>): string | null {
  if (result.status !== 'rejected') return null;
  const failure = result.reason as BillingApiError;
  return failure?.message ?? 'Could not load subscription details.';
}

/** Loads the organization's subscription + credits (JWT-scoped) and refreshes credits every 60s while visible. */
export function useAccountBilling() {
  const [state, setState] = React.useState<AccountBillingState>({ subscription: null, credits: null, loading: true, error: null });
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: true, error: null }));

    const load = async () => {
      const [subscriptionResult, creditsResult] = await Promise.allSettled([
        AccountBillingService.getSubscription(),
        AccountBillingService.getCredits(),
      ]);
      if (cancelled) return;
      setState({
        subscription: valueOf(subscriptionResult),
        credits: valueOf(creditsResult),
        loading: false,
        error: errorText(subscriptionResult),
      });
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      AccountBillingService.getCredits()
        .then((credits) => setState((current) => ({ ...current, credits })))
        .catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const reload = React.useCallback(() => setReloadToken((token) => token + 1), []);

  return { ...state, reload };
}
