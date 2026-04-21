/**
 * Hook to check feature flag visibility from the backend.
 * Calls GET /api/v1/admin/feature-flags/evaluate/{flagName}
 * and returns { visible, enabled, loading }.
 *
 * Safe defaults: visible=true, enabled=true while loading or on error.
 */
import { useEffect, useState } from 'react';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';

interface FeatureFlagState {
  visible: boolean;
  enabled: boolean;
  loading: boolean;
}

export function useFeatureVisibility(flagName: string): FeatureFlagState {
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

    let cancelled = false;

    fetch(
      `${environment.apiCoreUrl}/api/v1/feature-flags/evaluate/${flagName}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data && typeof data.visible === 'boolean') {
          setState({ visible: data.visible, enabled: data.enabled, loading: false });
        } else {
          // Flag not found or error — safe default: show everything
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
  }, [accessToken, flagName]);

  return state;
}
