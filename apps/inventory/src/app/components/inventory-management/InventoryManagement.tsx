import * as React from 'react';

import { ManagementContainer } from '@horizon-sync/ui/components';

import { InventoryContent } from './InventoryContent';
import { InventoryHeader } from './InventoryHeader';
import { InventoryNavigation } from './InventoryNavigation';
import type { InventoryView } from './types';

/**
 * Inventory shell: owns the active view state, then delegates rendering to the
 * view-specific components — `ItemManagement`, `WarehouseManagement`,
 * `ItemGroupManagement` and `StockManagement`.
 */
export function InventoryManagement() {
  const [activeView, setActiveView] = React.useState<InventoryView>('items');

  return (
    <ManagementContainer>
      <InventoryHeader />
      <InventoryNavigation activeView={activeView} onViewChange={setActiveView} />
      <InventoryContent activeView={activeView} />
    </ManagementContainer>
  );
}
