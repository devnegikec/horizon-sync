import * as React from 'react';

import { ArrowLeft, ArrowRight, Package, TrendingDown, TrendingUp, Users, Warehouse } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { useToast } from '@horizon-sync/ui/hooks';
import { useUserStore } from '@horizon-sync/store';

import { wmsDashboardApi } from '../../utility/api/wms';
import type { WMSDashboardStats } from '../../types/wms.types';

interface DashboardPanelProps {
  warehouseId?: string;
}

function StatCard({ title, value, sub, icon: Icon }: { title: string; value: string | number; sub?: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function DashboardPanel({ warehouseId }: DashboardPanelProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [period, setPeriod] = React.useState<'week' | 'month' | 'year'>('week');
  const [anchorDate, setAnchorDate] = React.useState<Date>(new Date());
  const [stats, setStats] = React.useState<WMSDashboardStats | null>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchStats = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const result = await wmsDashboardApi.getStats(accessToken, {
        warehouse_id: warehouseId,
        period,
        date: anchorDate.toISOString(),
      });
      setStats(result);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to load stats', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [accessToken, warehouseId, period, anchorDate, toast]);

  React.useEffect(() => { fetchStats(); }, [fetchStats]);

  const prevPeriod = () => {
    const d = new Date(anchorDate);
    if (period === 'week') d.setDate(d.getDate() - 7);
    else if (period === 'month') d.setMonth(d.getMonth() - 1);
    else d.setFullYear(d.getFullYear() - 1);
    setAnchorDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(anchorDate);
    if (period === 'week') d.setDate(d.getDate() + 7);
    else if (period === 'month') d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
    setAnchorDate(d);
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map((i) => (
            <Card key={i} className="animate-pulse"><CardHeader><div className="h-3 bg-muted rounded w-2/3" /></CardHeader><CardContent><div className="h-8 bg-muted rounded w-1/2" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return <div className="text-sm text-muted-foreground">No dashboard data available.</div>;
  }

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Revenue Overview</h2>
          <p className="text-muted-foreground">Stock overview for {formatDate(stats.period_start)} - {formatDate(stats.period_end)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={prevPeriod}><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex border rounded-md overflow-hidden">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                className={`px-3 py-1 text-sm capitalize ${period === p ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
                onClick={() => setPeriod(p)}>
                {p}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={nextPeriod}><ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Inbound Stock Qty" value={stats.inbound.stock_in_qty.toLocaleString()} sub={`${stats.inbound.receiving_slips} receiving slips`} icon={TrendingUp} />
        <StatCard title="Outbound Stock Qty" value={stats.outbound.stock_out_qty.toLocaleString()} sub={`${stats.outbound.dispatches} dispatches`} icon={TrendingDown} />
        <StatCard title="Current Stock Qty" value={stats.current_stock.total_quantity.toLocaleString()} sub={`${stats.current_stock.total_records} records`} icon={Package} />
        <StatCard title="Active Workers" value={stats.workers_count} icon={Users} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2 pb-2">
          <Warehouse className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.recent_activity.length === 0 && (
            <p className="text-sm text-muted-foreground">No recent activity.</p>
          )}
          {stats.recent_activity.map((act, i) => (
            <div key={i} className="flex items-center justify-between text-sm border-b last:border-0 pb-2 last:pb-0">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize">{act.type.replace('_', ' ')}</Badge>
                <span>{act.title}</span>
              </div>
              <span className="text-muted-foreground">{act.created_at ? new Date(act.created_at).toLocaleString() : '—'}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
