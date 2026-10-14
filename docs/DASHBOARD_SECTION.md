# Dashboard Section — configurable widget section

This document describes the **Operations Snapshot** dashboard section: a
settings/registry-driven area of the dashboard whose widgets share one
point-in-time filter. It complements [`DASHBOARD_DOC.md`](./DASHBOARD_DOC.md),
which lists the backend endpoints each widget can consume.

## Where it lives

| Concern | Location |
|---|---|
| Section renderer | `apps/platform/src/app/components/dashboard/DashboardSection.tsx` |
| Widget registry (edit this to add widgets) | `apps/platform/src/app/components/dashboard/registry.ts` |
| Shared filter context | `apps/platform/src/app/components/dashboard/DashboardFiltersContext.tsx` |
| API helper | `apps/platform/src/app/components/dashboard/api.ts` |
| Shared data hook | `apps/platform/src/app/components/dashboard/useWmsStats.ts` |
| Example widgets | `apps/platform/src/app/components/dashboard/widgets/` |

The section is mounted from `dashboard-home.tsx` (both the default and the WMS
dashboard variants). It renders `null` when the user can see no widgets.

## How it works

1. `DashboardSection` owns the **point-in-time filter**: `period`
   (`week | month | year`) and an `anchorDate`, plus a `refreshToken`.
2. It reads the static **registry** (`dashboardWidgets`) and keeps only the
   widgets whose optional `permission` the current user holds.
3. Each widget is rendered inside its own `Card` + `WidgetErrorBoundary`, at a
   size defined by the registry (`sm | md | lg | full`).
4. Every widget receives `{ filters, refreshToken, size }` as props, and can
   also read the filters anywhere below it via `useDashboardFilters()`.

## Adding a widget

1. Create `widgets/MyWidget.tsx` that accepts `DashboardWidgetProps`:

   ```tsx
   import type { DashboardWidgetProps } from '../types';
   import { useWmsStats } from '../useWmsStats';

   export function MyWidget({ filters, refreshToken }: DashboardWidgetProps) {
     const { data, loading, error } = useWmsStats(filters, refreshToken);
     // ...render...
   }
   ```

2. Append an entry to `dashboardWidgets` in `registry.ts`:

   ```ts
   {
     id: 'wms-space-utilization',
     title: 'Space Utilization',
     description: 'Volume % vs weight % across bins.',
     endpoint: '/api/v1/wms/reports/bin-capacity',
     permission: 'warehouse.read',
     size: 'lg',            // sm | md | lg | full
     Component: SpaceUtilizationWidget,
   }
   ```

That's it — the section picks it up. No changes to `DashboardSection` are needed.

## Widget contract

```ts
interface DashboardWidgetProps {
  filters: DashboardFilters;   // { period, anchorDate, warehouseId? }
  refreshToken: number;        // bump to re-fetch
  size: WidgetSize;            // 'sm' | 'md' | 'lg' | 'full'
}
```

Widgets should be **self-fetching** (own their data hook) so a slow or failing
widget never blocks the others. Use the shared helpers in `api.ts` /
`useWmsStats.ts`, or add a sibling hook following the same shape.

## Charts

Graphical widgets use [`recharts`](https://recharts.org) (added to the root
`package.json`). Wrap charts in a fixed-height container with a
`ResponsiveContainer`, e.g.:

```tsx
<div className="h-[320px] w-full">
  <ResponsiveContainer width="100%" height="100%">
    {/* Line / Area / Composed / Bar / Pie ... */}
  </ResponsiveContainer>
</div>
```

## Notes & follow-ups

- The example widgets call `GET /api/v1/wms-dashboard/stats` (permission
  `warehouse.read`). Extend to the other endpoints in `DASHBOARD_DOC.md`
  (aging, receiving variance, capacity tree, QSeal analytics) by adding
  widgets — the section itself is endpoint-agnostic.
- `ANALYTICS_MODULE_ENABLED` gates `/analytics/*` and `/qseal/analytics/*`
  routes, so QSeal widgets will return 404 when the flag is off.
- Widgets are currently filtered by permission only. To make the layout
  user-editable (show/hide, reorder), persist a widget-id list to the store and
  filter/sort `dashboardWidgets` in `DashboardSection`.
