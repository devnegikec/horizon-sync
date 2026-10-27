/** Top-level Inventory views shown in `InventoryNavigation`. */
export type InventoryView = 'items' | 'warehouses' | 'item_groups' | 'stock';

/**
 * Shared prop contract every `InventoryView` content component receives.
 *
 * Mirrors `WMSContentProps` / `QSealContentProps`; it is currently just the
 * active view because each Inventory view owns its own data hooks.
 */
export interface InventoryContentProps {
  activeView: InventoryView;
}
