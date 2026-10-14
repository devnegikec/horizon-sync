import { environment } from '../../../environments/environment';

const API_BASE = `${environment.apiCoreUrl}/api/v1`;

/** One point of the pre-bucketed inbound/outbound series returned by the API. */
export interface ChartBucket {
  label: string;
  qty: number;
  value: number;
}

export interface WmsStockFlow {
  total_qty: number;
  total_value: number;
  chart: ChartBucket[];
}

/** The subset of `GET /api/v1/wms-dashboard/stats` the widgets consume. */
export interface WmsStatsResponse {
  period: string;
  period_start: string;
  period_end: string;
  stats: {
    total_stock_items: number;
    assigned_warehouses: number;
    low_stock_count: number;
    out_of_stock_count: number;
    active_workers: number;
  };
  stock_overview: {
    inbound: WmsStockFlow & { receiving_slips: number };
    outbound: WmsStockFlow & { dispatches: number };
  };
}

export interface WmsStatsParams {
  warehouse_id?: string;
  period?: string;
  date?: string;
  page?: number;
  page_size?: number;
}

type QueryValue = string | number | undefined;

/** Thin GET helper — mirrors the fetch pattern used by `wms-dashboard-home.tsx`. */
async function apiGet<T>(token: string, path: string, params?: Record<string, QueryValue>): Promise<T> {
  const search = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') search.append(key, String(value));
    });
  }
  const qs = search.toString();
  const res = await fetch(`${API_BASE}${path}${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status}) for ${path}`);
  return (await res.json()) as T;
}

/** `GET /api/v1/wms-dashboard/stats` — permission `warehouse.read`. */
export function fetchWmsStats(token: string, params: WmsStatsParams = {}): Promise<WmsStatsResponse> {
  const query: Record<string, QueryValue> = {
    warehouse_id: params.warehouse_id,
    period: params.period,
    date: params.date,
    page: params.page,
    page_size: params.page_size,
  };
  return apiGet<WmsStatsResponse>(token, '/wms-dashboard/stats', query);
}
