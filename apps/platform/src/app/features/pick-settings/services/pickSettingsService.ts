import { environment } from '../../../../environments/environment';

const PICK_SETTINGS_URL = `${environment.apiCoreUrl}/api/v1/pick-settings`;

export interface PickConfigCatalogItem {
  key: string;
  type: 'bool' | 'int' | 'numeric' | 'enum' | 'list';
  default: unknown;
  allowed: string[] | null;
  label: string;
  description: string;
}

export interface PickSettingsResult {
  organization_id: string;
  settings: Record<string, unknown>;
}

async function parseError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => null);
  const message = body?.detail?.message || body?.detail || body?.message || fallback;
  return new Error(typeof message === 'string' ? message : fallback);
}

export const pickSettingsService = {
  /** List the pick.* config catalog (types, defaults, allowed values). */
  async getCatalog(token: string): Promise<PickConfigCatalogItem[]> {
    const res = await fetch(`${PICK_SETTINGS_URL}/catalog`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw await parseError(res, `Failed to load pick settings catalog (HTTP ${res.status})`);
    }
    const data = await res.json();
    return Array.isArray(data?.config) ? data.config : [];
  },

  /** Get effective settings (defaults merged with overrides) for the org. */
  async getSettings(token: string): Promise<PickSettingsResult> {
    const res = await fetch(PICK_SETTINGS_URL, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw await parseError(res, `Failed to load pick settings (HTTP ${res.status})`);
    }
    return res.json();
  },

  /** Upsert one or more pick.* overrides. */
  async update(token: string, settings: Record<string, unknown>): Promise<PickSettingsResult> {
    const res = await fetch(PICK_SETTINGS_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ settings }),
    });
    if (!res.ok) {
      throw await parseError(res, `Failed to save pick settings (HTTP ${res.status})`);
    }
    return res.json();
  },

  /** Clear all overrides, falling back to defaults. */
  async reset(token: string): Promise<PickSettingsResult> {
    const res = await fetch(`${PICK_SETTINGS_URL}/reset`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw await parseError(res, `Failed to reset pick settings (HTTP ${res.status})`);
    }
    return res.json();
  },
};
