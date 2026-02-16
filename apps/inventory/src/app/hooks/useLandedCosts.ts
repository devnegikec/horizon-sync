import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { landedCostApi } from '../utility/api/landed-costs';
import type { LandedCostVoucherListItem, LandedCostVoucherFilters } from '../types/landed-cost.types';

export function useLandedCosts(initialFilters: Partial<LandedCostVoucherFilters> = {}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [landedCosts, setLandedCosts] = useState<LandedCostVoucherListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Partial<LandedCostVoucherFilters>>({
    status: 'all',
    page: 1,
    page_size: 10,
    sort_by: 'posting_date',
    sort_order: 'desc',
    ...initialFilters,
  });

  const fetchLandedCosts = useCallback(async () => {
    if (!accessToken) {
      setLandedCosts([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await landedCostApi.list(accessToken, filters);
      
      setLandedCosts(response.vouchers || []);
      setTotalCount(response.pagination?.total_count || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch landed cost vouchers';
      setError(errorMessage);
      console.error('Error fetching landed cost vouchers:', err);
      setLandedCosts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    fetchLandedCosts();
  }, [fetchLandedCosts]);

  const refetch = useCallback(() => {
    fetchLandedCosts();
  }, [fetchLandedCosts]);

  return {
    landedCosts,
    loading,
    error,
    totalCount,
    filters,
    setFilters,
    refetch,
  };
}
