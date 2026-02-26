import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import type {
  StockEntry,
  StockEntriesResponse,
  StockEntryStats,
  StockEntryFilters,
} from '../../types/stock.types';
import { buildUrl, buildPaginationParams } from '../../utility';

export interface UseStockEntriesResult {
  data: StockEntry[];
  pagination: StockEntriesResponse['pagination'] | null;
  stats: StockEntryStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  currentPage: number;
  currentPageSize: number;
}

/**
 * Build query parameters for stock entries API call
 */
function buildStockEntriesParams(
  page: number,
  pageSize: number,
  filters?: Partial<StockEntryFilters>
): Record<string, string | number> {
  const params: Record<string, string | number> = {
    ...buildPaginationParams(page, pageSize, 'posting_date', 'desc'),
  };

  if (!filters) return params;

  // Add filters to API params if provided
  const filterKeys: Array<keyof StockEntryFilters> = [
    'stock_entry_type',
    'status',
    'from_warehouse_id',
    'to_warehouse_id',
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
 * Calculate stats from stock entries data
 * This is a fallback if the API doesn't provide stats
 */
function calculateStats(stockEntries: StockEntry[]): StockEntryStats {
  const totalEntries = stockEntries.length;
  
  // Count entries by status
  const draftCount = stockEntries.filter((se) => se.status === 'draft').length;
  const submittedCount = stockEntries.filter((se) => se.status === 'submitted').length;
  
  // Calculate total value
  const totalValue = stockEntries.reduce((sum, se) => {
    const value = typeof se.total_value === 'number' ? se.total_value : parseFloat(String(se.total_value || 0));
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

  return {
    total_entries: totalEntries,
    draft_count: draftCount,
    submitted_count: submittedCount,
    total_value: totalValue,
  };
}

export function useStockEntries(options: {
  page?: number;
  pageSize?: number;
  filters?: Partial<StockEntryFilters>;
} = {}): UseStockEntriesResult {
  const { page: initialPage = 1, pageSize: initialPageSize = 20, filters } = options;
  const accessToken = useUserStore((s) => s.accessToken);
  const [stockEntries, setStockEntries] = React.useState<StockEntry[]>([]);
  const [pagination, setPagination] = React.useState<StockEntriesResponse['pagination'] | null>(null);
  const [stats, setStats] = React.useState<StockEntryStats | null>(null);
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

  // Extract filter values to prevent unnecessary re-renders
  const stockEntryType = filters?.stock_entry_type;
  const status = filters?.status;
  const fromWarehouseId = filters?.from_warehouse_id;
  const toWarehouseId = filters?.to_warehouse_id;
  const search = filters?.search;

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = React.useMemo(() => filters, [
    stockEntryType,
    status,
    fromWarehouseId,
    toWarehouseId,
    search,
  ]);

  const fetchStockEntries = React.useCallback(async () => {
    if (!accessToken) {
      setStockEntries([]);
      setPagination(null);
      setStats(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = buildStockEntriesParams(currentPage, currentPageSize, memoizedFilters);
      const url = buildUrl('/stock-entries', params);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const message = `Error ${res.status}: ${res.statusText}`;
        throw new Error(message);
      }

      const data = (await res.json()) as StockEntriesResponse;
      setStockEntries(data.stock_entries ?? []);
      setPagination(data.pagination ?? null);

      // Calculate stats from the data
      if (data.stats) {
        setStats(data.stats);
      } else {
        // Calculate stats manually if not provided by API
        const calculatedStats = calculateStats(data.stock_entries ?? []);
        setStats(calculatedStats);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stock entries';
      setError(message);
      setStockEntries([]);
      setPagination(null);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, currentPageSize, memoizedFilters]);

  React.useEffect(() => {
    fetchStockEntries();
  }, [fetchStockEntries]);

  return {
    data: stockEntries,
    pagination,
    stats,
    loading,
    error,
    refetch: fetchStockEntries,
    setPage: setCurrentPage,
    setPageSize: setCurrentPageSize,
    currentPage,
    currentPageSize,
  };
}
