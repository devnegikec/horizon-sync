/**
 * WMS (Warehouse Management System) Permissions Reference
 *
 * This file documents all permission codes used by the WMS module.
 * These must also be defined in the identity-service backend.
 *
 * Permission format: {resource}.{action}
 *   e.g. warehouse.read, pick_list.create, asn_order.update
 *
 * Wildcards:
 *   warehouse.*  → grants all warehouse actions
 *   pick_list.*  → grants all pick_list actions
 *   asn_order.*  → grants all ASN order actions
 *   *.*          → super-admin wildcard (grants everything)
 */

export type WmsPermission =
  // ── Warehouse & Layout ──
  | 'warehouse.read'
  | 'warehouse.create'
  | 'warehouse.update'
  | 'warehouse.delete'
  | 'warehouse.manage'
  | 'warehouse.*'
  // ── Stock Entry ──
  | 'stock_entry.read'
  | 'stock_entry.create'
  | 'stock_entry.update'
  | 'stock_entry.delete'
  | 'stock_entry.manage'
  | 'stock_entry.*'
  // ── Pick List (Outbound / Gate / Dispatch) ──
  | 'pick_list.read'
  | 'pick_list.create'
  | 'pick_list.update'
  | 'pick_list.delete'
  | 'pick_list.manage'
  | 'pick_list.*'
  // ── ASN (Advance Stock Notice) ──
  | 'asn_order.read'
  | 'asn_order.create'
  | 'asn_order.update'
  | 'asn_order.delete'
  | 'asn_order.manage'
  | 'asn_order.*'
  // ── Item (read-only for WMS users) ──
  | 'item.read'
  | 'item.*'
  // ── Batch / Serial (read-only for WMS users) ──
  | 'batch.read'
  | 'serial.read';

/**
 * WMS Role Templates — permission sets used by the role creation dialog.
 * These mirror the ROLE_TEMPLATES in RoleDialog.tsx.
 */
export const WMS_ROLE_PERMISSIONS = {
  /** WMS Supervisor — mother warehouse, can see/manage all warehouses */
  wms_supervisor: [
    'warehouse.*',
    'pick_list.*',
    'asn_order.*',
    'stock_entry.*',
    'item.read',
    'batch.read',
    'serial.read',
  ] satisfies WmsPermission[],

  /** WMS Manager — assigned warehouse(s), full operational control */
  wms_manager: [
    'warehouse.*',
    'pick_list.*',
    'asn_order.*',
    'stock_entry.*',
    'item.read',
    'batch.read',
    'serial.read',
  ] satisfies WmsPermission[],

  /** WMS Operator — floor worker, scanning & execution only */
  wms_operator: [
    'warehouse.read',
    'pick_list.read',
    'pick_list.update',
    'stock_entry.read',
    'item.read',
    'batch.read',
    'serial.read',
  ] satisfies WmsPermission[],

  /** ASN Coordinator — manages inter-warehouse transfers */
  asn_coordinator: [
    'asn_order.*',
    'warehouse.read',
    'stock_entry.read',
    'item.read',
    'pick_list.read',
  ] satisfies WmsPermission[],
} as const;

/**
 * Recommended backend permission seed data for the identity-service.
 *
 * These should be inserted into the `permissions` table (or equivalent)
 * so that the grouped-permissions API returns them.
 *
 * ```sql
 * -- Example PostgreSQL seed
 * INSERT INTO permissions (code, name, resource, action, module, is_active)
 * VALUES
 *   -- warehouse
 *   ('warehouse.read',   'Read Warehouse',     'warehouse', 'read',   'wms', true),
 *   ('warehouse.create',  'Create Warehouse',   'warehouse', 'create', 'wms', true),
 *   ('warehouse.update',  'Update Warehouse',   'warehouse', 'update', 'wms', true),
 *   ('warehouse.delete',  'Delete Warehouse',   'warehouse', 'delete', 'wms', true),
 *   ('warehouse.manage',  'Manage Warehouse',   'warehouse', 'manage', 'wms', true),
 *   -- pick_list
 *   ('pick_list.read',   'Read Pick List',     'pick_list', 'read',   'wms', true),
 *   ('pick_list.create',  'Create Pick List',   'pick_list', 'create', 'wms', true),
 *   ('pick_list.update',  'Update Pick List',   'pick_list', 'update', 'wms', true),
 *   ('pick_list.delete',  'Delete Pick List',   'pick_list', 'delete', 'wms', true),
 *   ('pick_list.manage',  'Manage Pick List',   'pick_list', 'manage', 'wms', true),
 *   -- asn_order
 *   ('asn_order.read',   'Read ASN Order',     'asn_order', 'read',   'inventory', true),
 *   ('asn_order.create',  'Create ASN Order',   'asn_order', 'create', 'inventory', true),
 *   ('asn_order.update',  'Update ASN Order',   'asn_order', 'update', 'inventory', true),
 *   ('asn_order.delete',  'Delete ASN Order',   'asn_order', 'delete', 'inventory', true),
 *   ('asn_order.manage',  'Manage ASN Order',   'asn_order', 'manage', 'inventory', true);
 * ```
 */
