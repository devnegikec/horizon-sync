import type { ComponentType } from 'react';

import { Package, PackageX, TriangleAlert, Users, Warehouse } from 'lucide-react';

import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { cn } from '@horizon-sync/ui/lib';

import type { DashboardWidgetProps } from '../types';
import { useWmsStats } from '../useWmsStats';

interface KpiTile {
  label: string;
  value: number;
  icon: ComponentType<{ className?: string }>;
  tone: string;
}

function Kpi({ tile }: { tile: KpiTile }) {
  const Icon = tile.icon;
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tile.tone)}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{tile.label}</p>
        <p className="text-2xl font-bold tracking-tight">{tile.value.toLocaleString()}</p>
      </div>
    </div>
  );
}

/** KPI strip from `wms-dashboard/stats` — the doc's recommended widget #1. */
export function KpiStripWidget({ filters, refreshToken }: DashboardWidgetProps) {
  const { data, loading, error } = useWmsStats(filters, refreshToken);

  if (loading && !data) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-[76px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return <p className="p-2 text-sm text-destructive">{error ?? 'No data available.'}</p>;
  }

  const s = data.stats;
  const tiles: KpiTile[] = [
    { label: 'Total Stock Items', value: s.total_stock_items, icon: Package, tone: 'bg-gradient-to-br from-violet-500 to-fuchsia-500' },
    { label: 'Assigned Warehouses', value: s.assigned_warehouses, icon: Warehouse, tone: 'bg-gradient-to-br from-blue-500 to-blue-600' },
    { label: 'Low Stock', value: s.low_stock_count, icon: TriangleAlert, tone: 'bg-gradient-to-br from-amber-500 to-orange-500' },
    { label: 'Out of Stock', value: s.out_of_stock_count, icon: PackageX, tone: 'bg-gradient-to-br from-red-500 to-rose-600' },
    { label: 'Active Workers', value: s.active_workers, icon: Users, tone: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((tile) => (
        <Kpi key={tile.label} tile={tile} />
      ))}
    </div>
  );
}
