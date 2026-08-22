import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { batchApi } from '../api/batches';
import type { BatchListItem, PaginationMeta } from '../types/batch.types';

export function useBatches() {
  const accessToken = useUserStore((s) => s.accessToken);
  const [batches, setBatches] = React.useState<BatchListItem[]>([]);
  const [pagination, setPagination] = React.useState<PaginationMeta | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refetch = React.useCallback(async () => {
    if (!accessToken) {
      setBatches([]);
      setPagination(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await batchApi.list(accessToken, 1, 50);
      setBatches(res.batches ?? []);
      setPagination(res.pagination ?? null);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to load batches');
      setBatches([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    refetch();
  }, [refetch]);

  return { batches, pagination, loading, error, refetch };
}
