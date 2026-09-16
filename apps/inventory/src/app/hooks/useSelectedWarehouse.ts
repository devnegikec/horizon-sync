import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { selectOwnedWarehouseId, useSelectedWarehouseStore } from '../store/selectedWarehouseStore';
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
 * Whether the assigned list can be trusted. While the request is in flight — or
 * after it failed — an empty list means "unknown", not "the user has no
 * warehouses". Treating a failure as empty would silently widen every scoped
 * screen from the user's warehouse to all warehouses.
 */
function isAssignedListKnown(loading: boolean, error: string | null): boolean {
  return !loading && !error;
}

/** Fallback when nothing valid is stored yet, e.g. on a user's very first visit. */
function autoSelectedWarehouseId(warehouses: AssignedWarehouse[], enabled: boolean): string {
  return enabled && warehouses.length > 0 ? warehouses[0].id : '';
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
  const ownerId = useUserStore((s) => s.user?.id ?? null);
  const storedWarehouseId = useSelectedWarehouseStore(selectOwnedWarehouseId(ownerId));
  const setStoredWarehouseId = useSelectedWarehouseStore((s) => s.setWarehouseId);

  const setWarehouseId = React.useCallback(
    (warehouseId: string) => setStoredWarehouseId(warehouseId, ownerId),
    [setStoredWarehouseId, ownerId],
  );

  const isAssigned = warehouses.some((w) => w.id === storedWarehouseId);
  const fallbackWarehouseId = autoSelectedWarehouseId(warehouses, autoSelectFirst);
  const isListKnown = isAssignedListKnown(loading, error);

  React.useEffect(() => {
    if (!isListKnown || isAssigned || !fallbackWarehouseId) return;
    setWarehouseId(fallbackWarehouseId);
  }, [isListKnown, isAssigned, fallbackWarehouseId, setWarehouseId]);

  // Trust the stored id until the assigned list is actually known — that avoids an
  // "all warehouses" flash followed by a re-fetch. Once known, an id that is no
  // longer assigned is dropped so it cannot silently filter every screen to nothing.
  const warehouseId = isListKnown && !isAssigned ? fallbackWarehouseId : storedWarehouseId;

  const warehouse = React.useMemo(
    () => warehouses.find((w) => w.id === warehouseId) ?? null,
    [warehouses, warehouseId],
  );

  return { warehouses, loading, error, warehouseId, warehouse, setWarehouseId, refetch };
}
