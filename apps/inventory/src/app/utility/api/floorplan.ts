import { environment } from '../../../environments/environment';
import type {
  FloorPlanApplyRequest,
  FloorPlanApplyResponse,
  FloorPlanPreviewRequest,
  FloorPlanPreviewResponse,
  FloorPlanResponse,
} from '../../types/floorplan.types';

const BASE = `${environment.apiCoreUrl}/api/v1/floor-plans`;

function headers(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function req<T>(url: string, token: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, { headers: headers(token), ...options });
  if (!res.ok) {
    const text = await res.text();
    let detail = text;
    try { detail = JSON.parse(text)?.detail ?? text; } catch { /* not json */ }
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const floorPlanApi = {
  /** Dry-run: compute positions, return summary without writing to DB. */
  preview: (token: string, body: FloorPlanPreviewRequest) =>
    req<FloorPlanPreviewResponse>(`${BASE}/preview`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** Generate and persist bin hierarchy from config. */
  apply: (token: string, body: FloorPlanApplyRequest) =>
    req<FloorPlanApplyResponse>(`${BASE}/apply`, token, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  /** List all floor plans for a warehouse (newest first). */
  list: (token: string, warehouseId: string) =>
    req<FloorPlanResponse[]>(`${BASE}?warehouse_id=${warehouseId}`, token),

  /** Get a single floor plan by ID. */
  get: (token: string, id: string) =>
    req<FloorPlanResponse>(`${BASE}/${id}`, token),
};
