import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import { useWebSocket } from './useWebSocket';
import { wms3dApi } from '../utility/api/wms3d';
import type { FlatBin, LayoutResponse, StatusBin, StatusResponse } from '../types/wms3d.types';

const STATUS_POLL_MS = 5000;

/** Derive a ws(s):// URL from the HTTP API base URL. */
function toWsUrl(warehouseId: string, token: string): string {
  const base = (environment.apiCoreUrl ?? '').replace(/^http/, 'ws');
  return `${base}/api/v1/wms-3d/ws?warehouse_id=${warehouseId}&token=${encodeURIComponent(token)}`;
}

/** Flatten the nested layout hierarchy into a single array of bins. */
function flattenBins(layout: LayoutResponse): FlatBin[] {
  const result: FlatBin[] = [];
  for (const zone of layout.zones) {
    for (const aisle of zone.aisles) {
      for (const bay of aisle.bays) {
        for (const level of bay.levels) {
          for (const bin of level.bins) {
            result.push({
              ...bin,
              zone_id: zone.id,
              zone_code: zone.code,
              zone_name: zone.name,
              aisle_id: aisle.id,
              aisle_code: aisle.code,
              aisle_name: aisle.name,
              bay_id: bay.id,
              bay_code: bay.code,
              bay_name: bay.name,
              level_id: level.id,
              level_code: level.code,
              level_name: level.name,
            });
          }
        }
      }
    }
  }
  return result;
}

/** Overlay live status on top of layout bins. */
function mergeBins(bins: FlatBin[], status: StatusResponse | null): FlatBin[] {
  if (!status) return bins;
  const map = new Map<string, StatusBin>(status.bins.map((b) => [b.bin_id, b]));
  return bins.map((bin) => {
    const live = map.get(bin.id);
    if (!live) return bin;
    return {
      ...bin,
      live_fill_pct: live.fill_percentage,
      live_is_reserved: live.is_reserved,
      live_reserved_by: live.reserved_by,
    };
  });
}

export interface UseWarehouse3DResult {
  layout: LayoutResponse | null;
  status: StatusResponse | null;
  /** Raw bins from layout (no status overlay). */
  bins: FlatBin[];
  /** Bins with live status merged in — use these for rendering. */
  activeBins: FlatBin[];
  loading: boolean;
  statusLoading: boolean;
  /** True while the WebSocket connection is OPEN. */
  wsConnected: boolean;
  error: string | null;
  refetch: () => void;
  refetchStatus: () => void;
}

export function useWarehouse3D(warehouseId: string | null): UseWarehouse3DResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [layout, setLayout] = React.useState<LayoutResponse | null>(null);
  const [status, setStatus] = React.useState<StatusResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [statusLoading, setStatusLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Real-time WebSocket — DISABLED for now (will re-enable with future requirements)
  // const wsUrl = warehouseId && accessToken ? toWsUrl(warehouseId, accessToken) : null;

  const { connected: wsConnected } = { connected: false };

  const fetchLayout = React.useCallback(async () => {
    if (!warehouseId || !accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await wms3dApi.getLayout(accessToken, warehouseId);
      setLayout(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load 3D layout');
      setLayout(null);
    } finally {
      setLoading(false);
    }
  }, [warehouseId, accessToken]);

  const fetchStatus = React.useCallback(async () => {
    if (!warehouseId || !accessToken) return;
    setStatusLoading(true);
    try {
      const data = await wms3dApi.getStatus(accessToken, warehouseId);
      setStatus(data);
    } catch {
      /* status refresh failures are silent — stale data is acceptable */
    } finally {
      setStatusLoading(false);
    }
  }, [warehouseId, accessToken]);

  // Fetch layout once on mount / warehouse change
  React.useEffect(() => {
    setLayout(null);
    setStatus(null);
    fetchLayout();
  }, [fetchLayout]);

  // Poll status every STATUS_POLL_MS once layout is loaded
  React.useEffect(() => {
    if (!layout) return;
    fetchStatus();
    const id = setInterval(fetchStatus, STATUS_POLL_MS);
    return () => clearInterval(id);
  }, [layout, fetchStatus]);

  const bins = React.useMemo(() => (layout ? flattenBins(layout) : []), [layout]);
  const activeBins = React.useMemo(() => mergeBins(bins, status), [bins, status]);

  return {
    layout,
    status,
    bins,
    activeBins,
    loading,
    statusLoading,
    wsConnected,
    error,
    refetch: fetchLayout,
    refetchStatus: fetchStatus,
  };
}
