import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { fetchWmsStats, type WmsStatsResponse } from './api';
import type { DashboardFilters } from './types';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches `wms-dashboard/stats` for the given point-in-time filters.
 *
 * The KPI strip and the Inbound-vs-Outbound chart both use this so a section
 * refresh only issues one request per widget.
 */
export function useWmsStats(filters: DashboardFilters, refreshToken: number): AsyncState<WmsStatsResponse> {
  const accessToken = useUserStore((s) => s.accessToken);
  const { period, warehouseId } = filters;
  const anchorIso = filters.anchorDate.toISOString();
  const [state, setState] = React.useState<AsyncState<WmsStatsResponse>>({ data: null, loading: true, error: null });

  React.useEffect(() => {
    if (!accessToken) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    fetchWmsStats(accessToken, { period, date: anchorIso, warehouse_id: warehouseId })
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load dashboard stats',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, period, anchorIso, warehouseId, refreshToken]);

  return state;
}
