import { environment } from '../../../../environments/environment';

const DATA_SYNC_URL = `${environment.apiCoreUrl}/api/v1/data-sync`;

export interface SyncableFeature {
  key: string;
  label: string;
  description: string;
}

export interface FeatureSummary {
  created?: number;
  skipped?: number;
  already_existed?: boolean;
  error?: string;
  put_away_count?: number;
  put_away_list_nos?: string[];
  put_away_list_no?: string;
  put_away_status?: string;
  reset?: number;
  orders_reset?: number;
  details?: Array<{ pick_list_no: string; status: string }>;
}

export interface DataSyncResult {
  success: boolean;
  organization_id: string;
  message: string;
  summary: Record<string, FeatureSummary | string>;
}

export interface ReceiveAsnItemConfig {
  item_id?: string;
  sku?: string;
  batch: string;
  quantity: number;
  no_of_cases?: number;
  master_pack_size: number;
}

export type ReceiveAsnStep = 'qr_blocks' | 'asn' | 'receiving_slip' | 'put_away';

export interface ReceiveAsnOptions {
  mode: 'items' | 'block_ids';
  steps: ReceiveAsnStep[];
  qr_image: boolean;
  items: ReceiveAsnItemConfig[];
  block_ids: string[];
  qr_type: string;
  asn_type: string;
  source_warehouse_id?: string;
  target_warehouse_id?: string;
  put_away_worker_ids?: string[];
}

export interface ResetPickListOptions {
  order_id?: string;
  pick_list_id?: string;
  order_no?: string;
  pick_list_no?: string;
}

export interface OutboundOrderOption {
  id: string;
  order_no: string;
  status: string;
}

export interface PickListOption {
  id: string;
  pick_list_no: string;
  status: string;
}

export interface WarehouseUserAssignment {
  user_id: string;
}

async function parseError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => null);
  const message = body?.detail?.message || body?.detail || body?.message || fallback;
  return new Error(typeof message === 'string' ? message : fallback);
}

export const dataSyncService = {
  async listWarehouseUsers(token: string, warehouseId: string): Promise<WarehouseUserAssignment[]> {
    const res = await fetch(`${environment.apiCoreUrl}/api/v1/warehouse-users?warehouse_id=${encodeURIComponent(warehouseId)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw await parseError(res, `Failed to load warehouse workers (HTTP ${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data)
      ? data
      : data?.items ?? data?.users ?? data?.warehouse_users ?? data?.assignments ?? data?.data ?? [];
  },

  /** List the catalog of on-demand seedable data categories. */
  async listFeatures(token: string): Promise<SyncableFeature[]> {
    const res = await fetch(`${DATA_SYNC_URL}/features`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw await parseError(res, `Failed to load data sync features (HTTP ${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data?.features) ? data.features : [];
  },

  /** List outbound orders (order_no) for the Reset PickList selector. */
  async listOutboundOrders(token: string): Promise<OutboundOrderOption[]> {
    const res = await fetch(`${environment.apiCoreUrl}/api/v1/outbound/orders?page=1&page_size=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw await parseError(res, `Failed to load outbound orders (HTTP ${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data?.orders)
      ? data.orders.map((o: { id: string; order_no?: string; status?: string }) => ({
        id: o.id,
        order_no: o.order_no ?? o.id.slice(0, 8),
        status: o.status ?? '',
      }))
      : [];
  },

  /** List pick lists (pick_list_no) for the Reset PickList selector. */
  async listPickLists(token: string): Promise<PickListOption[]> {
    const res = await fetch(`${environment.apiCoreUrl}/api/v1/outbound?page=1&page_size=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw await parseError(res, `Failed to load pick lists (HTTP ${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data?.pick_lists)
      ? data.pick_lists.map((p: { id: string; pick_list_no?: string; status?: string }) => ({
        id: p.id,
        pick_list_no: p.pick_list_no ?? p.id.slice(0, 8),
        status: p.status ?? '',
      }))
      : [];
  },

  /** Seed the selected data categories for the current user's organization. */
  async sync(
    token: string,
    features: string[],
    baseCurrency = 'USD',
    warehouseId?: string,
    stockBoostQty?: number,
    receiveAsnOptions?: ReceiveAsnOptions,
    resetPicklistOptions?: ResetPickListOptions,
  ): Promise<DataSyncResult> {
    const res = await fetch(`${DATA_SYNC_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        features,
        base_currency: baseCurrency,
        warehouse_id: warehouseId || null,
        stock_boost_qty: stockBoostQty || null,
        receive_asn: receiveAsnOptions || null,
        reset_picklist: resetPicklistOptions || null,
      }),
    });
    if (!res.ok) {
      throw await parseError(res, `Failed to sync data (HTTP ${res.status})`);
    }
    return res.json();
  },
};
