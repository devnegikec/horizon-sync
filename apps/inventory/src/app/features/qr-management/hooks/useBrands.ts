import { useState, useEffect, useCallback } from 'react';

import { brandService } from '../services/brandService';
import type { BrandListResponse } from '../types/brand.types';

export const useBrands = () => {
  const [data, setData] = useState<BrandListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const result = await brandService.list({ page, page_size: 20 });
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch brands');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};
