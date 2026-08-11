import { useState, useEffect, useCallback } from 'react';

import { qrBlockService } from '../services/qrBlockService';
import type { QRBlockListResponse } from '../types/qrBlock.types';
import { getApiErrorMessage } from '../utils/apiError';

export const useQRBlocks = (productId: string) => {
  const [data, setData] = useState<QRBlockListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await qrBlockService.listBlocks(productId, { page, page_size: 20 });
      setData(result);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to fetch blocks'));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};
