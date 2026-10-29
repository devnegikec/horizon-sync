import { environment } from '../../../environments/environment';
import type { BinCapacityResponse, InventoryAgingResponse, ReceivingVarianceResponse } from '../../types/wms-report.types';

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
  recent_activity: RecentActivityItem[];
}

/** One item of the `recent_activity` feed returned by the dashboard. */
export interface RecentActivityItem {
  type: string;
  title: string;
  status: string;
  warehouse_id: string | null;
  worker_name: string | null;
  created_at: string | null;
}

/**
 * Legacy stats payloads may omit `stats`, `stock_overview` or individual flow
 * fields. Treating them as required crashed the KPI/flow widgets on
 * `undefined`, so every field is normalized before the widgets see it.
 */
type WmsStatsPayload = Partial<Omit<WmsStatsResponse, 'stats' | 'stock_overview' | 'recent_activity'>> & {
  stats?: Partial<WmsStatsResponse['stats']>;
  stock_overview?: {
    inbound?: Partial<WmsStatsResponse['stock_overview']['inbound']>;
    outbound?: Partial<WmsStatsResponse['stock_overview']['outbound']>;
  };
  recent_activity?: RecentActivityItem[];
};

function normalizeCounters(stats: Partial<WmsStatsResponse['stats']>): WmsStatsResponse['stats'] {
  return {
    total_stock_items: stats.total_stock_items ?? 0,
    assigned_warehouses: stats.assigned_warehouses ?? 0,
    low_stock_count: stats.low_stock_count ?? 0,
    out_of_stock_count: stats.out_of_stock_count ?? 0,
    active_workers: stats.active_workers ?? 0,
  };
}

function normalizeInbound(flow: Partial<WmsStatsResponse['stock_overview']['inbound']>): WmsStatsResponse['stock_overview']['inbound'] {
  return {
    total_qty: flow.total_qty ?? 0,
    total_value: flow.total_value ?? 0,
    receiving_slips: flow.receiving_slips ?? 0,
    chart: flow.chart ?? [],
  };
}

function normalizeOutbound(flow: Partial<WmsStatsResponse['stock_overview']['outbound']>): WmsStatsResponse['stock_overview']['outbound'] {
  return {
    total_qty: flow.total_qty ?? 0,
    total_value: flow.total_value ?? 0,
    dispatches: flow.dispatches ?? 0,
    chart: flow.chart ?? [],
  };
}

function normalizeWmsStats(payload: WmsStatsPayload): WmsStatsResponse {
  return {
    period: payload.period ?? '',
    period_start: payload.period_start ?? '',
    period_end: payload.period_end ?? '',
    stats: normalizeCounters(payload.stats ?? {}),
    stock_overview: {
      inbound: normalizeInbound(payload.stock_overview?.inbound ?? {}),
      outbound: normalizeOutbound(payload.stock_overview?.outbound ?? {}),
    },
    recent_activity: payload.recent_activity ?? [],
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
  return apiGet<WmsStatsPayload>(token, '/wms-dashboard/stats', query).then(normalizeWmsStats);
}

// ── Report / list endpoints (see docs/DASHBOARD_DOC.md) ──────────────────────

/** Params shared by the WMS report and list endpoints. */
export interface ReportParams {
  warehouse_id?: string;
  page?: number;
  page_size?: number;
}

export interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

export interface PutAwayStatusCounts {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  cancelled?: number;
}

export interface PutAwayListResponse {
  status_counts?: PutAwayStatusCounts;
}

export interface PickListStatusCounts {
  total: number;
  draft: number;
  confirmed: number;
  pending_picking: number;
  in_progress: number;
  pick_complete: number;
  completed: number;
  ready_for_dispatch: number;
  in_transit: number;
  delivered: number;
  cancelled: number;
}

export interface PickListResponse {
  status_counts?: PickListStatusCounts;
}

interface CapacityAxis {
  occupied_m3?: number;
  occupied_kg?: number;
  capacity_m3?: number | null;
  capacity_kg?: number | null;
  pct?: number | null;
}

/** Recursive zone → aisle → bin capacity rollup node. */
export interface CapacityNode {
  node: string;
  level: string;
  code: string;
  full_path: string | null;
  volume: CapacityAxis;
  weight: CapacityAxis;
  binding_pct: number | null;
  bin_state: string | null;
  is_available: boolean | null;
  children: CapacityNode[];
}

const toQuery = (params: ReportParams = {}): Record<string, QueryValue> => ({
  warehouse_id: params.warehouse_id,
  page: params.page,
  page_size: params.page_size,
});

/** `GET /api/v1/wms/reports/bin-capacity` */
export function fetchBinCapacity(token: string, params?: ReportParams): Promise<BinCapacityResponse> {
  return apiGet<BinCapacityResponse>(token, '/wms/reports/bin-capacity', toQuery(params));
}

/** `GET /api/v1/wms/reports/inventory-aging` */
export function fetchInventoryAging(token: string, params?: ReportParams): Promise<InventoryAgingResponse> {
  return apiGet<InventoryAgingResponse>(token, '/wms/reports/inventory-aging', toQuery(params));
}

/** `GET /api/v1/wms/reports/receiving-variance` */
export function fetchReceivingVariance(token: string, params?: ReportParams): Promise<ReceivingVarianceResponse> {
  return apiGet<ReceivingVarianceResponse>(token, '/wms/reports/receiving-variance', toQuery(params));
}

/** `GET /api/v1/put-away` — returns the pending/in-progress/completed counts. */
export function fetchPutAwayBacklog(token: string, params?: ReportParams): Promise<PutAwayListResponse> {
  return apiGet<PutAwayListResponse>(token, '/put-away', { ...toQuery(params), page_size: params?.page_size ?? 1 });
}

/** `GET /api/v1/pick-lists` — returns the per-stage pick counts. */
export function fetchPickListBacklog(token: string, params?: ReportParams): Promise<PickListResponse> {
  return apiGet<PickListResponse>(token, '/pick-lists', { ...toQuery(params), page_size: params?.page_size ?? 1 });
}

/** `GET /api/v1/capacity/warehouses/{id}/tree` */
export function fetchCapacityTree(token: string, warehouseId: string): Promise<CapacityNode> {
  return apiGet<CapacityNode>(token, `/capacity/warehouses/${warehouseId}/tree`);
}

/** `GET /api/v1/warehouse-users/my-warehouses` */
export function fetchMyWarehouses(token: string): Promise<WarehouseOption[]> {
  return apiGet<{ warehouses?: WarehouseOption[] }>(token, '/warehouse-users/my-warehouses').then(
    (data) => data.warehouses ?? [],
  );
}
