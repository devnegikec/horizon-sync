import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { inboundApi, layoutApi, outboundApi, putAwayApi, wmsWorkerApi, wmsDeviceApi, wmsDashboardApi } from '../utility/api/wms';
import type {
  DispatchListResponse,
  DispatchRecord,
  GateSession,
  GateScanResult,
  GateSessionProgress,
  LocationTree,
  PaginatedLocations,
  PaginatedPickLists,
  PaginatedReceivingSlips,
  PickList,
  PickScanResult,
  PutAwayItem,
  PutAwayList,
  ReceivingSlip,
  ScanResult,
  ScanSession,
  SessionSummary,
  WMSWorkerListResponse,
  WMSDeviceListResponse,
  WMSDashboardStats,
} from '../types/wms.types';

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

export function useWarehouseLocations(params: {
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
    if (!accessToken || !params.warehouse_id) return;
    setLoading(true);
    setError(null);
    try {
      const result = await layoutApi.listLocations(accessToken, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }, [accessToken, params.warehouse_id, params.location_type, params.is_active, params.page, params.page_size]);

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
    async (warehouseId: string, dockLocation?: string): Promise<ScanSession> => {
      if (!accessToken) throw new Error('Not authenticated');
      setLoading(true);
      setError(null);
      try {
        const result = await inboundApi.startSession(accessToken, {
          warehouse_id: warehouseId,
          dock_location: dockLocation ?? null,
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

export function useReceivingSlips(params: { warehouse_id?: string; status?: string; page?: number; page_size?: number }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<PaginatedReceivingSlips | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await inboundApi.listReceivingSlips(accessToken, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load receiving slips');
    } finally {
      setLoading(false);
    }
  }, [accessToken, params.warehouse_id, params.status, params.page, params.page_size]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  const approveSlip = React.useCallback(
    async (slipId: string): Promise<ReceivingSlip> => {
      if (!accessToken) throw new Error('Not authenticated');
      const result = await inboundApi.approveSlip(accessToken, slipId);
      await fetch();
      return result;
    },
    [accessToken, fetch],
  );

  const rejectSlip = React.useCallback(
    async (slipId: string, reason: string): Promise<ReceivingSlip> => {
      if (!accessToken) throw new Error('Not authenticated');
      const result = await inboundApi.rejectSlip(accessToken, slipId, reason);
      await fetch();
      return result;
    },
    [accessToken, fetch],
  );

  const getSlip = React.useCallback(
    async (slipId: string): Promise<ReceivingSlip> => {
      if (!accessToken) throw new Error('Not authenticated');
      return inboundApi.getReceivingSlip(accessToken, slipId);
    },
    [accessToken],
  );

  const generatePutAway = React.useCallback(
    async (slipId: string): Promise<PutAwayList> => {
      if (!accessToken) throw new Error('Not authenticated');
      const result = await putAwayApi.generateFromSlip(accessToken, slipId);
      await fetch();
      return result;
    },
    [accessToken, fetch],
  );

  return { data, loading, error, refetch: fetch, approveSlip, rejectSlip, getSlip, generatePutAway };
}

// ============================================
// PUT-AWAY LISTS HOOK
// ============================================

export function usePutAwayLists(params: { warehouse_id?: string; status?: string; page?: number; page_size?: number }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<{ put_away_lists: PutAwayList[]; pagination: unknown } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await putAwayApi.listPutAwayLists(accessToken, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load put-away lists');
    } finally {
      setLoading(false);
    }
  }, [accessToken, params.warehouse_id, params.status, params.page, params.page_size]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function usePutAwayList(listId: string | null) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [list, setList] = React.useState<PutAwayList | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchList = React.useCallback(async () => {
    if (!listId || !accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await putAwayApi.getPutAwayList(accessToken, listId);
      setList(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load put-away list');
    } finally {
      setLoading(false);
    }
  }, [accessToken, listId]);

  React.useEffect(() => {
    fetchList();
  }, [fetchList]);

  const completeItem = React.useCallback(
    async (itemId: string, binId?: string): Promise<PutAwayItem> => {
      if (!listId || !accessToken) throw new Error('No list selected');
      const result = await putAwayApi.completeItem(accessToken, listId, itemId, binId);
      await fetchList();
      return result;
    },
    [accessToken, listId, fetchList],
  );

  const skipItem = React.useCallback(
    async (itemId: string, reason: string): Promise<PutAwayItem> => {
      if (!listId || !accessToken) throw new Error('No list selected');
      const result = await putAwayApi.skipItem(accessToken, listId, itemId, reason);
      await fetchList();
      return result;
    },
    [accessToken, listId, fetchList],
  );

  return { list, loading, error, refetch: fetchList, completeItem, skipItem };
}

// ============================================
// PICK LIST HOOK
// ============================================

export function usePickLists(params: { status?: string; warehouse_id?: string; page?: number; page_size?: number }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<PaginatedPickLists | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await outboundApi.listPickLists(accessToken, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pick lists');
    } finally {
      setLoading(false);
    }
  }, [accessToken, params.status, params.warehouse_id, params.page, params.page_size]);

  React.useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
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
    async (qrData: string): Promise<PickScanResult> => {
      if (!pickListId || !accessToken) throw new Error('No pick list selected');
      setError(null);
      try {
        const result = await outboundApi.recordPickScan(accessToken, pickListId, qrData);
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

  return { pickList, loading, error, refetch: fetchPickList, recordScan, complete, cancel };
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

export function useDispatches(params: { page?: number; page_size?: number; vehicle_number?: string }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<DispatchListResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await outboundApi.listDispatches(accessToken, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dispatches');
    } finally {
      setLoading(false);
    }
  }, [accessToken, params.page, params.page_size, params.vehicle_number]);

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

export function useWMSWorkers(params: { warehouse_id?: string; status?: string; search?: string; page?: number; page_size?: number }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<WMSWorkerListResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await wmsWorkerApi.list(accessToken, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workers');
    } finally {
      setLoading(false);
    }
  }, [accessToken, params.warehouse_id, params.status, params.search, params.page, params.page_size]);

  React.useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ============================================
// WMS DEVICES HOOK
// ============================================

export function useWMSDevices(params: { warehouse_id?: string; status?: string; search?: string; page?: number; page_size?: number }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<WMSDeviceListResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await wmsDeviceApi.list(accessToken, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, [accessToken, params.warehouse_id, params.status, params.search, params.page, params.page_size]);

  React.useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ============================================
// WMS DASHBOARD HOOK
// ============================================

export function useWMSDashboard(params: { warehouse_id?: string; period?: string; date?: string }) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [data, setData] = React.useState<WMSDashboardStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetch = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await wmsDashboardApi.getStats(accessToken, params);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, [accessToken, params.warehouse_id, params.period, params.date]);

  React.useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
