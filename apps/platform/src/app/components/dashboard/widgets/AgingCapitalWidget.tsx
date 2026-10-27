import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';

import { fetchInventoryAging } from '../api';
import type { DashboardWidgetProps } from '../types';
import { useApiData } from '../useApiData';
import { formatCurrency, formatInt, toNumber } from '../utils';

const BUCKETS = [
  { label: '0-30d', min: 0, max: 30 },
  { label: '30-60d', min: 30, max: 60 },
  { label: '60-90d', min: 60, max: 90 },
  { label: '90d+', min: 90, max: Number.POSITIVE_INFINITY },
];

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

/** Idle / dead capital from `wms/reports/inventory-aging` — the doc's widget #5. */
export function AgingCapitalWidget({ filters, refreshToken }: DashboardWidgetProps) {
  const key = `aging:${filters.warehouseId ?? 'all'}`;
  const { data, loading, error } = useApiData(
    key,
    (token) => fetchInventoryAging(token, { warehouse_id: filters.warehouseId, page_size: 500 }),
    refreshToken,
  );

  if (loading && !data) return <Skeleton className="h-[300px] w-full rounded-lg" />;
  if (error || !data) return <p className="p-2 text-sm text-destructive">{error ?? 'No data available.'}</p>;

  const series = BUCKETS.map((bucket) => {
    const value = data.rows
      .filter((row) => {
        const days = toNumber(row.days_idle);
        return days != null && days >= bucket.min && days < bucket.max;
      })
      .reduce((sum, row) => sum + (toNumber(row.est_value) ?? 0), 0);
    return { label: bucket.label, value: Math.round(value) };
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Idle value" value={formatCurrency(data.summary.total_idle_value)} />
        <Kpi label="Idle items" value={formatInt(data.summary.idle_item_count)} />
        <Kpi label="Idle qty" value={formatInt(data.summary.total_idle_qty)} />
      </div>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} width={54} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="value" name="Idle value (₹)" fill="#f43f5e" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
