import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { rfqApi } from '../utility/api';
import type { RFQListItem, RFQFilters } from '../types/rfq.types';

export function useRFQs(initialFilters: Partial<RFQFilters> = {}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [rfqs, setRFQs] = useState<RFQListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Partial<RFQFilters>>({
    status: 'all',
    search: '',
    page: 1,
    page_size: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
    ...initialFilters,
  });

  const fetchRFQs = useCallback(async () => {
    if (!accessToken) {
      setRFQs([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await rfqApi.list(accessToken, filters);
      
      console.log('RFQs Response:', response);
      
      setRFQs(response.data || []);
      setTotalCount(response.total_count || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch RFQs';
      setError(errorMessage);
      console.error('Error fetching RFQs:', err);
      setRFQs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    fetchRFQs();
  }, [fetchRFQs]);

  const refetch = useCallback(() => {
    fetchRFQs();
  }, [fetchRFQs]);

  return {
    rfqs,
    loading,
    error,
    totalCount,
    filters,
    setFilters,
    refetch,
  };
}
