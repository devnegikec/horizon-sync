import * as React from 'react';

import { ChevronLeft, ChevronRight, LayoutDashboard, RefreshCw } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { cn } from '@horizon-sync/ui/lib';

import { usePermissions } from '../../hooks/usePermissions';

import { DashboardFiltersContext } from './DashboardFiltersContext';
import { dashboardWidgets } from './registry';
import type { DashboardFilters, DashboardPeriod, DashboardWidgetDef, WidgetSize } from './types';
import { useDashboardLayout, type DashboardLayoutLookup } from './useDashboardLayout';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';

const PERIODS: DashboardPeriod[] = ['week', 'month', 'year'];

/** Grid spans per widget size (grid is 2 columns at sm, 12 at lg). */
const SIZE_SPAN: Record<WidgetSize, string> = {
  sm: 'sm:col-span-1 lg:col-span-4',
  md: 'sm:col-span-2 lg:col-span-6',
  lg: 'sm:col-span-2 lg:col-span-8',
  full: 'sm:col-span-2 lg:col-span-12',
};

/** Shift a date by whole months, clamping the day so it never overflows. */
function addMonths(date: Date, months: number): void {
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
}

/** Earliest order the widget's server ids were given in the saved layout. */
function widgetOrder(widget: DashboardWidgetDef, layout: DashboardLayoutLookup): number {
  const orders = widget.serverIds
    .map((id) => layout.orders.get(id))
    .filter((order): order is number => order !== undefined);
  return orders.length > 0 ? Math.min(...orders) : Number.MAX_SAFE_INTEGER;
}

/**
 * Configurable dashboard section.
 *
 * Renders every widget in `dashboardWidgets` that the current user is allowed
 * to see, all sharing one point-in-time filter (period + anchor date). New
 * widgets are added by editing the registry — this component does not change.
 */
export function DashboardSection({ warehouseId }: { warehouseId?: string }) {
  const { hasPermission, loading: permsLoading } = usePermissions();
  const [period, setPeriod] = React.useState<DashboardPeriod>('week');
  const [anchorDate, setAnchorDate] = React.useState<Date>(() => new Date());
  const [refreshToken, setRefreshToken] = React.useState(0);

  const shift = (direction: 1 | -1): void => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (period === 'week') next.setDate(next.getDate() + direction * 7);
      else if (period === 'month') addMonths(next, direction);
      else next.setFullYear(next.getFullYear() + direction);
      return next;
    });
  };

  const filters = React.useMemo<DashboardFilters>(
    () => ({ period, anchorDate, warehouseId }),
    [period, anchorDate, warehouseId],
  );

  // A widget that threw is allowed to retry whenever the section refreshes or
  // its scope changes; otherwise the boundary would hide it forever.
  const widgetResetKey = `${refreshToken}|${period}|${anchorDate.getTime()}|${warehouseId ?? 'all'}`;

  // Apply the organization's saved Settings → Dashboard Layout overrides.
  const organizationId = useUserStore((s) => s.user?.organization_id);
  const layout = useDashboardLayout(organizationId);

  const widgets = React.useMemo(() => {
    const permitted = dashboardWidgets.filter((widget) => !widget.permission || hasPermission(widget.permission));
    if (!layout) return permitted;
    return permitted
      .filter((widget) => widget.serverIds.some((id) => layout.enabledIds.has(id)))
      .sort((a, b) => widgetOrder(a, layout) - widgetOrder(b, layout));
  }, [hasPermission, layout]);

  // Avoid a flash of an empty section while permissions are still loading,
  // and hide the section entirely when the user can see no widgets.
  if (permsLoading || widgets.length === 0) return null;

  return (
    <DashboardFiltersContext.Provider value={filters}>
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Operations Snapshot</h2>
              <p className="text-sm text-muted-foreground">
                {widgets.length} widget{widgets.length === 1 ? '' : 's'} · point in time {anchorDate.toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous period" onClick={() => shift(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex overflow-hidden rounded-md border">
              {PERIODS.map((p) => (
                <button key={p}
                  type="button"
                  className={cn('px-3 py-1.5 text-sm capitalize', period === p ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted')}
                  onClick={() => setPeriod(p)}>
                  {p}
                </button>
              ))}
            </div>
            <Button variant="outline" size="icon" aria-label="Next period" onClick={() => shift(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" aria-label="Refresh widgets" onClick={() => setRefreshToken((token) => token + 1)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-12">
          {widgets.map((widget) => (
            <div key={widget.id} className={SIZE_SPAN[widget.size]}>
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{widget.title}</CardTitle>
                  {widget.description && <CardDescription>{widget.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <WidgetErrorBoundary title={widget.title} resetKey={widgetResetKey}>
                    <widget.Component filters={filters} refreshToken={refreshToken} size={widget.size} />
                  </WidgetErrorBoundary>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>
    </DashboardFiltersContext.Provider>
  );
}
