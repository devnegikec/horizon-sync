import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';

import { fetchReceivingVariance } from '../api';
import type { DashboardWidgetProps } from '../types';
import { useApiData } from '../useApiData';
import { formatInt, toNumber } from '../utils';

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

interface VarianceSummary {
  total_expected_qty?: unknown;
  total_received_qty?: unknown;
  total_variance_qty?: unknown;
  short_line_count?: unknown;
  excess_line_count?: unknown;
}

function varianceStats(summary: VarianceSummary) {
  const variance = toNumber(summary.total_variance_qty) ?? 0;
  return {
    varianceLabel: `${variance > 0 ? '+' : ''}${formatInt(variance)}`,
    series: [
      { name: 'Expected', qty: toNumber(summary.total_expected_qty) ?? 0 },
      { name: 'Received', qty: toNumber(summary.total_received_qty) ?? 0 },
    ],
    shortLines: formatInt(summary.short_line_count),
    excessLines: formatInt(summary.excess_line_count),
  };
}

/** Shrinkage / short receipts from `wms/reports/receiving-variance` — widget #6. */
export function ReceivingVarianceWidget({ filters, refreshToken }: DashboardWidgetProps) {
  const key = `receiving-variance:${filters.warehouseId ?? 'all'}`;
  const { data, loading, error } = useApiData(
    key,
    (token) => fetchReceivingVariance(token, { warehouse_id: filters.warehouseId, page_size: 1 }),
    refreshToken,
  );

  if (loading && !data) return <Skeleton className="h-[280px] w-full rounded-lg" />;
  if (error || !data) return <p className="p-2 text-sm text-destructive">{error ?? 'No data available.'}</p>;

  const stats = varianceStats(data.summary);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Variance" value={stats.varianceLabel} />
        <Kpi label="Short lines" value={stats.shortLines} />
        <Kpi label="Excess lines" value={stats.excessLines} />
      </div>
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stats.series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
            <YAxis tickLine={false} axisLine={false} fontSize={12} width={54} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="qty" name="Qty" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
