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
  setWarehouseId: (warehouseId: string) => void;
}

export const useSelectedWarehouseStore = create<SelectedWarehouseState>()(
  persist(
    (set) => ({
      warehouseId: '',
      setWarehouseId: (warehouseId) => set({ warehouseId }),
    }),
    { name: 'horizon-sync:selected-warehouse' },
  ),
);
