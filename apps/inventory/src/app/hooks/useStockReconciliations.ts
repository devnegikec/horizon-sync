import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import type {
  StockReconciliation,
  StockReconciliationsResponse,
  StockReconciliationStats,
  StockReconciliationFilters,
} from '../types/stock.types';
import { buildUrl, buildPaginationParams } from '../utility';

interface UseStockReconciliationsResult {
  data: StockReconciliation[];
  pagination: StockReconciliationsResponse['pagination'] | null;
  stats: StockReconciliationStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  currentPage: number;
  currentPageSize: number;
}

export function useStockReconciliations(options: {
  page?: number;
  pageSize?: number;
  filters?: Partial<StockReconciliationFilters>;
} = {}): UseStockReconciliationsResult {
  const { page: initialPage = 1, pageSize: initialPageSize = 20, filters } = options;
  const accessToken = useUserStore((s) => s.accessToken);
  const [stockReconciliations, setStockReconciliations] = React.useState<StockReconciliation[]>([]);
  const [pagination, setPagination] = React.useState<StockReconciliationsResponse['pagination'] | null>(null);
  const [stats, setStats] = React.useState<StockReconciliationStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = React.useState(initialPageSize);

  // Sync internal state with options if they change
  React.useEffect(() => {
    if (options.page !== undefined) setCurrentPage(options.page);
  }, [options.page]);

  React.useEffect(() => {
    if (options.pageSize !== undefined) setCurrentPageSize(options.pageSize);
  }, [options.pageSize]);

  const fetchStockReconciliations = React.useCallback(async () => {
    if (!accessToken) {
      setStockReconciliations([]);
      setPagination(null);
      setStats(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = buildStockReconciliationsParams(currentPage, currentPageSize, filters);
      const url = buildUrl('/stock-reconciliations', params);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const message = `Error ${res.status}: ${res.statusText}`;
        throw new Error(message);
      }

      const data = (await res.json()) as StockReconciliationsResponse;
      setStockReconciliations(data.stock_reconciliations ?? []);
      setPagination(data.pagination ?? null);

      // Calculate stats from the data
      if (data.stats) {
        setStats(data.stats);
      } else {
        // Calculate stats manually if not provided by API
        const calculatedStats = calculateStats(data.stock_reconciliations ?? []);
        setStats(calculatedStats);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stock reconciliations';
      setError(message);
      setStockReconciliations([]);
      setPagination(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, currentPageSize, filters]);

  React.useEffect(() => {
    fetchStockReconciliations();
  }, [fetchStockReconciliations]);

  return {
    data: stockReconciliations,
    pagination,
    stats,
    loading,
    error,
    refetch: fetchStockReconciliations,
    setPage: setCurrentPage,
    setPageSize: setCurrentPageSize,
    currentPage,
    currentPageSize,
  };
}

/**
 * Build query parameters for stock reconciliations API call
 */
function buildStockReconciliationsParams(
  page: number,
  pageSize: number,
  filters?: Partial<StockReconciliationFilters>
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    ...buildPaginationParams(page, pageSize, 'posting_date', 'desc'),
  };

  if (!filters) return params;

  // Add filters to API params if provided
  const filterKeys: Array<keyof StockReconciliationFilters> = ['status', 'search'];

  filterKeys.forEach((key) => {
    const value = filters[key];
    if (value && value !== 'all') {
      params[key] = value;
    }
  });

  return params;
}

/**
 * Calculate stats from stock reconciliations data
 * This is a fallback if the API doesn't provide stats
 */
function calculateStats(stockReconciliations: StockReconciliation[]): StockReconciliationStats {
  const totalReconciliations = stockReconciliations.length;
  
  // Count reconciliations by status
  const pendingCount = stockReconciliations.filter((sr) => sr.status === 'draft').length;
  const completedCount = stockReconciliations.filter((sr) => sr.status === 'submitted').length;
  
  // Calculate total adjustments
  const totalAdjustments = stockReconciliations.reduce((sum, sr) => {
    const diff = typeof sr.total_difference === 'number' ? sr.total_difference : parseFloat(String(sr.total_difference || 0));
    return sum + (isNaN(diff) ? 0 : Math.abs(diff));
  }, 0);

  return {
    total_reconciliations: totalReconciliations,
    pending_count: pendingCount,
    completed_count: completedCount,
    total_adjustments: totalAdjustments,
  };
}
