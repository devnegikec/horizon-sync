import {
  SYSTEM_ADMIN_PERMISSIONS,
  hasPermission,
  hasAnyPermissionForDomain,
} from './permissions';

describe('SYSTEM_ADMIN_PERMISSIONS', () => {
  it('should contain exactly 21 permission codes', () => {
    expect(Object.keys(SYSTEM_ADMIN_PERMISSIONS)).toHaveLength(21);
  });

  it('should have master permission', () => {
    expect(SYSTEM_ADMIN_PERMISSIONS.MASTER).toBe('system_admin.master');
  });

  it('should have all CRUD + manage permissions for each domain', () => {
    const domains = ['USERS', 'ORGANIZATIONS', 'BILLING', 'REPORTING'];
    const actions = ['READ', 'CREATE', 'UPDATE', 'DELETE', 'MANAGE'];
    for (const domain of domains) {
      for (const action of actions) {
        const key = `${domain}_${action}` as keyof typeof SYSTEM_ADMIN_PERMISSIONS;
        expect(SYSTEM_ADMIN_PERMISSIONS[key]).toBe(
          `system_admin.${domain.toLowerCase()}_${action.toLowerCase()}`
        );
      }
    }
  });
});

describe('hasPermission', () => {
  it('should grant access when user has the exact permission', () => {
    expect(hasPermission(['system_admin.users_read'], 'system_admin.users_read')).toBe(true);
  });

  it('should deny access when user lacks the permission', () => {
    expect(hasPermission(['system_admin.users_read'], 'system_admin.users_create')).toBe(false);
  });

  it('should grant access for any permission when user has master', () => {
    const perms = ['system_admin.master'];
    expect(hasPermission(perms, 'system_admin.users_read')).toBe(true);
    expect(hasPermission(perms, 'system_admin.billing_delete')).toBe(true);
    expect(hasPermission(perms, 'system_admin.organizations_manage')).toBe(true);
  });

  it('should expand _manage to grant CRUD permissions', () => {
    const perms = ['system_admin.users_manage'];
    expect(hasPermission(perms, 'system_admin.users_read')).toBe(true);
    expect(hasPermission(perms, 'system_admin.users_create')).toBe(true);
    expect(hasPermission(perms, 'system_admin.users_update')).toBe(true);
    expect(hasPermission(perms, 'system_admin.users_delete')).toBe(true);
  });

  it('should not expand _manage across domains', () => {
    const perms = ['system_admin.users_manage'];
    expect(hasPermission(perms, 'system_admin.billing_read')).toBe(false);
  });

  it('should not grant _manage itself via _manage expansion', () => {
    // _manage expansion only applies to read/create/update/delete
    const perms = ['system_admin.billing_read'];
    expect(hasPermission(perms, 'system_admin.billing_manage')).toBe(false);
  });
});

describe('hasAnyPermissionForDomain', () => {
  it('should return true when user has any permission in the domain', () => {
    expect(hasAnyPermissionForDomain(['system_admin.users_read'], 'users')).toBe(true);
  });

  it('should return false when user has no permissions in the domain', () => {
    expect(hasAnyPermissionForDomain(['system_admin.billing_read'], 'users')).toBe(false);
  });

  it('should return true when user has master permission', () => {
    expect(hasAnyPermissionForDomain(['system_admin.master'], 'organizations')).toBe(true);
  });

  it('should match _manage permission for the domain', () => {
    expect(hasAnyPermissionForDomain(['system_admin.reporting_manage'], 'reporting')).toBe(true);
  });
});
