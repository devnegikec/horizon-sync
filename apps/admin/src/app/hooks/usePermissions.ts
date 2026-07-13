import { useMemo } from 'react';

import { useAdminProfile } from './useAdminProfile';
import type { Permission } from '../utils/permissions';
import { 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  hasSystemAdminMasterPermission,
  canAccessSystemSettings,
  canModifySystemSettings,
  hasCrossOrgAccess,
  hasPermissionForDomain as checkDomainPermission
} from '../utils/permissions';

export interface UsePermissionsResult {
  permissions: Permission[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasPermissionForDomain: (domain: string) => boolean;
  hasSystemAdminMaster: boolean;
  canAccessSystemSettings: boolean;
  canModifySystemSettings: boolean;
  hasCrossOrgAccess: boolean;
  loading: boolean;
}

export function usePermissions(): UsePermissionsResult {
  const { data: profile, isPending } = useAdminProfile();
  
  const userPermissions = profile?.permissions || [];
  
  const permissionCheckers = useMemo(() => ({
    hasPermission: (permission: string) => hasPermission(userPermissions, permission),
    hasAnyPermission: (permissions: string[]) => hasAnyPermission(userPermissions, permissions),
    hasAllPermissions: (permissions: string[]) => hasAllPermissions(userPermissions, permissions),
    hasPermissionForDomain: (domain: string) => checkDomainPermission(userPermissions, domain),
    hasSystemAdminMaster: hasSystemAdminMasterPermission(userPermissions),
    canAccessSystemSettings: canAccessSystemSettings(userPermissions),
    canModifySystemSettings: canModifySystemSettings(userPermissions),
    hasCrossOrgAccess: hasCrossOrgAccess(userPermissions),
  }), [userPermissions]);
  
  return {
    permissions: userPermissions,
    ...permissionCheckers,
    loading: isPending,
  };
}