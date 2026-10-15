import type { DashboardWidgetDef } from './types';
import { AgingCapitalWidget } from './widgets/AgingCapitalWidget';
import { BacklogWidget } from './widgets/BacklogWidget';
import { InboundOutboundWidget } from './widgets/InboundOutboundWidget';
import { KpiStripWidget } from './widgets/KpiStripWidget';
import { LiveActivityWidget } from './widgets/LiveActivityWidget';
import { ReceivingVarianceWidget } from './widgets/ReceivingVarianceWidget';
import { SpaceUtilizationWidget } from './widgets/SpaceUtilizationWidget';
import { ZoneUtilizationWidget } from './widgets/ZoneUtilizationWidget';

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
    serverIds: ['kpi_total_stock_items', 'kpi_low_stock', 'kpi_out_of_stock', 'kpi_active_workers', 'kpi_assigned_warehouses'],
    permission: 'warehouse.read',
    size: 'md',
    Component: KpiStripWidget,
  },
  {
    id: 'wms-inbound-outbound',
    title: 'Inbound vs Outbound',
    description: 'Movement quantity and value per bucket, for the point in time selected.',
    endpoint: '/api/v1/wms-dashboard/stats',
    serverIds: ['chart_inbound_outbound'],
    permission: 'warehouse.read',
    size: 'md',
    Component: InboundOutboundWidget,
  },
  {
    id: 'wms-space-utilization',
    title: 'Space Utilization',
    description: 'Volume vs weight utilisation and bin health (full / over-utilized).',
    endpoint: '/api/v1/wms/reports/bin-capacity',
    serverIds: ['chart_bin_capacity_utilization'],
    permission: 'warehouse.read',
    size: 'md',
    Component: SpaceUtilizationWidget,
  },
  {
    id: 'wms-backlog',
    title: 'Put-away & Pick Backlog',
    description: 'Pending, in-progress and completed work across both pipelines.',
    endpoint: '/api/v1/put-away, /api/v1/pick-lists',
    serverIds: ['chart_putaway_backlog', 'chart_outbound_pick_pipeline'],
    permission: 'warehouse.read',
    size: 'md',
    Component: BacklogWidget,
  },
  {
    id: 'wms-aging-capital',
    title: 'Idle / Aging Capital',
    description: 'Idle stock value bucketed by days idle (0-30 / 30-60 / 60-90 / 90+).',
    endpoint: '/api/v1/wms/reports/inventory-aging',
    serverIds: ['chart_inventory_aging'],
    permission: 'warehouse.read',
    size: 'lg',
    Component: AgingCapitalWidget,
  },
  {
    id: 'wms-receiving-variance',
    title: 'Receiving Variance',
    description: 'Expected vs received quantity and the resulting short/excess lines.',
    endpoint: '/api/v1/wms/reports/receiving-variance',
    serverIds: ['chart_receiving_variance'],
    permission: 'warehouse.read',
    size: 'sm',
    Component: ReceivingVarianceWidget,
  },
  {
    id: 'wms-zone-utilization',
    title: 'Zone Utilization',
    description: 'Occupied volume by zone, from the warehouse capacity tree.',
    endpoint: '/api/v1/capacity/warehouses/{id}/tree',
    serverIds: ['chart_location_utilization_tree'],
    permission: 'warehouse.read',
    size: 'lg',
    Component: ZoneUtilizationWidget,
  },
  {
    id: 'wms-live-activity',
    title: 'Live Activity',
    description: 'Most recent warehouse events (scan, pick, put-away, ASN, dispatch).',
    endpoint: '/api/v1/wms-dashboard/stats',
    serverIds: ['feed_recent_activity'],
    permission: 'warehouse.read',
    size: 'sm',
    Component: LiveActivityWidget,
  },
];
