import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { accountApi } from '../utility/api/accounts';
import type { AccountListItem, AccountFilters, AccountPaginationResponse } from '../types/account.types';

const MAX_PAGE_SIZE = 100;
const MIN_PAGE_SIZE = 1;

const normalizePageSize = (pageSize: number) => Math.min(Math.max(pageSize, MIN_PAGE_SIZE), MAX_PAGE_SIZE);

export function useAccounts(
  initialPage = 1,
  initialPageSize = 20,
  filters?: AccountFilters,
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
) {
  const { accessToken } = useUserStore();
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [pagination, setPagination] = useState<AccountPaginationResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = useState(normalizePageSize(initialPageSize));
  const [currentSortBy, setCurrentSortBy] = useState(sortBy || 'account_code');
  const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc'>(sortOrder || 'asc');

  const fetchAccounts = useCallback(async () => {
    if (!accessToken) {
      setError('No access token available');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching accounts with params:', {
        page: currentPage,
        pageSize: currentPageSize,
        filters,
        sortBy: currentSortBy,
        sortOrder: currentSortOrder
      });
      
      const response = await accountApi.list(
        accessToken,
        currentPage,
        normalizePageSize(currentPageSize),
        filters,
        currentSortBy,
        currentSortOrder
      ) as AccountPaginationResponse;
      
      console.log('Account API response:', response);
      
      setAccounts(response.chart_of_accounts || []);
      setPagination(response.pagination || null);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      setAccounts([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, currentPageSize, filters, currentSortBy, currentSortOrder]);

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
    setCurrentPageSize(normalizePageSize(pageSize));
    setCurrentPage(1); // Reset to first page when page size changes
  }, []);

  const setSorting = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setCurrentSortBy(sortBy);
    setCurrentSortOrder(sortOrder);
    setCurrentPage(1); // Reset to first page when sorting changes
  }, []);

  return {
    accounts,
    pagination,
    loading,
    error,
    refetch,
    setPage,
    setPageSize,
    setSorting,
    currentPage,
    currentPageSize,
    currentSortBy,
    currentSortOrder,
  };
}
