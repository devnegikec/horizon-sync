import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { cn } from '@horizon-sync/ui/lib';

import type { DashboardWidgetProps } from '../types';
import { useWmsStats } from '../useWmsStats';
import { relativeTime } from '../utils';

const DOT: Record<string, string> = {
  scan_session: 'bg-violet-500',
  pick_list: 'bg-blue-500',
  put_away: 'bg-emerald-500',
  asn_order: 'bg-amber-500',
  receiving_slip: 'bg-cyan-500',
  dispatch: 'bg-fuchsia-500',
};

/** Live activity feed from `wms-dashboard/stats.recent_activity` — widget #8. */
export function LiveActivityWidget({ filters, refreshToken }: DashboardWidgetProps) {
  const { data, loading, error } = useWmsStats(filters, refreshToken);

  if (loading && !data) return <Skeleton className="h-[280px] w-full rounded-lg" />;
  if (error || !data) return <p className="p-2 text-sm text-destructive">{error ?? 'No data available.'}</p>;

  const activity = data.recent_activity.slice(0, 8);
  if (activity.length === 0) return <p className="p-2 text-sm text-muted-foreground">No recent activity.</p>;

  return (
    <ul className="space-y-3">
      {activity.map((item) => (
        <li key={`${item.type}-${item.title}-${item.created_at ?? ''}`} className="flex items-start gap-3">
          <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', DOT[item.type] ?? 'bg-muted-foreground')} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.title}</p>
            <p className="text-xs text-muted-foreground">
              {item.worker_name ? `${item.worker_name} · ${item.status}` : item.status}
            </p>
          </div>
          <span className="whitespace-nowrap text-xs text-muted-foreground">{relativeTime(item.created_at)}</span>
        </li>
      ))}
    </ul>
  );
}
