import * as React from 'react';

import type { ColumnDef } from '@tanstack/react-table';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  HelpCircle,
  History,
  Lightbulb,
  LockKeyhole,
  MapPin,
  Package,
  Repeat2,
  ShieldAlert,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@horizon-sync/ui/components/ui/tooltip';

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

function locationSourceLabel(source: string | null | undefined): string | null {
  if (!source) return null;
  const normalized = source.trim().toLowerCase();
  if (normalized === 'browser' || normalized === 'gps') return 'GPS';
  if (normalized === 'ip' || normalized === 'ip_address') return 'IP estimate';
  return source;
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-32 flex-col items-center justify-center gap-2 p-4 text-center">
      <p className="text-sm text-destructive">Unable to load this section.</p>
      <p className="text-xs text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

const TREND_SERIES = [
  { key: 'total_scans', label: 'Total', color: '#4f46e5', dash: undefined },
  { key: 'valid_scans', label: 'Valid', color: '#10b981', dash: undefined },
  { key: 'invalid_scans', label: 'Invalid', color: '#ef4444', dash: undefined },
  { key: 'suspicious_scans', label: 'Suspicious', color: '#f59e0b', dash: '6 4' },
] as const;

type TrendSeriesKey = (typeof TREND_SERIES)[number]['key'];

const DEFAULT_VISIBLE_TREND_SERIES: Record<TrendSeriesKey, boolean> = {
  total_scans: true,
  valid_scans: false,
  invalid_scans: true,
  suspicious_scans: true,
};

function formatTrendDate(value: string): string {
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
}

function formatTrendCount(value: number): string {
  return value.toLocaleString();
}

function TrendChart({ items }: { items: QSealScanTrendItem[] }) {
  const [visibleSeriesState, setVisibleSeries] = React.useState(DEFAULT_VISIBLE_TREND_SERIES);
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  if (!items.length) return <EmptyPanel message="No scan trend data for this period" />;

  const chartWidth = 900;
  const chartHeight = 260;
  const chartMargin = { top: 18, right: 18, bottom: 34, left: 48 };
  const plotWidth = chartWidth - chartMargin.left - chartMargin.right;
  const plotHeight = chartHeight - chartMargin.top - chartMargin.bottom;
  const visibleSeries = TREND_SERIES.filter((series) => visibleSeriesState[series.key]);
  const max = Math.max(...items.flatMap((item) => visibleSeries.map((series) => item[series.key])), 1);
  const xFor = (index: number) => chartMargin.left + (index * plotWidth) / Math.max(items.length - 1, 1);
  const yFor = (value: number) => chartMargin.top + plotHeight - (value / max) * plotHeight;
  const linePoints = (key: TrendSeriesKey) => items.map((item, index) => `${xFor(index)},${yFor(item[key])}`).join(' ');
  const tickStep = Math.max(1, Math.ceil(items.length / 6));
  const xTicks = items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => index === 0 || index === items.length - 1 || index % tickStep === 0);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: Math.round(max * ratio),
    y: yFor(max * ratio),
  }));
  const selectedIndex = Math.min(activeIndex ?? items.length - 1, items.length - 1);
  const selectedItem = items[selectedIndex];
  const suspiciousAverage = items.reduce((sum, item) => sum + item.suspicious_scans, 0) / items.length;
  const suspiciousSpikeThreshold = Math.max(suspiciousAverage * 1.5, 1);

  const toggleSeries = (key: TrendSeriesKey) => {
    setVisibleSeries((current) => {
      const visibleCount = Object.values(current).filter(Boolean).length;
      if (current[key] && visibleCount === 1) return current;
      return { ...current, [key]: !current[key] };
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" aria-label="Trend series">
        {TREND_SERIES.map((series) => (
          <button
            key={series.key}
            type="button"
            aria-pressed={visibleSeriesState[series.key]}
            onClick={() => toggleSeries(series.key)}
            disabled={visibleSeriesState[series.key] && visibleSeries.length === 1}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${visibleSeriesState[series.key] ? 'border-border bg-background text-foreground shadow-sm' : 'border-transparent bg-muted/60 text-muted-foreground'}`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
            {series.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <div className="min-w-[680px] p-3">
          <svg aria-label="Scan trends over time" role="img" viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="block h-64 w-full">
            {yTicks.map((tick) => (
              <g key={tick.value}>
                <line
                  x1={chartMargin.left}
                  x2={chartWidth - chartMargin.right}
                  y1={tick.y}
                  y2={tick.y}
                  stroke="hsl(var(--border))"
                  strokeDasharray="3 4"
                />
                <text x={chartMargin.left - 10} y={tick.y + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
                  {formatTrendCount(tick.value)}
                </text>
              </g>
            ))}
            {xTicks.map(({ item, index }) => (
              <g key={item.date}>
                <line
                  x1={xFor(index)}
                  x2={xFor(index)}
                  y1={chartMargin.top}
                  y2={chartHeight - chartMargin.bottom}
                  stroke="hsl(var(--border))"
                  strokeDasharray="2 5"
                  opacity="0.35"
                />
                <text x={xFor(index)} y={chartHeight - 10} textAnchor="middle" className="fill-muted-foreground text-[11px]">
                  {formatTrendDate(item.date)}
                </text>
              </g>
            ))}
            {TREND_SERIES.map(
              (series) =>
                visibleSeriesState[series.key] && (
                  <polyline
                    key={series.key}
                    points={linePoints(series.key)}
                    fill="none"
                    stroke={series.color}
                    strokeWidth={series.key === 'total_scans' ? 3.5 : 2.5}
                    strokeDasharray={series.dash}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ),
            )}
            {visibleSeriesState.suspicious_scans &&
              items.map(
                (item, index) =>
                  item.suspicious_scans >= suspiciousSpikeThreshold &&
                  item.suspicious_scans > 0 && (
                    <circle
                      key={`spike-${item.date}`}
                      cx={xFor(index)}
                      cy={yFor(item.suspicious_scans)}
                      r="6"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2"
                      opacity="0.8"
                    >
                      <title>{`${formatTrendDate(item.date)}: suspicious scan spike`}</title>
                    </circle>
                  ),
              )}
            {selectedItem && (
              <line
                x1={xFor(selectedIndex)}
                x2={xFor(selectedIndex)}
                y1={chartMargin.top}
                y2={chartHeight - chartMargin.bottom}
                stroke="hsl(var(--foreground))"
                strokeDasharray="4 4"
                opacity="0.35"
              />
            )}
            {items.map((item, index) => (
              <rect
                key={`hit-${item.date}`}
                x={xFor(index) - plotWidth / Math.max(items.length * 2, 2)}
                y={chartMargin.top}
                width={plotWidth / Math.max(items.length, 1)}
                height={plotHeight}
                fill="transparent"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                tabIndex={0}
                aria-label={`${formatTrendDate(item.date)}: ${formatTrendCount(item.total_scans)} total scans`}
              />
            ))}
          </svg>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/30 px-3 py-2" aria-live="polite">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-foreground">{formatTrendDate(selectedItem.date)}</span>
          <span className="text-muted-foreground">Scan breakdown</span>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
          {TREND_SERIES.map((series) => (
            <span key={series.key} className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: series.color }} />
              {series.label}: <strong className="text-foreground">{formatTrendCount(selectedItem[series.key])}</strong>
            </span>
          ))}
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

function InsightsCard({
  summary,
  products,
  geography,
  trends,
  history,
  onOpenEvents,
}: {
  summary: QSealAnalyticsSummary | null;
  products: QSealProductAnalyticsItem[];
  geography: QSealGeographyAnalyticsItem[];
  trends: QSealScanTrendItem[];
  history: QSealAnalyticsHistoryItem[];
  onOpenEvents: (nextFilters: Partial<AnalyticsFiltersType>) => void;
}) {
  if (!summary) return null;
  const invalidRate = summary.total_scans ? (summary.invalid_scans / summary.total_scans) * 100 : 0;
  const topProduct = products[0];
  const invalidMessage =
    invalidRate >= 5
      ? `${invalidRate.toFixed(1)}% of scans are invalid. Review the affected serials.`
      : 'Invalid scans are currently within a low-risk range.';
  const previousTrend = trends.length > 1 ? trends.slice(0, -1) : [];
  const latestTrend = trends[trends.length - 1];
  const averagePreviousScans = previousTrend.length ? previousTrend.reduce((total, item) => total + item.total_scans, 0) / previousTrend.length : 0;
  const scanSpike = Boolean(latestTrend && averagePreviousScans > 0 && latestTrend.total_scans >= Math.max(5, averagePreviousScans * 2));
  const reasonCounts = new Map<string, number>();
  history
    .filter((item) => item.is_suspicious)
    .forEach((item) => item.suspicious_reasons.forEach((reason) => reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1)));
  const topReason = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const alerts = [
    summary.high_risk_scans > 0
      ? {
          tone: 'border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20',
          icon: ShieldAlert,
          title: 'High-risk scans detected',
          message: `${summary.high_risk_scans.toLocaleString()} scan${summary.high_risk_scans === 1 ? '' : 's'} scored high risk.`,
          action: 'View high-risk events',
          filters: { risk_filter: 'high_risk' as const },
        }
      : null,
    summary.unreviewed_suspicious_scans > 0
      ? {
          tone: 'border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/20',
          icon: AlertTriangle,
          title: 'Review queue requires attention',
          message: `${summary.unreviewed_suspicious_scans.toLocaleString()} suspicious scan${summary.unreviewed_suspicious_scans === 1 ? '' : 's'} are still unreviewed.`,
          action: 'Open review queue',
          filters: { risk_filter: 'unreviewed' as const },
        }
      : null,
    scanSpike
      ? {
          tone: 'border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20',
          icon: TrendingUp,
          title: 'Scan volume spike',
          message: `${latestTrend.total_scans.toLocaleString()} scans were recorded on ${latestTrend.date}, at least twice the earlier daily average.`,
          action: null,
          filters: {},
        }
      : null,
  ].filter(Boolean) as {
    tone: string;
    icon: typeof AlertTriangle;
    title: string;
    message: string;
    action: string | null;
    filters: Partial<AnalyticsFiltersType>;
  }[];
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Lightbulb className="h-4 w-4 text-amber-500" />
        <CardTitle className="text-sm font-medium">Alerts & insights</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {alerts.map((alert) => {
              const Icon = alert.icon;
              return (
                <div key={alert.title} className={`rounded-lg border p-4 ${alert.tone}`}>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                    <Icon className="h-4 w-4" />
                    {alert.title}
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  {alert.action && (
                    <Button variant="link" className="mt-2 h-auto gap-1 p-0 text-sm" onClick={() => onOpenEvents(alert.filters)}>
                      {alert.action}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
            No active alerts in the selected period.
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-red-500" /> Scan quality
            </div>
            <p className="text-sm text-muted-foreground">{invalidMessage}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Repeat2 className="h-4 w-4 text-amber-500" /> Repeat activity
            </div>
            <p className="text-sm text-muted-foreground">
              {summary.repeat_scans.toLocaleString()} repeat scans across {summary.unique_serials.toLocaleString()} valid serials.
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-blue-500" /> Leading product
            </div>
            <p className="text-sm text-muted-foreground">
              {topProduct ? `${topProduct.product_name} has ${topProduct.total_scans.toLocaleString()} scans.` : 'No product scan data yet.'}{' '}
              {geography.length ? `${geography.length} locations captured.` : ''}
            </p>
            {topProduct?.product_id && (
              <Button
                variant="link"
                className="mt-2 h-auto gap-1 p-0 text-sm"
                onClick={() =>
                  onOpenEvents({ product_id: topProduct.product_id || undefined, batch: topProduct.batch || undefined, risk_filter: undefined })
                }
              >
                View product events
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950/20">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <ShieldAlert className="h-4 w-4 text-red-500" /> Why scans were flagged
            </div>
            <p className="text-sm text-muted-foreground">
              {summary.suspicious_scans.toLocaleString()} flagged scans ({summary.suspicious_rate.toFixed(1)}%).{' '}
              {topReason
                ? `Most common: ${SUSPICIOUS_REASON_LABELS[topReason[0]] || topReason[0]} (${topReason[1]} recent events).`
                : 'Review high-risk events first.'}
            </p>
            {summary.suspicious_scans > 0 && (
              <Button
                variant="link"
                className="mt-2 h-auto gap-1 p-0 text-sm text-red-700 dark:text-red-300"
                onClick={() => onOpenEvents({ risk_filter: 'suspicious' })}
              >
                View suspicious events
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
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
          <tr>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Batch</th>
            <th className="px-4 py-3 font-medium">Total scans</th>
            <th className="px-4 py-3 font-medium">Valid</th>
            <th className="px-4 py-3 font-medium">Unique serials</th>
            <th className="px-4 py-3 font-medium">Last scan</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item, index) => (
            <tr key={`${item.product_id || 'unknown'}-${item.batch || index}`} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium">{item.product_name || 'Unknown product'}</td>
              <td className="px-4 py-3 text-muted-foreground">{item.batch || '—'}</td>
              <td className="px-4 py-3">{item.total_scans.toLocaleString()}</td>
              <td className="px-4 py-3 text-emerald-600">{item.valid_scans.toLocaleString()}</td>
              <td className="px-4 py-3">{item.unique_serials.toLocaleString()}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {item.last_scan ? formatDate(item.last_scan, 'DD-MMM-YY', { includeTime: true }) : '—'}
              </td>
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
          <tr>
            <th className="px-4 py-3 font-medium">Location</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Total scans</th>
            <th className="px-4 py-3 font-medium">Valid</th>
            <th className="px-4 py-3 font-medium">Invalid</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item, index) => (
            <tr key={`${item.country}-${item.state}-${item.city}-${index}`} className="hover:bg-muted/30">
              <td className="px-4 py-3">{[item.city, item.state, item.country].filter(Boolean).join(', ') || 'Unknown location'}</td>
              <td className="px-4 py-3 text-muted-foreground">{locationSourceLabel(item.location_source) || 'Unknown'}</td>
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

interface VerificationStatusPresentation {
  label: string;
  icon: LucideIcon;
  className: string;
}

const VERIFICATION_STATUS_PRESENTATIONS: Record<string, VerificationStatusPresentation> = {
  authentic: {
    label: 'Authentic',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  },
  valid: {
    label: 'Authentic',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  },
  verified: {
    label: 'Authentic',
    icon: CheckCircle2,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  },
  invalid: {
    label: 'Authentication failed',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  },
  authentication_failed: {
    label: 'Authentication failed',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  },
  verification_failed: {
    label: 'Authentication failed',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  },
  verification_required: {
    label: 'Verification required',
    icon: ShieldAlert,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  },
  not_activated: {
    label: 'Not activated',
    icon: Clock3,
    className: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-300',
  },
  already_used: {
    label: 'Already used',
    icon: History,
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300',
  },
  unknown: {
    label: 'Unknown status',
    icon: HelpCircle,
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  },
};

function verificationStatusPresentation(status: string | null): VerificationStatusPresentation {
  const normalizedStatus =
    status
      ?.trim()
      .toLowerCase()
      .replace(/[\s-]+/g, '_') || 'unknown';
  return (
    VERIFICATION_STATUS_PRESENTATIONS[normalizedStatus] || {
      label: status || 'Unknown status',
      icon: HelpCircle,
      className: VERIFICATION_STATUS_PRESENTATIONS.unknown.className,
    }
  );
}

function VerificationStatusIcon({ status }: { status: string | null }) {
  const presentation = verificationStatusPresentation(status);
  const Icon = presentation.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex h-8 w-8 cursor-help items-center justify-center rounded-full ${presentation.className}`}
            role="img"
            aria-label={presentation.label}
            title={presentation.label}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">{presentation.label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function HistoryTable({
  items,
  productNames,
  onReview,
  reviewingEventId,
  canReview,
  serverPagination,
}: {
  items: QSealAnalyticsHistoryItem[];
  productNames: Map<string, string>;
  onReview: (eventId: string, status: QSealSuspiciousReviewStatus) => Promise<void>;
  reviewingEventId: string | null;
  canReview: boolean;
  serverPagination?: { totalItems: number; currentPage: number; pageSize: number; onPageChange: (page: number, pageSize: number) => void };
}) {
  if (!items.length) return <EmptyPanel message="No scan events for this period" />;

  const columns: ColumnDef<QSealAnalyticsHistoryItem, unknown>[] = [
    {
      accessorKey: 'scan_timestamp',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Time" />,
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">{formatDate(row.original.scan_timestamp, 'DD-MMM-YY', { includeTime: true })}</span>
      ),
    },
    {
      accessorKey: 'serial_number',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Serial" />,
      cell: ({ row }) => <code className="rounded bg-muted px-2 py-1 text-xs">{row.original.serial_number || '—'}</code>,
    },
    {
      id: 'product',
      accessorFn: (row) => (row.product_id ? productNames.get(row.product_id) || 'Product' : ''),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
      cell: ({ row }) => <span>{row.original.product_id ? productNames.get(row.original.product_id) || 'Product' : '—'}</span>,
    },
    {
      accessorKey: 'verification_status',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <VerificationStatusIcon status={row.original.verification_status} />
        </div>
      ),
    },
    {
      id: 'risk',
      accessorFn: (row) => (row.is_suspicious ? row.risk_score : 0),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Risk" />,
      cell: ({ row }) => {
        const item = row.original;
        if (!item.is_suspicious) return <span className="text-muted-foreground">Normal</span>;
        const reasons = item.suspicious_reasons.map((reason) => SUSPICIOUS_REASON_LABELS[reason] || reason);
        return (
          <div title={reasons.join(', ')}>
            <Badge
              className={
                item.risk_score >= 60
                  ? 'border-transparent bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  : 'border-transparent bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
              }
            >
              {item.risk_score >= 60 ? 'High risk' : 'Suspicious'} · {item.risk_score}
            </Badge>
            <p className="mt-1 max-w-48 text-xs text-muted-foreground">{reasons.join(', ')}</p>
            {item.review_status !== 'new' && (
              <Badge className="mt-1 border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {item.review_status.replace('_', ' ')}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'location',
      accessorFn: (row) => [row.city, row.state, row.country].filter(Boolean).join(', '),
      header: ({ column }) => <DataTableColumnHeader column={column} title="Location" />,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div>
            <div>{[item.city, item.state, item.country].filter(Boolean).join(', ') || 'Unknown'}</div>
            {locationSourceLabel(item.location_source) && (
              <div className="mt-1 text-xs text-muted-foreground">
                {locationSourceLabel(item.location_source)}
                {item.location_accuracy_meters != null ? ` · ±${item.location_accuracy_meters} m` : ''}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'action',
      header: () => <span>Action</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
        return item.is_suspicious && item.review_status === 'new' && canReview ? (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={reviewingEventId === item.id} onClick={() => onReview(item.id, 'reviewed')}>
              Review
            </Button>
            <Button size="sm" variant="ghost" disabled={reviewingEventId === item.id} onClick={() => onReview(item.id, 'dismissed')}>
              Dismiss
            </Button>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={items}
      config={{
        showPagination: true,
        enableRowSelection: false,
        enableColumnVisibility: false,
        enableSorting: true,
        enableFiltering: false,
        initialPageSize: serverPagination?.pageSize ?? 20,
        serverPagination,
      }}
      maxHeight="auto"
    />
  );
}

export function AnalyticsManagement({ initialProductId }: { initialProductId?: string } = {}) {
  const {
    filters,
    setFilters,
    summary,
    previousSummary,
    previousPeriod,
    sectionErrors,
    trends,
    products,
    geography,
    devices,
    history,
    reviewSuspicious,
    reviewingEventId,
    productOptions,
    blockOptions,
    historyPagination,
    historyLoading,
    historyError,
    historyPage,
    setHistoryPage,
    historyPageSize,
    setHistoryPageSize,
    exportHistory,
    loading,
    error,
    analyticsEnabled,
    featureFlagLoading,
    refetch,
  } = useAnalyticsManagement(initialProductId);
  const [activeTab, setActiveTab] = React.useState('summary');
  const [exporting, setExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);
  const user = useUserStore((state) => state.user);
  const userPermissions = useUserStore((state) => state.permissions?.permissions || []);
  const canReview =
    user?.user_type === 'system_admin' || user?.user_type === 'organization_admin' || hasPermission(userPermissions, 'qr_product.update');
  const openFilteredEvents = React.useCallback(
    (nextFilters: Partial<AnalyticsFiltersType>) => {
      setFilters((current) => ({ ...current, ...nextFilters }));
      setActiveTab('summary');
    },
    [setFilters],
  );

  const productNames = React.useMemo(() => new Map(productOptions.map((product) => [product.id, product.name])), [productOptions]);
  const mapPoints = React.useMemo(
    () =>
      geography
        .filter((item) => item.latitude != null && item.longitude != null)
        .map((item) => ({
          city: item.city,
          state: item.state,
          country: item.country,
          location_source: item.location_source,
          latitude: item.latitude as number,
          longitude: item.longitude as number,
          count: item.total_scans,
        })),
    [geography],
  );

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const events = await exportHistory();
      if (!events.length) return;
      const columns = [
        'Scan ID',
        'Time',
        'Serial',
        'Product',
        'Product ID',
        'Batch',
        'Status',
        'Risk score',
        'Suspicious',
        'Suspicious reasons',
        'Review status',
        'QR type',
        'Device',
        'City',
        'State',
        'Country',
        'Location source',
        'Location accuracy (m)',
      ];
      const escapeCsv = (value: unknown) =>
        `"${String(value ?? '')
          .split('"')
          .join('""')}"`;
      const rows = events.map((event) =>
        [
          event.id,
          event.scan_timestamp,
          event.serial_number,
          event.product_id ? productNames.get(event.product_id) || 'Unknown product' : '',
          event.product_id,
          event.batch,
          event.verification_status,
          event.risk_score,
          event.is_suspicious ? 'Yes' : 'No',
          event.suspicious_reasons.map((reason) => SUSPICIOUS_REASON_LABELS[reason] || reason).join('; '),
          event.review_status,
          event.qseal_type,
          event.device_type,
          event.city,
          event.state,
          event.country,
          locationSourceLabel(event.location_source),
          event.location_accuracy_meters,
        ]
          .map(escapeCsv)
          .join(','),
      );
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
        <Card>
          <CardContent className="flex min-h-40 items-center justify-center text-sm text-muted-foreground">Checking analytics access…</CardContent>
        </Card>
      </div>
    );
  }

  if (!analyticsEnabled) {
    return (
      <div className="space-y-6">
        <AnalyticsHeader onRefresh={refetch} />
        <Card>
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
            <LockKeyhole className="h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Analytics is not enabled</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Analytics is not enabled for this organization. Contact your administrator to enable this feature.
            </p>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="space-y-6">
        <AnalyticsHeader onRefresh={refetch} />
        <Card className="border-destructive">
          <CardContent className="flex items-center justify-between gap-4 p-6 text-destructive">
            <span>{error}</span>
            <Button variant="outline" onClick={refetch}>
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnalyticsHeader onRefresh={refetch} isLoading={loading} />
      <AnalyticsStats summary={summary} previousSummary={previousSummary} previousPeriod={previousPeriod} />
      <AnalyticsFilters filters={filters} setFilters={setFilters} productOptions={productOptions} blockOptions={blockOptions} />
      {error && summary && (
        <Card className="border-destructive">
          <CardContent className="flex items-center justify-between gap-4 p-4 text-sm text-destructive">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={refetch}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-6 space-y-6">
          {loading && !summary ? (
            <EmptyPanel message="Loading insights…" />
          ) : (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center gap-2 pb-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Scan trends</CardTitle>
                </CardHeader>
                <CardContent>
                  {sectionErrors.trends ? <SectionError message={sectionErrors.trends} onRetry={refetch} /> : <TrendChart items={trends} />}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Recent scan events</CardTitle>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleExport}
                    disabled={exporting || historyLoading || !historyPagination?.total_items}
                  >
                    <Download className="h-4 w-4" />
                    {exporting ? 'Exporting…' : 'Export CSV'}
                  </Button>
                </CardHeader>
                {exportError && <p className="px-6 text-sm text-destructive">{exportError}</p>}
                {historyError ? (
                  <SectionError message={historyError} onRetry={refetch} />
                ) : (
                  <CardContent className="p-0">
                    <HistoryTable
                      items={history}
                      productNames={productNames}
                      onReview={reviewSuspicious}
                      reviewingEventId={reviewingEventId}
                      canReview={canReview}
                      serverPagination={
                        historyPagination
                          ? {
                              totalItems: historyPagination.total_items,
                              currentPage: historyPage,
                              pageSize: historyPageSize,
                              onPageChange: (page, pageSize) => {
                                setHistoryPage(pageSize === historyPageSize ? page : 1);
                                setHistoryPageSize(pageSize);
                              },
                            }
                          : undefined
                      }
                    />
                  </CardContent>
                )}
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="details" className="mt-6 space-y-6">
          <InsightsCard
            summary={summary}
            products={products}
            geography={geography}
            trends={trends}
            history={history}
            onOpenEvents={openFilteredEvents}
          />
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Product-level analytics</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {sectionErrors.products ? <SectionError message={sectionErrors.products} onRetry={refetch} /> : <ProductTable items={products} />}
            </CardContent>
          </Card>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Geographic distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {sectionErrors.geography ? (
                  <SectionError message={sectionErrors.geography} onRetry={refetch} />
                ) : (
                  <GeographyTable items={geography} />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Device totals</CardTitle>
              </CardHeader>
              <CardContent>
                {sectionErrors.devices ? <SectionError message={sectionErrors.devices} onRetry={refetch} /> : <DeviceBreakdown devices={devices} />}
              </CardContent>
            </Card>
          </div>
          {!sectionErrors.geography && <AnalyticsMap points={mapPoints} loading={loading} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
