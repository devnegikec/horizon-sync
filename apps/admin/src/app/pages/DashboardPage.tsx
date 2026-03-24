import { useState } from 'react';

import {
  Building2,
  Users,
  DollarSign,
  Activity,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@horizon-sync/ui/components/ui/card';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components/ui/table';

import { useDashboardOverview } from '../hooks/useDashboardOverview';
import type { DashboardFilters, DashboardOverview, ActivityLogItem } from '../types';

function MetricCard({ title, value, icon, loading }: {
  title: string;
  value?: string | number;
  icon: React.ReactNode;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <div className="text-2xl font-bold">{value ?? 0}</div>
        )}
      </CardContent>
    </Card>
  );
}

const orgIcon = <Building2 className="h-4 w-4 text-muted-foreground" />;
const userIcon = <Users className="h-4 w-4 text-muted-foreground" />;
const dollarIcon = <DollarSign className="h-4 w-4 text-muted-foreground" />;

function formatRevenue(value: string): string {
  return parseFloat(value).toLocaleString();
}

function OrganizationMetrics({ data, loading }: { data?: DashboardOverview; loading: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard title="Total Organizations" value={data?.organizations.total} icon={orgIcon} loading={loading} />
      <MetricCard title="Active Organizations" value={data?.organizations.active} icon={orgIcon} loading={loading} />
      <MetricCard title="On Trial" value={data?.organizations.on_trial} icon={orgIcon} loading={loading} />
    </div>
  );
}

function UserMetrics({ data, loading }: { data?: DashboardOverview; loading: boolean }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <MetricCard title="Total Users" value={data?.users.total} icon={userIcon} loading={loading} />
      <MetricCard title="Active Users" value={data?.users.active} icon={userIcon} loading={loading} />
    </div>
  );
}

function RevenueMetrics({ data, loading }: { data?: DashboardOverview; loading: boolean }) {
  const invoiced = data?.revenue.total_invoiced != null ? formatRevenue(data.revenue.total_invoiced) : undefined;
  const outstanding = data?.revenue.total_outstanding != null ? formatRevenue(data.revenue.total_outstanding) : undefined;
  const received = data?.revenue.total_received != null ? formatRevenue(data.revenue.total_received) : undefined;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard title="Total Invoiced" value={invoiced} icon={dollarIcon} loading={loading} />
      <MetricCard title="Total Outstanding" value={outstanding} icon={dollarIcon} loading={loading} />
      <MetricCard title="Total Received" value={received} icon={dollarIcon} loading={loading} />
    </div>
  );
}

function RecentActivityTable({ items }: { items: ActivityLogItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Resource Type</TableHead>
          <TableHead>IP Address</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.action}</TableCell>
            <TableCell>{item.resource_type ?? '—'}</TableCell>
            <TableCell>{item.ip_address ?? '—'}</TableCell>
            <TableCell>{item.created_at}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function ActivitySection({ data, loading }: { data?: DashboardOverview; loading: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <RecentActivityTable items={data?.recent_activity ?? []} />
        )}
      </CardContent>
    </Card>
  );
}

function DateFilters({ filters, onChange }: {
  filters: DashboardFilters;
  onChange: (field: 'date_from' | 'date_to', value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input type="date"
        placeholder="From"
        value={filters.date_from ?? ''}
        onChange={(e) => onChange('date_from', e.target.value)}
        className="w-40" />
      <Input type="date"
        placeholder="To"
        value={filters.date_to ?? ''}
        onChange={(e) => onChange('date_to', e.target.value)}
        className="w-40" />
    </div>
  );
}

export function DashboardPage() {
  const [filters, setFilters] = useState<DashboardFilters>({});
  const { data, isLoading, isError, refetch } = useDashboardOverview(filters);

  const handleDateChange = (field: 'date_from' | 'date_to', value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value || undefined }));
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-destructive text-lg">Failed to load dashboard data.</p>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <DateFilters filters={filters} onChange={handleDateChange} />
      </div>
      <OrganizationMetrics data={data} loading={isLoading} />
      <UserMetrics data={data} loading={isLoading} />
      <RevenueMetrics data={data} loading={isLoading} />
      <ActivitySection data={data} loading={isLoading} />
    </div>
  );
}
