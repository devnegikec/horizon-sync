import { resolveModuleAccess } from '../engine';
import { getModuleAccessConfig, listRegisteredAccessModules } from '../modules/registry';
import { WMS_RULE_IDS, wmsAccessConfig } from '../modules/wms';
import type { AccessUserContext } from '../types';

function ctx(partial: Partial<AccessUserContext>): AccessUserContext {
  return { permissions: [], roles: [], userTypes: [], ...partial };
}

function accessFor(partial: Partial<AccessUserContext>) {
  return resolveModuleAccess(wmsAccessConfig, ctx(partial));
}

describe('WMS access config', () => {
  it('is registered under the "wms" module key', () => {
    expect(getModuleAccessConfig('wms')).toBe(wmsAccessConfig);
    expect(listRegisteredAccessModules()).toContain('wms');
    expect(getModuleAccessConfig('unknown')).toBeUndefined();
  });
});

describe('WMS Admin rule', () => {
  it('matches by role name and grants every action on every resource', () => {
    const access = accessFor({ roles: ['WMS Admin'] });
    expect(access.rule?.id).toBe(WMS_RULE_IDS.admin);
    expect(access.is('wms_admin')).toBe(true);
    expect(access.can('manage', 'manage')).toBe(true);
    expect(access.can('workers', 'delete')).toBe(true);
    expect(access.can('layout', 'manage')).toBe(true);
    expect(access.can('location_qr', 'create')).toBe(true);
  });

  it('matches an organization admin by user type', () => {
    const access = accessFor({ userTypes: ['organization_admin'] });
    expect(access.is('wms_admin')).toBe(true);
    expect(access.can('devices', 'manage')).toBe(true);
  });
});

describe('WMS Manager rule', () => {
  it('grants full operational control but read-only configuration', () => {
    const access = accessFor({ roles: ['WMS Manager'] });
    expect(access.rule?.id).toBe(WMS_RULE_IDS.manager);

    // Operational resources: full CRUD
    for (const resource of ['asn', 'inbound', 'outbound', 'stock']) {
      expect(access.can(resource, 'view')).toBe(true);
      expect(access.can(resource, 'create')).toBe(true);
      expect(access.can(resource, 'update')).toBe(true);
      expect(access.can(resource, 'delete')).toBe(true);
    }

    // Configuration: visible but not editable
    expect(access.can('manage', 'view')).toBe(true);
    expect(access.can('manage', 'manage')).toBe(false);
    expect(access.can('devices', 'create')).toBe(false);
    expect(access.can('layout', 'manage')).toBe(false);
    expect(access.can('location_qr', 'create')).toBe(false);

    // Workers: can add/update, cannot delete
    expect(access.can('workers', 'create')).toBe(true);
    expect(access.can('workers', 'update')).toBe(true);
    expect(access.can('workers', 'delete')).toBe(false);
  });

  it('matches via the warehouse.* wildcard even without the role name', () => {
    const access = accessFor({ permissions: ['warehouse.*'] });
    expect(access.is('wms_manager')).toBe(true);
  });

  it('does not escalate to Admin despite holding warehouse.* (which grants warehouse.manage)', () => {
    const access = accessFor({ roles: ['WMS Manager'], permissions: ['warehouse.*', 'pick_list.*'] });
    expect(access.is('wms_manager')).toBe(true);
    expect(access.is('wms_admin')).toBe(false);
    // Narrowed: configuration stays read-only.
    expect(access.can('manage', 'manage')).toBe(false);
  });
});

describe('WMS permission-code fallback (no named rule)', () => {
  it('exposes only the resources granted by raw permission codes', () => {
    const access = accessFor({ permissions: ['stock_entry.read', 'pick_list.read'] });
    expect(access.rule).toBeNull();
    expect(access.can('inbound', 'view')).toBe(true);
    expect(access.can('outbound', 'view')).toBe(true);
    expect(access.can('stock', 'view')).toBe(true);
    // No asn_order.read → hidden; no write permissions → not editable.
    expect(access.visible('asn')).toBe(false);
    expect(access.can('inbound', 'create')).toBe(false);
    expect(access.visible('manage')).toBe(false);
  });
});
