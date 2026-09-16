import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { getFriendlyErrorMessage } from '../utility/api/core';
import { warehouseUserApi, AssignedWarehouse } from '../utility/api/warehouseUsers';

interface UseMyWarehousesResult {
  warehouses: AssignedWarehouse[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMyWarehouses(): UseMyWarehousesResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [warehouses, setWarehouses] = React.useState<AssignedWarehouse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  // Requests can overlap (the mount effect racing a `warehouse:changed` refetch,
  // or StrictMode's double-invoke) and are not guaranteed to resolve in order.
  // Only the newest request may write state, so a slow earlier response cannot
  // restore a stale list — which would drop the user's chosen warehouse.
  const latestRequest = React.useRef(0);

  const fetchWarehouses = React.useCallback(async () => {
    const requestId = ++latestRequest.current;
    const isStale = () => requestId !== latestRequest.current;

    if (!accessToken) {
      setWarehouses([]);
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await warehouseUserApi.getMyWarehouses(accessToken);
      if (!isStale()) setWarehouses(data.warehouses ?? []);
    } catch (err) {
      if (!isStale()) {
        setError(getFriendlyErrorMessage(err));
        setWarehouses([]);
      }
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  return { warehouses, loading, error, refetch: fetchWarehouses };
}
