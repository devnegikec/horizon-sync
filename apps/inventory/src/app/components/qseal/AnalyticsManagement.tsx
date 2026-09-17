import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';
import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, Download, Lightbulb, LockKeyhole, MapPin, Package, Repeat2, ShieldAlert, TrendingUp } from 'lucide-react';

import { Badge, Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';

import { useAnalyticsManagement } from '../../hooks/useAnalyticsManagement';
import type {
  QSealAnalyticsHistoryItem,
  QSealAnalyticsSummary,
  QSealDeviceAnalyticsItem,
  QSealGeographyAnalyticsItem,
  QSealProductAnalyticsItem,
  QSealScanTrendItem,
  QSealSuspiciousReviewStatus,
} from '../../types/qseal.types';
import type { AnalyticsFilters as AnalyticsFiltersType } from '../../types/qseal.types';
import { formatDate } from '../../utility/formatDate';
import { hasPermission } from '../../utils/permissions';

import { AnalyticsFilters } from './AnalyticsFilters';
import { AnalyticsHeader } from './AnalyticsHeader';
import { AnalyticsMap } from './AnalyticsMap';
import { AnalyticsStats } from './AnalyticsStats';

function EmptyPanel({ message }: { message: string }) {
  return <div className="flex min-h-32 items-center justify-center text-sm text-muted-foreground">{message}</div>;
}

function TrendChart({ items }: { items: QSealScanTrendItem[] }) {
  if (!items.length) return <EmptyPanel message="No scan trend data for this period" />;
  const max = Math.max(...items.map((item) => item.total_scans), 1);
  const chartHeight = 160;
  const chartWidth = 640;
  const chartPadding = 10;
  const xFor = (index: number) => chartPadding + (index * (chartWidth - chartPadding * 2)) / Math.max(items.length - 1, 1);
  const yFor = (value: number) => chartHeight - chartPadding - (value / max) * (chartHeight - chartPadding * 2);
  const linePoints = (valueFor: (item: QSealScanTrendItem) => number) => items.map((item, index) => `${xFor(index)},${yFor(valueFor(item))}`).join(' ');
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border-b border-l">
        <svg aria-label="QSeal scan trends over time" role="img" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="block h-44 w-full">
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line key={ratio} x1={chartPadding} x2={chartWidth - chartPadding} y1={yFor(max * ratio)} y2={yFor(max * ratio)} stroke="hsl(var(--border))" strokeDasharray="3 4" />
          ))}
          <polyline points={linePoints((item) => item.total_scans)} fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={linePoints((item) => item.valid_scans)} fill="none" stroke="hsl(160 70% 42%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={linePoints((item) => item.invalid_scans)} fill="none" stroke="hsl(0 84% 60%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={linePoints((item) => item.suspicious_scans)} fill="none" stroke="hsl(30 90% 50%)" strokeWidth="2.5" strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />
          {items.map((item, index) => (
            <g key={item.date}>
              <title>{`${item.date}: ${item.total_scans} scans (${item.valid_scans} valid, ${item.invalid_scans} invalid, ${item.suspicious_scans} suspicious)`}</title>
              <circle cx={xFor(index)} cy={yFor(item.total_scans)} r="2.5" fill="hsl(var(--primary))" />
              <circle cx={xFor(index)} cy={yFor(item.valid_scans)} r="2" fill="hsl(160 70% 42%)" />
              {item.invalid_scans > 0 && <circle cx={xFor(index)} cy={yFor(item.invalid_scans)} r="2" fill="hsl(0 84% 60%)" />}
            </g>
          ))}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{items[0].date}</span>
        <span>{items[items.length - 1].date}</span>
      </div>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-primary" /> Total scans</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-emerald-500" /> Valid</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-red-400" /> Invalid</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-orange-500" /> Suspicious</span>
      </div>
    </div>
  );
}

function StatusBreakdown({ summary }: { summary: { valid_scans: number; invalid_scans: number } }) {
  const total = summary.valid_scans + summary.invalid_scans;
  if (!total) return <EmptyPanel message="No scan status data for this period" />;
  const validWidth = (summary.valid_scans / total) * 100;
  return (
    <div className="space-y-5 py-2">
      <div className="flex h-4 overflow-hidden rounded-full bg-muted">
        <div className="bg-emerald-500" style={{ width: `${validWidth}%` }} />
        <div className="bg-red-400" style={{ width: `${100 - validWidth}%` }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Valid scans</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">{summary.valid_scans.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Invalid scans</p>
          <p className="mt-1 text-2xl font-semibold text-red-500">{summary.invalid_scans.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function DeviceBreakdown({ devices }: { devices: QSealDeviceAnalyticsItem[] }) {
  if (!devices.length) return <EmptyPanel message="No device data for this period" />;
  const max = Math.max(...devices.map((device) => device.total_scans), 1);
  return (
    <div className="space-y-4">
      {devices.map((device) => (
        <div key={device.device_type}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="capitalize">{device.device_type}</span>
            <span className="font-medium">{device.total_scans.toLocaleString()}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-violet-500" style={{ width: `${(device.total_scans / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightsCard({ summary, products, geography, trends, history, onOpenEvents }: { summary: QSealAnalyticsSummary | null; products: QSealProductAnalyticsItem[]; geography: QSealGeographyAnalyticsItem[]; trends: QSealScanTrendItem[]; history: QSealAnalyticsHistoryItem[]; onOpenEvents: (nextFilters: Partial<AnalyticsFiltersType>) => void }) {
  if (!summary) return null;
  const invalidRate = summary.total_scans ? (summary.invalid_scans / summary.total_scans) * 100 : 0;
  const topProduct = products[0];
  const invalidMessage = invalidRate >= 5 ? `${invalidRate.toFixed(1)}% of scans are invalid. Review the affected serials.` : 'Invalid scans are currently within a low-risk range.';
  const previousTrend = trends.length > 1 ? trends.slice(0, -1) : [];
  const latestTrend = trends[trends.length - 1];
  const averagePreviousScans = previousTrend.length ? previousTrend.reduce((total, item) => total + item.total_scans, 0) / previousTrend.length : 0;
  const scanSpike = Boolean(latestTrend && averagePreviousScans > 0 && latestTrend.total_scans >= Math.max(5, averagePreviousScans * 2));
  const reasonCounts = new Map<string, number>();
  history.filter((item) => item.is_suspicious).forEach((item) => item.suspicious_reasons.forEach((reason) => reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1)));
  const topReason = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const alerts = [
    summary.high_risk_scans > 0 ? { tone: 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20', icon: ShieldAlert, title: 'High-risk scans detected', message: `${summary.high_risk_scans.toLocaleString()} scan${summary.high_risk_scans === 1 ? '' : 's'} scored high risk.`, action: 'View high-risk events', filters: { risk_filter: 'high_risk' as const } } : null,
    summary.unreviewed_suspicious_scans > 0 ? { tone: 'border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/20', icon: AlertTriangle, title: 'Review queue requires attention', message: `${summary.unreviewed_suspicious_scans.toLocaleString()} suspicious scan${summary.unreviewed_suspicious_scans === 1 ? '' : 's'} are still unreviewed.`, action: 'Open review queue', filters: { risk_filter: 'unreviewed' as const } } : null,
    scanSpike ? { tone: 'border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20', icon: TrendingUp, title: 'Scan volume spike', message: `${latestTrend.total_scans.toLocaleString()} scans were recorded on ${latestTrend.date}, at least twice the earlier daily average.`, action: null, filters: {} } : null,
  ].filter(Boolean) as { tone: string; icon: typeof AlertTriangle; title: string; message: string; action: string | null; filters: Partial<AnalyticsFiltersType> }[];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2"><Lightbulb className="h-4 w-4 text-amber-500" /><CardTitle className="text-sm font-medium">Alerts & insights</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {alerts.length ? <div className="grid gap-3 md:grid-cols-3">{alerts.map((alert) => { const Icon = alert.icon; return <div key={alert.title} className={`rounded-lg border p-4 ${alert.tone}`}><div className="mb-2 flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4" />{alert.title}</div><p className="text-sm text-muted-foreground">{alert.message}</p>{alert.action && <Button variant="link" className="mt-2 h-auto gap-1 p-0 text-sm" onClick={() => onOpenEvents(alert.filters)}>{alert.action}<ArrowRight className="h-3.5 w-3.5" /></Button>}</div>; })}</div> : <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">No active QSeal alerts in the selected period.</div>}
        <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-muted/40 p-4"><div className="mb-2 flex items-center gap-2 text-sm font-medium"><AlertTriangle className="h-4 w-4 text-red-500" /> Scan quality</div><p className="text-sm text-muted-foreground">{invalidMessage}</p></div>
        <div className="rounded-lg bg-muted/40 p-4"><div className="mb-2 flex items-center gap-2 text-sm font-medium"><Repeat2 className="h-4 w-4 text-amber-500" /> Repeat activity</div><p className="text-sm text-muted-foreground">{summary.repeat_scans.toLocaleString()} repeat scans across {summary.unique_serials.toLocaleString()} valid serials.</p></div>
        <div className="rounded-lg bg-muted/40 p-4"><div className="mb-2 flex items-center gap-2 text-sm font-medium"><Package className="h-4 w-4 text-blue-500" /> Leading product</div><p className="text-sm text-muted-foreground">{topProduct ? `${topProduct.product_name} has ${topProduct.total_scans.toLocaleString()} scans.` : 'No product scan data yet.'} {geography.length ? `${geography.length} locations captured.` : ''}</p>{topProduct?.product_id && <Button variant="link" className="mt-2 h-auto gap-1 p-0 text-sm" onClick={() => onOpenEvents({ product_id: topProduct.product_id || undefined, batch: topProduct.batch || undefined, risk_filter: undefined })}>View product events<ArrowRight className="h-3.5 w-3.5" /></Button>}</div>
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/20"><div className="mb-2 flex items-center gap-2 text-sm font-medium"><ShieldAlert className="h-4 w-4 text-red-500" /> Suspicious activity</div><p className="text-sm text-muted-foreground">{summary.suspicious_scans.toLocaleString()} flagged scans ({summary.suspicious_rate.toFixed(1)}%). {topReason ? `Most common: ${SUSPICIOUS_REASON_LABELS[topReason[0]] || topReason[0]} (${topReason[1]} recent events).` : 'Review high-risk events first.'}</p>{summary.suspicious_scans > 0 && <Button variant="link" className="mt-2 h-auto gap-1 p-0 text-sm text-red-700 dark:text-red-300" onClick={() => onOpenEvents({ risk_filter: 'suspicious' })}>View suspicious events<ArrowRight className="h-3.5 w-3.5" /></Button>}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProductTable({ items }: { items: QSealProductAnalyticsItem[] }) {
  if (!items.length) return <EmptyPanel message="No product scan data for this period" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b text-left text-muted-foreground">
          <tr><th className="px-4 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">Batch</th><th className="px-4 py-3 font-medium">Total scans</th><th className="px-4 py-3 font-medium">Valid</th><th className="px-4 py-3 font-medium">Unique serials</th><th className="px-4 py-3 font-medium">Last scan</th></tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item, index) => (
            <tr key={`${item.product_id || 'unknown'}-${item.batch || index}`} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{item.product_name || 'Unknown product'}</td>
              <td className="px-4 py-3 text-muted-foreground">{item.batch || '—'}</td>
              <td className="px-4 py-3">{item.total_scans.toLocaleString()}</td>
              <td className="px-4 py-3 text-emerald-600">{item.valid_scans.toLocaleString()}</td>
              <td className="px-4 py-3">{item.unique_serials.toLocaleString()}</td>
              <td className="px-4 py-3 text-muted-foreground">{item.last_scan ? formatDate(item.last_scan, 'DD-MMM-YY', { includeTime: true }) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GeographyTable({ items }: { items: QSealGeographyAnalyticsItem[] }) {
  if (!items.length) return <EmptyPanel message="No location data captured yet" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b text-left text-muted-foreground">
          <tr><th className="px-4 py-3 font-medium">Location</th><th className="px-4 py-3 font-medium">Total scans</th><th className="px-4 py-3 font-medium">Valid</th><th className="px-4 py-3 font-medium">Invalid</th></tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item, index) => (
            <tr key={`${item.country}-${item.state}-${item.city}-${index}`} className="hover:bg-muted/30">
              <td className="px-4 py-3">{[item.city, item.state, item.country].filter(Boolean).join(', ') || 'Unknown location'}</td>
              <td className="px-4 py-3">{item.total_scans.toLocaleString()}</td>
              <td className="px-4 py-3 text-emerald-600">{item.valid_scans.toLocaleString()}</td>
              <td className="px-4 py-3 text-red-500">{item.invalid_scans.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const SUSPICIOUS_REASON_LABELS: Record<string, string> = {
  invalid_qr: 'Invalid QR',
  bot_scan: 'Bot scan',
  rapid_repeat: 'Rapid repeat',
  device_change: 'Device changed',
  location_change: 'Location changed',
  high_volume_source: 'High-volume source',
};

function HistoryTable({ items, productNames, onReview, reviewingEventId, canReview }: { items: QSealAnalyticsHistoryItem[]; productNames: Map<string, string>; onReview: (eventId: string, status: QSealSuspiciousReviewStatus) => Promise<void>; reviewingEventId: string | null; canReview: boolean }) {
  if (!items.length) return <EmptyPanel message="No scan events for this period" />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b text-left text-muted-foreground">
          <tr><th className="px-4 py-3 font-medium">Time</th><th className="px-4 py-3 font-medium">Serial</th><th className="px-4 py-3 font-medium">Product</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Risk</th><th className="px-4 py-3 font-medium">Location</th><th className="px-4 py-3 font-medium">Action</th></tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => {
            const status = item.verification_status || 'unknown';
            return (
              <tr key={item.id} className="hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(item.scan_timestamp, 'DD-MMM-YY', { includeTime: true })}</td>
                <td className="px-4 py-3"><code className="rounded bg-muted px-2 py-1 text-xs">{item.serial_number || '—'}</code></td>
                <td className="px-4 py-3">{item.product_id ? productNames.get(item.product_id) || 'Product' : '—'}</td>
                <td className="px-4 py-3"><Badge className={status === 'valid' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>{status}</Badge></td>
                <td className="px-4 py-3">{item.is_suspicious ? <div title={item.suspicious_reasons.map((reason) => SUSPICIOUS_REASON_LABELS[reason] || reason).join(', ')}><Badge className={item.risk_score >= 60 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}>{item.risk_score >= 60 ? 'High risk' : 'Suspicious'} · {item.risk_score}</Badge><p className="mt-1 max-w-48 text-xs text-muted-foreground">{item.suspicious_reasons.map((reason) => SUSPICIOUS_REASON_LABELS[reason] || reason).join(', ')}</p>{item.review_status !== 'new' && <Badge className="mt-1 bg-slate-100 text-slate-700">{item.review_status.replace('_', ' ')}</Badge>}</div> : <span className="text-muted-foreground">Normal</span>}</td>
                <td className="px-4 py-3">{[item.city, item.state, item.country].filter(Boolean).join(', ') || 'Unknown'}</td>
                <td className="px-4 py-3">{item.is_suspicious && item.review_status === 'new' && canReview ? <div className="flex gap-2"><Button size="sm" variant="outline" disabled={reviewingEventId === item.id} onClick={() => onReview(item.id, 'reviewed')}>Review</Button><Button size="sm" variant="ghost" disabled={reviewingEventId === item.id} onClick={() => onReview(item.id, 'dismissed')}>Dismiss</Button></div> : <span className="text-muted-foreground">—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AnalyticsManagement() {
  const {
    filters, setFilters, summary, trends, products, geography, devices, history, reviewSuspicious, reviewingEventId, productOptions, blockOptions, historyPagination, historyLoading, historyPage, setHistoryPage, exportHistory, loading, error, analyticsEnabled, featureFlagLoading, refetch,
  } = useAnalyticsManagement();
  const [activeTab, setActiveTab] = React.useState('summary');
  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);
  const user = useUserStore((state) => state.user);
  const userPermissions = useUserStore((state) => state.permissions?.permissions || []);
  const canReview = user?.user_type === 'system_admin'
    || user?.user_type === 'organization_admin'
    || hasPermission(userPermissions, 'qr_product.update');
  const openFilteredEvents = React.useCallback((nextFilters: Partial<AnalyticsFiltersType>) => {
    setFilters((current) => ({ ...current, ...nextFilters }));
    setActiveTab('summary');
  }, [setFilters]);

  const productNames = React.useMemo(() => new Map(productOptions.map((product) => [product.id, product.name])), [productOptions]);
  const mapPoints = React.useMemo(
    () => geography.filter((item) => item.latitude != null && item.longitude != null).map((item) => ({
      city: item.city, state: item.state, country: item.country, latitude: item.latitude as number, longitude: item.longitude as number, count: item.total_scans,
    })),
    [geography],
  );

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const events = await exportHistory();
      if (!events.length) return;
      const columns = ['Time', 'Serial', 'Product ID', 'Batch', 'Status', 'Device', 'City', 'State', 'Country'];
      const escapeCsv = (value: unknown) => `"${String(value ?? '').split('"').join('""')}"`;
      const rows = events.map((event) => [
        event.scan_timestamp, event.serial_number, event.product_id, event.batch, event.verification_status,
        event.device_type, event.city, event.state, event.country,
      ].map(escapeCsv).join(','));
      const blob = new Blob([[columns.map(escapeCsv).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `qseal-scan-events-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Unable to export scan events. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (featureFlagLoading || analyticsEnabled === null) {
    return (
      <div className="space-y-6">
        <AnalyticsHeader onRefresh={refetch} isLoading />
        <Card><CardContent className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">Checking analytics access…</CardContent></Card>
      </div>
    );
  }

  if (!analyticsEnabled) {
    return (
      <div className="space-y-6">
        <AnalyticsHeader onRefresh={refetch} />
        <Card><CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center"><LockKeyhole className="h-10 w-10 text-muted-foreground" /><h2 className="text-lg font-semibold">Analytics is not enabled</h2><p className="max-w-md text-sm text-muted-foreground">QSeal analytics is not enabled for this organization. Contact your administrator to enable the analytics module.</p>{error && <p className="text-xs text-destructive">{error}</p>}</CardContent></Card>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="space-y-6">
        <AnalyticsHeader onRefresh={refetch} />
        <Card className="border-destructive"><CardContent className="flex items-center justify-between gap-4 p-6 text-destructive"><span>{error}</span><Button variant="outline" onClick={refetch}>Retry</Button></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AnalyticsHeader onRefresh={refetch} isLoading={loading} />
      <AnalyticsFilters filters={filters} setFilters={setFilters} productOptions={productOptions} blockOptions={blockOptions} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6 space-y-6">
          <AnalyticsStats summary={summary} />
          {loading && !summary ? <EmptyPanel message="Loading QSeal analytics…" /> : (
            <>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card><CardHeader className="flex flex-row items-center gap-2 pb-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-sm font-medium">Scan trends</CardTitle></CardHeader><CardContent><TrendChart items={trends} /></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center gap-2 pb-2"><CheckCircle2 className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-sm font-medium">Scan status</CardTitle></CardHeader><CardContent>{summary ? <StatusBreakdown summary={summary} /> : <EmptyPanel message="Loading…" />}</CardContent></Card>
              </div>
              <Card><CardHeader className="flex flex-row items-center justify-between gap-2 pb-2"><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-sm font-medium">Recent QSeal scan events</CardTitle></div><Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={exporting || historyLoading || !historyPagination?.total_items}><Download className="h-4 w-4" />{exporting ? 'Exporting…' : 'Export CSV'}</Button></CardHeader>{exportError && <p className="px-6 text-sm text-destructive">{exportError}</p>}<CardContent className="p-0"><HistoryTable items={history} productNames={productNames} onReview={reviewSuspicious} reviewingEventId={reviewingEventId} canReview={canReview} /></CardContent><CardContent className="flex items-center justify-between gap-4 border-t py-3"><span className="text-xs text-muted-foreground">{historyPagination ? `Showing page ${historyPagination.page} of ${historyPagination.total_pages}` : 'No history loaded'}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={historyPage <= 1 || historyLoading} onClick={() => setHistoryPage(historyPage - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={!historyPagination?.has_next || historyLoading} onClick={() => setHistoryPage(historyPage + 1)}>Next</Button></div></CardContent></Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="details" className="mt-6 space-y-6">
          <InsightsCard summary={summary} products={products} geography={geography} trends={trends} history={history} onOpenEvents={openFilteredEvents} />
          <Card><CardHeader className="flex flex-row items-center gap-2 pb-2"><Repeat2 className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-sm font-medium">Repeat scans</CardTitle></CardHeader><CardContent className="flex min-h-32 items-center"><div><p className="text-3xl font-semibold">{summary?.repeat_scans.toLocaleString() ?? '—'}</p><p className="mt-1 text-sm text-muted-foreground">Repeat scans in the selected period</p></div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center gap-2 pb-2"><Package className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-sm font-medium">Product-level analytics</CardTitle></CardHeader><CardContent className="p-0"><ProductTable items={products} /></CardContent></Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader className="flex flex-row items-center gap-2 pb-2"><MapPin className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-sm font-medium">Geographic distribution</CardTitle></CardHeader><CardContent className="p-0"><GeographyTable items={geography} /></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center gap-2 pb-2"><BarChart3 className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-sm font-medium">Device totals</CardTitle></CardHeader><CardContent><DeviceBreakdown devices={devices} /></CardContent></Card>
          </div>
          <AnalyticsMap points={mapPoints} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
