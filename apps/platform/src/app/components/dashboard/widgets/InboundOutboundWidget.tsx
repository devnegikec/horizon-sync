import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';

import type { DashboardWidgetProps } from '../types';
import { useWmsStats } from '../useWmsStats';

/** Inbound vs Outbound flow from `wms-dashboard/stats` — the doc's widget #2. */
export function InboundOutboundWidget({ filters, refreshToken }: DashboardWidgetProps) {
  const { data, loading, error } = useWmsStats(filters, refreshToken);

  if (loading && !data) {
    return <Skeleton className="h-[320px] w-full rounded-lg" />;
  }

  if (error || !data) {
    return <p className="p-2 text-sm text-destructive">{error ?? 'No data available.'}</p>;
  }

  const { inbound, outbound } = data.stock_overview;
  const series = inbound.chart.map((bucket, index) => ({
    label: bucket.label,
    inboundQty: bucket.qty,
    outboundQty: outbound.chart[index]?.qty ?? 0,
    inboundValue: bucket.value,
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="dbInboundValueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis yAxisId="qty" tickLine={false} axisLine={false} fontSize={12} width={36} />
          <YAxis yAxisId="value" orientation="right" hide />
          <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area yAxisId="value"
            type="monotone"
            dataKey="inboundValue"
            name="Inbound value"
            stroke="#8b5cf6"
            fill="url(#dbInboundValueFill)" />
          <Line yAxisId="qty" type="monotone" dataKey="inboundQty" name="Inbound qty" stroke="#22c55e" strokeWidth={2} dot={false} />
          <Line yAxisId="qty" type="monotone" dataKey="outboundQty" name="Outbound qty" stroke="#ef4444" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
