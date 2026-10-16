/**
 * WMS access configuration.
 *
 * Four user types (spec: `docs/WMS_ROLES_AND_PERMISSIONS.md`, decisions locked 2026-10-16):
 *   - `org_owner`      — "Organization Owner": full WMS + configuration across ALL warehouses.
 *   - `wms_manager`    — "WMS Manager": full ops + configuration for assigned warehouses,
 *                        including irreversible decisions (dispose exception, write-off, reconcile).
 *   - `wms_supervisor` — "WMS Supervisor": executes everything + reversible approvals
 *                        (receiving slip, return note, dispatch); no configuration, no write-off.
 *   - `wms_operator`   — "WMS Operator": floor execution only (no planning, no approvals, no config).
 *
 * Matching notes
 * --------------
 * `hasPermission` treats a `resource.*` wildcard as granting every action on that
 * resource, and the seeded WMS roles all hold `warehouse.*`. Permission-code
 * matchers therefore cannot tell the tiers apart, so each rule matches on its
 * **role name** (plus user type / the `*.*` super-admin wildcard for the owner).
 * Warehouse *scope* (all vs assigned) is enforced by the backend, not here.
 */
import type { AccessResource, ModuleAccessConfig } from '../types';

const WMS_RESOURCES: readonly AccessResource[] = [
  // ── Master data & configuration (the "Manage" tab) ──
  {
    key: 'warehouse',
    label: 'Warehouse',
    actions: ['view', 'create', 'update', 'delete', 'manage'],
    actionPermissions: { view: ['warehouse.read'], manage: ['warehouse.manage'] },
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
    actions: ['view', 'manage'],
    actionPermissions: { view: ['warehouse.manage'] },
  },
  {
    key: 'devices',
    label: 'Devices',
    actions: ['view', 'manage'],
    actionPermissions: { view: ['warehouse.manage'] },
  },
  {
    key: 'layout',
    label: 'Layout Designer',
    actions: ['view', 'manage'],
    actionPermissions: { view: ['warehouse.manage'] },
  },
  {
    key: 'location_qr',
    label: 'Location QR',
    actions: ['view', 'manage'],
    actionPermissions: { view: ['warehouse.manage'] },
  },
  // ── Inbound ──
  {
    key: 'asn',
    label: 'Advance Stock Notice',
    actions: ['view', 'create', 'update', 'delete', 'arrive'],
    actionPermissions: { view: ['asn_order.read'], arrive: ['asn_order.update'] },
  },
  {
    key: 'receiving',
    label: 'Receiving',
    actions: ['view', 'create', 'update', 'approve', 'reject'],
    actionPermissions: { view: ['stock_entry.read'], create: ['stock_entry.create'] },
  },
  {
    key: 'putaway',
    label: 'Put-Away',
    actions: ['view', 'create', 'execute'],
    actionPermissions: { view: ['stock_entry.read'] },
  },
  {
    key: 'exceptions',
    label: 'Inbound Exceptions',
    actions: ['view', 'create', 'dispose'],
    actionPermissions: {
      view: ['inbound_exception.read'],
      create: ['inbound_exception.create'],
      dispose: ['inbound_exception.dispose'],
    },
  },
  {
    key: 'shortages',
    label: 'Shortage Ledger',
    actions: ['view', 'close'],
    actionPermissions: { view: ['inbound_exception.read'], close: ['inbound_exception.dispose'] },
  },
  // ── Outbound ──
  {
    key: 'outbound',
    label: 'Outbound Orders',
    actions: ['view', 'create', 'delete'],
    actionPermissions: { view: ['pick_list.read'], create: ['pick_list.create'] },
  },
  {
    key: 'picking',
    label: 'Picking',
    actions: ['view', 'create', 'execute'],
    actionPermissions: { view: ['pick_list.read'], create: ['pick_list.create'] },
  },
  {
    key: 'packing',
    label: 'Packing',
    actions: ['view', 'execute'],
    actionPermissions: { view: ['pick_list.read'] },
  },
  {
    key: 'gate',
    label: 'Gate Verification',
    actions: ['view', 'verify'],
    actionPermissions: { view: ['pick_list.read'], verify: ['pick_list.verify'] },
  },
  {
    key: 'dispatch',
    label: 'Dispatch',
    actions: ['view', 'create'],
    actionPermissions: { view: ['pick_list.read'] },
  },
  {
    key: 'pick_exceptions',
    label: 'Pick Exceptions',
    actions: ['view', 'manage'],
    actionPermissions: { view: ['pick_list.read'] },
  },
  // ── Returns ──
  {
    key: 'returns',
    label: 'Returns',
    actions: ['view', 'register', 'approve', 'dispose', 'putaway'],
    actionPermissions: {
      view: ['return.read'],
      register: ['return.register'],
      approve: ['return.approve'],
      dispose: ['return.dispose'],
    },
  },
  // ── Stock & reports ──
  {
    key: 'stock',
    label: 'Stock',
    actions: ['view', 'create', 'manage'],
    actionPermissions: { view: ['stock_entry.read'], create: ['stock_entry.create'], manage: ['stock_entry.manage'] },
  },
  {
    key: 'reports',
    label: 'Reports',
    actions: ['view', 'export'],
    actionPermissions: { view: ['report.read'] },
  },
];

export const WMS_RULE_IDS = {
  owner: 'org_owner',
  manager: 'wms_manager',
  supervisor: 'wms_supervisor',
  operator: 'wms_operator',
} as const;

export const wmsAccessConfig: ModuleAccessConfig = {
  module: 'wms',
  label: 'Warehouse Management',
  resources: WMS_RESOURCES,
  rules: [
    {
      id: WMS_RULE_IDS.owner,
      label: 'Organization Owner',
      description: 'Full WMS control, configuration and administration across all warehouses.',
      priority: 100,
      roles: ['Organization Owner', 'Organization Admin', 'WMS Admin'],
      userTypes: ['system_admin', 'organization_admin'],
      // Every action on every resource (super-admin `*.*` is handled by the engine).
      defaultGrant: '*',
    },
    {
      id: WMS_RULE_IDS.manager,
      label: 'WMS Manager',
      description: 'Runs assigned warehouses: full operations, configuration, and irreversible stock decisions.',
      priority: 80,
      roles: ['WMS Manager'],
      grants: {
        warehouse: ['view', 'manage'],
        manage: ['view', 'manage'],
        workers: ['view', 'manage'],
        devices: ['view', 'manage'],
        layout: ['view', 'manage'],
        location_qr: ['view', 'manage'],
        asn: ['view', 'create', 'update', 'delete', 'arrive'],
        receiving: ['view', 'create', 'update', 'approve', 'reject'],
        putaway: ['view', 'create', 'execute'],
        exceptions: ['view', 'create', 'dispose'],
        shortages: ['view', 'close'],
        outbound: ['view', 'create', 'delete'],
        picking: ['view', 'create', 'execute'],
        packing: ['view', 'execute'],
        gate: ['view', 'verify'],
        dispatch: ['view', 'create'],
        pick_exceptions: ['view', 'manage'],
        returns: ['view', 'register', 'approve', 'dispose', 'putaway'],
        stock: ['view', 'create', 'manage'],
        reports: ['view', 'export'],
      },
    },
    {
      id: WMS_RULE_IDS.supervisor,
      label: 'WMS Supervisor',
      description: 'Executes everything plus reversible approvals; no configuration and no write-off.',
      priority: 60,
      roles: ['WMS Supervisor'],
      grants: {
        warehouse: ['view'],
        asn: ['view', 'create', 'update', 'arrive'],
        receiving: ['view', 'create', 'update', 'approve', 'reject'],
        putaway: ['view', 'create', 'execute'],
        exceptions: ['view', 'create'],
        shortages: ['view', 'close'],
        outbound: ['view', 'create'],
        picking: ['view', 'create', 'execute'],
        packing: ['view', 'execute'],
        gate: ['view', 'verify'],
        dispatch: ['view', 'create'],
        pick_exceptions: ['view', 'manage'],
        returns: ['view', 'register', 'approve', 'putaway'],
        stock: ['view', 'create'],
        reports: ['view'],
      },
    },
    {
      id: WMS_RULE_IDS.operator,
      label: 'WMS Operator',
      description: 'Floor execution only: dock, put-away, pick, pack, gate; raises but never approves.',
      priority: 40,
      roles: ['WMS Operator'],
      grants: {
        warehouse: ['view'],
        asn: ['view', 'arrive'],
        receiving: ['view', 'create', 'update'],
        putaway: ['view', 'execute'],
        exceptions: ['view', 'create'],
        shortages: ['view'],
        outbound: ['view'],
        picking: ['view', 'execute'],
        packing: ['view', 'execute'],
        gate: ['view', 'verify'],
        dispatch: ['view'],
        pick_exceptions: ['view'],
        returns: ['view', 'register'],
        stock: ['view', 'create'],
      },
    },
  ],
};
