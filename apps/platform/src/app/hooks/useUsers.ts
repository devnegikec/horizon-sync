import * as React from 'react';

import { environment } from '../../environments/environment';
import { UserService } from '../services/user.service';
import type { User, UsersResponse, UserFilters } from '../types/user.types';

const USERS_URL = `${environment.apiBaseUrl}/api/v1/identity/users`;

interface PendingInvitation {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  status: string;
  created_at: string;
}

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
  accessToken?: string | null,
  organizationId?: string | null
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
        throw new Error(getFriendlyHttpError(res.status));
      }

      const data = (await res.json()) as UsersResponse;
      let invitationRows: User[] = [];
      let invitationCount = 0;
      const shouldLoadInvitations =
        organizationId &&
        (!filters?.userType || filters.userType === 'all') &&
        (!filters?.status || filters.status === 'all' || filters.status === 'pending');

      if (shouldLoadInvitations) {
        const invitationResponse = await UserService.getPendingInvitations(
          organizationId,
          accessToken,
          filters?.search ?? '',
          0,
          100
        );

        invitationCount = invitationResponse.total ?? 0;
        invitationRows = invitationResponse.data.map((invitation: PendingInvitation) => ({
          id: invitation.id,
          email: invitation.email,
          first_name: invitation.first_name ?? '',
          last_name: invitation.last_name ?? '',
          display_name:
            invitation.first_name || invitation.last_name
              ? `${invitation.first_name ?? ''} ${invitation.last_name ?? ''}`.trim()
              : invitation.email,
          user_type: 'regular',
          status: invitation.status,
          email_verified: false,
          last_login_at: null,
          created_at: invitation.created_at,
          avatar_url: null,
          phone: null,
          mfa_enabled: false,
        }));
      }

      setUsers([...(data.users ?? []), ...invitationRows]);
      setPagination(data.pagination ?? null);
      setStatusCounts(data.status_counts ?? null);
      setPendingInvitationCount(invitationCount);
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
  }, [accessToken, currentPage, currentPageSize, filters, organizationId]);

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
