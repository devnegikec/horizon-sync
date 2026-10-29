import * as React from 'react';

import { AccountBillingService, BillingApiError } from '../services/account-billing.service';
import { buildDummyCredits, buildDummyGrant, getDummyActivation, type DummyCreditGrant } from '../services/dummy-payment.service';
import type { AccountCredits, AccountSubscription } from '../types';

interface AccountBillingState {
  subscription: AccountSubscription | null;
  credits: AccountCredits | null;
  /** Simulated batch + ledger row shown while test-mode credits are active. */
  localGrant: DummyCreditGrant | null;
  loading: boolean;
  error: string | null;
}

function valueOf<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null;
}

function errorText(result: PromiseSettledResult<unknown>): string | null {
  if (result.status !== 'rejected') return null;
  const failure = result.reason as BillingApiError;
  // 404 = no subscription assigned yet; that is an empty state, not an error.
  if (failure?.status === 404) return null;
  return failure?.message ?? 'Could not load subscription details.';
}

/**
 * TEMPORARY: overlay a dummy activation payment on top of the API response until
 * Core exposes a real customer activation endpoint.
 */
function withLocalActivation(subscription: AccountSubscription | null): AccountSubscription | null {
  if (!subscription) return null;
  if (subscription.status !== 'pending_activation_payment') return subscription;
  const activation = getDummyActivation(subscription.organization_id);
  if (!activation) return subscription;
  return { ...subscription, status: 'active', activated_at: activation.paid_at, payment_status: 'current' };
}

/**
 * Real server credits always win. A test activation only supplies credits when
 * the API has none (which is the normal state right after activation, because
 * credits are granted by a paid invoice, not by activation itself).
 */
function resolveCredits(
  apiCredits: AccountCredits | null,
  subscription: AccountSubscription | null,
): { credits: AccountCredits | null; localGrant: DummyCreditGrant | null } {
  if (!subscription) return { credits: apiCredits, localGrant: null };
  const activation = getDummyActivation(subscription.organization_id);
  if (!activation) return { credits: apiCredits, localGrant: null };
  if (apiCredits && Number(apiCredits.available) > 0) return { credits: apiCredits, localGrant: null };
  return { credits: buildDummyCredits(activation, subscription.id_weight), localGrant: buildDummyGrant(activation) };
}

/** Loads the organization's subscription + credits (JWT-scoped) and refreshes credits every 60s while visible. */
export function useAccountBilling() {
  const [state, setState] = React.useState<AccountBillingState>({ subscription: null, credits: null, localGrant: null, loading: true, error: null });
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
      const subscriptionValue = withLocalActivation(valueOf(subscriptionResult));
      const resolved = resolveCredits(valueOf(creditsResult), subscriptionValue);
      setState({
        subscription: subscriptionValue,
        credits: resolved.credits,
        localGrant: resolved.localGrant,
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
        .then((credits) => setState((current) => {
          const resolved = resolveCredits(credits, current.subscription);
          return { ...current, credits: resolved.credits, localGrant: resolved.localGrant };
        }))
        .catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const reload = React.useCallback(() => setReloadToken((token) => token + 1), []);

  return { ...state, reload };
}
