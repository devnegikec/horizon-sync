import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import type { StockLevel, StockLevelsResponse, StockLevelStats, StockLevelFilters } from '../types/stock.types';
import { buildUrl, buildPaginationParams } from '../utility';

const STOCK_LEVELS_URL = `${environment.apiCoreUrl}/stock-levels`;

interface UseStockLevelsResult {
  stockLevels: StockLevel[];
  pagination: StockLevelsResponse['pagination'] | null;
  stats: StockLevelStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  currentPage: number;
  currentPageSize: number;
}

export function useStockLevels(
  initialPage = 1,
  initialPageSize = 20,
  filters?: Partial<StockLevelFilters>
): UseStockLevelsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [stockLevels, setStockLevels] = React.useState<StockLevel[]>([]);
  const [pagination, setPagination] = React.useState<StockLevelsResponse['pagination'] | null>(null);
  const [stats, setStats] = React.useState<StockLevelStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = React.useState(initialPageSize);

  const fetchStockLevels = React.useCallback(async () => {
    if (!accessToken) {
      setStockLevels([]);
      setPagination(null);
      setStats(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        ...buildPaginationParams(currentPage, currentPageSize, 'updated_at', 'desc'),
      };

      // Add filters to API params if provided
      if (filters?.item_id && filters.item_id !== 'all') {
        params.item_id = filters.item_id;
      }
      if (filters?.warehouse_id && filters.warehouse_id !== 'all') {
        params.warehouse_id = filters.warehouse_id;
      }
      if (filters?.search) {
        params.search = filters.search;
      }

      const url = buildUrl('/stock-levels', params);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const message = `Error ${res.status}: ${res.statusText}`;
        throw new Error(message);
      }

      const data = (await res.json()) as StockLevelsResponse;
      setStockLevels(data.stock_levels ?? []);
      setPagination(data.pagination ?? null);

      // Calculate stats from the data
      if (data.stats) {
        setStats(data.stats);
      } else {
        // Calculate stats manually if not provided by API
        const calculatedStats = calculateStats(data.stock_levels ?? []);
        setStats(calculatedStats);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stock levels';
      setError(message);
      setStockLevels([]);
      setPagination(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, currentPageSize, filters]);

  React.useEffect(() => {
    fetchStockLevels();
  }, [fetchStockLevels]);

  return {
    stockLevels,
    pagination,
    stats,
    loading,
    error,
    refetch: fetchStockLevels,
    setPage: setCurrentPage,
    setPageSize: setCurrentPageSize,
    currentPage,
    currentPageSize,
  };
}

/**
 * Calculate stats from stock levels data
 * This is a fallback if the API doesn't provide stats
 */
function calculateStats(stockLevels: StockLevel[]): StockLevelStats {
  const uniqueItems = new Set(stockLevels.map((sl) => sl.product_id));
  const uniqueWarehouses = new Set(stockLevels.map((sl) => sl.warehouse_id));
  
  // Count low stock items (available quantity < 10)
  const lowStockItems = stockLevels.filter((sl) => sl.quantity_available < 10 && sl.quantity_available > 0).length;
  
  // Count out of stock items (available quantity = 0)
  const outOfStockItems = stockLevels.filter((sl) => sl.quantity_available === 0).length;

  return {
    total_items: uniqueItems.size,
    total_warehouses: uniqueWarehouses.size,
    low_stock_items: lowStockItems,
    out_of_stock_items: outOfStockItems,
  };
}
