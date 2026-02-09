import * as React from 'react';

import type { GroupedPermissions } from '../../../types/role.types';
import { RoleService } from '../../../services/role.service';

interface UsePermissionsResult {
  permissions: GroupedPermissions;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePermissions(accessToken?: string | null): UsePermissionsResult {
  const [permissions, setPermissions] = React.useState<GroupedPermissions>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPermissions = React.useCallback(async () => {
    if (!accessToken) {
      setPermissions({});
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await RoleService.getGroupedPermissions(accessToken);
      setPermissions(data.data ?? {});
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load permissions';
      setError(message);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    error,
    refetch: fetchPermissions,
  };
}
