/**
 * Permission utility functions for inventory app
 */

export type Permission = string;

/**
 * Check if user has a specific permission
 * Supports wildcard permissions like "*.*", "user.*" etc.
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
 * Check if user is a system administrator
 * System admin has *.* or system.admin or role.manage permissions
 */
export function isSystemAdmin(userPermissions: Permission[]): boolean {
  return hasAnyPermission(userPermissions, ['*.*', 'system.admin', 'role.manage']);
}

/**
 * Account management permissions
 */
export const AccountPermissions = {
  view: (userPermissions: Permission[]) => 
    hasAnyPermission(userPermissions, ['*.*', 'account.*', 'account.read', 'account.view']),
  create: (userPermissions: Permission[]) => 
    hasAnyPermission(userPermissions, ['*.*', 'account.*', 'account.create']),
  update: (userPermissions: Permission[]) => 
    hasAnyPermission(userPermissions, ['*.*', 'account.*', 'account.update']),
  'delete': (userPermissions: Permission[]) => 
    hasAnyPermission(userPermissions, ['*.*', 'account.*', 'account.delete']),
  manageDefaults: (userPermissions: Permission[]) => 
    hasAnyPermission(userPermissions, ['*.*', 'account.*', 'account.manage', 'system.admin']),
};