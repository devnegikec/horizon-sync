import * as React from 'react';

import { environment } from '../../environments/environment';
import type { User, UsersResponse, UserFilters } from '../types/user.types';

const USERS_URL = `${environment.apiBaseUrl}/api/v1/identity/users`;

/** Map HTTP status codes to user-friendly error messages */
function getFriendlyHttpError(status: number): string {
  switch (status) {
    case 401: return 'Your session has expired. Please log in again.';
    case 403: return 'You do not have permission to view users.';
    case 404: return 'The users service endpoint was not found.';
    case 422: return 'The submitted data is invalid. Please check your input.';
    case 500: return 'An unexpected server error occurred. Please try again later.';
    case 502: case 503: case 504: return 'The service is temporarily unavailable. Please try again in a few moments.';
    default: return `Something went wrong (Error ${status}). Please try again later.`;
  }
}

/** Map network/fetch errors to user-friendly messages */
function getFriendlyNetworkError(message: string): string {
  if (message.includes('Failed to fetch') || message.includes('NetworkError') || message.includes('ERR_CONNECTION_REFUSED')) {
    return 'The service is temporarily unavailable. Please try again in a few moments.';
  }
  return message;
}

/**
 * Keep one row per user from the `/identity/users` payload.
 *
 * The endpoint is the only source for this list, but a repeated record (for
 * example a role join or a re-invited email that now has two user rows) would
 * render the same person twice. De-duplicating here guarantees the table shows
 * each user once, in the order returned by the API.
 */
function dedupeUsers(users: User[]): User[] {
  const seen = new Set<string>();
  const unique: User[] = [];
  const duplicates: string[] = [];

  for (const user of users) {
    const key = (user.id || user.email || '').trim().toLowerCase();
    if (!key) continue;
    if (seen.has(key)) {
      duplicates.push(user.email || user.id);
      continue;
    }
    seen.add(key);
    unique.push(user);
  }

  if (duplicates.length > 0 && typeof console !== 'undefined') {
    console.warn('[useUsers] /identity/users returned duplicate rows:', duplicates);
  }

  return unique;
}

/** Builds the single request URL for the users list — no other endpoints are called. */
function buildUsersUrl(page: number, pageSize: number, filters?: UserFilters): string {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  if (filters?.search) {
    params.append('search', filters.search);
  }
  if (filters?.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }

  return `${USERS_URL}?${params}`;
}

/** Performs the users request and surfaces a friendly error on failure. */
async function requestUsers(url: string, accessToken: string): Promise<UsersResponse> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(getFriendlyHttpError(res.status));
  }

  return (await res.json()) as UsersResponse;
}

interface UseUsersResult {
  users: User[];
  pagination: UsersResponse['pagination'] | null;
  statusCounts: UsersResponse['status_counts'] | null;
  pendingInvitationCount: number;
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
  const [pendingInvitationCount, setPendingInvitationCount] = React.useState(0);
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
      const url = buildUsersUrl(currentPage, currentPageSize, filters);
      const data = await requestUsers(url, accessToken);

      // Single source of truth: `/identity/users?page=&page_size=`.
      // No invitation merge, and repeats inside the payload are collapsed so the
      // table can never render the same user twice.
      setUsers(dedupeUsers(data.users ?? []));
      setPagination(data.pagination ?? null);
      setStatusCounts(data.status_counts ?? null);
      setPendingInvitationCount(data.status_counts?.pending ?? 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users';
      setError(getFriendlyNetworkError(message));
      setUsers([]);
      setPagination(null);
      setStatusCounts(null);
      setPendingInvitationCount(0);
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
    pendingInvitationCount,
    loading,
    error,
    refetch: fetchUsers,
    setPage: setCurrentPage,
    setPageSize: setCurrentPageSize,
    currentPage,
    currentPageSize,
  };
}
