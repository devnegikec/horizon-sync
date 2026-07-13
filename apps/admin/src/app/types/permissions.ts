export const SYSTEM_ADMIN_PERMISSIONS = {
  MASTER: 'system_admin.master',
  USERS_READ: 'system_admin.users_read',
  USERS_CREATE: 'system_admin.users_create',
  USERS_UPDATE: 'system_admin.users_update',
  USERS_DELETE: 'system_admin.users_delete',
  USERS_MANAGE: 'system_admin.users_manage',
  ORGANIZATIONS_READ: 'system_admin.organizations_read',
  ORGANIZATIONS_CREATE: 'system_admin.organizations_create',
  ORGANIZATIONS_UPDATE: 'system_admin.organizations_update',
  ORGANIZATIONS_DELETE: 'system_admin.organizations_delete',
  ORGANIZATIONS_MANAGE: 'system_admin.organizations_manage',
  BILLING_READ: 'system_admin.billing_read',
  BILLING_CREATE: 'system_admin.billing_create',
  BILLING_UPDATE: 'system_admin.billing_update',
  BILLING_DELETE: 'system_admin.billing_delete',
  BILLING_MANAGE: 'system_admin.billing_manage',
  REPORTING_READ: 'system_admin.reporting_read',
  REPORTING_CREATE: 'system_admin.reporting_create',
  REPORTING_UPDATE: 'system_admin.reporting_update',
  REPORTING_DELETE: 'system_admin.reporting_delete',
  REPORTING_MANAGE: 'system_admin.reporting_manage',
} as const;

export type SystemAdminPermission =
  (typeof SYSTEM_ADMIN_PERMISSIONS)[keyof typeof SYSTEM_ADMIN_PERMISSIONS];

export function hasPermission(
  userPermissions: string[],
  required: string
): boolean {
  if (userPermissions.includes('system_admin.master')) return true;
  if (userPermissions.includes(required)) return true;
  // _manage expansion
  const match = required.match(
    /^system_admin\.(\w+)_(read|create|update|delete)$/
  );
  if (match) {
    const managePerm = `system_admin.${match[1]}_manage`;
    if (userPermissions.includes(managePerm)) return true;
  }
  return false;
}

export function hasAnyPermissionForDomain(
  userPermissions: string[],
  domain: string
): boolean {
  if (userPermissions.includes('system_admin.master')) return true;
  return userPermissions.some((p) => p.startsWith(`system_admin.${domain}_`));
}
