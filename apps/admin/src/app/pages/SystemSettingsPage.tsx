import { 
  Shield, 
  Building2, 
  Activity, 
  TrendingUp, 
  Users, 
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@horizon-sync/ui/components/ui/card';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { Alert, AlertDescription } from '@horizon-sync/ui/components/ui/alert';
import { cn } from '@horizon-sync/ui/lib';

import { MasterOrgSetup } from '../components/MasterOrgSetup';
import { usePermissions } from '../hooks/usePermissions';
import { useSystemStats, useSystemHealth } from '../hooks/useSystemSettings';

interface SystemStats {
  total_organizations: number;
  active_organizations: number;
  overdue_organizations: number;
  total_users: number;
  active_users: number;
  total_invoices: number;
  overdue_invoices: number;
  total_revenue: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'error';
  services: {
    database: 'ok' | 'error';
    identity_service: 'ok' | 'error';
    core_service: 'ok' | 'error';
    search_service: 'ok' | 'error';
  };
  timestamp: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  trend?: {
    value: number;
    label: string;
  };
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor, trend }: StatCardProps) {
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {trend && (
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1" />
                {trend.value > 0 ? '+' : ''}{trend.value} {trend.label}
              </div>
            )}
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SystemHealthCard({ health }: { health: SystemHealth | null }) {
  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: 'ok' | 'error') => {
    return status === 'ok' ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (status: 'ok' | 'error') => {
    return status === 'ok' ? CheckCircle2 : AlertCircle;
  };

  const getOverallStatusColor = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          System Health
        </CardTitle>
        <CardDescription>
          <div className="flex items-center gap-2">
            <span>Overall Status:</span>
            <Badge 
              variant={health.status === 'healthy' ? 'default' : 'destructive'}
              className={cn(
                health.status === 'warning' && 'bg-yellow-100 text-yellow-800 border-yellow-200'
              )}
            >
              {health.status.charAt(0).toUpperCase() + health.status.slice(1)}
            </Badge>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Object.entries(health.services).map(([service, status]) => {
            const Icon = getStatusIcon(status);
            return (
              <div key={service} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', getStatusColor(status))} />
                  <span className="text-sm font-medium">
                    {service.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <Badge variant={status === 'ok' ? 'default' : 'destructive'}>
                  {status.toUpperCase()}
                </Badge>
              </div>
            );
          })}
          <div className="pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last checked: {new Date(health.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SystemSettingsPage() {
  const { canAccessSystemSettings, hasSystemAdminMaster, loading: permissionsLoading } = usePermissions();
  
  // Use hooks for data fetching
  const { data: stats, isLoading: statsLoading } = useSystemStats();
  const { data: health, isLoading: healthLoading } = useSystemHealth();

  const loading = statsLoading || healthLoading;

  if (permissionsLoading) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!canAccessSystemSettings) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground mt-1">
            System administration and configuration management
          </p>
        </div>
        
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You do not have permission to access system settings. Please contact your system administrator.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground mt-1">
          System administration and configuration management
        </p>
      </div>

      {/* System Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))
        ) : stats ? (
          <>
            <StatCard
              title="Total Organizations"
              value={stats.total_organizations}
              icon={Building2}
              iconBg="bg-blue-500"
              iconColor="text-white"
            />
            <StatCard
              title="Active Users"
              value={stats.active_users}
              icon={Users}
              iconBg="bg-green-500"
              iconColor="text-white"
            />
            <StatCard
              title="Total Revenue"
              value={`$${parseFloat(stats.total_revenue).toLocaleString()}`}
              icon={DollarSign}
              iconBg="bg-emerald-500"
              iconColor="text-white"
            />
            <StatCard
              title="Overdue Invoices"
              value={stats.overdue_invoices}
              icon={AlertCircle}
              iconBg="bg-red-500"
              iconColor="text-white"
            />
          </>
        ) : null}
      </div>

      {/* System Health and Master Org Setup */}
      <div className="grid gap-6 md:grid-cols-3">
        <SystemHealthCard health={health || null} />
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <div className="text-sm font-medium">Active Organizations</div>
                <div className="text-2xl font-bold">{stats?.active_organizations || 0}</div>
                <div className="text-xs text-muted-foreground">
                  {stats?.overdue_organizations || 0} overdue
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">System Status</div>
                <Badge 
                  variant={health?.status === 'healthy' ? 'default' : 'destructive'}
                  className={cn(
                    health?.status === 'warning' && 'bg-yellow-100 text-yellow-800 border-yellow-200'
                  )}
                >
                  {health?.status?.charAt(0).toUpperCase()}{health?.status?.slice(1)}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  All services operational
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Master Organization Setup */}
      <MasterOrgSetup />
    </div>
  );
}