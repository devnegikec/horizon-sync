import * as React from 'react';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserStore } from '@horizon-sync/store';

import type {
  DispatchListResponse,
  DispatchRecord,
  ErpSyncFlushResponse,
  ErpSyncListResponse,
  GateSession,
  GateScanResult,
  GateSessionProgress,
  InboundException,
  LocationTree,
  PaginatedLocations,
  PaginatedPickLists,
  PaginatedPackingSlips,
  ReceivingSlipActionResult,
  PickList,
  PickScanResult,
  PutAwayItem,
  PutAwayList,
  PutAwayListBatchResponse,
  PutAwayExceptionRequest,
  ReceivingSlip,
  ScanResult,
  ScanSession,
  SessionSummary,
  WMSWorkerListResponse,
  WMSWorker,
  WMSDeviceListResponse,
  WMSDashboardStats,
  PaginatedVehicleArrivals,
  VehicleArrival,
  CreateReturnRegistrationRequest,
  GenerateReturnPutAwayRequest,
  GenerateReturnPutAwayResponse,
  ReturnDispositionAction,
  ReturnDispositionRequest,
  ReturnNoteApprovalRequest,
  ReturnReceiptNoteDetail,
  ReturnReference,
  ReturnRegistrationDetail,
} from '../types/wms.types';
import { toNormalizedApiError, type NormalizedApiError } from '../utility/api/core';
import { queryErrorToMessage } from '../utility/api/error-utils';
import { pickSettingsApi } from '../utility/api/pick-settings';
import {
  inboundApi,
  layoutApi,
  outboundApi,
  outboundOrderApi,
  packingSlipApi,
  putAwayApi,
  returnApi,
  wmsWorkerApi,
  wmsDeviceApi,
  wmsDashboardApi,
  vehicleArrivalApi,
  erpSyncApi,
} from '../utility/api/wms';

// ============================================
// QUERY KEYS
// ============================================

/**
 * Root key for put-away list queries. Invalidate this prefix after any mutation
 * that creates or changes put-away lists so mounted lists/counters refresh.
 */
export const PUT_AWAY_LISTS_QUERY_KEY = ['wms', 'put-away-lists'] as const;

/**
 * Root key for receiving slip queries. Invalidate this prefix after any mutation
 * that changes a slip's status or the status counts.
 */
export const RECEIVING_SLIPS_QUERY_KEY = ['wms', 'receiving-slips'] as const;

/**
 * Root key for outbound order queries. Invalidate this prefix after any mutation
 * that changes an order's status or the status counts.
 */
export const OUTBOUND_ORDERS_QUERY_KEY = ['wms', 'outbound-orders'] as const;

// ============================================
// PICK SETTINGS HOOK (runtime config gating)
// ============================================

export function usePickSettings() {
  const accessToken = useUserStore((s) => s.accessToken);
  const [settings, setSettings] = React.useState<Record<string, unknown>>({});
  const [loading, setLoading] = React.useState(false);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await pickSettingsApi.getRuntime(accessToken);
      setSettings(res.settings ?? {});
    } catch {
      // Deny-by-default: leave settings empty on failure.
      setSettings({});
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    settings,
    loading,
    refetch: fetch,
    enableHandlingUnit: Boolean(settings['enable_handling_unit']),
  };
}

// ============================================
// LOCATION TREE HOOK
// ============================================

export function useLocationTree(warehouseId: string | null) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [tree, setTree] = React.useState<LocationTree[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchTree = React.useCallback(async () => {
    if (!warehouseId || !accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const data = await layoutApi.getTree(accessToken, warehouseId);
      setTree(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load location tree');
    } finally {
      setLoading(false);
    }
  }, [accessToken, warehouseId]);

  React.useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return { tree, loading, error, refetch: fetchTree };
}

// ============================================
// WAREHOUSE LOCATIONS HOOK
// ============================================

export function useWarehouseLocations({
  warehouse_id,
  location_type,
  is_active,
  page,
  page_size,
}: {
  warehouse_id: string;
  location_type?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<PaginatedLocations | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    if (!accessToken || !warehouse_id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await layoutApi.listLocations(accessToken, { warehouse_id, location_type, is_active, page, page_size });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [accessToken, warehouse_id, location_type, is_active, page, page_size]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ============================================
// INBOUND SESSION HOOK
// ============================================

export function useInboundSession() {
  const accessToken = useUserStore((s) => s.accessToken);
  const [session, setSession] = React.useState<ScanSession | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const startSession = React.useCallback(
    async (warehouseId: string, dockLocation?: string, asnOrderId?: string): Promise<ScanSession> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        const result = await inboundApi.startSession(accessToken, {
          warehouse_id: warehouseId,
          dock_location: dockLocation ?? null,
          asn_order_id: asnOrderId ?? null,
        });
        setSession(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to start session';
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const recordScan = React.useCallback(
    async (qrData: string): Promise<ScanResult> => {
      if (!session || !accessToken) throw new Error('No active session');
      setError(null);
      try {
        const result = await inboundApi.recordScan(accessToken, session.id, { qr_data: qrData });
        setSession((prev) => (prev ? { ...prev, total_boxes_scanned: result.total_boxes_scanned } : prev));
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Scan failed';
        setError(msg);
        throw new Error(msg);
      }
    },
    [accessToken, session],
  );

  const endSession = React.useCallback(async (): Promise<ReceivingSlip> => {
    if (!session || !accessToken) throw new Error('No active session');
    setLoading(true);
    setError(null);
    try {
      const slip = await inboundApi.endSession(accessToken, session.id);
      setSession((prev) => (prev ? { ...prev, status: 'closed' as const } : prev));
      return slip;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to end session';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, session]);

  const getSummary = React.useCallback(async (): Promise<SessionSummary | null> => {
    if (!session || !accessToken) return null;
    try {
      return await inboundApi.getSessionSummary(accessToken, session.id);
    } catch {
      return null;
    }
  }, [accessToken, session]);

  return { session, loading, error, startSession, recordScan, endSession, getSummary };
}

// ============================================
// RECEIVING SLIPS HOOK
// ============================================

export function useReceivingSlips({
  warehouse_id,
  status,
  page,
  page_size,
}: {
  warehouse_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  // TanStack Query dedupes identical in-flight requests and caches by key, so
  // several components asking for the same page share a single API call.
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [...RECEIVING_SLIPS_QUERY_KEY, { warehouse_id, status, page, page_size }],
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated');
      return inboundApi.listReceivingSlips(accessToken, { warehouse_id, status, page, page_size });
    },
    // Keep the previous page/filter's rows visible while the next one loads.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled: !!accessToken,
  });

  const approveSlip = React.useCallback(
    async (slipId: string): Promise<ReceivingSlipActionResult> => {
      if (!accessToken) throw new Error('Not authenticated');
      const result = await inboundApi.approveSlip(accessToken, slipId);
      queryClient.invalidateQueries({ queryKey: RECEIVING_SLIPS_QUERY_KEY });
      // Approving a slip generates its put-away list(s).
      queryClient.invalidateQueries({ queryKey: PUT_AWAY_LISTS_QUERY_KEY });
      return result;
    },
    [accessToken, queryClient],
  );

  const rejectSlip = React.useCallback(
    async (slipId: string, reason: string): Promise<ReceivingSlipActionResult> => {
      if (!accessToken) throw new Error('Not authenticated');
      const result = await inboundApi.rejectSlip(accessToken, slipId, reason);
      queryClient.invalidateQueries({ queryKey: RECEIVING_SLIPS_QUERY_KEY });
      return result;
    },
    [accessToken, queryClient],
  );

  const generatePutAway = React.useCallback(
    async (slipId: string, options?: { mode?: 'auto' | 'manual'; workerIds?: string[] }): Promise<PutAwayList | PutAwayListBatchResponse> => {
      if (!accessToken) throw new Error('Not authenticated');
      const ids = (options?.workerIds ?? []).filter(Boolean);
      const result = await putAwayApi.generateFromSlip(accessToken, slipId, {
        mode: options?.mode,
        ...(ids.length === 1 ? { worker_id: ids[0] } : {}),
        ...(ids.length > 1 ? { worker_ids: ids } : {}),
      });
      queryClient.invalidateQueries({ queryKey: RECEIVING_SLIPS_QUERY_KEY });
      // A new put-away list was created — refresh mounted lists and counters.
      queryClient.invalidateQueries({ queryKey: PUT_AWAY_LISTS_QUERY_KEY });
      return result;
    },
    [accessToken, queryClient],
  );

  const rejectItem = React.useCallback(
    async (slipId: string, itemId: string, reason: string): Promise<void> => {
      if (!accessToken) throw new Error('Not authenticated');
      await inboundApi.rejectItem(accessToken, slipId, itemId, reason);
      queryClient.invalidateQueries({ queryKey: RECEIVING_SLIPS_QUERY_KEY });
    },
    [accessToken, queryClient],
  );

  return {
    data: data ?? null,
    statusCounts: data?.status_counts ?? null,
    loading: isFetching,
    error: queryErrorToMessage(error),
    refetch,
    approveSlip,
    rejectSlip,
    rejectItem,
    generatePutAway,
  };
}

// ============================================
// RECEIVING SLIP DETAIL HOOK
// ============================================

/**
 * Fetch a single receiving slip (with its line items) through TanStack Query.
 * The key is nested under `RECEIVING_SLIPS_QUERY_KEY`, so the mutations in
 * `useReceivingSlips` (approve/reject/flag) also refresh an open detail.
 */
export function useReceivingSlip(slipId: string | null) {
  const accessToken = useUserStore((s) => s.accessToken);

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [...RECEIVING_SLIPS_QUERY_KEY, 'detail', slipId],
    queryFn: async () => {
      if (!slipId) throw new Error('No slip selected');
      if (!accessToken) throw new Error('Not authenticated');
      return inboundApi.getReceivingSlip(accessToken, slipId);
    },
    staleTime: 30_000,
    enabled: !!slipId && !!accessToken,
  });

  return {
    slip: data ?? null,
    loading: isFetching,
    error: queryErrorToMessage(error),
    refetch,
  };
}

// ============================================
// PUT-AWAY LISTS HOOK
// ============================================

export function usePutAwayLists({
  warehouse_id,
  status,
  page,
  page_size,
}: {
  warehouse_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  const accessToken = useUserStore((s) => s.accessToken);

  // TanStack Query dedupes identical in-flight requests and caches by key, so
  // several components asking for the same page share a single API call.
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [...PUT_AWAY_LISTS_QUERY_KEY, { warehouse_id, status, page, page_size }],
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated');
      return putAwayApi.listPutAwayLists(accessToken, { warehouse_id, status, page, page_size });
    },
    // Keep the previous page/filter's rows visible while the next one loads.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled: !!accessToken,
  });

  return {
    data: data ?? null,
    statusCounts: data?.status_counts ?? null,
    loading: isFetching,
    error: queryErrorToMessage(error),
    refetch,
  };
}

/**
 * Fetch a single put-away list (with its items/bin locations) through TanStack
 * Query. The key is nested under `PUT_AWAY_LISTS_QUERY_KEY`, so completing or
 * skipping an item — and anything else that invalidates the prefix — also
 * refreshes an open detail.
 */
export function usePutAwayList(listId: string | null) {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [...PUT_AWAY_LISTS_QUERY_KEY, 'detail', listId],
    queryFn: async () => {
      if (!listId) throw new Error('No list selected');
      if (!accessToken) throw new Error('Not authenticated');
      return putAwayApi.getPutAwayList(accessToken, listId);
    },
    staleTime: 30_000,
    enabled: !!listId && !!accessToken,
  });

  const completeItem = React.useCallback(
    async (itemId: string, binId?: string): Promise<PutAwayItem> => {
      if (!listId || !accessToken) throw new Error('No list selected');
      const result = await putAwayApi.completeItem(accessToken, listId, itemId, binId);
      // Item progress changes this detail and the list's status/counts.
      queryClient.invalidateQueries({ queryKey: PUT_AWAY_LISTS_QUERY_KEY });
      return result;
    },
    [accessToken, listId, queryClient],
  );

  const skipItem = React.useCallback(
    async (itemId: string, reason: string): Promise<PutAwayItem> => {
      if (!listId || !accessToken) throw new Error('No list selected');
      const result = await putAwayApi.skipItem(accessToken, listId, itemId, reason);
      queryClient.invalidateQueries({ queryKey: PUT_AWAY_LISTS_QUERY_KEY });
      return result;
    },
    [accessToken, listId, queryClient],
  );

  const raiseException = React.useCallback(
    async (itemId: string, data: PutAwayExceptionRequest): Promise<InboundException> => {
      if (!listId || !accessToken) throw new Error('No list selected');
      const result = await putAwayApi.raiseException(accessToken, listId, itemId, data);
      // The excepted units leave the list, so its progress and counts move too.
      queryClient.invalidateQueries({ queryKey: PUT_AWAY_LISTS_QUERY_KEY });
      return result;
    },
    [accessToken, listId, queryClient],
  );

  return {
    list: data ?? null,
    loading: isFetching,
    error: queryErrorToMessage(error),
    refetch,
    completeItem,
    skipItem,
    raiseException,
  };
}

// ============================================
// PICK LIST HOOK
// ============================================

export function usePickLists(params: {
  status?: string;
  warehouse_id?: string;
  sort_by?: string;
  page?: number;
  page_size?: number;
  enabled?: boolean;
  refreshKey?: number;
}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const enabled = params.enabled !== false;
  const [data, setData] = React.useState<PaginatedPickLists | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const latestRequestRef = React.useRef(0);

  const fetch = React.useCallback(async () => {
    if (!accessToken || !enabled) return;
    const requestId = ++latestRequestRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await outboundApi.listPickLists(accessToken, params);
      if (requestId === latestRequestRef.current) setData(result);
    } catch (err) {
      if (requestId === latestRequestRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load pick lists');
      }
    } finally {
      if (requestId === latestRequestRef.current) setLoading(false);
    }
  }, [accessToken, enabled, params.status, params.warehouse_id, params.sort_by, params.page, params.page_size, params.refreshKey]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, statusCounts: data?.status_counts ?? null, loading, error, refetch: fetch };
}

/**
 * Invalidate every outbound-order query (list, status counts and detail).
 *
 * Call this from any mutation that changes an order's status — generating a
 * pick list, packing one, dispatching a packing slip — including mutations
 * performed on another tab. Relying on `staleTime` alone leaves the orders list
 * and its stat cards serving cached counts for up to 30s after the mutation.
 */
export function useInvalidateOutboundOrders() {
  const queryClient = useQueryClient();
  return React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: OUTBOUND_ORDERS_QUERY_KEY }),
    [queryClient],
  );
}

export function useOutboundOrders({
  status,
  order_type,
  warehouse_id,
  page,
  page_size,
}: {
  status?: string;
  order_type?: string;
  warehouse_id?: string;
  page?: number;
  page_size?: number;
}) {
  const accessToken = useUserStore((s) => s.accessToken);

  // TanStack Query dedupes identical in-flight requests and caches by key, so
  // several components asking for the same page share a single API call.
  const { data, isFetching, isPlaceholderData, error, refetch } = useQuery({
    queryKey: [...OUTBOUND_ORDERS_QUERY_KEY, { status, order_type, warehouse_id, page, page_size }],
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated');
      return outboundOrderApi.listOrders(accessToken, { status, order_type, warehouse_id, page, page_size });
    },
    // Keep the previous page/filter's rows visible while the next one loads.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled: !!accessToken,
  });

  return {
    data: data ?? null,
    statusCounts: data?.status_counts ?? null,
    loading: isFetching,
    /** True while `data` still belongs to the previous query key (warehouse/filter/page). */
    isPlaceholderData,
    error: queryErrorToMessage(error),
    refetch,
  };
}

/**
 * Fetch a single outbound order (with its items) through TanStack Query. The key
 * is nested under `OUTBOUND_ORDERS_QUERY_KEY`, so confirming an order or packing
 * it also refreshes an open detail.
 */
export function useOutboundOrder(orderId: string | null) {
  const accessToken = useUserStore((s) => s.accessToken);

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [...OUTBOUND_ORDERS_QUERY_KEY, 'detail', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('No order selected');
      if (!accessToken) throw new Error('Not authenticated');
      return outboundOrderApi.getOrder(accessToken, orderId);
    },
    staleTime: 30_000,
    enabled: !!orderId && !!accessToken,
  });

  return {
    order: data ?? null,
    loading: isFetching,
    error: queryErrorToMessage(error),
    refetch,
  };
}

export function usePackingSlips(params: {
  warehouse_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
  enabled?: boolean;
  refreshKey?: number;
}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const enabled = params.enabled !== false;
  const [data, setData] = React.useState<PaginatedPackingSlips | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const latestRequestRef = React.useRef(0);

  const fetch = React.useCallback(async () => {
    if (!accessToken || !enabled) return;
    const requestId = ++latestRequestRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await packingSlipApi.list(accessToken, params);
      if (requestId === latestRequestRef.current) setData(result);
    } catch (err) {
      if (requestId === latestRequestRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to load packing slips');
      }
    } finally {
      if (requestId === latestRequestRef.current) setLoading(false);
    }
  }, [accessToken, enabled, params.warehouse_id, params.status, params.page, params.page_size, params.refreshKey]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, statusCounts: data?.status_counts ?? null, loading, error, refetch: fetch };
}

export function usePickList(pickListId: string | null) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [pickList, setPickList] = React.useState<PickList | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPickList = React.useCallback(async () => {
    if (!pickListId || !accessToken) return;
    setLoading(true);
    try {
      const data = await outboundApi.getPickList(accessToken, pickListId);
      setPickList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pick list');
    } finally {
      setLoading(false);
    }
  }, [accessToken, pickListId]);

  React.useEffect(() => {
    fetchPickList();
  }, [fetchPickList]);

  const recordScan = React.useCallback(
    async (qrData: string, binLocationId?: string | null, idempotencyKey?: string): Promise<PickScanResult> => {
      if (!pickListId || !accessToken) throw new Error('No pick list selected');
      setError(null);
      try {
        const result = await outboundApi.recordPickScan(accessToken, pickListId, qrData, binLocationId, idempotencyKey);
        await fetchPickList();
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Pick scan failed';
        setError(msg);
        throw new Error(msg);
      }
    },
    [accessToken, pickListId, fetchPickList],
  );

  const complete = React.useCallback(async () => {
    if (!pickListId || !accessToken) throw new Error('No pick list selected');
    setLoading(true);
    setError(null);
    try {
      const result = await outboundApi.completePickList(accessToken, pickListId);
      setPickList(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to complete pick list';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, pickListId]);

  const cancel = React.useCallback(async () => {
    if (!pickListId || !accessToken) throw new Error('No pick list selected');
    setLoading(true);
    try {
      const result = await outboundApi.cancelPickList(accessToken, pickListId);
      setPickList(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to cancel pick list';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, pickListId]);

  const assignWorker = React.useCallback(
    async (workerId: string): Promise<PickList> => {
      if (!pickListId || !accessToken) throw new Error('No pick list selected');
      setError(null);
      try {
        const result = await outboundApi.assignWorker(accessToken, pickListId, workerId);
        setPickList(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to assign worker';
        setError(msg);
        throw new Error(msg);
      }
    },
    [accessToken, pickListId],
  );

  const accept = React.useCallback(async (): Promise<PickList> => {
    if (!pickListId || !accessToken) throw new Error('No pick list selected');
    setError(null);
    let accepted: PickList;
    try {
      accepted = await outboundApi.acceptTask(accessToken, pickListId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to accept task';
      setError(msg);
      throw new Error(msg);
    }
    try {
      // The accept endpoint returns a minimal payload (no items/groups), so
      // re-fetch the full pick list to keep the detail view populated.
      const full = await outboundApi.getPickList(accessToken, pickListId);
      setPickList(full);
      return full;
    } catch {
      // The task is already accepted. Fall back to the accept response instead
      // of reporting a misleading failure that could trigger unsafe retries.
      setPickList(accepted);
      return accepted;
    }
  }, [accessToken, pickListId]);

  const stageTransfer = React.useCallback(
    async (stagingLocationId: string): Promise<PickList> => {
      if (!pickListId || !accessToken) throw new Error('No pick list selected');
      setError(null);
      try {
        const result = await outboundApi.stageTransfer(accessToken, pickListId, stagingLocationId);
        setPickList(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to transfer to staging';
        setError(msg);
        throw new Error(msg);
      }
    },
    [accessToken, pickListId],
  );

  const stageScan = React.useCallback(
    async (stagingLocationId: string): Promise<PickList> => {
      if (!pickListId || !accessToken) throw new Error('No pick list selected');
      setError(null);
      try {
        const result = await outboundApi.stageScan(accessToken, pickListId, stagingLocationId);
        setPickList(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to validate staging lane';
        setError(msg);
        throw new Error(msg);
      }
    },
    [accessToken, pickListId],
  );

  const assignHandlingUnit = React.useCallback(
    async (pickListItemId: string, handlingUnitId: string): Promise<void> => {
      if (!pickListId || !accessToken) throw new Error('No pick list selected');
      setError(null);
      try {
        await outboundApi.assignHandlingUnit(accessToken, pickListId, pickListItemId, handlingUnitId);
        await fetchPickList();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to assign handling unit';
        setError(msg);
        throw new Error(msg);
      }
    },
    [accessToken, pickListId, fetchPickList],
  );

  const confirm = React.useCallback(async (): Promise<PickList> => {
    if (!pickListId || !accessToken) throw new Error('No pick list selected');
    setError(null);
    try {
      const result = await outboundApi.confirm(accessToken, pickListId);
      setPickList(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to confirm pick list';
      setError(msg);
      throw new Error(msg);
    }
  }, [accessToken, pickListId]);

  const markReady = React.useCallback(async (): Promise<PickList> => {
    if (!pickListId || !accessToken) throw new Error('No pick list selected');
    setError(null);
    try {
      const result = await outboundApi.markReady(accessToken, pickListId);
      setPickList(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to mark ready for dispatch';
      setError(msg);
      throw new Error(msg);
    }
  }, [accessToken, pickListId]);

  const markInTransit = React.useCallback(async (): Promise<PickList> => {
    if (!pickListId || !accessToken) throw new Error('No pick list selected');
    setError(null);
    try {
      const result = await outboundApi.markInTransit(accessToken, pickListId);
      setPickList(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to mark in transit';
      setError(msg);
      throw new Error(msg);
    }
  }, [accessToken, pickListId]);

  const markDelivered = React.useCallback(async (): Promise<PickList> => {
    if (!pickListId || !accessToken) throw new Error('No pick list selected');
    setError(null);
    try {
      const result = await outboundApi.markDelivered(accessToken, pickListId);
      setPickList(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to mark delivered';
      setError(msg);
      throw new Error(msg);
    }
  }, [accessToken, pickListId]);

  return {
    pickList,
    loading,
    error,
    refetch: fetchPickList,
    recordScan,
    complete,
    cancel,
    assignWorker,
    accept,
    confirm,
    markReady,
    markInTransit,
    markDelivered,
    stageTransfer,
    stageScan,
    assignHandlingUnit,
  };
}

// ============================================
// ERP SYNC QUEUE HOOK (WF-022 / ALT-009)
// ============================================

export function useErpSyncQueue(params: { status?: string; page?: number; page_size?: number } = {}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<ErpSyncListResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchQueue = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await erpSyncApi.listMessages(accessToken, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ERP sync queue');
    } finally {
      setLoading(false);
    }
  }, [accessToken, params.status, params.page, params.page_size]);

  React.useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const flush = React.useCallback(async (): Promise<ErpSyncFlushResponse> => {
    if (!accessToken) throw new Error('Not authenticated');
    setError(null);
    try {
      const result = await erpSyncApi.flush(accessToken);
      await fetchQueue();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to flush ERP sync queue');
      throw err;
    }
  }, [accessToken, fetchQueue]);

  return { data, loading, error, refetch: fetchQueue, flush };
}

// ============================================
// GATE VERIFICATION HOOK
// ============================================

export function useGateVerification() {
  const accessToken = useUserStore((s) => s.accessToken);
  const [session, setSession] = React.useState<GateSession | null>(null);
  const [progress, setProgress] = React.useState<GateSessionProgress | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const startSession = React.useCallback(
    async (pickListId: string, vehicleNumber?: string, driverName?: string, driverContact?: string): Promise<GateSession> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        const result = await outboundApi.startGateSession(accessToken, {
          pick_list_no: pickListId,
          vehicle_number: vehicleNumber ?? null,
          driver_name: driverName ?? null,
          driver_contact: driverContact ?? null,
        });
        setSession(result);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to start gate session';
        setError(msg);
        throw new Error(msg);
      } finally {
        setLoading(false);
      }
    },
    [accessToken],
  );

  const recordScan = React.useCallback(
    async (qrData: string): Promise<GateScanResult> => {
      if (!session || !accessToken) throw new Error('No active gate session');
      setError(null);
      try {
        const result = await outboundApi.recordGateScan(accessToken, session.id, qrData);
        const prog = await outboundApi.getGateSessionProgress(accessToken, session.id);
        setProgress(prog);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gate scan failed';
        setError(msg);
        throw new Error(msg);
      }
    },
    [accessToken, session],
  );

  const verify = React.useCallback(async (): Promise<GateSession> => {
    if (!session || !accessToken) throw new Error('No active gate session');
    setLoading(true);
    setError(null);
    try {
      const result = await outboundApi.verifyGateSession(accessToken, session.id);
      setSession(result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to verify gate session';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, [accessToken, session]);

  return { session, progress, loading, error, startSession, recordScan, verify };
}

// ============================================
// DISPATCHES HOOK
// ============================================

export function useDispatches({ page, page_size, vehicle_number }: { page?: number; page_size?: number; vehicle_number?: string }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<DispatchListResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await outboundApi.listDispatches(accessToken, { page, page_size, vehicle_number });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dispatches');
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, page_size, vehicle_number]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  const createDispatch = React.useCallback(
    async (gateSessionId: string): Promise<DispatchRecord> => {
      if (!accessToken) throw new Error('Not authenticated');
      const result = await outboundApi.createDispatch(accessToken, gateSessionId);
      await fetch();
      return result;
    },
    [accessToken, fetch],
  );

  return { data, loading, error, refetch: fetch, createDispatch };
}

// ============================================
// WMS WORKERS HOOK
// ============================================

/**
 * Every assignable worker of a warehouse, following pagination so warehouses
 * with more than one page of workers are fully covered.
 */
async function fetchAllWarehouseWorkers(accessToken: string, warehouseId?: string, pageSize = 100): Promise<WMSWorker[]> {
  const all: WMSWorker[] = [];
  let page = 1;
  while (page > 0) {
    const data = await wmsWorkerApi.list(accessToken, { page, page_size: pageSize, warehouse_id: warehouseId });
    all.push(...(data.workers ?? []));
    page = data.page < data.total_pages ? page + 1 : 0;
  }
  return all;
}

/**
 * Loads the warehouse's assignable workers while `enabled` (typically a dialog is
 * open) and ignores a response that arrives after it closed. Shared by the
 * put-away and pick-list generators so the pagination walk lives in one place.
 */
export function useWarehouseWorkers(warehouseId: string | undefined, enabled: boolean) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [workers, setWorkers] = React.useState<WMSWorker[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<NormalizedApiError | null>(null);

  React.useEffect(() => {
    if (!enabled || !accessToken) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Drop the previous warehouse's list straight away: leaving it selectable while the
    // new one loads lets a worker from the wrong warehouse be submitted.
    setWorkers([]);
    fetchAllWarehouseWorkers(accessToken, warehouseId)
      .then((data) => {
        if (!cancelled) setWorkers(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setWorkers([]);
        // Reported rather than swallowed: an empty list on a 403 reads as "no workers".
        setError(toNormalizedApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, accessToken, warehouseId]);

  return { workers, loading, error };
}

export function useWMSWorkers({
  warehouse_id,
  status,
  search,
  page,
  page_size,
}: {
  warehouse_id?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<WMSWorkerListResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await wmsWorkerApi.list(accessToken, { warehouse_id, status, search, page, page_size });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  }, [accessToken, warehouse_id, status, search, page, page_size]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ============================================
// WMS DEVICES HOOK
// ============================================

export function useWMSDevices({
  warehouse_id,
  status,
  search,
  page,
  page_size,
}: {
  warehouse_id?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<WMSDeviceListResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await wmsDeviceApi.list(accessToken, { warehouse_id, status, search, page, page_size });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [accessToken, warehouse_id, status, search, page, page_size]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ============================================
// WMS DASHBOARD HOOK
// ============================================

export function useWMSDashboard({ warehouse_id, period, date }: { warehouse_id?: string; period?: string; date?: string }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<WMSDashboardStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await wmsDashboardApi.getStats(accessToken, { warehouse_id, period, date });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, [accessToken, warehouse_id, period, date]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ============================================
// VEHICLE ARRIVALS HOOK
// ============================================

export function useVehicleArrivals({
  warehouse_id,
  status,
  search,
  page,
  page_size,
}: {
  warehouse_id?: string;
  status?: string;
  search?: string;
  page?: number;
  page_size?: number;
}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<PaginatedVehicleArrivals | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await vehicleArrivalApi.list(accessToken, { warehouse_id, status, search, page, page_size });
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vehicle arrivals');
    } finally {
      setLoading(false);
    }
  }, [accessToken, warehouse_id, status, search, page, page_size]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  const register = React.useCallback(
    async (payload: {
      vehicle_no: string;
      driver_name?: string | null;
      driver_contact?: string | null;
      transporter?: string | null;
      warehouse_id?: string | null;
      dock?: string | null;
      asn_order_ids?: string[];
      notes?: string | null;
    }): Promise<VehicleArrival> => {
      if (!accessToken) throw new Error('Not authenticated');
      const result = await vehicleArrivalApi.register(accessToken, payload);
      await fetch();
      return result;
    },
    [accessToken, fetch],
  );

  const linkAsns = React.useCallback(
    async (arrivalId: string, asnOrderIds: string[]): Promise<VehicleArrival> => {
      if (!accessToken) throw new Error('Not authenticated');
      const result = await vehicleArrivalApi.linkAsns(accessToken, arrivalId, asnOrderIds);
      await fetch();
      return result;
    },
    [accessToken, fetch],
  );

  const update = React.useCallback(
    async (
      arrivalId: string,
      payload: {
        vehicle_no?: string;
        driver_name?: string | null;
        driver_contact?: string | null;
        transporter?: string | null;
        dock?: string | null;
        notes?: string | null;
      },
    ): Promise<VehicleArrival> => {
      if (!accessToken) throw new Error('Not authenticated');
      const result = await vehicleArrivalApi.update(accessToken, arrivalId, payload);
      await fetch();
      return result;
    },
    [accessToken, fetch],
  );

  const unlinkAsn = React.useCallback(
    async (arrivalId: string, asnOrderId: string): Promise<VehicleArrival> => {
      if (!accessToken) throw new Error('Not authenticated');
      const result = await vehicleArrivalApi.unlinkAsn(accessToken, arrivalId, asnOrderId);
      await fetch();
      return result;
    },
    [accessToken, fetch],
  );

  return { data, loading, error, refetch: fetch, register, linkAsns, unlinkAsn, update };
}

// ============================================
// RETURN RECEIPT NOTES
// ============================================

/**
 * Root key for return receipt-note queries. Approving or disposing a line changes
 * the note, its queue row and - through generated exceptions - the inbound
 * exception queue, so mutations invalidate this prefix.
 */
export const RETURN_NOTES_QUERY_KEY = ['wms', 'return-receipt-notes'] as const;

/** Supervisor queue of return receipt notes (`GET /returns/receipt-notes`). */
export function useReturnReceiptNotes({
  warehouse_id,
  status,
  page,
  page_size,
}: {
  warehouse_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  const accessToken = useUserStore((s) => s.accessToken);

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [...RETURN_NOTES_QUERY_KEY, { warehouse_id, status, page, page_size }],
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated');
      return returnApi.listReceiptNotes(accessToken, { warehouse_id, status, page, page_size });
    },
    // Keep the previous page/filter's rows visible while the next one loads.
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled: !!accessToken,
  });

  return {
    data: data ?? null,
    loading: isFetching,
    error: queryErrorToMessage(error),
    refetch,
  };
}

/**
 * One return receipt note plus its review actions. The key is nested under
 * `RETURN_NOTES_QUERY_KEY` so a mutation here also refreshes the open queue, and
 * every action re-reads the note instead of assuming the stock movement landed.
 */
export function useReturnReceiptNote(noteId: string | null) {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [...RETURN_NOTES_QUERY_KEY, 'detail', noteId],
    queryFn: async () => {
      if (!noteId) throw new Error('No note selected');
      if (!accessToken) throw new Error('Not authenticated');
      return returnApi.getReceiptNote(accessToken, noteId);
    },
    staleTime: 30_000,
    enabled: !!noteId && !!accessToken,
  });

  const invalidate = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: RETURN_NOTES_QUERY_KEY }),
    [queryClient],
  );

  const requireNote = React.useCallback(() => {
    if (!noteId) throw new Error('No note selected');
    if (!accessToken) throw new Error('Not authenticated');
    return { noteId, accessToken };
  }, [noteId, accessToken]);

  const approveNote = React.useCallback(
    async (payload: ReturnNoteApprovalRequest): Promise<void> => {
      const { noteId: id, accessToken: token } = requireNote();
      await returnApi.approveReceiptNote(token, id, payload);
      await invalidate();
    },
    [requireNote, invalidate],
  );

  const rejectNote = React.useCallback(
    async (reason: string): Promise<void> => {
      const { noteId: id, accessToken: token } = requireNote();
      await returnApi.rejectReceiptNote(token, id, { reason });
      await invalidate();
    },
    [requireNote, invalidate],
  );

  const disposeLine = React.useCallback(
    async (lineId: string, action: ReturnDispositionAction, reasonCode?: string, note?: string): Promise<void> => {
      const { noteId: id, accessToken: token } = requireNote();
      const payload: ReturnDispositionRequest = { line_id: lineId, action };
      if (reasonCode) payload.reason_code = reasonCode;
      if (note) payload.note = note;
      await returnApi.disposeLine(token, id, payload);
      await invalidate();
    },
    [requireNote, invalidate],
  );

  /**
   * Creates put-away tasks for the `release_to_stock` lines and keeps the rest in
   * the non-pickable bins, so the put-away lists are invalidated too.
   */
  const generatePutAway = React.useCallback(
    async (payload: GenerateReturnPutAwayRequest): Promise<GenerateReturnPutAwayResponse> => {
      const { noteId: id, accessToken: token } = requireNote();
      const result = await returnApi.generatePutAway(token, id, payload);
      await Promise.all([
        invalidate(),
        queryClient.invalidateQueries({ queryKey: PUT_AWAY_LISTS_QUERY_KEY }),
      ]);
      return result;
    },
    [requireNote, invalidate, queryClient],
  );

  /** Downloads the Return Slip document as CSV (§6.7). */
  const downloadSlip = React.useCallback(async (): Promise<void> => {
    const { noteId: id, accessToken: token } = requireNote();
    const blob = await returnApi.downloadSlipCsv(token, id);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data?.note_no ?? id}-slip.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [requireNote, data?.note_no]);

  return {
    note: (data ?? null) as ReturnReceiptNoteDetail | null,
    loading: isFetching,
    error: queryErrorToMessage(error),
    refetch,
    approveNote,
    rejectNote,
    disposeLine,
    generatePutAway,
    downloadSlip,
  };
}

// ============================================
// RETURN REGISTRATIONS
// ============================================

/** Root key for return registration queries. */
export const RETURN_REGISTRATIONS_QUERY_KEY = ['wms', 'return-registrations'] as const;

/**
 * Reference lookup behind the registration form (§4.1). It only fires once an
 * invoice number or party is supplied, and a miss (`RETURNS_REFERENCE_NOT_FOUND`)
 * is surfaced as a normalised error so the form can show the server's `hint`.
 */
export function useReturnReference(reference: { invoice_no?: string; party_id?: string; warehouse_id?: string }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const enabled = Boolean(reference.invoice_no || reference.party_id);

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [...RETURN_REGISTRATIONS_QUERY_KEY, 'reference', reference],
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated');
      return returnApi.getReferences(accessToken, reference);
    },
    // A miss is a definitive answer, not a transient failure worth retrying.
    retry: false,
    staleTime: 30_000,
    enabled: enabled && !!accessToken,
  });

  return {
    reference: (data ?? null) as ReturnReference | null,
    loading: isFetching,
    error: error ? toNormalizedApiError(error) : null,
    refetch,
  };
}

/** Registration queue (§5.2) plus the create/cancel actions the screen needs. */
export function useReturnRegistrations({
  warehouse_id,
  status,
  page,
  page_size,
}: {
  warehouse_id?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [...RETURN_REGISTRATIONS_QUERY_KEY, { warehouse_id, status, page, page_size }],
    queryFn: async () => {
      if (!accessToken) throw new Error('Not authenticated');
      return returnApi.listRegistrations(accessToken, { warehouse_id, status, page, page_size });
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled: !!accessToken,
  });

  const invalidate = React.useCallback(
    () => queryClient.invalidateQueries({ queryKey: RETURN_REGISTRATIONS_QUERY_KEY }),
    [queryClient],
  );

  const createRegistration = React.useCallback(
    async (payload: CreateReturnRegistrationRequest): Promise<ReturnRegistrationDetail> => {
      if (!accessToken) throw new Error('Not authenticated');
      const created = await returnApi.createRegistration(accessToken, payload);
      await invalidate();
      return created;
    },
    [accessToken, invalidate],
  );

  const cancelRegistration = React.useCallback(
    async (registrationId: string, reason: string): Promise<void> => {
      if (!accessToken) throw new Error('Not authenticated');
      await returnApi.cancelRegistration(accessToken, registrationId, { reason });
      await invalidate();
    },
    [accessToken, invalidate],
  );

  return {
    data: data ?? null,
    loading: isFetching,
    error: queryErrorToMessage(error),
    refetch,
    createRegistration,
    cancelRegistration,
  };
}

/** One registration with its expected/received lines and dock sessions (§5.3). */
export function useReturnRegistration(registrationId: string | null) {
  const accessToken = useUserStore((s) => s.accessToken);

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [...RETURN_REGISTRATIONS_QUERY_KEY, 'detail', registrationId],
    queryFn: async () => {
      if (!registrationId) throw new Error('No registration selected');
      if (!accessToken) throw new Error('Not authenticated');
      return returnApi.getRegistration(accessToken, registrationId);
    },
    staleTime: 30_000,
    enabled: !!registrationId && !!accessToken,
  });

  return {
    registration: (data ?? null) as ReturnRegistrationDetail | null,
    loading: isFetching,
    error: queryErrorToMessage(error),
    refetch,
  };
}
