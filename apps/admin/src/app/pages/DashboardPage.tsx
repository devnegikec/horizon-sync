import * as React from 'react';
import { useState } from 'react';

import {
  Building2, Users, DollarSign, Activity, ArrowUpRight,
  RefreshCw, FileText, CreditCard,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { cn } from '@horizon-sync/ui/lib';

import { useDashboardOverview } from '../hooks/useDashboardOverview';
import type { DashboardFilters, ActivityLogItem } from '../types';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  loading?: boolean;
}

function StatCard({ title, value, icon: Icon, iconBg, loading }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:shadow-[#3058EE]/5 hover:border-[#3058EE]/20">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="h-9 w-24" />
          ) : (
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          )}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110', iconBg)}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#3058EE]/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );
}

function formatRevenue(value: string | undefined): string {
  if (!value) return '0';
  const num = parseFloat(value);
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

function getActivityIcon(action: string): { icon: React.ComponentType<{ className?: string }>; color: string } {
  const lower = action.toLowerCase();
  if (lower.includes('user') || lower.includes('login')) return { icon: Users, color: 'text-blue-500' };
  if (lower.includes('org')) return { icon: Building2, color: 'text-violet-500' };
  if (lower.includes('invoice')) return { icon: FileText, color: 'text-emerald-500' };
  if (lower.includes('payment')) return { icon: CreditCard, color: 'text-amber-500' };
  return { icon: Activity, color: 'text-slate-500' };
}

function formatActivityTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ActivityFeed({ items, loading }: { items: ActivityLogItem[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 py-3 px-2">
            <Skeleton className="h-5 w-5 rounded" />
            <div className="flex-1 space-y-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div>
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No recent activity</p>;
  }

  return (
    <div className="space-y-1">
      {items.map((item, index) => {
        const { icon: ItemIcon, color } = getActivityIcon(item.action);
        return (
          <React.Fragment key={item.id}>
            <div className="flex items-start gap-4 py-3 rounded-lg px-2 hover:bg-accent/50 transition-colors">
              <div className={cn('mt-0.5', color)}><ItemIcon className="h-5 w-5" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.action}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {item.resource_type ? `${item.resource_type}` : ''}{item.ip_address ? ` · ${item.ip_address}` : ''}
                </p>
              </div>
              <p className="text-xs text-muted-foreground whitespace-nowrap">{formatActivityTime(item.created_at)}</p>
            </div>
            {index < items.length - 1 && <Separator className="my-1" />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: 'Manage Organizations', icon: Building2, path: '/organizations' },
  { label: 'Manage Users', icon: Users, path: '/users' },
  { label: 'View Invoices', icon: FileText, path: '/invoices' },
  { label: 'View Payments', icon: CreditCard, path: '/payments' },
];

export function DashboardPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<DashboardFilters>({});
  const { data, isLoading, isError, refetch } = useDashboardOverview(filters);

  const handleDateChange = (field: 'date_from' | 'date_to', value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }));
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-destructive text-lg">Failed to load dashboard data.</p>
        <Button onClick={() => refetch()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's an overview of your platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input type="date" value={filters.date_from ?? ''} onChange={(e) => handleDateChange('date_from', e.target.value)} className="w-36" />
          <Input type="date" value={filters.date_to ?? ''} onChange={(e) => handleDateChange('date_to', e.target.value)} className="w-36" />
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} /> Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Total Organizations', value: data?.organizations.total ?? 0, icon: Building2, iconBg: 'bg-gradient-to-br from-violet-500 to-fuchsia-500' },
          { title: 'Active Organizations', value: data?.organizations.active ?? 0, icon: Building2, iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
          { title: 'Total Users', value: data?.users.total ?? 0, icon: Users, iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600' },
          { title: 'Active Users', value: data?.users.active ?? 0, icon: Users, iconBg: 'bg-gradient-to-br from-[#3058EE] to-[#7D97F6]' },
        ].map((stat, index) => (
          <div key={stat.title} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
            <StatCard {...stat} loading={isLoading} />
          </div>
        ))}
      </div>

      {/* Revenue Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: 'Total Invoiced', value: formatRevenue(data?.revenue.total_invoiced), icon: FileText, iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600' },
          { title: 'Total Outstanding', value: formatRevenue(data?.revenue.total_outstanding), icon: DollarSign, iconBg: 'bg-gradient-to-br from-amber-500 to-orange-500' },
          { title: 'Total Received', value: formatRevenue(data?.revenue.total_received), icon: CreditCard, iconBg: 'bg-gradient-to-br from-[#3058EE] to-[#7D97F6]' },
        ].map((stat, index) => (
          <div key={stat.title} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${(index + 4) * 100}ms` }}>
            <StatCard {...stat} loading={isLoading} />
          </div>
        ))}
      </div>

      {/* Activity + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Recent Activity */}
        <div className="lg:col-span-4 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <p className="text-sm text-muted-foreground">Latest platform events</p>
            </div>
          </div>
          <ActivityFeed items={data?.recent_activity ?? []} loading={isLoading} />
        </div>

        {/* Quick Actions + Trial Orgs */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-xl border border-border bg-gradient-to-br from-[#3058EE]/5 via-transparent to-[#7D97F6]/5 p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid gap-3 grid-cols-2">
              {QUICK_ACTIONS.map((action) => (
                <Button key={action.label} variant="outline" className="h-auto py-4 flex-col gap-2 hover:border-[#3058EE]/50 hover:bg-[#3058EE]/5 transition-all"
                  onClick={() => navigate(action.path)}>
                  <action.icon className="h-5 w-5 text-[#3058EE]" />
                  <span className="text-xs">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Trial Orgs Card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Trial Organizations</h2>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            {isLoading ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{data?.organizations.on_trial ?? 0}</span>
                <span className="text-sm text-muted-foreground">organizations on trial</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
