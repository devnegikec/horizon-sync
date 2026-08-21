import * as React from 'react';

import { MapPin, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';

import { useAnalyticsManagement } from '../../hooks/useAnalyticsManagement';
import type { AnalyticsSummary, AnalyticsCTABreakdown, AnalyticsDeviceTimeline } from '../../types/qseal.types';

import { AnalyticsFilters } from './AnalyticsFilters';
import { AnalyticsHeader } from './AnalyticsHeader';
import { AnalyticsMap } from './AnalyticsMap';
import { AnalyticsStats } from './AnalyticsStats';
import { AnalyticsTable } from './AnalyticsTable';

// ── Sub-components for chart sections (reduces parent complexity) ──

function ScansOverTimeChart({ summary }: { summary: AnalyticsSummary }) {
  if (summary.by_date.length === 0) {
    return <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">No time-series data available</div>;
  }
  const maxDayCount = Math.max(...summary.by_date.map((d) => d.count), 1);
  const chartWidth = Math.max(summary.by_date.length * 14, 28);
  return (
    <>
      <svg
        aria-label="Scans over time"
        role="img"
        viewBox={`0 0 ${chartWidth} 100`}
        preserveAspectRatio="none"
        className="block w-full text-primary"
        style={{ height: 128 }}
      >
        {summary.by_date.map((day, index) => {
          const height = Math.max((day.count / maxDayCount) * 96, 2);
          return (
            <rect
              key={day.date}
              x={index * 14 + 1}
              y={100 - height}
              width={12}
              height={height}
              rx={1.5}
              fill="currentColor"
              opacity={0.85}
            >
              <title>{`${day.date}: ${day.count.toLocaleString()} scans`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>{summary.by_date[0]?.date?.slice(0, 10)}</span>
        <span>{summary.by_date[summary.by_date.length - 1]?.date?.slice(0, 10)}</span>
      </div>
    </>
  );
}

function DeviceTimelineChart({ timeline }: { timeline: AnalyticsDeviceTimeline[] }) {
  const data = Array.isArray(timeline) ? timeline : [];
  if (data.length === 0) {
    return <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">No device timeline data available</div>;
  }
  const visibleData = data.slice(-30);
  const maxTotal = Math.max(
    ...visibleData.map((d) => d.mobile + d.desktop + d.tablet + d.unknown),
    1,
  );
  return (
    <>
      <div className="flex items-end gap-1 h-32">
        {visibleData.map((d) => {
          return (
            <div key={d.date} className="flex-1 flex flex-col justify-end h-full" title={`${d.date}: M:${d.mobile} D:${d.desktop} T:${d.tablet}`}>
              {d.unknown > 0 && <div className="w-full bg-slate-400 rounded-t" style={{ height: `${(d.unknown / maxTotal) * 100}%` }} />}
              {d.tablet > 0 && <div className="w-full bg-amber-400" style={{ height: `${(d.tablet / maxTotal) * 100}%` }} />}
              {d.desktop > 0 && <div className="w-full bg-emerald-500" style={{ height: `${(d.desktop / maxTotal) * 100}%` }} />}
              {d.mobile > 0 && <div className="w-full bg-primary" style={{ height: `${(d.mobile / maxTotal) * 100}%` }} />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary inline-block" /> Mobile</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> Desktop</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Tablet</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-400 inline-block" /> Unknown</span>
      </div>
    </>
  );
}

function CTABreakdownChart({ ctaBreakdown }: { ctaBreakdown: AnalyticsCTABreakdown }) {
  if (ctaBreakdown.breakdown.length === 0) {
    return <p className="text-sm text-muted-foreground">No CTA data available</p>;
  }
  const maxCount = Math.max(...ctaBreakdown.breakdown.map((x) => x.count), 1);
  return (
    <>
      {ctaBreakdown.breakdown.map((b) => (
        <div key={b.cta_action}>
          <div className="flex justify-between text-sm mb-1">
            <span className="capitalize">{b.cta_action.replace(/_/g, ' ')}</span>
            <span className="font-medium">{b.count.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${(b.count / maxCount) * 100}%` }} />
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-2">
        Total scans with CTA: {ctaBreakdown.total_scans_with_cta.toLocaleString()}
      </p>
    </>
  );
}

function TopCountriesChart({ summary }: { summary: AnalyticsSummary }) {
  if (summary.by_country.length === 0) {
    return <p className="text-sm text-muted-foreground">No country data available</p>;
  }
  const maxCount = Math.max(...summary.by_country.map((x) => x.count), 1);
  return (
    <>
      {summary.by_country.slice(0, 8).map((c, i) => (
        <div key={c.country || `unknown-${i}`}>
          <div className="flex justify-between text-sm mb-1">
            <span><span className="text-muted-foreground mr-2">{i + 1}.</span>{c.country || 'Unknown'}</span>
            <span className="font-medium">{c.count.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${(c.count / maxCount) * 100}%` }} />
          </div>
        </div>
      ))}
    </>
  );
}

// ── Main Component ──

function AnalyticsLoadingSkeleton({ refetch }: { refetch: () => void }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AnalyticsHeader onRefresh={refetch} isLoading={true} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-2/3 mb-2" />
              <div className="h-8 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-pulse"><CardContent className="p-6"><div className="h-[300px] bg-muted rounded" /></CardContent></Card>
        <Card className="animate-pulse"><CardContent className="p-6"><div className="h-[300px] bg-muted rounded" /></CardContent></Card>
      </div>
    </div>
  );
}

export function AnalyticsManagement() {
  const {
    filters,
    setFilters,
    summary,
    ctaBreakdown,
    interactionFunnel,
    geoPoints,
    deviceTimeline,
    scanEvents,
    scanPagination,
    loading,
    error,
    setScanPage,
    refetch,
  } = useAnalyticsManagement();

  const hasActiveFilters = !!filters.date_from;

  const serverPaginationConfig = React.useMemo(() => {
    if (!scanPagination) return undefined;
    return {
      totalItems: scanPagination.total_items,
      currentPage: scanPagination.page,
      pageSize: scanPagination.page_size,
      onPageChange: (page: number, _pageSize: number) => { setScanPage(page); },
    };
  }, [scanPagination, setScanPage]);

  // --- Loading / Error States ---
  if (!summary) {
    if (loading) return <AnalyticsLoadingSkeleton refetch={refetch} />;
    if (error) {
      return (
        <div className="space-y-6">
          <AnalyticsHeader onRefresh={refetch} />
          <Card className="border-destructive"><CardContent className="pt-6 text-destructive">{error}</CardContent></Card>
        </div>
      );
    }
    return null;
  }

  // --- Empty State ---
  if (summary.total_scans === 0) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <AnalyticsHeader onRefresh={refetch} />
        <AnalyticsFilters filters={filters} setFilters={setFilters} />
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center gap-3">
            <TrendingUp className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No scan data yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              QR scan analytics will appear here once consumers start scanning your product QR codes.
              Make sure your products have QR codes generated and distributed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- Data Loaded ---
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AnalyticsHeader onRefresh={refetch} isLoading={loading} />
      <AnalyticsStats summary={summary} interactionFunnel={interactionFunnel} />
      <AnalyticsFilters filters={filters} setFilters={setFilters} />

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Scans Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? <ScansOverTimeChart summary={summary} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Device Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <DeviceTimelineChart timeline={deviceTimeline} />
          </CardContent>
        </Card>
      </div>

      {/* CTA & Country Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">CTA Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ctaBreakdown ? <CTABreakdownChart ctaBreakdown={ctaBreakdown} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Top Countries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary ? <TopCountriesChart summary={summary} /> : null}
          </CardContent>
        </Card>
      </div>

      {/* Geo Map */}
      <AnalyticsMap points={geoPoints} loading={loading} />

      {/* Scan Events Table */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Recent Scan Events</h3>
        <AnalyticsTable events={scanEvents} loading={loading && scanEvents.length === 0} error={null} hasActiveFilters={hasActiveFilters} serverPagination={serverPaginationConfig} />
      </div>
    </div>
  );
}
