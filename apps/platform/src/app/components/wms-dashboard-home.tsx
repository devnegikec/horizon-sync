/**
 * WMSDashboardHome — Warehouse Manager / Supervisor Dashboard
 *
 * Matches the visual style of the Organization Owner/Admin dashboard
 * (gradient icon cards, chart section, recent activity, quick actions)
 * but shows warehouse-specific data.
 *
 * Falls back to realistic dummy data when the API returns empty results
 * so the layout never appears broken.
 */

'use client';

import * as React from 'react';

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Box,
  Calendar,
  ChevronDown,
  ChevronUp,
  Package,
  PackageSearch,
  Truck,
  TrendingUp,
  Users,
  Warehouse,
} from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { cn } from '@horizon-sync/ui/lib';
import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../environments/environment';
import { WarehouseCapacityCard } from './warehouse-capacity-card';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartBucket { label: string; qty: number; value: number }

interface ActivityItem {
  type: string;
  title: string;
  status: string;
  warehouse_id: string | null;
  worker_name: string | null;
  created_at: string | null;
}

interface DashboardStats {
  period: string;
  period_start: string;
  period_end: string;
  stats?: {
    total_stock_items: number;
    assigned_warehouses: number;
    low_stock_count: number;
    out_of_stock_count: number;
    active_workers: number;
  };
  stock_overview?: {
    inbound: { total_qty: number; total_value: number; receiving_slips: number; chart: ChartBucket[] };
    outbound: { total_qty: number; total_value: number; dispatches: number; chart: ChartBucket[] };
  };
  recent_activity: ActivityItem[];
  activity_pagination?: { page: number; page_size: number; total: number; total_pages: number; has_next: boolean; has_prev: boolean };
}

// ─── Dummy data (matches owner dashboard style) ──────────────────────────────

const DUMMY_INBOUND_CHART: ChartBucket[] = [
  { label: 'Mon', qty: 120, value: 4800 },
  { label: 'Tue', qty: 185, value: 7400 },
  { label: 'Wed', qty: 95, value: 3800 },
  { label: 'Thu', qty: 230, value: 9200 },
  { label: 'Fri', qty: 150, value: 6000 },
  { label: 'Sat', qty: 75, value: 3000 },
  { label: 'Sun', qty: 40, value: 1600 },
];

const DUMMY_OUTBOUND_CHART: ChartBucket[] = [
  { label: 'Mon', qty: 90, value: 3600 },
  { label: 'Tue', qty: 140, value: 5600 },
  { label: 'Wed', qty: 110, value: 4400 },
  { label: 'Thu', qty: 200, value: 8000 },
  { label: 'Fri', qty: 170, value: 6800 },
  { label: 'Sat', qty: 50, value: 2000 },
  { label: 'Sun', qty: 30, value: 1200 },
];

const DUMMY_ACTIVITY: ActivityItem[] = [
  { type: 'scan_session', title: 'Scan Session #A8F2 — 24 items scanned', status: 'completed', warehouse_id: null, worker_name: 'Rajesh Kumar', created_at: new Date(Date.now() - 2 * 60_000).toISOString() },
  { type: 'pick_list', title: 'Pick List PL-0042 created', status: 'in_progress', warehouse_id: null, worker_name: null, created_at: new Date(Date.now() - 15 * 60_000).toISOString() },
  { type: 'receiving_slip', title: 'Receiving Slip RS-0128', status: 'approved', warehouse_id: null, worker_name: null, created_at: new Date(Date.now() - 45 * 60_000).toISOString() },
  { type: 'put_away', title: 'Put-Away PA-0091 completed', status: 'completed', warehouse_id: null, worker_name: 'Amit Singh', created_at: new Date(Date.now() - 2 * 3600_000).toISOString() },
  { type: 'dispatch', title: 'Dispatch DP-0037 — 6 cartons', status: 'completed', warehouse_id: null, worker_name: null, created_at: new Date(Date.now() - 4 * 3600_000).toISOString() },
  { type: 'scan_session', title: 'Scan Session #B4E1 — 18 items scanned', status: 'completed', warehouse_id: null, worker_name: 'Priya Sharma', created_at: new Date(Date.now() - 5 * 3600_000).toISOString() },
  { type: 'asn_order', title: 'ASN ASN-0056 confirmed', status: 'confirmed', warehouse_id: null, worker_name: null, created_at: new Date(Date.now() - 6 * 3600_000).toISOString() },
  { type: 'pick_list', title: 'Pick List PL-0041 completed', status: 'completed', warehouse_id: null, worker_name: 'Vikram Patel', created_at: new Date(Date.now() - 8 * 3600_000).toISOString() },
  { type: 'receiving_slip', title: 'Receiving Slip RS-0127', status: 'approved', warehouse_id: null, worker_name: null, created_at: new Date(Date.now() - 10 * 3600_000).toISOString() },
  { type: 'put_away', title: 'Put-Away PA-0090 completed', status: 'completed', warehouse_id: null, worker_name: 'Rajesh Kumar', created_at: new Date(Date.now() - 12 * 3600_000).toISOString() },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `₹${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}K`;
  return `₹${n.toFixed(0)}`;
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? 's' : ''} ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Stat Card (mirrors Owner/Admin style) ────────────────────────────────────

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
}

function StatCard({ title, value, change, changeType, icon: Icon, iconBg }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 hover:border-violet-500/20">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
          <div className="mt-2 flex items-center gap-1.5">
            {changeType === 'positive' && <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
            {changeType === 'negative' && <ArrowDownRight className="h-4 w-4 text-red-500" />}
            {changeType === 'neutral' && <Box className="h-4 w-4 text-muted-foreground" />}
            <span className={cn(
              'text-sm font-medium',
              changeType === 'positive' && 'text-emerald-500',
              changeType === 'negative' && 'text-red-500',
              changeType === 'neutral' && 'text-muted-foreground',
            )}>{change}</span>
            <span className="text-sm text-muted-foreground">this period</span>
          </div>
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110', iconBg)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-500/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

const QuickActions = [
  { label: 'Inbound Receiving', icon: Package },
  { label: 'Create Pick List', icon: Truck },
  { label: 'View Stock Levels', icon: PackageSearch },
  { label: 'Manage Workers', icon: Users },
];

// ─── Main Component ───────────────────────────────────────────────────────────

interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

function CapacityCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-3 w-full rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-2/3 rounded-full bg-muted animate-pulse" />
        <div className="h-3 w-1/2 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
  );
}

export function WMSDashboardHome() {
  const accessToken = useUserStore((s) => s.accessToken);
  const [period, setPeriod] = React.useState<'week' | 'month' | 'year'>('week');
  const [anchorDate, setAnchorDate] = React.useState(new Date());
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [showAllActivity, setShowAllActivity] = React.useState(false);
  const [allActivity, setAllActivity] = React.useState<ActivityItem[]>([]);
  const [loadingAll, setLoadingAll] = React.useState(false);

  // Warehouse selector
  const [warehouses, setWarehouses] = React.useState<WarehouseOption[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string>('all');
  const [warehousesLoading, setWarehousesLoading] = React.useState(false);

  // Fetch user's accessible warehouses
  React.useEffect(() => {
    if (!accessToken) return;
    setWarehousesLoading(true);
    fetch(`${environment.apiCoreUrl}/api/v1/warehouse-users/my-warehouses`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => setWarehouses(data.warehouses || []))
      .catch(() => setWarehouses([]))
      .finally(() => setWarehousesLoading(false));
  }, [accessToken]);

  const fetchStats = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ period, date: anchorDate.toISOString(), page: '1', page_size: '5' });
      if (selectedWarehouseId !== 'all') {
        params.set('warehouse_id', selectedWarehouseId);
      }
      const res = await fetch(`${environment.apiCoreUrl}/api/v1/wms-dashboard/stats?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data: DashboardStats = await res.json();
      setStats(data);
      setShowAllActivity(false);
      setAllActivity([]);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, period, anchorDate, selectedWarehouseId]);

  React.useEffect(() => { fetchStats(); }, [fetchStats]);

  const fetchAllActivity = React.useCallback(async () => {
    if (!accessToken) return;
    setLoadingAll(true);
    try {
      const params = new URLSearchParams({ period, date: anchorDate.toISOString(), page: '1', page_size: '100' });
      if (selectedWarehouseId !== 'all') {
        params.set('warehouse_id', selectedWarehouseId);
      }
      const res = await fetch(`${environment.apiCoreUrl}/api/v1/wms-dashboard/stats?${params}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data: DashboardStats = await res.json();
        setAllActivity(data.recent_activity);
      }
    } catch { /* use what we have */ }
    finally { setLoadingAll(false); }
  }, [accessToken, period, anchorDate, selectedWarehouseId]);

  const handleViewAll = () => {
    if (!showAllActivity) { setShowAllActivity(true); fetchAllActivity(); }
    else { setShowAllActivity(false); }
  };

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

  // Resolved values — use real API data when available, dummy only on API failure (stats===null)
  const hasRealData = stats !== null;
  const s = stats?.stats ?? { total_stock_items: 1248, assigned_warehouses: 3, low_stock_count: 12, out_of_stock_count: 4, active_workers: 18 };
  const overview = stats?.stock_overview ?? (hasRealData
    ? { inbound: { total_qty: 0, total_value: 0, receiving_slips: 0, chart: [] }, outbound: { total_qty: 0, total_value: 0, dispatches: 0, chart: [] } }
    : { inbound: { total_qty: 895, total_value: 35800, receiving_slips: 14, chart: DUMMY_INBOUND_CHART }, outbound: { total_qty: 790, total_value: 31600, dispatches: 9, chart: DUMMY_OUTBOUND_CHART } }
  );
  const activity = showAllActivity
    ? (allActivity.length > 0 ? allActivity : (hasRealData ? [] : DUMMY_ACTIVITY))
    : (stats?.recent_activity && stats.recent_activity.length > 0 ? stats.recent_activity.slice(0, 5) : (hasRealData ? [] : DUMMY_ACTIVITY));
  const totalActivity = stats?.activity_pagination?.total ?? (hasRealData ? 0 : DUMMY_ACTIVITY.length);

  const inboundChart = overview.inbound.chart;
  const outboundChart = overview.outbound.chart;
  const maxInbound = Math.max(...inboundChart.map((b) => b.qty), 1);
  const maxOutbound = Math.max(...outboundChart.map((b) => b.qty), 1);

  // Show a loading skeleton until the first real stats response arrives, so
  // dummy/stale fallback data never flashes before the user's actual data.
  if (loading && !stats) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Warehouse Dashboard</h1>
            <p className="text-muted-foreground mt-1">Loading your warehouse operations…</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-40 rounded-md bg-muted animate-pulse" />
            <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
          </div>
        </div>

        {/* Stat card skeletons */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6">
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="mt-3 h-8 w-16 rounded bg-muted animate-pulse" />
              <div className="mt-3 h-3 w-32 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>

        {/* Capacity skeletons */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-3 w-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400" />
            <h2 className="text-lg font-semibold">Warehouse Capacity</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <CapacityCardSkeleton />
            <CapacityCardSkeleton />
          </div>
        </div>

        {/* Chart skeletons */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-6">
              <div className="h-5 w-32 rounded bg-muted animate-pulse" />
              <div className="mt-4 h-40 w-full rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouse Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {stats ? (
              <>Showing data for <span className="font-medium text-foreground">{formatDateShort(stats.period_start)} — {formatDateShort(stats.period_end)}</span></>
            ) : (
              'Overview of your warehouse operations and stock levels.'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Warehouse filter */}
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            disabled={warehousesLoading}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">
              {warehousesLoading ? 'Loading...' : `All Warehouses (${warehouses.length})`}
            </option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>

          {/* Period controls */}
          <Button variant="outline" size="sm" onClick={prevPeriod} disabled={loading}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex border rounded-md overflow-hidden">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                className={cn(
                  'px-3 py-1.5 text-sm capitalize transition-colors',
                  period === p ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                )}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={nextPeriod} disabled={loading}>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid — same style as Owner/Admin dashboard */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Stock Items"
          value={s.total_stock_items.toLocaleString()}
          change={`${s.assigned_warehouses} warehouses`}
          changeType="positive"
          icon={Package}
          iconBg="bg-gradient-to-br from-violet-500 to-fuchsia-500"
        />
        <StatCard
          title="Inbound This Period"
          value={overview.inbound.total_qty.toLocaleString()}
          change={`+${overview.inbound.receiving_slips} receiving slips`}
          changeType="positive"
          icon={TrendingUp}
          iconBg="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <StatCard
          title="Outbound This Period"
          value={overview.outbound.total_qty.toLocaleString()}
          change={`${overview.outbound.dispatches} dispatches`}
          changeType="neutral"
          icon={Truck}
          iconBg="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <StatCard
          title="Active Workers"
          value={s.active_workers.toString()}
          change={s.low_stock_count > 0 ? `${s.low_stock_count} low stock alerts` : 'All stock healthy'}
          changeType={s.low_stock_count > 0 ? 'negative' : 'positive'}
          icon={Users}
          iconBg="bg-gradient-to-br from-orange-500 to-amber-500"
        />
      </div>

      {/* Warehouse Capacity */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-3 w-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400" />
          <h2 className="text-lg font-semibold">Warehouse Capacity</h2>
        </div>
        {selectedWarehouseId === 'all' ? (
          warehousesLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <CapacityCardSkeleton />
              <CapacityCardSkeleton />
            </div>
          ) : warehouses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No warehouses available.</p>
          ) : (
            <div className={cn('grid gap-4', warehouses.length > 1 && 'md:grid-cols-2')}>
              {warehouses.map((wh) => (
                <WarehouseCapacityCard key={wh.id} warehouseId={wh.id} warehouseName={wh.name} />
              ))}
            </div>
          )
        ) : (
          <WarehouseCapacityCard
            warehouseId={selectedWarehouseId}
            warehouseName={warehouses.find((w) => w.id === selectedWarehouseId)?.name}
          />
        )}
      </div>

      {/* Charts — modern interactive layout */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Inbound Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400" />
              <h2 className="text-lg font-semibold">Inbound Stock</h2>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-xl font-bold text-emerald-600">{overview.inbound.total_qty.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">total units</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-xl font-bold">{formatCurrency(overview.inbound.total_value)}</p>
                <p className="text-[11px] text-muted-foreground">total value</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {overview.inbound.receiving_slips} receiving slip{overview.inbound.receiving_slips !== 1 ? 's' : ''} this {period}
          </p>

          {/* Chart with Y-axis */}
          <div className="flex gap-2">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between h-[180px] text-[10px] text-muted-foreground pr-1 py-1">
              <span>{maxInbound.toLocaleString()}</span>
              <span>{Math.round(maxInbound * 0.5).toLocaleString()}</span>
              <span>0</span>
            </div>
            {/* Bars */}
            <div className="flex-1">
              {inboundChart.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center border-l border-b border-border/50 text-sm text-muted-foreground">
                  No inbound stock data for this period
                </div>
              ) : (
                <div className="h-[180px] flex items-end gap-1.5 border-l border-b border-border/50 pl-2 pb-1">
                  {inboundChart.map((b, i) => {
                    const pct = maxInbound > 0 ? (b.qty / maxInbound) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 group relative flex flex-col items-center justify-end h-full">
                        {/* Value label on top */}
                        <span className="text-[10px] font-medium text-emerald-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {b.qty > 0 ? b.qty.toLocaleString() : ''}
                        </span>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                          <div className="bg-popover text-popover-foreground text-xs rounded-lg px-3 py-2 shadow-lg border whitespace-nowrap">
                            <div className="font-semibold">{b.label}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-emerald-600 font-medium">{b.qty.toLocaleString()} units</span>
                              <span className="text-muted-foreground">·</span>
                              <span>{formatCurrency(b.value)}</span>
                            </div>
                          </div>
                        </div>
                        {/* Bar */}
                        <div
                          className="w-full bg-gradient-to-t from-emerald-500 to-teal-400 rounded-t-md transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-emerald-500/20 hover:scale-105 origin-bottom"
                          style={{ height: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              {/* X-axis labels */}
              {inboundChart.length > 0 && (
                <div className="flex mt-2 pl-2">
                  {inboundChart.map((b) => (
                    <span key={b.label} className="flex-1 text-center text-[11px] text-muted-foreground font-medium">{b.label}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Outbound Chart */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gradient-to-br from-rose-500 to-orange-400" />
              <h2 className="text-lg font-semibold">Outbound Stock</h2>
            </div>
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-xl font-bold text-rose-600">{overview.outbound.total_qty.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">total units</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="text-xl font-bold">{formatCurrency(overview.outbound.total_value)}</p>
                <p className="text-[11px] text-muted-foreground">total value</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {overview.outbound.dispatches} dispatch{overview.outbound.dispatches !== 1 ? 'es' : ''} this {period}
          </p>

          {/* Chart with Y-axis */}
          <div className="flex gap-2">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between h-[180px] text-[10px] text-muted-foreground pr-1 py-1">
              <span>{maxOutbound.toLocaleString()}</span>
              <span>{Math.round(maxOutbound * 0.5).toLocaleString()}</span>
              <span>0</span>
            </div>
            {/* Bars */}
            <div className="flex-1">
              {outboundChart.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center border-l border-b border-border/50 text-sm text-muted-foreground">
                  No outbound stock data for this period
                </div>
              ) : (
                <div className="h-[180px] flex items-end gap-1.5 border-l border-b border-border/50 pl-2 pb-1">
                  {outboundChart.map((b, i) => {
                    const pct = maxOutbound > 0 ? (b.qty / maxOutbound) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 group relative flex flex-col items-center justify-end h-full">
                        {/* Value label on top */}
                        <span className="text-[10px] font-medium text-rose-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {b.qty > 0 ? b.qty.toLocaleString() : ''}
                        </span>
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-6 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                          <div className="bg-popover text-popover-foreground text-xs rounded-lg px-3 py-2 shadow-lg border whitespace-nowrap">
                            <div className="font-semibold">{b.label}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-rose-600 font-medium">{b.qty.toLocaleString()} units</span>
                              <span className="text-muted-foreground">·</span>
                              <span>{formatCurrency(b.value)}</span>
                            </div>
                          </div>
                        </div>
                        {/* Bar */}
                        <div
                          className="w-full bg-gradient-to-t from-rose-500 to-orange-400 rounded-t-md transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-rose-500/20 hover:scale-105 origin-bottom"
                          style={{ height: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              {/* X-axis labels */}
              {outboundChart.length > 0 && (
                <div className="flex mt-2 pl-2">
                  {outboundChart.map((b) => (
                    <span key={b.label} className="flex-1 text-center text-[11px] text-muted-foreground font-medium">{b.label}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity — same layout as Owner dashboard */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Recent Activity</h2>
            <p className="text-sm text-muted-foreground">Latest warehouse operations</p>
          </div>
          {totalActivity > 5 && (
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleViewAll} disabled={loadingAll}>
              {loadingAll ? 'Loading…' : showAllActivity ? (
                <><ChevronUp className="h-3.5 w-3.5" />Show less</>
              ) : (
                <><ChevronDown className="h-3.5 w-3.5" />View all</>
              )}
            </Button>
          )}
        </div>

        <div className="space-y-1">
          {activity.map((item, index) => {
            const iconColor = {
              scan_session: 'text-blue-500',
              pick_list: 'text-violet-500',
              put_away: 'text-emerald-500',
              receiving_slip: 'text-teal-500',
              dispatch: 'text-orange-500',
              asn_order: 'text-rose-500',
            }[item.type] ?? 'text-muted-foreground';

            const IconComp = {
              scan_session: Package,
              pick_list: Truck,
              put_away: Warehouse,
              receiving_slip: TrendingUp,
              dispatch: Truck,
              asn_order: PackageSearch,
            }[item.type] ?? Box;

            return (
              <React.Fragment key={`${item.type}-${index}`}>
                <div className="flex items-start gap-4 py-3 rounded-lg px-2 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className={cn('mt-0.5', iconColor)}>
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.worker_name ? `by ${item.worker_name}` : item.type.replace(/_/g, ' ')} · {item.status}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{relativeTime(item.created_at)}</p>
                </div>
                {index < activity.length - 1 && <Separator className="my-1" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Quick Actions — same style as Owner dashboard */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QuickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
            >
              <action.icon className="h-5 w-5 text-violet-500" />
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
