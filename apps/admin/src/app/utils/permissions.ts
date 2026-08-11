/**
 * Permission utility functions for admin app system access control
 */

export type Permission = string;

/**
 * Check if user has a specific permission
 * Supports wildcard permissions like "*.*", "system_admin.*" etc.
 */
export function hasPermission(userPermissions: Permission[], requiredPermission: string): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  // Check for exact match first
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check for wildcard permissions
  for (const permission of userPermissions) {
    if (permission === '*.*') {
      // Super admin permission - has access to everything
      return true;
    }

    if (permission.endsWith('*')) {
      // Check if permission starts with the required permission prefix
      const prefix = permission.slice(0, -1); // Remove the '*'
      if (requiredPermission.startsWith(prefix)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(userPermissions: Permission[], requiredPermissions: string[]): boolean {
  return requiredPermissions.some(permission => hasPermission(userPermissions, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(userPermissions: Permission[], requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => hasPermission(userPermissions, permission));
}

/**
 * System Admin Permission Constants
 */
export const PERMISSIONS = {
  // System Admin Master Permissions
  SYSTEM_ADMIN_MASTER: 'system_admin.master',
  SYSTEM_ADMIN_USERS: 'system_admin.users',
  SYSTEM_ADMIN_ORGANIZATIONS: 'system_admin.organizations',
  SYSTEM_ADMIN_BILLING: 'system_admin.billing',
  SYSTEM_ADMIN_REPORTING: 'system_admin.reporting',
  
  // General Admin Permissions
  ALL_PERMISSIONS: '*.*',
  ADMIN_ALL: 'admin.*',
  
  // Organization Management
  ORG_CREATE: 'organization.create',
  ORG_UPDATE: 'organization.update',
  ORG_DELETE: 'organization.delete',
  ORG_VIEW: 'organization.read',
  
  // User Management
  USER_CREATE: 'user.create',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  USER_VIEW: 'user.read',
  
  // Settings and Configuration
  SETTINGS_VIEW: 'settings.read',
  SETTINGS_UPDATE: 'settings.update',
} as const;

/**
 * Check if user has system admin master permission (full access)
 */
export function hasSystemAdminMasterPermission(userPermissions: Permission[]): boolean {
  return hasPermission(userPermissions, PERMISSIONS.SYSTEM_ADMIN_MASTER) || 
         hasPermission(userPermissions, PERMISSIONS.ALL_PERMISSIONS);
}

/**
 * Check if user can access system settings
 */
export function canAccessSystemSettings(userPermissions: Permission[]): boolean {
  return hasAnyPermission(userPermissions, [
    PERMISSIONS.SYSTEM_ADMIN_MASTER,
    PERMISSIONS.ALL_PERMISSIONS,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.ADMIN_ALL
  ]);
}

/**
 * Check if user can modify system settings
 */
export function canModifySystemSettings(userPermissions: Permission[]): boolean {
  return hasAnyPermission(userPermissions, [
    PERMISSIONS.SYSTEM_ADMIN_MASTER,
    PERMISSIONS.ALL_PERMISSIONS,
    PERMISSIONS.SETTINGS_UPDATE,
    PERMISSIONS.ADMIN_ALL
  ]);
}

/**
 * Check if user has cross-organization access
 */
export function hasCrossOrgAccess(userPermissions: Permission[]): boolean {
  return hasAnyPermission(userPermissions, [
    PERMISSIONS.SYSTEM_ADMIN_MASTER,
    PERMISSIONS.SYSTEM_ADMIN_USERS,
    PERMISSIONS.SYSTEM_ADMIN_ORGANIZATIONS,
    PERMISSIONS.ALL_PERMISSIONS
  ]);
}

/**
 * Domain to permission mapping for sidebar navigation
 */
const DOMAIN_PERMISSIONS: Record<string, string> = {
  'organizations': PERMISSIONS.SYSTEM_ADMIN_ORGANIZATIONS,
  'users': PERMISSIONS.SYSTEM_ADMIN_USERS,
  'billing': PERMISSIONS.SYSTEM_ADMIN_BILLING,
  'reporting': PERMISSIONS.SYSTEM_ADMIN_REPORTING,
};

/**
 * Check if user has permission for a specific domain (used by sidebar navigation)
 */
export function hasPermissionForDomain(userPermissions: Permission[], domain: string): boolean {
  const requiredPermission = DOMAIN_PERMISSIONS[domain];
  if (!requiredPermission) {
    // If domain is not mapped, deny access
    return false;
  }

  return hasPermission(userPermissions, requiredPermission) ||
         hasSystemAdminMasterPermission(userPermissions) ||
         hasPermission(userPermissions, PERMISSIONS.ALL_PERMISSIONS);
}