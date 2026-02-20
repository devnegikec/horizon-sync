import { useUserStore } from '@horizon-sync/store';
import type { User } from '@horizon-sync/store';

/**
 * Check if a user has a specific permission
 * 
 * This function checks permissions from the global store first (recommended),
 * then falls back to checking user object permissions for backward compatibility.
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

  // First, try to get permissions from global store (preferred method)
  const storePermissions = getStorePermissions();
  if (storePermissions.length > 0) {
    return checkPermissionInList(storePermissions, permission);
  }

  // Fallback: Check user object permissions
  return checkUserPermissions(user, permission);
}

/**
 * Get permissions from the global store
 */
function getStorePermissions(): string[] {
  try {
    const storeState = useUserStore.getState();
    return storeState.permissions.permissions;
  } catch {
    // If store is not available (e.g., in tests), return empty array
    return [];
  }
}

/**
 * Check permissions from user object (fallback method)
 */
function checkUserPermissions(user: User, permission: string): boolean {
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
 * Check permissions directly from the global store (recommended for new code)
 * 
 * @param permission - The permission string to check (e.g., "organization.update")
 * @returns boolean indicating if the current user has the specified permission
 */
export function hasPermissionFromStore(permission: string): boolean {
  const storeState = useUserStore.getState();
  return checkPermissionInList(storeState.permissions.permissions, permission);
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
