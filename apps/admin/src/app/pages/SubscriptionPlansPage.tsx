import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Layers, Loader2, Plus, RefreshCw, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button, DataTable } from '@horizon-sync/ui/components';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import { CreatePlanDialog } from '../components/subscription/CreatePlanDialog';
import { SubscriptionNav } from '../components/subscription/SubscriptionNav';
import { BillingReadOnlyNotice, Money, cadenceLabel, formatDate, formatDecimal } from '../components/subscription/SubscriptionUI';
import { usePermissions } from '../hooks/usePermissions';
import { SubscriptionApiError, SubscriptionService } from '../services/subscription.service';
import type { BillingCadence, SubscriptionPlan } from '../types/subscription.types';
import { BILLING_WRITE_PERMISSION_CODES } from '../utils/permissions';

const PAGE_SIZE = 20;

interface PlanFilters {
  q: string;
  cadence: string;
  scope: string;
  active: string;
}

const INITIAL_FILTERS: PlanFilters = { q: '', cadence: 'all', scope: 'all', active: 'true' };

function ScopeCell({ plan }: { plan: SubscriptionPlan }) {
  if (!plan.organization_id) return <span className="text-xs text-muted-foreground">Global</span>;
  return <span className="text-xs">{plan.organization_name || 'Organization'}</span>;
}

function planColumns(onOpen: (plan: SubscriptionPlan) => void, onManage: (plan: SubscriptionPlan) => void): ColumnDef<SubscriptionPlan>[] {
  return [
    {
      accessorKey: 'code',
      header: 'Code',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="font-mono text-xs font-medium">{row.original.code}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.name}</p>
        </div>
      ),
    },
    { id: 'scope', header: 'Scope', cell: ({ row }) => <ScopeCell plan={row.original} /> },
    {
      id: 'cadence',
      header: 'Cadence',
      cell: ({ row }) => <span className="text-sm">{cadenceLabel(row.original.published_version?.billing_cadence)}</span>,
    },
    {
      id: 'base_price',
      header: 'Base price',
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.published_version ? <Money value={row.original.published_version.base_price} currency={row.original.currency} /> : '—'}
        </span>
      ),
    },
    {
      id: 'included_credits',
      header: 'Included credits',
      cell: ({ row }) => <span className="text-sm">{formatDecimal(row.original.published_version?.included_credits, 2)}</span>,
    },
    {
      id: 'id_weight',
      header: 'ID weight',
      cell: ({ row }) => <span className="font-mono text-xs">{formatDecimal(row.original.published_version?.id_weight, 6)}</span>,
    },
    {
      id: 'published_version',
      header: 'Published',
      cell: ({ row }) =>
        row.original.published_version ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium">v{row.original.published_version.version}</span>
            <span className="text-xs text-muted-foreground">{formatDate(row.original.published_version.effective_from)}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Not published</span>
        ),
    },
    {
      id: 'drafts',
      header: 'Drafts',
      cell: ({ row }) =>
        row.original.draft_version_count > 0 ? (
          <span className="text-xs font-medium text-amber-600">{row.original.draft_version_count} draft</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'secondary'}>{row.original.is_active ? 'Active' : 'Inactive'}</Badge>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {row.original.organization_id && (
            <Button variant="ghost"
              size="sm"
              className="h-7 px-2"
              aria-label={`Manage subscription for ${row.original.organization_name ?? row.original.code}`}
              onClick={() => onManage(row.original)}>
              <Settings2 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost"
            size="sm"
            className="h-7 px-2"
            aria-label={`Open plan ${row.original.code}`}
            onClick={() => onOpen(row.original)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}

export function SubscriptionPlansPage() {
  const navigate = useNavigate();
  const { hasAnyPermission, loading: permissionsLoading } = usePermissions();
  const canManage = hasAnyPermission(BILLING_WRITE_PERMISSION_CODES);
  const [filters, setFilters] = React.useState<PlanFilters>(INITIAL_FILTERS);
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [plans, setPlans] = React.useState<SubscriptionPlan[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    const timer = setTimeout(() => setFilters((current) => ({ ...current, q: search.trim() })), 300);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    SubscriptionService.listPlans({
      q: filters.q || undefined,
      billing_cadence: filters.cadence === 'all' ? undefined : (filters.cadence as BillingCadence),
      active: filters.active === 'all' ? undefined : filters.active === 'true',
      page,
      page_size: PAGE_SIZE,
    })
      .then((response) => {
        if (cancelled) return;
        setPlans(response.items ?? []);
        setTotalItems(response.pagination?.total_items ?? response.items?.length ?? 0);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setPlans([]);
        setError(err instanceof SubscriptionApiError ? err.message : 'Could not load plans.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filters, page, reloadToken]);

  const columns = React.useMemo(
    () =>
      planColumns(
        (plan) => navigate(`/subscriptions/plans/${plan.id}`),
        (plan) => navigate(`/subscriptions/customers/${plan.organization_id}`),
      ),
    [navigate],
  );

  const visiblePlans = React.useMemo(() => {
    if (filters.scope === 'all') return plans;
    const wantsOrganization = filters.scope === 'organization';
    return plans.filter((plan) => Boolean(plan.organization_id) === wantsOrganization);
  }, [plans, filters.scope]);

  const resetPage = () => setPage(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription plans</h1>
          <p className="text-sm text-muted-foreground">
            Versioned plan catalog. Pricing, included credits and ID weight are snapshot per published version.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setReloadToken((token) => token + 1)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <Button size="sm" variant="outline" onClick={() => navigate('/subscriptions/customers')}>
            <Plus className="mr-2 h-4 w-4" />
            New subscription
          </Button>
          {canManage && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New plan
            </Button>
          )}
        </div>
      </div>

      <SubscriptionNav />

      {!permissionsLoading && !canManage && <BillingReadOnlyNotice requiredPermission="system_admin.billing_create" />}

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input className="h-9 w-64"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                resetPage();
              }}
              placeholder="Search code or name"
              aria-label="Search plans" />
            <Select value={filters.cadence}
              onValueChange={(value) => {
                setFilters((current) => ({ ...current, cadence: value }));
                resetPage();
              }}>
              <SelectTrigger className="h-9 w-40" aria-label="Filter by cadence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All cadences</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.scope}
              onValueChange={(value) => {
                setFilters((current) => ({ ...current, scope: value }));
                resetPage();
              }}>
              <SelectTrigger className="h-9 w-40" aria-label="Filter by scope">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All scopes</SelectItem>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="organization">Organization</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.active}
              onValueChange={(value) => {
                setFilters((current) => ({ ...current, active: value }));
                resetPage();
              }}>
              <SelectTrigger className="h-9 w-36" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => setReloadToken((token) => token + 1)}>
                Retry
              </Button>
            </div>
          ) : (
            <DataTable columns={columns}
              data={visiblePlans}
              config={{
                showSerialNumber: true,
                enableRowSelection: false,
                enableFiltering: false,
                serverPagination: { totalItems, currentPage: page, pageSize: PAGE_SIZE, onPageChange: setPage },
              }} />
          )}

          {!loading && !error && visiblePlans.length === 0 && (
            <div className="flex flex-col items-center gap-3 pb-6 text-center">
              <Layers className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No plans match these filters.</p>
              {canManage && (
                <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create the first plan
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <CreatePlanDialog open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(plan) => navigate(`/subscriptions/plans/${plan.id}`)} />
    </div>
  );
}
