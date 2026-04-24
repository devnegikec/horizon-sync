/**
 * Hook to check feature flag visibility from the backend.
 * Calls GET /api/v1/feature-flags/evaluate/{flagName}
 * and returns { visible, enabled, loading }.
 *
 * Safe defaults: visible=true, enabled=true while loading or on error.
 */
import { useEffect, useState } from 'react';

import { useUserStore } from '@horizon-sync/store';

interface FeatureFlagState {
  visible: boolean;
  enabled: boolean;
  loading: boolean;
}

export function useFeatureVisibility(flagName: string, apiBaseUrl?: string): FeatureFlagState {
  const accessToken = useUserStore((s) => s.accessToken);
  const [state, setState] = useState<FeatureFlagState>({
    visible: true,
    enabled: true,
    loading: true,
  });

  useEffect(() => {
    if (!accessToken || !flagName) {
      setState({ visible: true, enabled: true, loading: false });
      return;
    }

    // Default API base URL if not provided
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
          setState({ visible: data.visible, enabled: data.enabled, loading: false });
        } else {
          setState({ visible: true, enabled: true, loading: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ visible: true, enabled: true, loading: false });
        }
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
  // when the caller passes an inline array literal.
  const flagNamesKey = flagNames.slice().sort().join(',');

  const [states, setStates] = useState<Record<string, FeatureFlagState>>(() => {
    const initial: Record<string, FeatureFlagState> = {};
    flagNames.forEach(flagName => {
      initial[flagName] = { visible: true, enabled: true, loading: true };
    });
    return initial;
  });

  useEffect(() => {
    const names = flagNamesKey ? flagNamesKey.split(',') : [];

    if (!accessToken || !names.length) {
      const defaults: Record<string, FeatureFlagState> = {};
      names.forEach(flagName => {
        defaults[flagName] = { visible: true, enabled: true, loading: false };
      });
      setStates(defaults);
      return;
    }

    // Default API base URL if not provided
    const baseUrl = apiBaseUrl || '/api/v1';

    let cancelled = false;

    // Fetch all flags in parallel
    const promises = names.map(flagName =>
      fetch(
        `${baseUrl}/feature-flags/evaluate/${flagName}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
        .then((res) => res.ok ? res.json() : null)
        .then((data) => ({
          flagName,
          state: data && typeof data.visible === 'boolean'
            ? { visible: data.visible, enabled: data.enabled, loading: false }
            : { visible: true, enabled: true, loading: false }
        }))
        .catch(() => ({
          flagName,
          state: { visible: true, enabled: true, loading: false }
        }))
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