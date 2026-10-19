## The one endpoint to start with

`GET /api/v1/wms-dashboard/stats` — permission `warehouse.read`, filters `warehouse_id`, `period=week|month|year`, `date` (anchor), `page`, `page_size`.

It already returns **stat cards + chart-ready arrays** in one call:

| Field | Already shaped as |
|---|---|
| `stats.total_stock_items`, `assigned_warehouses`, `low_stock_count`, `out_of_stock_count`, `active_workers` | 5 KPI cards |
| `stock_overview.inbound.chart[]` / `outbound.chart[]` | `[{label, qty, value}]` → ready for a line/bar chart, no client-side bucketing |
| `stock_overview.inbound.receiving_slips`, `outbound.dispatches` | Period counters |
| `recent_activity[]` | Typed feed (`scan_session`, `pick_list`, `put_away`, `asn_order`, `receiving_slip`, `dispatch`) |

## 🧑💼 Warehouse Manager / Supervisor — operational cockpit

| Chart | Endpoint | Key fields | Best chart type |
|---|---|---|---|
| Inbound vs Outbound flow | `wms-dashboard/stats` | `stock_overview.{inbound,outbound}.chart[]`, `total_qty`, `total_value` | Dual line / grouped bar + value area |
| Receiving pipeline | `inbound/receiving-slips` | `status_counts.{pending_review, pending_putaway, putaway_in_progress, putaway_complete, rejected}` | Donut + funnel |
| Put-away backlog | `put-away` | `status_counts.{pending, in_progress, completed}`, per-list `total_items/completed_items/pending_items` | Horizontal stacked bar |
| Outbound pick pipeline | `outbound/pick-lists` | `status_counts.*` (11 states), `progress.completion_percentage`, `remaining_items`, `age_minutes`, `is_aging` | Stage bar + "aging picks" alert list |
| ASN / dock pipeline | `asn-orders` | `status_counts.{draft, confirmed, partially_delivered, delivered, closed}` | Funnel |
| Packing & dispatch | `outbound/packing-slips` | `status_counts.{draft, loading, dispatched}` | Donut |
| **Low / out-of-stock exposure** | `wms-dashboard/stats` | `stats.low_stock_count`, `out_of_stock_count` vs `total_stock_items` | Gauge / KPI with delta |
| **Space utilization** | `wms/reports/bin-capacity` | `volume_utilization_pct`, `weight_utilization_pct`, `over_utilized_bins`, `full_bins`, `bins_with_volume_capacity` | Gauge + stacked bar (volume vs weight) |
| Bin-state map | `capacity/warehouses/{id}/bin-states` | `bin_state`, `binding_pct`, `position_x/y/z` | Heatmap / scatter (real 3-D layout) |
| Zone → aisle → bin rollup | `capacity/warehouses/{id}/tree` | recursive `volume.pct`, `weight.pct`, `count_pct`, `binding_pct`, `children[]` | Treemap / sunburst / drill-down bar |
| Where capacity binds first | `capacity/warehouses/{id}/bin-states`, `capacity/bins/{bin_id}` | `binding_pct` (volume vs weight vs count) | Stacked bar |
| Put-away / pick effort per location | `location-scans/summary` | `by_location[]{location_code, scan_count, avg_elapsed_seconds, total_elapsed_seconds}` | Bar (time per location) |
| Live floor activity | `wms-3d/status` | `bins[]`, `workers[]` | Live occupancy overlay |

## 👔 Owner / Executive — money and risk

| Chart | Endpoint | Key fields | Best chart type |
|---|---|---|---|
| **Idle / dead capital** | `wms/reports/inventory-aging` | `idle_item_count`, `total_idle_qty`, `total_idle_value`, `days_idle`; rows have `days_idle`, `est_value` | Aging buckets (0-30/30-60/60-90/90+ days) bar + ₹ KPI |
| Inbound/outbound **value** trend | `wms-dashboard/stats` | `stock_overview.*.total_value` + `chart[].value` | Area chart |
| Movement mix | `wms/reports/stock-movements` | `total_in_qty/value`, `total_out_qty/value`, `total_transfer_qty`, `total_adjustment_qty` | Stacked bar |
| Shrinkage / short receipts | `wms/reports/receiving-variance` | `total_expected_qty`, `total_received_qty`, `total_variance_qty`, `short_line_count`, `excess_line_count` | Diverging bar (short vs excess) |
| Unrecovered shortages | `inbound/short-balances` | `open_count`, `resolved_count`, `written_off_count`, `open_short_qty`, `total_short_qty` | Donut + ₹ at risk |
| Footprint | `warehouses`, `warehouse-locations/{id}/summary` | `status_counts`, `type_counts`; `occupied_bins`/`total_bins`, `used_capacity`/`total_capacity` | Bar + utilization gauge |

## 🛡️ Quality / Compliance (and brand protection)

| Chart | Endpoint | Key fields | Best chart type |
|---|---|---|---|
| QR authenticity health | `qseal/analytics/summary` | `valid_scans`, `invalid_scans`, `suspicious_scans`, `suspicious_rate`, `repeat_scan_rate`, `high_risk_scans`, `unreviewed_suspicious_scans` | KPI + risk donut |
| Scan trend over time | `qseal/analytics/trends` | `[{date, total_scans, valid_scans, invalid_scans, suspicious_scans}]` | Multi-line time series |
| Top products by scan | `qseal/analytics/products` | `product_name`, `batch`, `total_scans`, `unique_serials`, `last_scan` | Ranked bar |
| Scan geography | `qseal/analytics/geography` | `country/state/city/lat/long`, `total_scans`, `valid_scans` | Map / heatmap |
| Device split | `qseal/analytics/devices`, `analytics/scans/device-timeline` | `{device_type, total_scans}`, `{date, mobile, desktop, tablet}` | Donut + stacked area |
| QR block generation | `qr-products/blocks` | `status_counts.{pending, in_progress, completed, failed}` | Donut (watch `failed`) |

## Recommended 8-widget layout (biggest visual payoff, zero backend work)

1. **KPI strip** — total stock items · low stock · out of stock · active workers *(1 call)*
2. **Inbound vs Outbound** dual-line with value area — `wms-dashboard/stats`
3. **Warehouse space gauge** — volume % + weight % + full/over-utilized bins — `wms/reports/bin-capacity`
4. **Put-away + pick backlog** stacked bars — `put-away` + `outbound/pick-lists`
5. **Aging capital** buckets with ₹ — `wms/reports/inventory-aging`
6. **Receiving variance** short vs excess — `wms/reports/receiving-variance`
7. **Zone utilization treemap** — `capacity/warehouses/{id}/tree`
8. **Live activity feed** — `recent_activity[]` from `wms-dashboard/stats`

## Caveats worth knowing

- **`ANALYTICS_MODULE_ENABLED` feature flag** gates all `/analytics/*` and `/qseal/analytics/*` routes.
- **Don't use `GET /api/v1/admin/system/stats`** — it returns hard-coded zeros (mock).
- **No aggregates exist yet** for: `worker-tasks`, `worker-sessions`, `wms-workers`, `scan-events`, `vehicle-arrivals`, `batchs`/`invoices`/`sales-orders`/`purchase-orders`, `pick-exceptions`, `quality-inspections`, `returns`. Worker *productivity per person* is only derivable from `location-scans/summary` (which supports `worker_id`). If you want a "picks per worker per hour" chart, that needs new backend work.
- Several list endpoints return per-row `progress`, `age_minutes`, `is_aging` — enough to compute client-side aging buckets if you don't want a new endpoint.

Want me to sketch the frontend widget components for the 8-widget layout, or add the missing aggregate endpoints (e.g. worker throughput) on the backend?
