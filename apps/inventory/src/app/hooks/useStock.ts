import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import type {
  StockLevel,
  StockMovement,
  StockEntry,
  StockReconciliation,
  CreateStockMovementPayload,
  CreateStockEntryPayload,
  CreateStockReconciliationPayload,
} from '../types/stock.types';
import { stockMovementApi, stockEntryApi, stockReconciliationApi } from '../utility/api';

// Export query hooks from their individual files
export { useStockLevels } from './useStockLevels';
export { useStockMovements } from './useStockMovements';
export { useStockEntries } from './useStockEntries';
export { useStockReconciliations } from './useStockReconciliations';

// Stock Movement Mutations Hook
interface UseStockMovementMutationsResult {
  createMovement: (data: CreateStockMovementPayload) => Promise<StockMovement>;
  loading: boolean;
  error: string | null;
}

export function useStockMovementMutations(): UseStockMovementMutationsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createMovement = React.useCallback(
    async (data: CreateStockMovementPayload): Promise<StockMovement> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        const result = (await stockMovementApi.create(accessToken, data)) as StockMovement;
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create stock movement';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  return { createMovement, loading, error };
}

// Stock Entry Mutations Hook
interface UseStockEntryMutationsResult {
  createEntry: (data: CreateStockEntryPayload) => Promise<StockEntry>;
  updateEntry: (id: string, data: Partial<CreateStockEntryPayload>) => Promise<StockEntry>;
  deleteEntry: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useStockEntryMutations(): UseStockEntryMutationsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createEntry = React.useCallback(
    async (data: CreateStockEntryPayload): Promise<StockEntry> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        const result = (await stockEntryApi.create(accessToken, data)) as StockEntry;
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create stock entry';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const updateEntry = React.useCallback(
    async (id: string, data: Partial<CreateStockEntryPayload>): Promise<StockEntry> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        const result = (await stockEntryApi.update(accessToken, id, data)) as StockEntry;
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update stock entry';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const deleteEntry = React.useCallback(
    async (id: string): Promise<void> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        await stockEntryApi.delete(accessToken, id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete stock entry';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  return { createEntry, updateEntry, deleteEntry, loading, error };
}

// Stock Reconciliation Mutations Hook
interface UseStockReconciliationMutationsResult {
  createReconciliation: (data: CreateStockReconciliationPayload) => Promise<StockReconciliation>;
  updateReconciliation: (id: string, data: Partial<CreateStockReconciliationPayload>) => Promise<StockReconciliation>;
  deleteReconciliation: (id: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useStockReconciliationMutations(): UseStockReconciliationMutationsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const createReconciliation = React.useCallback(
    async (data: CreateStockReconciliationPayload): Promise<StockReconciliation> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        const result = (await stockReconciliationApi.create(accessToken, data)) as StockReconciliation;
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create reconciliation';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const updateReconciliation = React.useCallback(
    async (id: string, data: Partial<CreateStockReconciliationPayload>): Promise<StockReconciliation> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        const result = (await stockReconciliationApi.update(accessToken, id, data)) as StockReconciliation;
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to update reconciliation';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const deleteReconciliation = React.useCallback(
    async (id: string): Promise<void> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        await stockReconciliationApi.delete(accessToken, id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete reconciliation';
        setError(message);
        throw new Error(message);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  return { createReconciliation, updateReconciliation, deleteReconciliation, loading, error };
}
