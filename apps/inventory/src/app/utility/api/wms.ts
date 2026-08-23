import { environment } from '../../../environments/environment';
import type {
  WarehouseLocation,
  LocationTree,
  LocationSummary,
  PaginatedLocations,
  CreateLocationRequest,
  UpdateLocationRequest,
  ScanSession,
  ScanResult,
  SessionSummary,
  ReceivingSlip,
  PaginatedReceivingSlips,
  PutAwayList,
  PutAwayItem,
  PickList,
  PaginatedPickLists,
  PickScanResult,
  SAPInvoicePayload,
  GateSession,
  GateScanResult,
  GateSessionProgress,
  GateSessionRequest,
  DispatchRecord,
  DispatchListResponse,
  WMSWorker,
  WMSWorkerListResponse,
  WMSWorkerCreate,
  WMSWorkerUpdate,
  WMSDevice,
  WMSDeviceListResponse,
  WMSDeviceCreate,
  WMSDeviceUpdate,
  CopyStockRequest,
  StockImportRequest,
  StockImportResult,
  BinStateResponse,
  CapacityTreeNode,
  WMSDashboardStats,
  VehicleArrival,
  VehicleArrivalCreate,
  VehicleArrivalListItem,
  PaginatedVehicleArrivals,
} from '../../types/wms.types';

const BASE = `${environment.apiCoreUrl}/api/v1`;
const IDENTITY_BASE = `${environment.apiIdentityUrl || environment.apiBaseUrl}/api/v1`;

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function req<T>(url: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { headers: headers(token), ...options });
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed?.message ?? parsed?.detail ?? text;
    } catch {
      // not json
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

// ============================================
// LAYOUT
// ============================================

export const layoutApi = {
  createLocation: (token: string, data: CreateLocationRequest) =>
    req<WarehouseLocation>(`${BASE}/warehouse-locations`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTree: (token: string, warehouseId: string) =>
    req<LocationTree[]>(`${BASE}/warehouse-locations/tree/${warehouseId}`, token),

  listLocations: (
    token: string,
    params: {
      warehouse_id: string;
      location_type?: string;
      parent_location_id?: string;
      is_active?: boolean;
      has_stock?: boolean;
      page?: number;
      page_size?: number;
    },
  ) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    return req<PaginatedLocations>(`${BASE}/warehouse-locations?${p}`, token);
  },

  getLocation: (token: string, id: string) =>
    req<WarehouseLocation>(`${BASE}/warehouse-locations/${id}`, token),

  updateLocation: (token: string, id: string, data: UpdateLocationRequest) =>
    req<WarehouseLocation>(`${BASE}/warehouse-locations/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deactivateLocation: (token: string, id: string) =>
    req<WarehouseLocation>(`${BASE}/warehouse-locations/${id}/deactivate`, token, { method: 'POST', body: '{}' }),

  getLocationSummary: (token: string, id: string) =>
    req<LocationSummary>(`${BASE}/warehouse-locations/${id}/summary`, token),

  searchLocations: (token: string, warehouseId: string, query: string, limit = 20) =>
    req<WarehouseLocation[]>(
      `${BASE}/warehouse-locations/search?warehouse_id=${warehouseId}&q=${encodeURIComponent(query)}&limit=${limit}`,
      token,
    ),
};

// ============================================
// INBOUND
// ============================================

export const inboundApi = {
  startSession: (token: string, data: { warehouse_id: string; dock_location?: string | null }) =>
    req<ScanSession>(`${BASE}/inbound/sessions`, token, { method: 'POST', body: JSON.stringify(data) }),

  recordScan: (token: string, sessionId: string, data: { qr_data: string }) =>
    req<ScanResult>(`${BASE}/inbound/sessions/${sessionId}/scan`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  endSession: (token: string, sessionId: string) =>
    req<ReceivingSlip>(`${BASE}/inbound/sessions/${sessionId}/end`, token, { method: 'POST', body: '{}' }),

  getSessionSummary: (token: string, sessionId: string) =>
    req<SessionSummary>(`${BASE}/inbound/sessions/${sessionId}/summary`, token),

  listReceivingSlips: (token: string, params: { warehouse_id?: string; status?: string; page?: number; page_size?: number }) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    return req<PaginatedReceivingSlips>(`${BASE}/inbound/receiving-slips?${p}`, token);
  },

  getReceivingSlip: (token: string, slipId: string) =>
    req<ReceivingSlip>(`${BASE}/inbound/receiving-slips/${slipId}`, token),

  approveSlip: (token: string, slipId: string, workerId?: string) =>
    req<ReceivingSlip>(`${BASE}/inbound/receiving-slips/${slipId}/approve`, token, {
      method: 'POST',
      body: JSON.stringify(workerId ? { worker_id: workerId } : {}),
    }),

  rejectSlip: (token: string, slipId: string, reason: string) =>
    req<ReceivingSlip>(`${BASE}/inbound/receiving-slips/${slipId}/reject`, token, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  flagLineItem: (token: string, slipId: string, itemId: string, flag: 'short' | 'damaged', notes?: string) =>
    req<unknown>(`${BASE}/inbound/receiving-slips/${slipId}/items/${itemId}/flag`, token, {
      method: 'POST',
      body: JSON.stringify({ flag, notes }),
    }),

  rejectItem: (token: string, slipId: string, itemId: string, reason: string) =>
    req<unknown>(`${BASE}/inbound/receiving-slips/${slipId}/items/${itemId}/reject`, token, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ============================================
// VEHICLE ARRIVALS
// ============================================

export const vehicleArrivalApi = {
  register: (token: string, data: VehicleArrivalCreate) =>
    req<VehicleArrival>(`${BASE}/vehicle-arrivals`, token, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  list: (token: string, params: { warehouse_id?: string; status?: string; search?: string; page?: number; page_size?: number }) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    return req<PaginatedVehicleArrivals>(`${BASE}/vehicle-arrivals?${p}`, token);
  },

  get: (token: string, id: string) =>
    req<VehicleArrival>(`${BASE}/vehicle-arrivals/${id}`, token),

  linkAsns: (token: string, id: string, asnOrderIds: string[]) =>
    req<VehicleArrival>(`${BASE}/vehicle-arrivals/${id}/asns`, token, {
      method: 'POST',
      body: JSON.stringify({ asn_order_ids: asnOrderIds }),
    }),

  unlinkAsn: (token: string, id: string, asnOrderId: string) =>
    req<VehicleArrival>(`${BASE}/vehicle-arrivals/${id}/asns/${asnOrderId}`, token, {
      method: 'DELETE',
    }),
};

// ============================================
// PUT-AWAY
// ============================================

export const putAwayApi = {
  listPutAwayLists: (token: string, params: { warehouse_id?: string; status?: string; page?: number; page_size?: number }) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    return req<{ put_away_lists: PutAwayList[]; pagination: unknown }>(`${BASE}/put-away?${p}`, token);
  },

  getPutAwayList: (token: string, id: string) =>
    req<PutAwayList>(`${BASE}/put-away/${id}`, token),

  completeItem: (token: string, listId: string, itemId: string, binId?: string) =>
    req<PutAwayItem>(`${BASE}/put-away/${listId}/items/${itemId}/complete`, token, {
      method: 'POST',
      body: JSON.stringify(binId ? { bin_id: binId } : {}),
    }),

  skipItem: (token: string, listId: string, itemId: string, reason: string) =>
    req<PutAwayItem>(`${BASE}/put-away/${listId}/items/${itemId}/skip`, token, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  generateFromSlip: (token: string, slipId: string) =>
    req<PutAwayList>(`${BASE}/put-away/generate-from-slip/${slipId}`, token, { method: 'POST', body: '{}' }),
};

// ============================================
// OUTBOUND
// ============================================

export const outboundApi = {
  createFromInvoice: (token: string, data: SAPInvoicePayload) =>
    req<PickList>(`${BASE}/outbound/from-invoice`, token, { method: 'POST', body: JSON.stringify(data) }),

  listPickLists: (
    token: string,
    params: { status?: string; warehouse_id?: string; invoice_reference?: string; page?: number; page_size?: number },
  ) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    return req<PaginatedPickLists>(`${BASE}/outbound?${p}`, token);
  },

  getPickList: (token: string, id: string) =>
    req<PickList>(`${BASE}/outbound/${id}`, token),

  recordPickScan: (token: string, pickListId: string, qrData: string) =>
    req<PickScanResult>(`${BASE}/outbound/${pickListId}/scan`, token, {
      method: 'POST',
      body: JSON.stringify({ qr_data: qrData }),
    }),

  completePickList: (token: string, id: string) =>
    req<PickList>(`${BASE}/outbound/${id}/complete`, token, { method: 'POST', body: '{}' }),

  cancelPickList: (token: string, id: string) =>
    req<PickList>(`${BASE}/outbound/${id}/cancel`, token, { method: 'POST', body: '{}' }),

  assignWorker: (token: string, id: string, workerId: string) =>
    req<PickList>(`${BASE}/outbound/${id}/assign`, token, {
      method: 'POST',
      body: JSON.stringify({ worker_id: workerId }),
    }),

  // Gate Verification
  startGateSession: (token: string, data: GateSessionRequest) =>
    req<GateSession>(`${BASE}/outbound/gate-sessions`, token, { method: 'POST', body: JSON.stringify(data) }),

  recordGateScan: (token: string, sessionId: string, qrData: string) =>
    req<GateScanResult>(`${BASE}/outbound/gate-sessions/${sessionId}/scan`, token, {
      method: 'POST',
      body: JSON.stringify({ qr_data: qrData }),
    }),

  getGateSessionProgress: (token: string, sessionId: string) =>
    req<GateSessionProgress>(`${BASE}/outbound/gate-sessions/${sessionId}/progress`, token),

  verifyGateSession: (token: string, sessionId: string) =>
    req<GateSession>(`${BASE}/outbound/gate-sessions/${sessionId}/verify`, token, { method: 'POST', body: '{}' }),

  // Dispatches
  createDispatch: (token: string, gateSessionId: string) =>
    req<DispatchRecord>(`${BASE}/outbound/dispatches`, token, {
      method: 'POST',
      body: JSON.stringify({ gate_session_id: gateSessionId }),
    }),

  listDispatches: (
    token: string,
    params: { date_from?: string; date_to?: string; vehicle_number?: string; invoice_reference?: string; page?: number; page_size?: number },
  ) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    return req<DispatchListResponse>(`${BASE}/outbound/dispatches?${p}`, token);
  },

  getDispatch: (token: string, id: string) =>
    req<DispatchRecord>(`${BASE}/outbound/dispatches/${id}`, token),
};

// ============================================
// WMS WORKERS
// ============================================

export const wmsWorkerApi = {
  create: (token: string, data: WMSWorkerCreate) =>
    req<WMSWorker>(`${IDENTITY_BASE}/identity/workers`, token, { method: 'POST', body: JSON.stringify(data) }),

  list: (token: string, params: { warehouse_id?: string; status?: string; search?: string; page?: number; page_size?: number }) => {
    const p = new URLSearchParams();
    p.append('user_type', 'warehouse_worker');
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    return req<WMSWorkerListResponse>(`${IDENTITY_BASE}/identity/workers?${p}`, token);
  },

  get: (token: string, id: string) =>
    req<WMSWorker>(`${IDENTITY_BASE}/identity/workers/${id}`, token),

  update: (token: string, id: string, data: WMSWorkerUpdate) =>
    req<WMSWorker>(`${IDENTITY_BASE}/identity/workers/${id}`, token, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (token: string, id: string) =>
    req<void>(`${IDENTITY_BASE}/identity/workers/${id}`, token, { method: 'DELETE' }),

  regenerateBarcode: (token: string, id: string) =>
    req<WMSWorker>(`${IDENTITY_BASE}/identity/workers/${id}/regenerate-qr`, token, { method: 'POST', body: '{}' }),

  barcodeLogin: (barcode: string) =>
    req<{ access_token: string; token_type: string; expires_in: number; worker: WMSWorker }>(`${BASE}/wms-workers/login/barcode`, '', {
      method: 'POST',
      body: JSON.stringify({ barcode }),
      headers: { 'Content-Type': 'application/json' },
    }),
};

// ============================================
// WMS DEVICES
// ============================================

export const wmsDeviceApi = {
  create: (token: string, data: WMSDeviceCreate) =>
    req<WMSDevice>(`${BASE}/wms-devices`, token, { method: 'POST', body: JSON.stringify(data) }),

  list: (token: string, params: { warehouse_id?: string; status?: string; search?: string; page?: number; page_size?: number }) => {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
    });
    return req<WMSDeviceListResponse>(`${BASE}/wms-devices?${p}`, token);
  },

  get: (token: string, id: string) =>
    req<WMSDevice>(`${BASE}/wms-devices/${id}`, token),

  update: (token: string, id: string, data: WMSDeviceUpdate) =>
    req<WMSDevice>(`${BASE}/wms-devices/${id}`, token, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (token: string, id: string) =>
    req<void>(`${BASE}/wms-devices/${id}`, token, { method: 'DELETE' }),
};

// ============================================
// BIN STOCK COPY / EXPORT / IMPORT
// ============================================

export const binStockApi = {
  copy: (token: string, data: CopyStockRequest) =>
    req<unknown>(`${BASE}/bin-stock/copy`, token, { method: 'POST', body: JSON.stringify(data) }),

  exportCsv: (token: string, params?: { warehouse_id?: string; item_id?: string; bin_id?: string }) => {
    const p = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
      });
    }
    return fetch(`${BASE}/bin-stock/export/csv?${p}`, { headers: headers(token) });
  },

  import: (token: string, data: StockImportRequest) =>
    req<StockImportResult>(`${BASE}/bin-stock/import`, token, { method: 'POST', body: JSON.stringify(data) }),
};

// ============================================
// WMS DASHBOARD
// ============================================

export const wmsDashboardApi = {
  getStats: (token: string, params?: { warehouse_id?: string; period?: string; date?: string; page?: number; page_size?: number }) => {
    const p = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
      });
    }
    return req<WMSDashboardStats>(`${BASE}/wms-dashboard/stats?${p}`, token);
  },
};

// ============================================
// CAPACITY
// ============================================

export const capacityApi = {
  getTree: (token: string, warehouseId: string) =>
    req<CapacityTreeNode>(`${BASE}/capacity/warehouses/${warehouseId}/tree`, token),

  getBinStates: (token: string, warehouseId: string) =>
    req<BinStateResponse[]>(`${BASE}/capacity/warehouses/${warehouseId}/bin-states`, token),
};
