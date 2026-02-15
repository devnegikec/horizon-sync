import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { materialRequestApi } from '../utility/api';
import type { MaterialRequest, MaterialRequestFilters } from '../types/material-requests.types';

export function useMaterialRequests(initialFilters: Partial<MaterialRequestFilters> = {}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Partial<MaterialRequestFilters>>({
    status: 'all',
    search: '',
    page: 1,
    page_size: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
    ...initialFilters,
  });

  const fetchMaterialRequests = useCallback(async () => {
    if (!accessToken) {
      // Don't set error if not authenticated, just return empty state
      setMaterialRequests([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await materialRequestApi.list(accessToken, filters);
      
      console.log('Material Requests Response:', response);
      
      setMaterialRequests(response.data || []);
      setTotalCount(response.total_count || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch material requests';
      setError(errorMessage);
      console.error('Error fetching material requests:', err);
      // Set empty state on error to prevent crashes
      setMaterialRequests([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    fetchMaterialRequests();
  }, [fetchMaterialRequests]);

  const refetch = useCallback(() => {
    fetchMaterialRequests();
  }, [fetchMaterialRequests]);

  return {
    materialRequests,
    loading,
    error,
    totalCount,
    filters,
    setFilters,
    refetch,
  };
}
