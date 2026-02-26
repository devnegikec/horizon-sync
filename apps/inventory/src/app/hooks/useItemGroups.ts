import * as React from 'react';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { useUserStore } from '@horizon-sync/store';

import type { ItemGroup, ItemGroupListItem, ItemGroupListResponse, ItemGroupCreate, ItemGroupUpdate, ItemGroupFilters } from '../types/item-group.types';
import { itemGroupApi } from '../utility/api/item-groups';

interface UseItemGroupsResult {
  itemGroups: ItemGroupListItem[];
  pagination: ItemGroupListResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  currentPage: number;
  currentPageSize: number;
}

export function useItemGroups(initialPage = 1, initialPageSize = 20, filters?: ItemGroupFilters): UseItemGroupsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [itemGroups, setItemGroups] = React.useState<ItemGroupListItem[]>([]);
  const [pagination, setPagination] = React.useState<ItemGroupListResponse['pagination'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = React.useState(initialPageSize);

  const search = filters?.search;
  const status = filters?.status;

  const fetchItemGroups = React.useCallback(async () => {
    if (!accessToken) {
      setItemGroups([]);
      setPagination(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const isActive = status === 'active' ? true : status === 'inactive' ? false : undefined;
      const data = await itemGroupApi.list(accessToken, currentPage, currentPageSize, {
        search: search || undefined,
        is_active: isActive,
      });
      setItemGroups(data.item_groups ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item groups');
      setItemGroups([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, currentPageSize, search, status]);

  React.useEffect(() => {
    fetchItemGroups();
  }, [fetchItemGroups]);

  return {
    itemGroups,
    pagination,
    loading,
    error,
    refetch: fetchItemGroups,
    setPage: setCurrentPage,
    setPageSize: setCurrentPageSize,
    currentPage,
    currentPageSize,
  };
}

interface UseItemGroupMutationsResult {
  createItemGroup: (data: ItemGroupCreate) => Promise<ItemGroup>;
  updateItemGroup: (id: string, data: ItemGroupUpdate) => Promise<ItemGroup>;
  deleteItemGroup: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useItemGroupMutations(): UseItemGroupMutationsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createItemGroup = React.useCallback(async (data: ItemGroupCreate): Promise<ItemGroup> => {
    if (!accessToken) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      return await itemGroupApi.create(accessToken, data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create item group';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const updateItemGroup = React.useCallback(async (id: string, data: ItemGroupUpdate): Promise<ItemGroup> => {
    if (!accessToken) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      return await itemGroupApi.update(accessToken, id, data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update item group';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const deleteItemGroup = React.useCallback(async (id: string): Promise<void> => {
    if (!accessToken) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      await itemGroupApi.delete(accessToken, id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete item group';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  return { createItemGroup, updateItemGroup, deleteItemGroup, loading, error };
}
