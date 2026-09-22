import { useState, useEffect, useCallback } from 'react';

import { qrBlockService } from '../services/qrBlockService';
import type { QRBlockFilters, QRBlockListResponse } from '../types/qrBlock.types';
import { getApiErrorMessage } from '../utils/apiError';

interface UseAllQRBlocksOptions {
  page: number;
  pageSize?: number;
  filters: QRBlockFilters;
}

function startOfLocalDay(value?: string): string | undefined {
  return value ? new Date(`${value}T00:00:00`).toISOString() : undefined;
}

function startOfNextLocalDay(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString();
}

export const useAllQRBlocks = ({ page, pageSize = 20, filters }: UseAllQRBlocksOptions) => {
  const [data, setData] = useState<QRBlockListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await qrBlockService.listAllBlocks({
        page,
        page_size: pageSize,
        search: filters.search || undefined,
        product_id: filters.product_id,
        status: filters.status,
        qr_type: filters.qr_type,
        created_from: startOfLocalDay(filters.created_from),
        created_to: startOfNextLocalDay(filters.created_to),
      });
      setData(result);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to fetch blocks'));
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
};
