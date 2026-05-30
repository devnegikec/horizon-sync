import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { warehouseUserApi, AssignedWarehouse } from '../utility/api/warehouseUsers';
import { getFriendlyErrorMessage } from '../utility/api/core';

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

  const fetchWarehouses = React.useCallback(async () => {
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
      setWarehouses(data.warehouses ?? []);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  return { warehouses, loading, error, refetch: fetchWarehouses };
}
