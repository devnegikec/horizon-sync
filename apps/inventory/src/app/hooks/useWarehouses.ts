import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type { Warehouse, WarehousesResponse, CreateWarehousePayload, UpdateWarehousePayload } from '../types/warehouse.types';
import { warehouseApi } from '../utility';
const WAREHOUSE_URL = `${environment.apiCoreUrl}/warehouses`;

interface UseWarehousesResult {
  warehouses: Warehouse[];
  pagination: WarehousesResponse['pagination'] | null;
  statusCounts: WarehousesResponse['status_counts'] | null;
  typeCounts: WarehousesResponse['type_counts'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  currentPage: number;
  currentPageSize: number;
}

export function useWarehouses(initialPage = 1, initialPageSize = 20, filters?: { search?: string; warehouseType?: string; status?: string}): UseWarehousesResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [warehouses, setWarehouses] = React.useState<Warehouse[]>([]);
  const [pagination, setPagination] = React.useState<WarehousesResponse['pagination'] | null>(null);
  const [statusCounts, setStatusCounts] = React.useState<WarehousesResponse['status_counts'] | null>(null);
  const [typeCounts, setTypeCounts] = React.useState<WarehousesResponse['type_counts'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = React.useState(initialPageSize);

  const fetchWarehouses = React.useCallback(async () => {
    if (!accessToken) {
      setWarehouses([]);
      setPagination(null);
      setStatusCounts(null);
      setTypeCounts(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        page_size: String(currentPageSize),
        sort_by: 'created-at',
        sort_order: 'desc',
      })
      // Add filters to API params if provided
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.warehouseType && filters.warehouseType !== 'all') {
        params.append('warehouse_type', filters.warehouseType);
      }

      const res = await fetch(`${WAREHOUSE_URL}?${params}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const message = `Error ${res.status}: ${res.statusText}`;
        throw new Error(message);
      }

      const data = await res.json() as WarehousesResponse;
      setWarehouses(data.warehouses ?? []);
      setPagination(data.pagination ?? null);
      setStatusCounts(data.status_counts ?? null);
      setTypeCounts(data.type_counts ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load warehouses';
      setError(message);
      setWarehouses([]);
      setPagination(null);
      setStatusCounts(null);
      setTypeCounts(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, currentPageSize, filters]);

  React.useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  return { warehouses, pagination, statusCounts, typeCounts, loading, error, refetch: fetchWarehouses, setPage: setCurrentPage, setPageSize: setCurrentPageSize, currentPage, currentPageSize };
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
