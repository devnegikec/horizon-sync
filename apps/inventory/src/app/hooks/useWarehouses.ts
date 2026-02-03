import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import type { Warehouse, WarehousesResponse, CreateWarehousePayload, UpdateWarehousePayload } from '../types/warehouse.types';
import { warehouseApi } from '../utility/api';

interface UseWarehousesResult {
  warehouses: Warehouse[];
  pagination: WarehousesResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useWarehouses(page = 1, pageSize = 20): UseWarehousesResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [pagination, setPagination] = React.useState<WarehousesResponse['pagination'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchWarehouses = React.useCallback(async () => {
    if (!accessToken) {
      setWarehouses([]);
      setPagination(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = (await warehouseApi.list(accessToken, page, pageSize)) as WarehousesResponse;
      setWarehouses(data.warehouses ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load warehouses';
      setError(message);
      setWarehouses([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, pageSize]);

  React.useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  return { warehouses, pagination, loading, error, refetch: fetchWarehouses };
}

interface UseWarehouseMutationsResult {
  createWarehouse: (data: CreateWarehousePayload) => Promise<Warehouse>;
  updateWarehouse: (id: string, data: UpdateWarehousePayload) => Promise<Warehouse>;
  deleteWarehouse: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useWarehouseMutations(): UseWarehouseMutationsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createWarehouse = React.useCallback(
    async (data: CreateWarehousePayload): Promise<Warehouse> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        const result = (await warehouseApi.create(accessToken, data)) as Warehouse;
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create warehouse';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const updateWarehouse = React.useCallback(
    async (id: string, data: UpdateWarehousePayload): Promise<Warehouse> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        const result = (await warehouseApi.update(accessToken, id, data)) as Warehouse;
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update warehouse';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const deleteWarehouse = React.useCallback(
    async (id: string): Promise<void> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        await warehouseApi.delete(accessToken, id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete warehouse';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  return { createWarehouse, updateWarehouse, deleteWarehouse, loading, error };
}
