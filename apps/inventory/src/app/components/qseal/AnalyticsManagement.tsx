import * as React from 'react';

import { BarChart3, RefreshCw, Smartphone, Monitor, Tablet, MapPin, TrendingUp } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

interface DashboardMetrics {
  total_scans: number;
  unique_products_scanned: number;
  authentic_rate: number;
  top_locations: { address: string; count: number }[];
  device_breakdown: { mobile: number; desktop: number; tablet: number };
  scans_by_day: { date: string; count: number }[];
  scans_by_product: { product_id: string; product_name: string; count: number }[];
}

function StatCard({ title, value, sub }: { title: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function AnalyticsManagement() {
  const [metrics, setMetrics] = React.useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchMetrics = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/analytics/dashboard', {
        headers: { Authorization: 'Bearer mock-token', 'X-Tenant-ID': 'tenant-001' },
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      setMetrics(await res.json() as DashboardMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader><div className="h-3 bg-muted rounded w-2/3" /></CardHeader>
              <CardContent><div className="h-8 bg-muted rounded w-1/2" /></CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <Card className="border-destructive">
          <CardContent className="pt-6 text-destructive">{error ?? 'No data'}</CardContent>
        </Card>
      </div>
    );
  }

  const totalDevices = metrics.device_breakdown.mobile + metrics.device_breakdown.desktop + metrics.device_breakdown.tablet;
  const maxDayCount = Math.max(...metrics.scans_by_day.map((d) => d.count), 1);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">QR scan insights — last 30 days</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMetrics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Scans" value={metrics.total_scans.toLocaleString()} sub="Last 30 days" />
        <StatCard title="Products Scanned" value={metrics.unique_products_scanned} />
        <StatCard title="Authentic Rate" value={`${(metrics.authentic_rate * 100).toFixed(1)}%`} sub="Verified authentic" />
        <StatCard title="Mobile Scans" value={`${((metrics.device_breakdown.mobile / totalDevices) * 100).toFixed(0)}%`} sub={`${metrics.device_breakdown.mobile.toLocaleString()} scans`} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Scans Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1 h-32">
              {metrics.scans_by_day.map((day) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${day.date}: ${day.count}`}>
                  <div className="w-full bg-primary/80 rounded-t hover:bg-primary transition-colors" style={{ height: `${(day.count / maxDayCount) * 100}%` }} />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{metrics.scans_by_day[0]?.date}</span>
              <span>{metrics.scans_by_day[metrics.scans_by_day.length - 1]?.date}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Device Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {([
              { label: 'Mobile', count: metrics.device_breakdown.mobile, Icon: Smartphone },
              { label: 'Desktop', count: metrics.device_breakdown.desktop, Icon: Monitor },
              { label: 'Tablet', count: metrics.device_breakdown.tablet, Icon: Tablet },
            ] as const).map(({ label, count, Icon }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span>{label}</span>
                    <span className="font-medium">{count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(count / totalDevices) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Top Locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.top_locations.map((loc, i) => (
              <div key={loc.address} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground w-4">{i + 1}.</span>
                  <span>{loc.address}</span>
                </div>
                <Badge variant="secondary">{loc.count.toLocaleString()}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Scans by Product</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.scans_by_product.map((p) => {
              const maxCount = Math.max(...metrics.scans_by_product.map((x) => x.count), 1);
              return (
                <div key={p.product_id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="truncate">{p.product_name}</span>
                    <span className="font-medium ml-2 shrink-0">{p.count.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(p.count / maxCount) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
