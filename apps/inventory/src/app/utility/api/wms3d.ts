import { environment } from '../../../environments/environment';
import type {
  LayoutResponse,
  StatusResponse,
  SuggestRequest,
  SuggestResponse,
  ReserveRequest,
  ReservationResponse,
  ReleaseResponse,
} from '../../types/wms3d.types';

const BASE = `${environment.apiCoreUrl}/api/v1/wms-3d`;

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
      /* not json */
    }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const wms3dApi = {
  /** Full procedural 3D layout tree for a warehouse. */
  getLayout: (token: string, warehouseId: string) =>
    req<LayoutResponse>(`${BASE}/layout?warehouse_id=${warehouseId}`, token),

  /** Live bin fill / reservation snapshot (polling fallback for WebSocket). */
  getStatus: (token: string, warehouseId: string) =>
    req<StatusResponse>(`${BASE}/status?warehouse_id=${warehouseId}`, token),

  /** Ranked optimal-bin suggestions for a put-away or pick task. */
  suggest: (token: string, body: SuggestRequest) =>
    req<SuggestResponse>(`${BASE}/suggest`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** Atomically reserve a bin for a worker (TTL-bound). */
  reserve: (token: string, body: ReserveRequest) =>
    req<ReservationResponse>(`${BASE}/reserve`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** Release a worker's reservation on a bin. */
  release: (token: string, body: { bin_id: string; worker_id: string }) =>
    req<ReleaseResponse>(`${BASE}/release`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** Manager override — force-release any reservation on a bin. */
  forceRelease: (token: string, binId: string) =>
    req<ReleaseResponse>(`${BASE}/force-release/${binId}`, token, {
      method: 'POST',
      body: '{}',
    }),
};
