import { useMemo } from 'react';

import { usePermissionsContext } from '../contexts/PermissionsContext';
import { hasAnyPermissionForDomain } from '../types/permissions';
import {
  hasAllPermissions,
  hasSystemAdminMasterPermission,
  canAccessSystemSettings,
  canModifySystemSettings,
  hasCrossOrgAccess,
} from '../utils/permissions';

export interface UsePermissionsResult {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasPermissionForDomain: (domain: string) => boolean;
  hasSystemAdminMaster: boolean;
  canAccessSystemSettings: boolean;
  canModifySystemSettings: boolean;
  hasCrossOrgAccess: boolean;
  loading: boolean;
  error: string | null;
}

export function usePermissions(): UsePermissionsResult {
  const {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
  } = usePermissionsContext();

  const derived = useMemo(
    () => ({
      hasAllPermissions: (perms: string[]) =>
        hasAllPermissions(permissions, perms),
      hasPermissionForDomain: (domain: string) =>
        hasAnyPermissionForDomain(permissions, domain),
      hasSystemAdminMaster: hasSystemAdminMasterPermission(permissions),
      canAccessSystemSettings: canAccessSystemSettings(permissions),
      canModifySystemSettings: canModifySystemSettings(permissions),
      hasCrossOrgAccess: hasCrossOrgAccess(permissions),
    }),
    [permissions]
  );

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    ...derived,
    loading,
    error,
  };
}
