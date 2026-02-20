import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import type { ItemSupplier, ItemSuppliersResponse, CreateItemSupplierPayload, UpdateItemSupplierPayload } from '../types/supplier.types';
import { itemSupplierApi } from '../utility/api';

interface UseItemSuppliersResult {
  itemSuppliers: ItemSupplier[];
  pagination: ItemSuppliersResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  currentPage: number;
  currentPageSize: number;
}

export function useItemSuppliers(
  initialPage = 1,
  initialPageSize = 20,
  filters?: { search?: string; itemId?: string; supplierId?: string }
): UseItemSuppliersResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [itemSuppliers, setItemSuppliers] = React.useState<ItemSupplier[]>([]);
  const [pagination, setPagination] = React.useState<ItemSuppliersResponse['pagination'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = React.useState(initialPageSize);

  const fetchItemSuppliers = React.useCallback(async () => {
    if (!accessToken) {
      setItemSuppliers([]);
      setPagination(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const apiFilters: { item_id?: string; supplier_id?: string; search?: string } = {};
      if (filters?.itemId && filters.itemId !== 'all') {
        apiFilters.item_id = filters.itemId;
      }
      if (filters?.supplierId && filters.supplierId !== 'all') {
        apiFilters.supplier_id = filters.supplierId;
      }
      if (filters?.search) {
        apiFilters.search = filters.search;
      }
      const data = (await itemSupplierApi.list(accessToken, currentPage, currentPageSize, apiFilters)) as ItemSuppliersResponse;
      setItemSuppliers(data.item_suppliers ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load item suppliers';
      setError(message);
      setItemSuppliers([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, currentPageSize, filters]);

  React.useEffect(() => {
    fetchItemSuppliers();
  }, [fetchItemSuppliers]);

  return {
    itemSuppliers,
    pagination,
    loading,
    error,
    refetch: fetchItemSuppliers,
    setPage: setCurrentPage,
    setPageSize: setCurrentPageSize,
    currentPage,
    currentPageSize,
  };
}

interface UseItemSupplierMutationsResult {
  createItemSupplier: (data: CreateItemSupplierPayload) => Promise<ItemSupplier>;
  updateItemSupplier: (id: string, data: UpdateItemSupplierPayload) => Promise<ItemSupplier>;
  deleteItemSupplier: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useItemSupplierMutations(): UseItemSupplierMutationsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createItemSupplier = React.useCallback(
    async (data: CreateItemSupplierPayload): Promise<ItemSupplier> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        const result = (await itemSupplierApi.create(accessToken, data)) as ItemSupplier;
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create item supplier';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const updateItemSupplier = React.useCallback(
    async (id: string, data: UpdateItemSupplierPayload): Promise<ItemSupplier> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        const result = (await itemSupplierApi.update(accessToken, id, data)) as ItemSupplier;
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update item supplier';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const deleteItemSupplier = React.useCallback(
    async (id: string): Promise<void> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        await itemSupplierApi.delete(accessToken, id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete item supplier';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  return { createItemSupplier, updateItemSupplier, deleteItemSupplier, loading, error };
}
