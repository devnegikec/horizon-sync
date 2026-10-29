/**
 * Permission-code matching helpers.
 *
 * Kept local to `@horizon-sync/access` (instead of importing an app-level util)
 * so the module is self-contained. Semantics intentionally mirror the checks
 * already used across the platform/inventory apps:
 *   - exact match wins
 *   - `resource.*` grants any action on that resource
 *   - `*.*` grants everything (super admin)
 */

export const SUPER_ADMIN_PERMISSION = '*.*';

export function hasPermission(userPermissions: readonly string[], requiredPermission: string): boolean {
  if (!userPermissions || userPermissions.length === 0) {
    return false;
  }

  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  for (const permission of userPermissions) {
    if (permission === SUPER_ADMIN_PERMISSION) {
      return true;
    }

    if (permission.endsWith('*')) {
      const prefix = permission.slice(0, -1);
      if (requiredPermission.startsWith(prefix)) {
        return true;
      }
    }
  }

  return false;
}

export function hasAnyPermission(userPermissions: readonly string[], requiredPermissions: readonly string[]): boolean {
  return requiredPermissions.some((permission) => hasPermission(userPermissions, permission));
}
