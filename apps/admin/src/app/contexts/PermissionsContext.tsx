import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import {
  hasPermission as checkPermission,
  hasAnyPermissionForDomain,
} from '../types/permissions';
import { handleApiError } from '../utils/error-handler';

const API_CORE_URL = environment.apiCoreUrl;

interface PermissionsContextValue {
  permissions: string[];
  loading: boolean;
  error: string | null;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  permissions: [],
  loading: true,
  error: null,
  hasPermission: () => false,
  hasAnyPermission: () => false,
});

interface MePermissionsResponse {
  user_id: string;
  user_type: string;
  permissions: string[];
}

async function fetchMyPermissions(token: string): Promise<MePermissionsResponse> {
  const response = await fetch(`${API_CORE_URL}/api/v1/admin/me/permissions`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = new Error(`HTTP error! status: ${response.status}`);
    (error as Error & { status?: number }).status = response.status;
    try {
      (error as Error & { data?: unknown }).data = await response.json();
    } catch {
      // ignore JSON parse failure
    }
    throw error;
  }

  return response.json();
}

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const accessToken = useUserStore((state) => state.accessToken);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setPermissions([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchMyPermissions(accessToken)
      .then((data) => {
        if (!cancelled) {
          setPermissions(data.permissions);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : 'Failed to fetch permissions';
          setError(message);
          setPermissions([]);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const hasPermission = useCallback(
    (code: string) => checkPermission(permissions, code),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (codes: string[]) => codes.some((code) => checkPermission(permissions, code)),
    [permissions]
  );

  const value = useMemo<PermissionsContextValue>(
    () => ({
      permissions,
      loading,
      error,
      hasPermission,
      hasAnyPermission,
    }),
    [permissions, loading, error, hasPermission, hasAnyPermission]
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext(): PermissionsContextValue {
  return useContext(PermissionsContext);
}
