import * as React from 'react';

import { ItemGroupManagement } from '../item-groups';
import { ItemManagement } from '../items';
import { StockManagement } from '../stock';
import { WarehouseManagement } from '../warehouses';

import type { InventoryContentProps, InventoryView } from './types';

/**
 * `StockManagement` declares an optional `warehouseId` prop, so it cannot be used
 * directly here (the content contract shares no properties with it). Wrapping it
 * mirrors `StockContent` in `WMSContent`, which supplies the warehouse filter
 * when Stock is rendered from the WMS shell instead.
 */
function StockContent() {
  return <StockManagement />;
}

const inventoryViewComponents: Record<InventoryView, React.ComponentType<InventoryContentProps>> = {
  items: ItemManagement,
  warehouses: WarehouseManagement,
  item_groups: ItemGroupManagement,
  stock: StockContent,
};

/** Renders the content for the active top-level Inventory view. */
export function InventoryContent({ activeView, ...props }: InventoryContentProps) {
  const Content = inventoryViewComponents[activeView];
  return <Content activeView={activeView} {...props} />;
}
