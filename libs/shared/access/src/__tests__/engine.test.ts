import { emptyModuleAccess, resolveModuleAccess } from '../engine';
import type { AccessUserContext, ModuleAccessConfig } from '../types';

function ctx(partial: Partial<AccessUserContext>): AccessUserContext {
  return { permissions: [], roles: [], userTypes: [], ...partial };
}

const config: ModuleAccessConfig = {
  module: 'demo',
  label: 'Demo',
  resources: [
    {
      key: 'orders',
      label: 'Orders',
      actions: ['view', 'create', 'update', 'delete'],
      actionPermissions: {
        view: ['order.read'],
        create: ['order.create'],
        update: ['order.update'],
        delete: ['order.delete'],
      },
    },
    { key: 'settings', label: 'Settings', actions: ['view', 'manage'], actionPermissions: { view: ['settings.read'] } },
  ],
  rules: [
    {
      id: 'boss',
      label: 'Boss',
      priority: 100,
      userTypes: ['organization_admin'],
      grants: { orders: '*', settings: '*' },
    },
    {
      id: 'staff',
      label: 'Staff',
      priority: 50,
      roles: ['Staff'],
      grants: { orders: ['view', 'create'] },
    },
  ],
};

describe('resolveModuleAccess', () => {
  it('denies everything when no rule matches and no permissions are present', () => {
    const access = resolveModuleAccess(config, ctx({}));
    expect(access.can('orders', 'view')).toBe(false);
    expect(access.visible('orders')).toBe(false);
    expect(access.rule).toBeNull();
    expect(access.isSuperAdmin).toBe(false);
  });

  it('falls back to permission codes when no named rule matches', () => {
    const access = resolveModuleAccess(config, ctx({ permissions: ['order.read', 'order.update'] }));
    expect(access.rule).toBeNull();
    expect(access.can('orders', 'view')).toBe(true);
    expect(access.can('orders', 'update')).toBe(true);
    expect(access.can('orders', 'create')).toBe(false);
    expect(access.can('orders', 'delete')).toBe(false);
    expect(access.visible('settings')).toBe(false);
  });

  it('grants everything to a super admin (*.*)', () => {
    const access = resolveModuleAccess(config, ctx({ permissions: ['*.*'] }));
    expect(access.isSuperAdmin).toBe(true);
    expect(access.can('orders', 'delete')).toBe(true);
    expect(access.can('settings', 'manage')).toBe(true);
  });

  it('applies the highest-priority matching rule', () => {
    // Matches both `staff` (role) and `boss` (user type); boss wins.
    const access = resolveModuleAccess(
      config,
      ctx({ roles: ['Staff'], userTypes: ['organization_admin'] }),
    );
    expect(access.rule?.id).toBe('boss');
    expect(access.is('boss')).toBe(true);
    expect(access.hasRule('staff')).toBe(true);
    expect(access.can('settings', 'manage')).toBe(true);
  });

  it('uses the active rule grants, not the permission fallback', () => {
    // `staff` matches via its role; it grants only view/create despite the user
    // also holding order.delete as a raw permission code.
    const access = resolveModuleAccess(config, ctx({ roles: ['Staff'], permissions: ['order.delete'] }));
    expect(access.rule?.id).toBe('staff');
    expect(access.can('orders', 'view')).toBe(true);
    expect(access.can('orders', 'create')).toBe(true);
    expect(access.can('orders', 'delete')).toBe(false);
  });

  it('treats "*" grants as every supported action', () => {
    const access = resolveModuleAccess(config, ctx({ userTypes: ['organization_admin'] }));
    expect([...access.actions('orders')]).toEqual(['view', 'create', 'update', 'delete']);
    expect([...access.actions('settings')]).toEqual(['view', 'manage']);
  });

  it('canAny returns true when any requested action is allowed', () => {
    const access = resolveModuleAccess(config, ctx({ permissions: ['order.read'] }));
    expect(access.canAny('orders', ['delete', 'view'])).toBe(true);
    expect(access.canAny('orders', ['delete', 'create'])).toBe(false);
  });

  it('deny-by-default for unknown resource keys and unknown modules', () => {
    const access = resolveModuleAccess(config, ctx({ permissions: ['*.*'] }));
    expect(access.can('nope', 'view')).toBe(false);
    expect(access.visible('nope')).toBe(false);
    expect(access.actions('nope').size).toBe(0);

    const unknown = emptyModuleAccess('ghost');
    expect(unknown.can('orders', 'view')).toBe(false);
    expect(unknown.visible('orders')).toBe(false);
  });
});
