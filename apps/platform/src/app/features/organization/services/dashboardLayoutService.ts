import { environment } from '../../../../environments/environment';

const API_BASE = `${environment.apiBaseUrl}/api/v1/identity/organizations`;

/** A server-owned widget definition merged with the org's current state. */
export interface DashboardWidget {
  id: string;
  label: string;
  description: string | null;
  group: string | null;
  group_label: string | null;
  chart_type: string | null;
  data_source: string | null;
  permission: string | null;
  requires_feature_flag: string | null;
  configurable: string[];
  default_enabled?: boolean;
  is_default?: boolean;
  enabled: boolean;
  order: number;
}

/** The persisted override for a single widget (what PUT sends). */
export interface WidgetOverride {
  id: string;
  enabled: boolean;
  order: number;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  enabled_widget_ids: string[];
  /** group key → human label */
  groups: Record<string, string>;
  /** True once the organization has saved a custom layout. */
  customized: boolean;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function normalizeWidget(value: unknown, index: number): DashboardWidget {
  const raw = asRecord(value);
  const id = str(raw.id) ?? String(raw.id ?? '');
  return {
    id,
    label: str(raw.label) ?? id,
    description: str(raw.description),
    group: str(raw.group),
    group_label: str(raw.group_label),
    chart_type: str(raw.chart_type),
    data_source: str(raw.data_source),
    permission: str(raw.permission),
    requires_feature_flag: str(raw.requires_feature_flag),
    configurable: Array.isArray(raw.configurable)
      ? raw.configurable.filter((item): item is string => typeof item === 'string')
      : [],
    default_enabled: typeof raw.default_enabled === 'boolean' ? raw.default_enabled : undefined,
    is_default: typeof raw.is_default === 'boolean' ? raw.is_default : undefined,
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : raw.default_enabled === true,
    order: typeof raw.order === 'number' ? raw.order : index,
  };
}

/** Defensive normalisation so an unexpected payload can't crash the tab. */
function normalizeLayout(data: unknown): DashboardLayout {
  const raw = asRecord(data);
  const widgets = (Array.isArray(raw.widgets) ? raw.widgets : []).map(normalizeWidget);
  widgets.sort((a, b) => a.order - b.order);

  const enabledWidgetIds = Array.isArray(raw.enabled_widget_ids)
    ? raw.enabled_widget_ids.filter((id): id is string => typeof id === 'string')
    : widgets.filter((w) => w.enabled).map((w) => w.id);

  const groups: Record<string, string> = {};
  Object.entries(asRecord(raw.groups)).forEach(([key, value]) => {
    const label = str(value);
    if (label) groups[key] = label;
  });

  const customized = typeof raw.customized === 'boolean' ? raw.customized : false;

  return { widgets, enabled_widget_ids: enabledWidgetIds, groups, customized };
}

async function parseError(res: Response, fallback: string): Promise<Error> {
  const body = await res.json().catch(() => null);
  const record = asRecord(body);
  const detail = record.detail;
  const message =
    (typeof detail === 'string' ? detail : str(asRecord(detail).message)) ||
    str(record.message) ||
    fallback;
  return new Error(message);
}

const authHeaders = (token: string): Record<string, string> => ({ Authorization: `Bearer ${token}` });
const jsonHeaders = (token: string): Record<string, string> => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const url = (organizationId: string): string => `${API_BASE}/${organizationId}/dashboard-layout`;

/**
 * Org-level dashboard widget layout, persisted in
 * `organizations.extra_data["dashboard_layout"]` (identity-service).
 *
 * The widget catalogue itself is server-owned — this client only ever sends
 * `{ id, enabled, order }` overrides and renders whatever the server returns.
 */
export const dashboardLayoutService = {
  async get(token: string, organizationId: string): Promise<DashboardLayout> {
    const res = await fetch(url(organizationId), { headers: authHeaders(token) });
    if (!res.ok) throw await parseError(res, `Failed to load dashboard layout (HTTP ${res.status})`);
    return normalizeLayout(await res.json());
  },

  async save(token: string, organizationId: string, widgets: WidgetOverride[]): Promise<DashboardLayout> {
    const res = await fetch(url(organizationId), {
      method: 'PUT',
      headers: jsonHeaders(token),
      body: JSON.stringify({ widgets }),
    });
    if (!res.ok) throw await parseError(res, `Failed to save dashboard layout (HTTP ${res.status})`);
    return normalizeLayout(await res.json());
  },

  /** Reset to defaults. Returns the fresh layout, or `null` for a 204. */
  async reset(token: string, organizationId: string): Promise<DashboardLayout | null> {
    const res = await fetch(url(organizationId), { method: 'DELETE', headers: authHeaders(token) });
    if (!res.ok) throw await parseError(res, `Failed to reset dashboard layout (HTTP ${res.status})`);
    const body = await res.json().catch(() => null);
    return body ? normalizeLayout(body) : null;
  },
};
