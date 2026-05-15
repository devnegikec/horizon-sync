/**
 * Hook to check feature flag visibility from the backend.
 * Calls GET /api/v1/feature-flags/evaluate/{flagName}
 * and returns { visible, enabled, loading }.
 *
 * SECURITY: Defaults to visible=false (deny by default).
 * Features are only shown when the API explicitly confirms enabled=true.
 * Successful responses are cached in sessionStorage so that if core-service
 * goes down mid-session, the last-known state is preserved rather than
 * hiding features the user was already using.
 */
import { useEffect, useState } from 'react';

import { useUserStore } from '@horizon-sync/store';

interface FeatureFlagState {
  visible: boolean;
  enabled: boolean;
  loading: boolean;
  error?: boolean;
}

const CACHE_PREFIX = 'ff_cache_';

function getCachedState(flagName: string): FeatureFlagState | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_PREFIX}${flagName}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.visible === 'boolean' && typeof parsed.enabled === 'boolean') {
      return { visible: parsed.visible, enabled: parsed.enabled, loading: false };
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function setCachedState(flagName: string, state: { visible: boolean; enabled: boolean }) {
  try {
    sessionStorage.setItem(`${CACHE_PREFIX}${flagName}`, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export function useFeatureVisibility(flagName: string, apiBaseUrl?: string): FeatureFlagState {
  const accessToken = useUserStore((s) => s.accessToken);
  const [state, setState] = useState<FeatureFlagState>(() => {
    // On mount, check cache first — if we have a previous successful response, use it
    const cached = getCachedState(flagName);
    if (cached) return { ...cached, loading: true }; // still loading to refresh, but show cached
    // Deny by default — hidden until confirmed
    return { visible: false, enabled: false, loading: true };
  });

  useEffect(() => {
    if (!accessToken || !flagName) {
      // No auth — deny access
      setState({ visible: false, enabled: false, loading: false });
      return;
    }

    const baseUrl = apiBaseUrl || '/api/v1';
    let cancelled = false;

    fetch(
      `${baseUrl}/feature-flags/evaluate/${flagName}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data.visible === 'boolean') {
          const newState = { visible: data.visible, enabled: data.enabled, loading: false };
          setState(newState);
          setCachedState(flagName, { visible: data.visible, enabled: data.enabled });
        } else {
          // Non-OK response or unexpected shape — use cache or deny
          const cached = getCachedState(flagName);
          setState(cached || { visible: false, enabled: false, loading: false, error: true });
        }
      })
      .catch(() => {
        if (cancelled) return;
        // Network error (core-service down) — use cache if available, otherwise deny
        const cached = getCachedState(flagName);
        setState(cached || { visible: false, enabled: false, loading: false, error: true });
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, flagName, apiBaseUrl]);

  return state;
}

export function useFeatureVisibilities(flagNames: string[], apiBaseUrl?: string): Record<string, FeatureFlagState> {
  const accessToken = useUserStore((s) => s.accessToken);

  // Serialize to a stable string so the effect doesn't re-run on every render
  const flagNamesKey = flagNames.slice().sort().join(',');

  const [states, setStates] = useState<Record<string, FeatureFlagState>>(() => {
    const initial: Record<string, FeatureFlagState> = {};
    flagNames.forEach(flagName => {
      const cached = getCachedState(flagName);
      initial[flagName] = cached
        ? { ...cached, loading: true }
        : { visible: false, enabled: false, loading: true };
    });
    return initial;
  });

  useEffect(() => {
    const names = flagNamesKey ? flagNamesKey.split(',') : [];

    if (!accessToken || !names.length) {
      const defaults: Record<string, FeatureFlagState> = {};
      names.forEach(flagName => {
        defaults[flagName] = { visible: false, enabled: false, loading: false };
      });
      setStates(defaults);
      return;
    }

    const baseUrl = apiBaseUrl || '/api/v1';
    let cancelled = false;

    const promises = names.map(flagName =>
      fetch(
        `${baseUrl}/feature-flags/evaluate/${flagName}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data && typeof data.visible === 'boolean') {
            setCachedState(flagName, { visible: data.visible, enabled: data.enabled });
            return {
              flagName,
              state: { visible: data.visible, enabled: data.enabled, loading: false } as FeatureFlagState
            };
          }
          // Unexpected response — use cache or deny
          const cached = getCachedState(flagName);
          return {
            flagName,
            state: cached || { visible: false, enabled: false, loading: false, error: true } as FeatureFlagState
          };
        })
        .catch(() => {
          // Network error — use cache or deny
          const cached = getCachedState(flagName);
          return {
            flagName,
            state: cached || { visible: false, enabled: false, loading: false, error: true } as FeatureFlagState
          };
        })
    );

    Promise.all(promises).then((results) => {
      if (cancelled) return;
      const newStates: Record<string, FeatureFlagState> = {};
      results.forEach(({ flagName, state }) => {
        newStates[flagName] = state;
      });
      setStates(newStates);
    });

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, flagNamesKey, apiBaseUrl]);

  return states;
}
