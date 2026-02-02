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
}

export function useItems(page = 1, pageSize = 20): UseItemsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [items, setItems] = React.useState<ApiItem[]>([]);
  const [pagination, setPagination] = React.useState<ItemsPagination | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

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
        page: String(page),
        page_size: String(pageSize),
        sort_by: 'created_at',
        sort_order: 'desc',
      });
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
  }, [accessToken, page, pageSize]);

  React.useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, pagination, loading, error, refetch: fetchItems };
}
