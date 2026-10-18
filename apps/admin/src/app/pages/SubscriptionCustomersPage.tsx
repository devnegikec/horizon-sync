import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Eye, Loader2, Plus, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button, DataTable } from '@horizon-sync/ui/components';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Input } from '@horizon-sync/ui/components/ui/input';

import { AssignPlanDialog } from '../components/subscription/AssignPlanDialog';
import { SubscriptionNav } from '../components/subscription/SubscriptionNav';
import { SubscriptionStatusBadge, activationFeeLabel, formatDate } from '../components/subscription/SubscriptionUI';
import { usePermissions } from '../hooks/usePermissions';
import { AdminOrganizationService } from '../services/admin-organization.service';
import { SubscriptionService } from '../services/subscription.service';
import type { AdminOrgListItem } from '../types/organization.types';
import { SYSTEM_ADMIN_PERMISSIONS } from '../types/permissions';
import type { OrganizationSubscription } from '../types/subscription.types';

const PAGE_SIZE = 20;

interface CustomerRow {
  organization: AdminOrgListItem;
  subscription: OrganizationSubscription | null;
}

interface PendingOrganization {
  id: string;
  label: string;
}

function settledValue<T>(result: PromiseSettledResult<T> | undefined): T | null {
  return result?.status === 'fulfilled' ? result.value : null;
}

function planText(subscription: OrganizationSubscription | null): string {
  if (!subscription?.plan) return '—';
  const version = subscription.plan_version;
  return `${subscription.plan.code}${version ? ` · v${version.version}` : ''}`;
}

function orgName(organization: AdminOrgListItem): string {
  return organization.display_name || organization.name;
}

function customerColumns(onManage: (row: CustomerRow) => void, onCreate: (row: CustomerRow) => void): ColumnDef<CustomerRow>[] {
  return [
    {
      id: 'organization',
      header: 'Organization',
      cell: ({ row }) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{orgName(row.original.organization)}</p>
          <p className="font-mono text-xs text-muted-foreground">{row.original.organization.slug}</p>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Subscription',
      cell: ({ row }) => <SubscriptionStatusBadge status={row.original.subscription?.status} />,
    },
    {
      id: 'plan',
      header: 'Plan',
      cell: ({ row }) => <span className="text-xs">{planText(row.original.subscription)}</span>,
    },
    {
      id: 'next_invoice',
      header: 'Next invoice',
      cell: ({ row }) => <span className="text-xs">{formatDate(row.original.subscription?.next_invoice_date)}</span>,
    },
    {
      id: 'activation',
      header: 'Activation',
      cell: ({ row }) => <span className="text-xs">{activationFeeLabel(row.original.subscription?.activation_fee_status)}</span>,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {row.original.subscription ? (
            <Button variant="ghost"
              size="sm"
              className="h-7 px-2"
              aria-label={`Manage subscription for ${orgName(row.original.organization)}`}
              onClick={() => onManage(row.original)}>
              <Eye className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              aria-label={`Create subscription for ${orgName(row.original.organization)}`}
              onClick={() => onCreate(row.original)}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Create
            </Button>
          )}
        </div>
      ),
    },
  ];
}

export function SubscriptionCustomersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission(SYSTEM_ADMIN_PERMISSIONS.BILLING_CREATE);
  const [rows, setRows] = React.useState<CustomerRow[]>([]);
  const [search, setSearch] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [page, setPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [pendingOrganization, setPendingOrganization] = React.useState<PendingOrganization | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await AdminOrganizationService.list({ search: query || undefined, page, page_size: PAGE_SIZE });
        const organizations = response.organizations ?? [];
        const settled = await Promise.allSettled(organizations.map((organization) => SubscriptionService.getSubscription(organization.id)));
        if (cancelled) return;
        setRows(organizations.map((organization, index) => ({ organization, subscription: settledValue(settled[index]) })));
        setTotalItems(response.pagination?.total_items ?? organizations.length);
      } catch {
        if (cancelled) return;
        setRows([]);
        setError('Could not load organizations.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [query, page, reloadToken]);

  const columns = React.useMemo(
    () =>
      customerColumns(
        (row) => navigate(`/subscriptions/customers/${row.organization.id}`),
        (row) => {
          setPendingOrganization({ id: row.organization.id, label: orgName(row.organization) });
          setCreateOpen(true);
        },
      ),
    [navigate],
  );

  const openCreate = () => {
    setPendingOrganization(null);
    setCreateOpen(true);
  };

  const handleCreated = (subscription: OrganizationSubscription) => {
    setCreateOpen(false);
    navigate(`/subscriptions/customers/${subscription.organization_id}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscription customers</h1>
          <p className="text-sm text-muted-foreground">Provision a plan, activate billing and manage existing contracts.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setReloadToken((token) => token + 1)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          {canManage && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" />
              New subscription
            </Button>
          )}
        </div>
      </div>

      <SubscriptionNav />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="h-9 pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search organizations"
              aria-label="Search organizations" />
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
              data={rows}
              config={{
                showSerialNumber: true,
                enableRowSelection: false,
                enableFiltering: false,
                serverPagination: {
                  totalItems,
                  currentPage: page,
                  pageSize: PAGE_SIZE,
                  onPageChange: (nextPage) => setPage(nextPage),
                },
              }} />
          )}

          {!loading && !error && rows.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">No organizations match this search.</p>
          )}
        </CardContent>
      </Card>

      <AssignPlanDialog open={createOpen}
        onOpenChange={setCreateOpen}
        organizationId={pendingOrganization?.id}
        organizationLabel={pendingOrganization?.label}
        onCreated={handleCreated} />
    </div>
  );
}
