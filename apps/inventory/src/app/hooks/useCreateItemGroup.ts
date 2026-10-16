import { useState } from 'react';

import { useUserStore } from '@horizon-sync/store';

import type { CreateItemGroupPayload, CreateItemGroupResponse } from '../types/item-group-creation.types';
import { apiRequest, getFriendlyErrorMessage } from '../utility/api/core';

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
      return await apiRequest<CreateItemGroupResponse>('/item-groups', accessToken, {
        method: 'POST',
        body: payload,
      });
    } catch (err) {
      const errorMessage = getFriendlyErrorMessage(err);
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
