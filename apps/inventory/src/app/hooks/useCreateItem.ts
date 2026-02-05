import { useState } from 'react';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type { CreateItemPayload } from '../types/items-api.types';

const ITEMS_URL = `${environment.apiCoreUrl}/items`;

interface UseCreateItemResult {
  createItem: (payload: CreateItemPayload) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useCreateItem(): UseCreateItemResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createItem = async (payload: CreateItemPayload): Promise<void> => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(ITEMS_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP ${response.status}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create item';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createItem,
    loading,
    error,
  };
}
