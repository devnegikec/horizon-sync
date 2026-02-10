import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type { ApiItem, ItemsPagination } from '../types/items-api.types';

const ITEMS_URL = `${environment.apiCoreUrl}/items`;

interface UseItemsResult {
  items: ApiItem[];
  pagination: ItemsPagination | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  currentPage: number;
  currentPageSize: number;
}

export function useItems(initialPage = 1, initialPageSize = 20, filters?: { search?: string; groupId?: string; status?: string }): UseItemsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [items, setItems] = React.useState<ApiItem[]>([]);
  const [pagination, setPagination] = React.useState<ItemsPagination | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = React.useState(initialPageSize);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = React.useMemo(() => filters, [
    filters?.search,
    filters?.groupId,
    filters?.status,
  ]);

  const fetchItems = React.useCallback(async () => {
    if (!accessToken) {
      setItems([]);
      setPagination(null);
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
        sort_by: 'created_at',
        sort_order: 'desc',
      });
      
      // Add filters to API params if provided
      if (memoizedFilters?.search) {
        params.append('search', memoizedFilters.search);
      }
      if (memoizedFilters?.groupId && memoizedFilters.groupId !== 'all') {
        params.append('item_group_id', memoizedFilters.groupId);
      }
      if (memoizedFilters?.status && memoizedFilters.status !== 'all') {
        params.append('status', memoizedFilters.status);
      }
      
      const res = await fetch(`${ITEMS_URL}?${params}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setItems(data.items ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items');
      setItems([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, currentPageSize, memoizedFilters]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { 
    items, 
    pagination, 
    loading, 
    error, 
    refetch: fetchItems,
    setPage: setCurrentPage,
    setPageSize: setCurrentPageSize,
    currentPage,
    currentPageSize,
  };
}
