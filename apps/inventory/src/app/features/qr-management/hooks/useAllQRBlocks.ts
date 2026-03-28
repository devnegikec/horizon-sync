import { useState, useEffect, useCallback } from 'react';

import { qrBlockService } from '../services/qrBlockService';
import type { QRBlockListResponse } from '../types/qrBlock.types';

export const useAllQRBlocks = () => {
  const [data, setData] = useState<QRBlockListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    setError(null);
    try {
      const result = await qrBlockService.listAllBlocks({ page, page_size: pageSize });
      setData(result);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || 'Failed to fetch blocks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};
