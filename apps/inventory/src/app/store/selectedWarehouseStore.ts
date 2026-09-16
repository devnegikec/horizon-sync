import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * The warehouse the user is currently working in.
 *
 * Held outside component state (and persisted) because warehouse-aware screens
 * unmount whenever the user changes tab or route. Local state reset the choice
 * to the first assigned warehouse on every remount; this store keeps it stable.
 *
 * `''` means "not chosen yet" — or "all warehouses" on screens where that is a
 * valid choice.
 */
export interface SelectedWarehouseState {
  warehouseId: string;
  /**
   * The user the selection belongs to. The store outlives logout, so without an
   * owner the next user to sign in would inherit the previous user's warehouse.
   */
  ownerId: string | null;
  setWarehouseId: (warehouseId: string, ownerId: string | null) => void;
}

export const useSelectedWarehouseStore = create<SelectedWarehouseState>()(
  persist(
    (set) => ({
      warehouseId: '',
      ownerId: null,
      setWarehouseId: (warehouseId, ownerId) => set({ warehouseId, ownerId }),
    }),
    { name: 'horizon-sync:selected-warehouse' },
  ),
);

/**
 * Selector for the stored id, but only while it still belongs to `ownerId`.
 * Reading through here is what stops a user inheriting someone else's selection
 * after that someone logged out.
 */
export function selectOwnedWarehouseId(ownerId: string | null) {
  return (state: SelectedWarehouseState): string =>
    state.ownerId === ownerId ? state.warehouseId : '';
}
