import * as React from 'react';

import { ArrowUpRight, ArrowDownRight, Package, Users, DollarSign, Activity, TrendingUp, Calendar } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import { cn } from '@horizon-sync/ui/lib';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
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
            {changeType === 'positive' ? <ArrowUpRight className="h-4 w-4 text-emerald-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
            <span className={cn('text-sm font-medium', changeType === 'positive' ? 'text-emerald-500' : 'text-red-500')}>{change}</span>
            <span className="text-sm text-muted-foreground">vs last month</span>
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

const stats: StatCardProps[] = [
  {
    title: 'Total Revenue',
    value: '$45,231.89',
    change: '+20.1%',
    changeType: 'positive',
    icon: DollarSign,
    iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
  },
  {
    title: 'Active Users',
    value: '2,350',
    change: '+15.3%',
    changeType: 'positive',
    icon: Users,
    iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600',
  },
  {
    title: 'Inventory Items',
    value: '12,234',
    change: '-5.2%',
    changeType: 'negative',
    icon: Package,
    iconBg: 'bg-gradient-to-br from-violet-500 to-fuchsia-500',
  },
  {
    title: 'System Health',
    value: '99.9%',
    change: '+0.1%',
    changeType: 'positive',
    icon: Activity,
    iconBg: 'bg-gradient-to-br from-orange-500 to-amber-500',
  },
];

const QuickActions: { label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'Add Inventory', icon: Package },
  { label: 'Create User', icon: Users },
  { label: 'View Reports', icon: TrendingUp },
  { label: 'System Settings', icon: Activity },
];

interface RecentActivityItem {
  id: string;
  action: string;
  description: string;
  time: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

const recentActivity: RecentActivityItem[] = [
  {
    id: '1',
    action: 'New order received',
    description: 'Order #12345 from Acme Corp',
    time: '2 min ago',
    icon: Package,
    iconColor: 'text-violet-500',
  },
  {
    id: '2',
    action: 'User registration',
    description: 'Sarah Johnson joined the platform',
    time: '15 min ago',
    icon: Users,
    iconColor: 'text-blue-500',
  },
  {
    id: '3',
    action: 'Revenue milestone',
    description: 'Monthly target achieved',
    time: '1 hour ago',
    icon: TrendingUp,
    iconColor: 'text-emerald-500',
  },
  {
    id: '4',
    action: 'Scheduled maintenance',
    description: 'System update completed',
    time: '3 hours ago',
    icon: Calendar,
    iconColor: 'text-orange-500',
  },
];

export function DashboardHome() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s an overview of your platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Jan 1 - Jan 20, 2026</span>
            <span className="sm:hidden">Date Range</span>
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg shadow-violet-500/25">
            <TrendingUp className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div key={stat.title} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Chart Area */}
        <div className="lg:col-span-4 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Revenue Overview</h2>
              <p className="text-sm text-muted-foreground">Monthly revenue trends</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-xs">
                Week
              </Button>
              <Button variant="ghost" size="sm" className="text-xs bg-accent">
                Month
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                Year
              </Button>
            </div>
          </div>

          {/* Placeholder Chart */}
          <div className="h-[300px] flex items-end justify-between gap-2 px-4">
            {[40, 65, 45, 80, 55, 70, 85, 60, 75, 90, 70, 95].map((height, index) => (
              <div key={index}
                className="flex-1 bg-gradient-to-t from-violet-500 to-fuchsia-500 rounded-t-md opacity-80 hover:opacity-100 transition-all duration-300 cursor-pointer hover:scale-y-105 origin-bottom"
                style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-4 px-4 text-xs text-muted-foreground">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month) => (
              <span key={month}>{month}</span>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <p className="text-sm text-muted-foreground">Latest platform events</p>
            </div>
            <Button variant="ghost" size="sm" className="text-xs">
              View all
            </Button>
          </div>

          <div className="space-y-1">
            {recentActivity.map((item, index) => (
              <React.Fragment key={item.id}>
                <div className="flex items-start gap-4 py-3 rounded-lg px-2 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className={cn('mt-0.5', item.iconColor)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{item.time}</p>
                </div>
                {index < recentActivity.length - 1 && <Separator className="my-1" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-violet-500/5 via-transparent to-fuchsia-500/5 p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {QuickActions.map((action) => (
            <Button key={action.label}
              variant="outline"
              className="h-auto py-4 flex-col gap-2 hover:border-violet-500/50 hover:bg-violet-500/5 transition-all">
              <action.icon className="h-5 w-5 text-violet-500" />
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
