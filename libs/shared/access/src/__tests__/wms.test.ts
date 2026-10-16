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

describe('Org Owner rule', () => {
  it('matches the owner role and grants every action on every resource', () => {
    const access = accessFor({ roles: ['Organization Owner'] });
    expect(access.rule?.id).toBe(WMS_RULE_IDS.owner);
    expect(access.is('org_owner')).toBe(true);
    expect(access.can('warehouse', 'delete')).toBe(true);
    expect(access.can('manage', 'manage')).toBe(true);
    expect(access.can('returns', 'dispose')).toBe(true);
    expect(access.can('stock', 'manage')).toBe(true);
  });

  it('matches an organization admin by user type', () => {
    const access = accessFor({ userTypes: ['organization_admin'] });
    expect(access.is('org_owner')).toBe(true);
    expect(access.can('layout', 'manage')).toBe(true);
  });
});

describe('WMS Manager rule', () => {
  it('has full operations, configuration and irreversible stock decisions', () => {
    const access = accessFor({ roles: ['WMS Manager'] });
    expect(access.rule?.id).toBe(WMS_RULE_IDS.manager);

    expect(access.can('receiving', 'approve')).toBe(true);
    expect(access.can('exceptions', 'dispose')).toBe(true);
    expect(access.can('stock', 'manage')).toBe(true);
    expect(access.can('returns', 'dispose')).toBe(true);
    expect(access.can('dispatch', 'create')).toBe(true);

    // Configuration: manage settings/workers/devices/layout, but not create warehouses.
    expect(access.can('manage', 'manage')).toBe(true);
    expect(access.can('layout', 'manage')).toBe(true);
    expect(access.can('workers', 'manage')).toBe(true);
    expect(access.can('warehouse', 'manage')).toBe(true);
    expect(access.can('warehouse', 'create')).toBe(false);
  });

  it('outranks the Supervisor rule when a user holds both roles', () => {
    const access = accessFor({ roles: ['WMS Manager', 'WMS Supervisor'] });
    expect(access.is('wms_manager')).toBe(true);
    expect(access.hasRule('wms_supervisor')).toBe(true);
    expect(access.can('stock', 'manage')).toBe(true);
  });
});

describe('WMS Supervisor rule', () => {
  it('executes everything and can approve, but cannot configure or write off', () => {
    const access = accessFor({ roles: ['WMS Supervisor'] });
    expect(access.rule?.id).toBe(WMS_RULE_IDS.supervisor);

    // Reversible approvals: allowed
    expect(access.can('receiving', 'approve')).toBe(true);
    expect(access.can('receiving', 'reject')).toBe(true);
    expect(access.can('returns', 'approve')).toBe(true);
    expect(access.can('shortages', 'close')).toBe(true);
    expect(access.can('dispatch', 'create')).toBe(true);
    expect(access.can('gate', 'verify')).toBe(true);

    // Irreversible / configuration: NOT allowed
    expect(access.can('exceptions', 'dispose')).toBe(false);
    expect(access.can('returns', 'dispose')).toBe(false);
    expect(access.can('stock', 'manage')).toBe(false);
    expect(access.can('manage', 'view')).toBe(false);
    expect(access.can('layout', 'manage')).toBe(false);
    expect(access.can('workers', 'manage')).toBe(false);
    expect(access.can('asn', 'delete')).toBe(false);
    expect(access.can('reports', 'export')).toBe(false);

    // Planning: allowed
    expect(access.can('asn', 'create')).toBe(true);
    expect(access.can('picking', 'create')).toBe(true);
  });
});

describe('WMS Operator rule', () => {
  it('is floor execution only — no planning, no approvals, no config', () => {
    const access = accessFor({ roles: ['WMS Operator'] });
    expect(access.rule?.id).toBe(WMS_RULE_IDS.operator);

    // Execution: allowed
    expect(access.can('asn', 'arrive')).toBe(true);
    expect(access.can('receiving', 'create')).toBe(true);
    expect(access.can('receiving', 'update')).toBe(true);
    expect(access.can('putaway', 'execute')).toBe(true);
    expect(access.can('exceptions', 'create')).toBe(true);
    expect(access.can('picking', 'execute')).toBe(true);
    expect(access.can('packing', 'execute')).toBe(true);
    expect(access.can('gate', 'verify')).toBe(true);
    expect(access.can('returns', 'register')).toBe(true);
    expect(access.can('stock', 'create')).toBe(true);

    // Planning / approvals / config: NOT allowed
    expect(access.can('asn', 'create')).toBe(false);
    expect(access.can('receiving', 'approve')).toBe(false);
    expect(access.can('putaway', 'create')).toBe(false);
    expect(access.can('exceptions', 'dispose')).toBe(false);
    expect(access.can('outbound', 'create')).toBe(false);
    expect(access.can('picking', 'create')).toBe(false);
    expect(access.can('dispatch', 'create')).toBe(false);
    expect(access.can('returns', 'approve')).toBe(false);
    expect(access.can('stock', 'manage')).toBe(false);
    // ...and the Manage tab stays hidden
    expect(access.can('manage', 'view')).toBe(false);
    expect(access.visible('manage')).toBe(false);
  });

  it('is not escalated to Manager by holding warehouse.* (role-name matching only)', () => {
    const access = accessFor({ roles: ['WMS Operator'], permissions: ['warehouse.*'] });
    expect(access.is('wms_operator')).toBe(true);
    expect(access.is('wms_manager')).toBe(false);
    expect(access.can('stock', 'manage')).toBe(false);
  });
});

describe('WMS permission-code fallback (no named rule)', () => {
  it('exposes only the resources granted by raw permission codes', () => {
    const access = accessFor({ permissions: ['stock_entry.read', 'pick_list.read'] });
    expect(access.rule).toBeNull();
    expect(access.can('receiving', 'view')).toBe(true);
    expect(access.can('picking', 'view')).toBe(true);
    expect(access.can('stock', 'view')).toBe(true);
    // No asn_order.read → hidden; no write permissions → not editable; no config.
    expect(access.visible('asn')).toBe(false);
    expect(access.can('receiving', 'approve')).toBe(false);
    expect(access.visible('manage')).toBe(false);
  });
});
