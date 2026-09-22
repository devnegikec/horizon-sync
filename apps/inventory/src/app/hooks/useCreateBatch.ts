import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { batchApi } from '../api/batches';
import type { Batch, BatchCreatePayload } from '../types/batch.types';

export function useCreateBatch() {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createBatch = async (data: BatchCreatePayload): Promise<Batch> => {
    setLoading(true);
    setError(null);
    try {
      return await batchApi.create(accessToken || '', data);
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message || 'Failed to create batch';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createBatch, loading, error };
}
