import type { ComponentType } from 'react';

/** Dashboard widget footprint inside the section's 12-column grid. */
export type WidgetSize = 'sm' | 'md' | 'lg' | 'full';

/** Point-in-time granularity supported by the WMS dashboard API. */
export type DashboardPeriod = 'week' | 'month' | 'year';

/**
 * Filters shared by every widget in the section. `anchorDate` is the
 * "point in time" the dashboard is rendered for; `period` is the window
 * around it (the API calls these `date` and `period`).
 */
export interface DashboardFilters {
  period: DashboardPeriod;
  anchorDate: Date;
  warehouseId?: string;
}

/** Props every dashboard widget component receives from `DashboardSection`. */
export interface DashboardWidgetProps {
  filters: DashboardFilters;
  /** Increments when the user hits refresh, so widgets can re-fetch. */
  refreshToken: number;
  size: WidgetSize;
}

/**
 * Static registry entry describing a dashboard widget. Add an object to
 * `dashboardWidgets` (registry.tsx) and the section renders it automatically.
 */
export interface DashboardWidgetDef {
  /** Stable id, also used as the React key. */
  id: string;
  title: string;
  description?: string;
  /** Documented backend path (see docs/DASHBOARD_DOC.md). Shown as a hint. */
  endpoint: string;
  /**
   * Server catalogue widget ids this frontend widget maps to (a widget may
   * cover several, e.g. the KPI strip). Used to apply the org's saved
   * Settings → Dashboard Layout enable/order overrides.
   */
  serverIds: string[];
  /** Optional permission code; the widget is hidden when the user lacks it. */
  permission?: string;
  size: WidgetSize;
  Component: ComponentType<DashboardWidgetProps>;
}
