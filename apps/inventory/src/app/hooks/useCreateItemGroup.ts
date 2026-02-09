import { useState } from 'react';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type { CreateItemGroupPayload, CreateItemGroupResponse } from '../types/item-group-creation.types';

const ITEM_GROUPS_URL = `${environment.apiCoreUrl}/item-groups`;

interface UseCreateItemGroupResult {
  createItemGroup: (payload: CreateItemGroupPayload) => Promise<CreateItemGroupResponse>;
  loading: boolean;
  error: string | null;
}

export function useCreateItemGroup(): UseCreateItemGroupResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createItemGroup = async (payload: CreateItemGroupPayload): Promise<CreateItemGroupResponse> => {
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(ITEM_GROUPS_URL, {
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

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create item group';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createItemGroup,
    loading,
    error,
  };
}