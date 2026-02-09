import * as React from 'react';

import { environment } from '../../environments/environment';
import type { User, UsersResponse, UserFilters } from '../types/user.types';

const USERS_URL = `${environment.apiBaseUrl}/identity/users`;

interface UseUsersResult {
  users: User[];
  pagination: UsersResponse['pagination'] | null;
  statusCounts: UsersResponse['status_counts'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  currentPage: number;
  currentPageSize: number;
}

export function useUsers(
  initialPage = 1,
  initialPageSize = 20,
  filters?: UserFilters,
  accessToken?: string | null
): UseUsersResult {
  const [users, setUsers] = React.useState<User[]>([]);
  const [pagination, setPagination] = React.useState<UsersResponse['pagination'] | null>(null);
  const [statusCounts, setStatusCounts] = React.useState<UsersResponse['status_counts'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = React.useState(initialPageSize);

  const fetchUsers = React.useCallback(async () => {
    if (!accessToken) {
      setUsers([]);
      setPagination(null);
      setStatusCounts(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        page_size: String(currentPageSize),
      });

      // Add filters to API params if provided
      if (filters?.search) {
        params.append('search', filters.search);
      }
      if (filters?.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters?.userType && filters.userType !== 'all') {
        params.append('user_type', filters.userType);
      }

      const res = await fetch(`${USERS_URL}?${params}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const message = `Error ${res.status}: ${res.statusText}`;
        throw new Error(message);
      }

      const data = (await res.json()) as UsersResponse;
      setUsers(data.users ?? []);
      setPagination(data.pagination ?? null);
      setStatusCounts(data.status_counts ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      setError(message);
      setUsers([]);
      setPagination(null);
      setStatusCounts(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, currentPageSize, filters]);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    pagination,
    statusCounts,
    loading,
    error,
    refetch: fetchUsers,
    setPage: setCurrentPage,
    setPageSize: setCurrentPageSize,
    currentPage,
    currentPageSize,
  };
}
