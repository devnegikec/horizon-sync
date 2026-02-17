import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { accountApi } from '../utility/api/accounts';
import type { AccountListItem, AccountFilters, AccountPaginationResponse } from '../types/account.types';

export function useAccounts(initialPage = 1, initialPageSize = 20, filters?: AccountFilters) {
  const { accessToken } = useUserStore();
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [pagination, setPagination] = useState<AccountPaginationResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = useState(initialPageSize);

  const fetchAccounts = useCallback(async () => {
    if (!accessToken) {
      setError('No access token available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await accountApi.list(
        accessToken,
        currentPage,
        currentPageSize,
        filters
      ) as AccountPaginationResponse;
      setAccounts(response.chart_of_accounts || []);
      setPagination(response.pagination || null);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, currentPageSize, filters]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const refetch = useCallback(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setCurrentPageSize(pageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  return {
    accounts,
    pagination,
    loading,
    error,
    refetch,
    setPage,
    setPageSize,
    currentPage,
    currentPageSize,
  };
}
