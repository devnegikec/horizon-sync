import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';
import { quotationApi } from '../utility/api';
import type { Quotation, QuotationResponse } from '../types/quotation.types';

interface UseQuotationsResult {
  quotations: Quotation[];
  pagination: QuotationResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  currentPage: number;
  currentPageSize: number;
}

interface UseQuotationsFilters {
  search?: string;
  status?: string;
}

export function useQuotations(
  initialPage = 1,
  initialPageSize = 20,
  filters?: UseQuotationsFilters
): UseQuotationsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [quotations, setQuotations] = React.useState<QuotationResponse['quotations']>([]);
  const [pagination, setPagination] = React.useState<QuotationResponse['pagination'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = React.useState(initialPageSize);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = React.useMemo(
    () => filters,
    [filters?.search, filters?.status]
  );

  const fetchQuotations = React.useCallback(async () => {
    if (!accessToken) {
      setQuotations([]);
      setPagination(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await quotationApi.list(
        accessToken,
        currentPage,
        currentPageSize,
        {
          status: memoizedFilters?.status !== 'all' ? memoizedFilters?.status : undefined,
          search: memoizedFilters?.search || undefined,
        }
      );
      setQuotations(data.quotations ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotations');
      setQuotations([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, currentPageSize, memoizedFilters]);

  React.useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return {
    quotations,
    pagination,
    loading,
    error,
    refetch: fetchQuotations,
    setPage: setCurrentPage,
    setPageSize: setCurrentPageSize,
    currentPage,
    currentPageSize,
  };
}

