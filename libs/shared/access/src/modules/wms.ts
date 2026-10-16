/**
 * WMS access configuration.
 *
 * Declares the WMS resources and the two rules requested for the first rollout:
 *   - `wms_admin`   — "WMS Admin": full control across all warehouses + configuration.
 *   - `wms_manager` — "WMS Manager": full operational control, read-only configuration.
 *
 * Matching notes
 * --------------
 * `hasPermission` treats a `resource.*` wildcard as granting every action on that
 * resource. A WMS Manager holds `warehouse.*` (see `WMS_ROLE_PERMISSIONS`), so it
 * would also satisfy a `warehouse.manage` matcher. To keep Admin and Manager
 * distinct, Admin is matched by **role name / user type** and Manager is matched
 * by **role name or the `warehouse.*` wildcard**. Admin outranks Manager by
 * priority, so an Admin who also holds `warehouse.*` still resolves to `wms_admin`.
 */
import type { AccessResource, ModuleAccessConfig } from '../types';

const WMS_RESOURCES: readonly AccessResource[] = [
  {
    key: 'asn',
    label: 'Advance Stock Notice',
    actions: ['view', 'create', 'update', 'delete'],
    actionPermissions: { view: ['asn_order.read'] },
  },
  {
    key: 'inbound',
    label: 'Inbound',
    actions: ['view', 'create', 'update', 'delete'],
    actionPermissions: { view: ['stock_entry.read'] },
  },
  {
    key: 'outbound',
    label: 'Outbound',
    actions: ['view', 'create', 'update', 'delete'],
    actionPermissions: { view: ['pick_list.read'] },
  },
  {
    key: 'stock',
    label: 'Stock',
    actions: ['view', 'create', 'update', 'delete'],
    actionPermissions: { view: ['stock_entry.read'] },
  },
  {
    key: 'exceptions',
    label: 'Inbound Exceptions',
    actions: ['view', 'manage'],
    actionPermissions: { view: ['warehouse.manage'] },
  },
  {
    key: 'returns',
    label: 'Returns',
    actions: ['view', 'create', 'update'],
    actionPermissions: { view: ['stock_entry.read'] },
  },
  {
    key: 'manage',
    label: 'Manage (Settings)',
    actions: ['view', 'manage'],
    actionPermissions: { view: ['warehouse.manage'] },
  },
  {
    key: 'workers',
    label: 'Workers',
    actions: ['view', 'create', 'update', 'delete', 'manage'],
    actionPermissions: { view: ['warehouse.manage'] },
  },
  {
    key: 'devices',
    label: 'Devices',
    actions: ['view', 'create', 'update', 'delete', 'manage'],
    actionPermissions: { view: ['warehouse.manage'] },
  },
  {
    key: 'layout',
    label: 'Layout Designer',
    actions: ['view', 'create', 'update', 'delete', 'manage'],
    actionPermissions: { view: ['warehouse.manage'] },
  },
  {
    key: 'location_qr',
    label: 'Location QR',
    actions: ['view', 'create', 'update', 'delete', 'manage'],
    actionPermissions: { view: ['warehouse.manage'] },
  },
];

export const WMS_RULE_IDS = {
  admin: 'wms_admin',
  manager: 'wms_manager',
} as const;

export const wmsAccessConfig: ModuleAccessConfig = {
  module: 'wms',
  label: 'Warehouse Management',
  resources: WMS_RESOURCES,
  rules: [
    {
      id: WMS_RULE_IDS.admin,
      label: 'WMS Admin',
      description: 'Full WMS control across all warehouses, including configuration.',
      priority: 100,
      roles: ['WMS Admin', 'WMS Administrator', 'WMS Supervisor'],
      userTypes: ['system_admin', 'organization_admin'],
      grants: {
        asn: '*',
        inbound: '*',
        outbound: '*',
        stock: '*',
        exceptions: '*',
        returns: '*',
        manage: '*',
        workers: '*',
        devices: '*',
        layout: '*',
        location_qr: '*',
      },
    },
    {
      id: WMS_RULE_IDS.manager,
      label: 'WMS Manager',
      description: 'Full operational control on assigned warehouses; read-only configuration.',
      priority: 80,
      roles: ['WMS Manager'],
      permissions: ['warehouse.*'],
      grants: {
        asn: ['view', 'create', 'update', 'delete'],
        inbound: ['view', 'create', 'update', 'delete'],
        outbound: ['view', 'create', 'update', 'delete'],
        stock: ['view', 'create', 'update', 'delete'],
        exceptions: ['view', 'manage'],
        returns: ['view', 'create', 'update'],
        manage: ['view'],
        workers: ['view', 'create', 'update'],
        devices: ['view'],
        layout: ['view'],
        location_qr: ['view'],
      },
    },
  ],
};
