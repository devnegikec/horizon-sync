import type { DashboardWidgetDef } from './types';
import { InboundOutboundWidget } from './widgets/InboundOutboundWidget';
import { KpiStripWidget } from './widgets/KpiStripWidget';

/**
 * Static dashboard widget registry.
 *
 * To add a widget:
 *   1. Create a component that accepts `DashboardWidgetProps`.
 *   2. Append an entry below (id/title/endpoint/size + the component).
 *
 * `DashboardSection` renders every entry (subject to its optional
 * `permission`) — no other wiring is required. `endpoint` values reference
 * docs/DASHBOARD_DOC.md.
 */
export const dashboardWidgets: DashboardWidgetDef[] = [
  {
    id: 'wms-kpi-strip',
    title: 'Key Metrics',
    description: 'Stock, stock-risk and workforce counters for the selected window.',
    endpoint: '/api/v1/wms-dashboard/stats',
    permission: 'warehouse.read',
    size: 'full',
    Component: KpiStripWidget,
  },
  {
    id: 'wms-inbound-outbound',
    title: 'Inbound vs Outbound',
    description: 'Movement quantity and value per bucket, for the point in time selected.',
    endpoint: '/api/v1/wms-dashboard/stats',
    permission: 'warehouse.read',
    size: 'full',
    Component: InboundOutboundWidget,
  },
];
