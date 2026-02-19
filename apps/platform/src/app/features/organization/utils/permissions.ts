import type { User } from '@horizon-sync/store';

/**
 * Check if a user has a specific permission
 * 
 * This function checks both direct user permissions and role-based permissions.
 * It supports wildcard permissions like "*.*" and "organization.*"
 * 
 * @param user - The user object (can be null for unauthenticated users)
 * @param permission - The permission string to check (e.g., "organization.update")
 * @returns boolean indicating if the user has the specified permission
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) {
    return false;
  }

  // Check direct user permissions
  if (user.permissions && Array.isArray(user.permissions)) {
    if (checkPermissionInList(user.permissions, permission)) {
      return true;
    }
  }

  // Check role permissions
  if (user.role?.permissions && Array.isArray(user.role.permissions)) {
    if (checkPermissionInList(user.role.permissions, permission)) {
      return true;
    }
  }

  return false;
}

/**
 * Helper function to check if a permission exists in a list of permissions
 * Supports wildcard matching
 */
function checkPermissionInList(permissions: string[], requiredPermission: string): boolean {
  // Check for exact match
  if (permissions.includes(requiredPermission)) {
    return true;
  }

  // Check for wildcard permissions
  for (const perm of permissions) {
    // Super admin permission - has access to everything
    if (perm === '*.*') {
      return true;
    }

    // Check for prefix wildcard (e.g., "organization.*")
    if (perm.endsWith('*')) {
      const prefix = perm.slice(0, -1); // Remove the '*'
      if (requiredPermission.startsWith(prefix)) {
        return true;
      }
    }
  }

  return false;
}
