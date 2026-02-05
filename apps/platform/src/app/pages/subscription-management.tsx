import * as React from 'react';

import { CreditCard, Users, Activity, Calendar, DollarSign, AlertCircle, TrendingUp, Download } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { cn } from '@horizon-sync/ui/lib';

import { AddSubscriptionModal } from '../components/AddSubscriptionModal';
import { useAuth } from '../hooks';
import { SubscriptionService, Subscription } from '../services/subscription.service';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconColor?: string;
}

function StatCard({ title, value, icon: Icon, trend, iconColor }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-2">
          <Icon className={cn('h-5 w-5', iconColor || 'text-muted-foreground')} />
          {trend && (
            <span className={cn('text-xs font-medium flex items-center', trend.isPositive ? 'text-emerald-600' : 'text-red-600')}>
              {trend.isPositive ? '+' : ''}
              {trend.value}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}

function SubscriptionCard({ subscription }: { subscription: Subscription }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'trial':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'past_due':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <Card className="overflow-hidden border-border hover:border-border/80 transition-all">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-semibold">Acme Corporation</h3>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                {subscription.plan.name}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Tenant ID: {subscription.id.split('-')[0].toUpperCase()}</p>
              <p>
                Billing Cycle: <span className="capitalize">{subscription.billing_cycle}</span>
              </p>
            </div>
          </div>
          <Badge className={cn('self-start capitalize', getStatusColor(subscription.status))}>{subscription.status}</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg mb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              Monthly Cost
            </div>
            <p className="font-semibold text-lg">$499</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Start Date
            </div>
            <p className="font-semibold">{formatDate(subscription.starts_at)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Next Billing
            </div>
            <p className="font-semibold">{formatDate(subscription.next_billing_date)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              Payment Method
            </div>
            <p className="font-semibold">Visa •••• 4242</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Users</span>
              <span className="font-medium">
                {subscription.current_usage.users} / {subscription.limits.max_users}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-violet-600 rounded-full"
                style={{ width: `${(subscription.current_usage.users / subscription.limits.max_users) * 100}%` }}/>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Storage (GB)</span>
              <span className="font-medium">
                {(subscription.current_usage.storage_mb / 1024).toFixed(1)} / {subscription.limits.max_storage_gb}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full"
                style={{ width: `${(subscription.current_usage.storage_mb / 1024 / subscription.limits.max_storage_gb) * 100}%` }}/>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Teams</span>
              <span className="font-medium">
                {subscription.current_usage.teams} / {subscription.limits.max_teams}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${(subscription.current_usage.teams / subscription.limits.max_teams) * 100}%` }}/>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-border">
          <Button className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white">
            <TrendingUp className="h-4 w-4 mr-2" />
            Upgrade Plan
          </Button>
          <Button variant="outline" className="flex-1">
            <CreditCard className="h-4 w-4 mr-2" />
            Process Payment
          </Button>
          <Button className="flex-1 bg-emerald-800 hover:bg-emerald-900 text-white">
            <Activity className="h-4 w-4 mr-2" />
            View Usage
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function SubscriptionManagementPage() {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { accessToken } = useAuth();

  const fetchSubscriptions = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      setIsLoading(true);
      const data = await SubscriptionService.getCurrentSubscriptions(accessToken);
      setSubscriptions(data);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Subscription Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage tenant subscriptions, billing cycles, and usage tracking with integrated payment processing
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <AddSubscriptionModal onSuccess={fetchSubscriptions} />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Revenue" value="$28,450" icon={DollarSign} iconColor="text-emerald-600" trend={{ value: '12.5%', isPositive: true }} />
        <StatCard title="Active Subscriptions"
          value={subscriptions.filter((s) => s.status === 'active').length.toString()}
          icon={Users}
          iconColor="text-blue-600"
          trend={{ value: '8', isPositive: true }}/>
        <StatCard title="Failed Payments" value="1" icon={AlertCircle} iconColor="text-red-600" trend={{ value: '3', isPositive: false }} />
        <StatCard title="Avg Usage Rate" value="68%" icon={Activity} iconColor="text-violet-600" trend={{ value: '5.2%', isPositive: true }} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg border border-border">
        <Input placeholder="Search organizations..." className="sm:w-[300px]" />
        <Select defaultValue="all-plans">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Plans" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-plans">All Plans</SelectItem>
            <SelectItem value="pro">Professional</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all-status">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-status">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button variant="ghost" className="text-muted-foreground">
          Reset Filters
        </Button>
      </div>

      {/* Subscriptions List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading subscriptions...</div>
        ) : (
          subscriptions.map((subscription) => <SubscriptionCard key={subscription.id} subscription={subscription} />)
        )}
      </div>
    </div>
  );
}
