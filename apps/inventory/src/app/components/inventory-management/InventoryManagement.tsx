import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';
import { ManagementContainer } from '@horizon-sync/ui/components';

import { hasAnyPermission } from '../../utils/permissions';
import { InventoryContent } from './InventoryContent';
import { InventoryHeader } from './InventoryHeader';
import { InventoryNavigation } from './InventoryNavigation';
import type { InventoryView } from './types';

/** Read permission required to view each top-level Inventory view. */
const VIEW_PERMISSIONS: Record<InventoryView, string[]> = {
  items: ['item.read'],
  warehouses: ['warehouse.read'],
  item_groups: ['item_group.read'],
  stock: ['stock_entry.read', 'stock_level.read', 'stock_reconciliation.read', 'asn_order.read'],
};

const ALL_VIEWS: InventoryView[] = ['items', 'warehouses', 'item_groups', 'stock'];

/**
 * Inventory shell: owns the active view state, then delegates rendering to the
 * view-specific components — `ItemManagement`, `WarehouseManagement`,
 * `ItemGroupManagement` and `StockManagement`.
 */
export function InventoryManagement() {
  const [activeView, setActiveView] = React.useState<InventoryView>('items');

  const userPermissions = useUserStore((s) => s.permissions.permissions);
  const permissionsLoaded = useUserStore((s) => s.permissions.lastFetched) !== null;

  const visibleViews = React.useMemo(() => {
    // Until permissions have loaded, keep every view visible so the nav never
    // flashes empty; views are pruned as soon as permissions are known.
    if (!permissionsLoaded) return ALL_VIEWS;
    return ALL_VIEWS.filter((view) => {
      const required = VIEW_PERMISSIONS[view];
      return required.length === 0 || hasAnyPermission(userPermissions, required);
    });
  }, [permissionsLoaded, userPermissions]);

  // If the active view loses permission (or the first render landed on a
  // forbidden view), move to the first permitted view.
  React.useEffect(() => {
    if (visibleViews.length > 0 && !visibleViews.includes(activeView)) {
      setActiveView(visibleViews[0]);
    }
  }, [activeView, visibleViews]);

  return (
    <ManagementContainer>
      <InventoryHeader />
      <InventoryNavigation activeView={activeView} onViewChange={setActiveView} visibleViews={visibleViews} />
      <InventoryContent activeView={activeView} />
    </ManagementContainer>
  );
}
