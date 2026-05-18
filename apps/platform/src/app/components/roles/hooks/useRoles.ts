import * as React from 'react';

import type { Role, RoleFilters, RoleListResponse } from '../../../types/role.types';
import { RoleService } from '../../../services/role.service';

/** Map network/fetch errors to user-friendly messages */
function getFriendlyErrorMessage(err: unknown): string {
  // AppError from RoleService
  if (err && typeof err === 'object' && 'message' in err && 'type' in err) {
    const appErr = err as { message: string; type: string };
    // Map server errors to the standard service unavailable message
    if (appErr.type === 'NETWORK_ERROR' || appErr.type === 'SERVER_ERROR') {
      return 'The service is temporarily unavailable. Please try again in a few moments.';
    }
    return appErr.message;
  }
  if (err instanceof Error) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('ERR_CONNECTION_REFUSED')) {
      return 'The service is temporarily unavailable. Please try again in a few moments.';
    }
    return err.message;
  }
  return 'Failed to load roles';
}

interface UseRolesResult {
  roles: Role[];
  pagination: RoleListResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  currentPage: number;
  currentPageSize: number;
}

export function useRoles(
  initialPage = 1,
  initialPageSize = 20,
  filters: Omit<RoleFilters, 'page' | 'pageSize'>,
  accessToken?: string | null
): UseRolesResult {
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [pagination, setPagination] = React.useState<RoleListResponse['pagination'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentPage, setCurrentPage] = React.useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = React.useState(initialPageSize);

  const fetchRoles = React.useCallback(async () => {
    if (!accessToken) {
      setRoles([]);
      setPagination(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fullFilters: RoleFilters = {
        ...filters,
        page: currentPage,
        pageSize: currentPageSize,
      };

      const data = await RoleService.getRoles(fullFilters, accessToken);
      setRoles(data.data ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
      setRoles([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, currentPage, currentPageSize, filters]);

  React.useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return {
    roles,
    pagination,
    loading,
    error,
    refetch: fetchRoles,
    setPage: setCurrentPage,
    setPageSize: setCurrentPageSize,
    currentPage,
    currentPageSize,
  };
}
