import * as React from 'react';

import type { GroupedPermissions, ModuleGroup, PermissionGroupedResponse } from '../../../types/role.types';
import { RoleService } from '../../../services/role.service';

interface UsePermissionsResult {
  /** Legacy flat map { resource: Permission[] } — used by PermissionMatrix */
  permissions: GroupedPermissions;
  /** Module-grouped structure — used by ModulePermissionMatrix */
  modules: ModuleGroup[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function usePermissions(accessToken?: string | null): UsePermissionsResult {
  const [permissions, setPermissions] = React.useState<GroupedPermissions>({});
  const [modules, setModules] = React.useState<ModuleGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPermissions = React.useCallback(async () => {
    if (!accessToken) {
      setPermissions({});
      setModules([]);
      setLoading(false);
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data: PermissionGroupedResponse = await RoleService.getGroupedPermissions(accessToken);
      setPermissions(data.data ?? {});
      setModules(data.modules ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load permissions';
      setError(message);
      setPermissions({});
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    modules,
    loading,
    error,
    refetch: fetchPermissions,
  };
}
