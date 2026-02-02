import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type { ApiItemGroup } from '../types/item-groups.types';

const ACTIVE_ITEM_GROUPS_URL = `${environment.apiCoreUrl}/item-groups/active`;

interface UseItemGroupsResult {
  itemGroups: ApiItemGroup[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useItemGroups(): UseItemGroupsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [itemGroups, setItemGroups] = React.useState<ApiItemGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchItemGroups = React.useCallback(async () => {
    if (!accessToken) {
      setItemGroups([]);
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ACTIVE_ITEM_GROUPS_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setItemGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item groups');
      setItemGroups([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchItemGroups();
  }, [fetchItemGroups]);

  return { itemGroups, loading, error, refetch: fetchItemGroups };
}
