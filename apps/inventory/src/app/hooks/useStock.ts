import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import type {
  StockLevel,
  StockLevelsResponse,
  StockMovement,
  StockMovementsResponse,
  StockEntry,
  StockEntriesResponse,
  StockReconciliation,
  StockReconciliationsResponse,
  CreateStockMovementPayload,
  CreateStockEntryPayload,
  CreateStockReconciliationPayload,
} from '../types/stock.types';
import {
  stockLevelApi,
  stockMovementApi,
  stockEntryApi,
  stockReconciliationApi,
} from '../utility/api';

// Stock Levels Hook
interface UseStockLevelsResult {
  stockLevels: StockLevel[];
  pagination: StockLevelsResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStockLevels(
  page = 1,
  pageSize = 20,
  filters?: { warehouseId?: string; itemId?: string }
): UseStockLevelsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [stockLevels, setStockLevels] = React.useState<StockLevel[]>([]);
  const [pagination, setPagination] = React.useState<StockLevelsResponse['pagination'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStockLevels = React.useCallback(async () => {
    if (!accessToken) {
      setStockLevels([]);
      setPagination(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const apiFilters: { warehouse_id?: string; item_id?: string } = {};
      if (filters?.warehouseId && filters.warehouseId !== 'all') {
        apiFilters.warehouse_id = filters.warehouseId;
      }
      if (filters?.itemId && filters.itemId !== 'all') {
        apiFilters.item_id = filters.itemId;
      }
      const data = (await stockLevelApi.list(accessToken, page, pageSize, apiFilters)) as StockLevelsResponse;
      setStockLevels(data.stock_levels ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stock levels';
      setError(message);
      setStockLevels([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, pageSize, filters?.warehouseId, filters?.itemId]);

  React.useEffect(() => {
    fetchStockLevels();
  }, [fetchStockLevels]);

  return { stockLevels, pagination, loading, error, refetch: fetchStockLevels };
}

// Stock Movements Hook
interface UseStockMovementsResult {
  stockMovements: StockMovement[];
  pagination: StockMovementsResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStockMovements(
  page = 1,
  pageSize = 20,
  filters?: { warehouseId?: string; itemId?: string }
): UseStockMovementsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [stockMovements, setStockMovements] = React.useState<StockMovement[]>([]);
  const [pagination, setPagination] = React.useState<StockMovementsResponse['pagination'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStockMovements = React.useCallback(async () => {
    if (!accessToken) {
      setStockMovements([]);
      setPagination(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const apiFilters: { warehouse_id?: string; item_id?: string } = {};
      if (filters?.warehouseId && filters.warehouseId !== 'all') {
        apiFilters.warehouse_id = filters.warehouseId;
      }
      if (filters?.itemId && filters.itemId !== 'all') {
        apiFilters.item_id = filters.itemId;
      }
      const data = (await stockMovementApi.list(accessToken, page, pageSize, apiFilters)) as StockMovementsResponse;
      setStockMovements(data.stock_movements ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stock movements';
      setError(message);
      setStockMovements([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, pageSize, filters?.warehouseId, filters?.itemId]);

  React.useEffect(() => {
    fetchStockMovements();
  }, [fetchStockMovements]);

  return { stockMovements, pagination, loading, error, refetch: fetchStockMovements };
}

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
    [accessToken]
  );

  return { createMovement, loading, error };
}

// Stock Entries Hook
interface UseStockEntriesResult {
  stockEntries: StockEntry[];
  pagination: StockEntriesResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStockEntries(
  page = 1,
  pageSize = 20,
  filters?: { entryType?: string; status?: string }
): UseStockEntriesResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [stockEntries, setStockEntries] = React.useState<StockEntry[]>([]);
  const [pagination, setPagination] = React.useState<StockEntriesResponse['pagination'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchStockEntries = React.useCallback(async () => {
    if (!accessToken) {
      setStockEntries([]);
      setPagination(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const apiFilters: { stock_entry_type?: string; status?: string } = {};
      if (filters?.entryType && filters.entryType !== 'all') {
        apiFilters.stock_entry_type = filters.entryType;
      }
      if (filters?.status && filters.status !== 'all') {
        apiFilters.status = filters.status;
      }
      const data = (await stockEntryApi.list(accessToken, page, pageSize, apiFilters)) as StockEntriesResponse;
      setStockEntries(data.stock_entries ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load stock entries';
      setError(message);
      setStockEntries([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, pageSize, filters?.entryType, filters?.status]);

  React.useEffect(() => {
    fetchStockEntries();
  }, [fetchStockEntries]);

  return { stockEntries, pagination, loading, error, refetch: fetchStockEntries };
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
    [accessToken]
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
    [accessToken]
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
    [accessToken]
  );

  return { createEntry, updateEntry, deleteEntry, loading, error };
}

// Stock Reconciliations Hook
interface UseStockReconciliationsResult {
  reconciliations: StockReconciliation[];
  pagination: StockReconciliationsResponse['pagination'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useStockReconciliations(
  page = 1,
  pageSize = 20,
  filters?: { status?: string }
): UseStockReconciliationsResult {
  const accessToken = useUserStore((s) => s.accessToken);
  const [reconciliations, setReconciliations] = React.useState<StockReconciliation[]>([]);
  const [pagination, setPagination] = React.useState<StockReconciliationsResponse['pagination'] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchReconciliations = React.useCallback(async () => {
    if (!accessToken) {
      setReconciliations([]);
      setPagination(null);
      setLoading(false);
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const apiFilters: { status?: string } = {};
      if (filters?.status && filters.status !== 'all') {
        apiFilters.status = filters.status;
      }
      const data = (await stockReconciliationApi.list(accessToken, page, pageSize, apiFilters)) as StockReconciliationsResponse;
      setReconciliations(data.stock_reconciliations ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load reconciliations';
      setError(message);
      setReconciliations([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, pageSize, filters?.status]);

  React.useEffect(() => {
    fetchReconciliations();
  }, [fetchReconciliations]);

  return { reconciliations, pagination, loading, error, refetch: fetchReconciliations };
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
    [accessToken]
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
    [accessToken]
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
    [accessToken]
  );

  return { createReconciliation, updateReconciliation, deleteReconciliation, loading, error };
}
