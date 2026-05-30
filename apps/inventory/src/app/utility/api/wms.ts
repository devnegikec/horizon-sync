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
} from '../../types/wms.types';

const BASE = `${environment.apiCoreUrl}/api/v1`;

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function req<T>(url: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { headers: headers(token), ...options });
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try {
      detail = JSON.parse(text)?.detail ?? text;
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
