import * as React from 'react';

import { useSelectedWarehouseStore } from '../store/selectedWarehouseStore';
import type { AssignedWarehouse } from '../utility/api/warehouseUsers';

import { useMyWarehouses } from './useMyWarehouses';

export interface UseSelectedWarehouseOptions {
  /**
   * Fall back to the first assigned warehouse when nothing valid is stored.
   * Screens that always need a concrete warehouse (WMS) want this; screens where
   * "all warehouses" is a valid choice (Stock) do not.
   */
  autoSelectFirst?: boolean;
}

export interface UseSelectedWarehouseResult {
  warehouses: AssignedWarehouse[];
  loading: boolean;
  error: string | null;
  /** Selected warehouse id. `''` means "none chosen" or "all warehouses". */
  warehouseId: string;
  /** The selected warehouse record, or null when nothing valid is selected. */
  warehouse: AssignedWarehouse | null;
  setWarehouseId: (warehouseId: string) => void;
  refetch: () => Promise<void>;
}

/**
 * The app-wide "current warehouse", shared by every warehouse-aware screen.
 *
 * Backed by a persisted store rather than component state, so the warehouse a
 * user picks stays picked while they move between tabs, screens and reloads. The
 * stored id is checked against the assigned list and replaced when it is no
 * longer valid (warehouse unassigned or deleted, or a different user signed in).
 */
export function useSelectedWarehouse({
  autoSelectFirst = true,
}: UseSelectedWarehouseOptions = {}): UseSelectedWarehouseResult {
  const { warehouses, loading, error, refetch } = useMyWarehouses();
  const storedWarehouseId = useSelectedWarehouseStore((s) => s.warehouseId);
  const setWarehouseId = useSelectedWarehouseStore((s) => s.setWarehouseId);

  const isAssigned = warehouses.some((w) => w.id === storedWarehouseId);
  const fallbackWarehouseId = autoSelectFirst && warehouses.length > 0 ? warehouses[0].id : '';

  React.useEffect(() => {
    if (loading || isAssigned || !fallbackWarehouseId) return;
    setWarehouseId(fallbackWarehouseId);
  }, [loading, isAssigned, fallbackWarehouseId, setWarehouseId]);

  // Trust the stored id while the assigned list loads — that avoids an
  // "all warehouses" flash followed by a re-fetch. Once loaded, an id that is no
  // longer assigned is dropped so it cannot silently filter every screen to nothing.
  const warehouseId = loading || isAssigned ? storedWarehouseId : fallbackWarehouseId;

  const warehouse = React.useMemo(
    () => warehouses.find((w) => w.id === warehouseId) ?? null,
    [warehouses, warehouseId],
  );

  return { warehouses, loading, error, warehouseId, warehouse, setWarehouseId, refetch };
}
