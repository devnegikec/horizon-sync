import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { accountApi } from '../utility/api/accounts';
import type { AccountListItem, AccountFilters, AccountPaginationResponse, AccountType } from '../types/account.types';

const MAX_PAGE_SIZE = 100;

/** Normalize API account_type to frontend AccountType (e.g. INCOME -> REVENUE) */
function normalizeAccountType(t: string | undefined): AccountType {
  if (!t) return 'ASSET';
  const u = String(t).toUpperCase();
  if (u === 'INCOME') return 'REVENUE';
  if (['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'].includes(u)) return u as AccountType;
  return 'ASSET';
}

/** Normalize a list item from API for consistent display and edit */
function normalizeAccountListItem(raw: Record<string, unknown>): AccountListItem {
  return {
    id: String(raw.id ?? ''),
    account_code: String(raw.account_code ?? ''),
    account_name: String(raw.account_name ?? ''),
    account_type: normalizeAccountType(raw.account_type as string),
    parent_account_id: raw.parent_account_id != null ? String(raw.parent_account_id) : null,
    currency: String(raw.currency ?? 'USD'),
    level: Number(raw.level ?? 1),
    is_group: Boolean(raw.is_group),
    is_active: raw.is_active === true || String(raw.status ?? '').toUpperCase() === 'ACTIVE',
    created_at: String(raw.created_at ?? ''),
  };
}
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
      const response = await accountApi.list(
        accessToken,
        currentPage,
        normalizePageSize(currentPageSize),
        filters,
        currentSortBy,
        currentSortOrder
      ) as AccountPaginationResponse;
      const rawList = response.chart_of_accounts || [];
      setAccounts(rawList.map((a) => normalizeAccountListItem(a as unknown as Record<string, unknown>)));
      setPagination(response.pagination || null);
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch accounts');
      setAccounts([]);
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
