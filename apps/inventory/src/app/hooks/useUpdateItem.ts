import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';
import { getFriendlyErrorMessage } from '../utility/api/core';

import { environment } from '../../environments/environment';
import type { UpdateItemPayload } from '../types/items-api.types';

const ITEMS_URL = `${environment.apiCoreUrl}/api/v1/items`;

interface UseUpdateItemResult {
  updateItem: (itemId: string, payload: UpdateItemPayload) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useUpdateItem(): UseUpdateItemResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const updateItem = React.useCallback(
    async (itemId: string, payload: UpdateItemPayload) => {
      if (!accessToken) {
        setError('Not authenticated');
        throw new Error('Not authenticated');
      }
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${ITEMS_URL}/${itemId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
      } catch (err) {
        const message = getFriendlyErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  return { updateItem, loading, error };
}


