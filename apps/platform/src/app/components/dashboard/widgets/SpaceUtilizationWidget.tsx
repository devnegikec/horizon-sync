import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';

import { fetchBinCapacity } from '../api';
import type { DashboardWidgetProps } from '../types';
import { useApiData } from '../useApiData';
import { formatInt, toNumber } from '../utils';

function Gauge({ label, pct }: { label: string; pct: unknown }) {
  const value = Math.max(0, Math.min(100, toNumber(pct) ?? 0));
  const data = [
    { name: 'used', value },
    { name: 'free', value: 100 - value },
  ];
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[140px] w-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={48} outerRadius={64} startAngle={90} endAngle={-270} stroke="none">
              <Cell fill="#8b5cf6" />
              <Cell fill="hsl(var(--muted))" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{pct == null ? '—' : `${value.toFixed(1)}%`}</span>
        </div>
      </div>
      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

/** Space utilization from `wms/reports/bin-capacity` — the doc's widget #3. */
export function SpaceUtilizationWidget({ filters, refreshToken }: DashboardWidgetProps) {
  const key = `bin-capacity:${filters.warehouseId ?? 'all'}`;
  const { data, loading, error } = useApiData(
    key,
    (token) => fetchBinCapacity(token, { warehouse_id: filters.warehouseId, page_size: 1 }),
    refreshToken,
  );

  if (loading && !data) return <Skeleton className="h-[320px] w-full rounded-lg" />;
  if (error || !data) return <p className="p-2 text-sm text-destructive">{error ?? 'No data available.'}</p>;

  const s = data.summary;
  const bins = [
    { name: 'With capacity', count: toNumber(s.bins_with_volume_capacity) ?? 0 },
    { name: 'Full', count: toNumber(s.full_bins) ?? 0 },
    { name: 'Over-utilized', count: toNumber(s.over_utilized_bins) ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Gauge label="Volume utilization" pct={s.volume_utilization_pct} />
        <Gauge label="Weight utilization" pct={s.weight_utilization_pct} />
      </div>
      <div className="h-[170px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bins} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 8 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={96} tickLine={false} axisLine={false} fontSize={12} />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="count" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        {formatInt(s.total_bins)} bins tracked · {formatInt(s.full_bins)} full · {formatInt(s.over_utilized_bins)} over-utilized
      </p>
    </div>
  );
}
