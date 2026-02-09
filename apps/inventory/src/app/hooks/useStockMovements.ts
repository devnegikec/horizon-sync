import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import type {
  StockMovement,
  StockMovementsResponse,
  StockMovementStats,
  StockMovementFilters,
} from '../types/stock.types';
import { buildUrl, buildPaginationParams } from '../utility';

export interface UseStockMovementsResult {
  data: StockMovement[];
  pagination: StockMovementsResponse['pagination'] | null;
  stats: StockMovementStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  currentPage: number;
  currentPageSize: number;
}

export function useStockMovements(options: {
  page?: number;
  pageSize?: number;
  filters?: Partial<StockMovementFilters>;
} = {}): UseStockMovementsResult {
  const { page: initialPage = 1, pageSize: initialPageSize = 20, filters } = options;
  const accessToken = useUserStore((s) => s.accessToken);
  const [stockMovements, setStockMovements] = React.useState<StockMovement[]>([]);
  const [pagination, setPagination] = React.useState<StockMovementsResponse['pagination'] | null>(null);
  const [stats, setStats] = React.useState<StockMovementStats | null>(null);
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

  const fetchStockMovements = React.useCallback(async () => {
    if (!accessToken) {
      setStockMovements([]);
      setPagination(null);
      setStats(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = buildStockMovementsParams(currentPage, currentPageSize, filters);
      const url = buildUrl('/stock-movements', params);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const message = `Error ${res.status}: ${res.statusText}`;
        throw new Error(message);
      }

      const data = (await res.json()) as StockMovementsResponse;
      setStockMovements(data.stock_movements ?? []);
      setPagination(data.pagination ?? null);

      // Calculate stats from the data
      if (data.stats) {
        setStats(data.stats);
      } else {
        // Calculate stats manually if not provided by API
        const calculatedStats = calculateStats(data.stock_movements ?? []);
        setStats(calculatedStats);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stock movements';
      setError(message);
      setStockMovements([]);
      setPagination(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, currentPageSize, filters]);

  React.useEffect(() => {
    fetchStockMovements();
  }, [fetchStockMovements]);

  return {
    data: stockMovements,
    pagination,
    stats,
    loading,
    error,
    refetch: fetchStockMovements,
    setPage: setCurrentPage,
    setPageSize: setCurrentPageSize,
    currentPage,
    currentPageSize,
  };
}

/**
 * Build query parameters for stock movements API call
 */
function buildStockMovementsParams(
  page: number,
  pageSize: number,
  filters?: Partial<StockMovementFilters>
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    ...buildPaginationParams(page, pageSize, 'performed_at', 'desc'),
  };

  if (!filters) return params;

  // Add filters to API params if provided
  const filterKeys: Array<keyof StockMovementFilters> = [
    'item_id',
    'warehouse_id',
    'movement_type',
    'reference_type',
    'search',
  ];

  filterKeys.forEach((key) => {
    const value = filters[key];
    if (value && value !== 'all') {
      params[key] = value;
    }
  });

  return params;
}

/**
 * Calculate stats from stock movements data
 * This is a fallback if the API doesn't provide stats
 */
function calculateStats(stockMovements: StockMovement[]): StockMovementStats {
  const totalMovements = stockMovements.length;
  
  // Count movements by type
  const stockIn = stockMovements.filter((sm) => sm.movement_type === 'in').length;
  const stockOut = stockMovements.filter((sm) => sm.movement_type === 'out').length;
  const adjustments = stockMovements.filter((sm) => sm.movement_type === 'adjustment').length;

  return {
    total_movements: totalMovements,
    stock_in: stockIn,
    stock_out: stockOut,
    adjustments,
  };
}
