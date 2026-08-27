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
}

export interface DataSyncResult {
  success: boolean;
  organization_id: string;
  message: string;
  summary: Record<string, FeatureSummary | string>;
}

async function parseError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => null);
  const message = body?.detail?.message || body?.detail || body?.message || fallback;
  return new Error(typeof message === 'string' ? message : fallback);
}

export const dataSyncService = {
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

  /** Seed the selected data categories for the current user's organization. */
  async sync(token: string, features: string[], baseCurrency = 'USD'): Promise<DataSyncResult> {
    const res = await fetch(`${DATA_SYNC_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ features, base_currency: baseCurrency }),
    });
    if (!res.ok) {
      throw await parseError(res, `Failed to sync data (HTTP ${res.status})`);
    }
    return res.json();
  },
};
