import { Bar, BarChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';

import { fetchPickListBacklog, fetchPutAwayBacklog } from '../api';
import type { DashboardWidgetProps } from '../types';
import { useApiData } from '../useApiData';
import { toNumber } from '../utils';

const n = (value: unknown): number => toNumber(value) ?? 0;

interface PutAwayCounts {
  pending?: number;
  in_progress?: number;
  completed?: number;
}

interface PickCounts {
  draft?: number;
  confirmed?: number;
  pending_picking?: number;
  in_progress?: number;
  pick_complete?: number;
  completed?: number;
  ready_for_dispatch?: number;
  in_transit?: number;
  delivered?: number;
}

function putAwayRow(pa: PutAwayCounts | undefined) {
  return { name: 'Put-away', pending: n(pa?.pending), in_progress: n(pa?.in_progress), completed: n(pa?.completed) };
}

function pickingRow(pl: PickCounts | undefined) {
  return {
    name: 'Picking',
    pending: n(pl?.draft) + n(pl?.confirmed),
    in_progress: n(pl?.pending_picking) + n(pl?.in_progress) + n(pl?.pick_complete),
    completed: n(pl?.completed) + n(pl?.ready_for_dispatch) + n(pl?.in_transit) + n(pl?.delivered),
  };
}

/** Put-away + pick backlog from `put-away` & `pick-lists` — the doc's widget #4. */
export function BacklogWidget({ filters, refreshToken }: DashboardWidgetProps) {
  const key = `backlog:${filters.warehouseId ?? 'all'}`;
  const { data, loading, error } = useApiData(
    key,
    async (token) => {
      const [putAway, picks] = await Promise.all([
        fetchPutAwayBacklog(token, { warehouse_id: filters.warehouseId }),
        fetchPickListBacklog(token, { warehouse_id: filters.warehouseId }),
      ]);
      return { putAway, picks };
    },
    refreshToken,
  );

  if (loading && !data) return <Skeleton className="h-[240px] w-full rounded-lg" />;
  if (error || !data) return <p className="p-2 text-sm text-destructive">{error ?? 'No data available.'}</p>;

  const rows = [putAwayRow(data.putAway.status_counts), pickingRow(data.picks.status_counts)];

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
          <XAxis type="number" allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="name" width={72} fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="pending" stackId="a" name="Pending" fill="#f59e0b" barSize={28} />
          <Bar dataKey="in_progress" stackId="a" name="In progress" fill="#3b82f6" barSize={28} />
          <Bar dataKey="completed" stackId="a" name="Completed" fill="#22c55e" radius={[0, 6, 6, 0]} barSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
