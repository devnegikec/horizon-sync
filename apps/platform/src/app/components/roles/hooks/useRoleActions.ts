import * as React from 'react';

import type { Role, RoleFormData } from '../../../types/role.types';
import { RoleService } from '../../../services/role.service';

interface UseRoleActionsResult {
  createRole: (data: RoleFormData) => Promise<Role>;
  updateRole: (roleId: string, data: Partial<RoleFormData>) => Promise<Role>;
  deleteRole: (roleId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useRoleActions(
  accessToken?: string | null,
  onSuccess?: () => void
): UseRoleActionsResult {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createRole = React.useCallback(
    async (data: RoleFormData): Promise<Role> => {
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      setLoading(true);
      setError(null);

      try {
        const role = await RoleService.createRole(data, accessToken);
        onSuccess?.();
        return role;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create role';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [accessToken, onSuccess]
  );

  const updateRole = React.useCallback(
    async (roleId: string, data: Partial<RoleFormData>): Promise<Role> => {
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      setLoading(true);
      setError(null);

      try {
        const role = await RoleService.updateRole(roleId, data, accessToken);
        onSuccess?.();
        return role;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update role';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [accessToken, onSuccess]
  );

  const deleteRole = React.useCallback(
    async (roleId: string): Promise<void> => {
      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      setLoading(true);
      setError(null);

      try {
        await RoleService.deleteRole(roleId, accessToken);
        onSuccess?.();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete role';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [accessToken, onSuccess]
  );

  return {
    createRole,
    updateRole,
    deleteRole,
    loading,
    error,
  };
}
