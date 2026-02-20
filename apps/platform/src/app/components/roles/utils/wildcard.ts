import type { Permission } from '../../../types/role.types';

/**
 * Check if a permission code is a wildcard pattern
 */
export function isWildcardPermission(code: string): boolean {
  return code.includes('*');
}

/**
 * Get the type of wildcard permission
 */
export function getWildcardType(code: string): 'full' | 'module' | 'none' {
  if (code === '*.*') return 'full';
  if (code.endsWith('.*')) return 'module';
  return 'none';
}

/**
 * Validate wildcard permission pattern
 */
export function validateWildcardPattern(code: string): boolean {
  if (!isWildcardPermission(code)) return true;
  
  // Valid patterns: *.* or resource.*
  return code === '*.*' || /^[a-zA-Z0-9_-]+\.\*$/.test(code);
}

/**
 * Expand wildcard permissions for UI display
 */
export function expandWildcardPermissions(
  rolePermissions: string[],
  allPermissions: Permission[]
): Set<string> {
  const expanded = new Set<string>();

  for (const perm of rolePermissions) {
    if (perm === '*.*') {
      // Add all permissions
      allPermissions.forEach((p) => expanded.add(p.code));
    } else if (perm.endsWith('.*')) {
      // Add all permissions in module
      const resource = perm.split('.')[0];
      allPermissions
        .filter((p) => p.code.startsWith(resource + '.'))
        .forEach((p) => expanded.add(p.code));
    } else {
      expanded.add(perm);
    }
  }

  return expanded;
}

/**
 * Suggest wildcard compression when saving permissions
 */
export function suggestWildcardCompression(
  selectedPermissions: Set<string>,
  allPermissions: Permission[]
): string[] {
  const permArray = Array.from(selectedPermissions);

  // Check for full access
  if (permArray.length === allPermissions.length) {
    return ['*.*'];
  }

  // Group permissions by resource (first part of code)
  const resourceGroups = new Map<string, Permission[]>();
  allPermissions.forEach((perm) => {
    const resource = perm.code.split('.')[0];
    if (!resource) return;
    
    if (!resourceGroups.has(resource)) {
      resourceGroups.set(resource, []);
    }
    const group = resourceGroups.get(resource);
    if (group) {
      group.push(perm);
    }
  });

  const compressed: string[] = [];
  const remaining = new Set(selectedPermissions);

  // Check each resource group for complete selection
  for (const [resource, perms] of resourceGroups.entries()) {
    const resourcePermCodes = perms.map((p) => p.code);
    const allResourcePermsSelected = resourcePermCodes.every((code) => remaining.has(code));

    if (allResourcePermsSelected && resourcePermCodes.length > 1) {
      compressed.push(`${resource}.*`);
      resourcePermCodes.forEach((code) => remaining.delete(code));
    }
  }

  // Add remaining individual permissions
  compressed.push(...Array.from(remaining));

  return compressed;
}
