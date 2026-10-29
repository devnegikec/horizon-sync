import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, Download, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button, DataTable } from '@horizon-sync/ui/components';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import { SubscriptionNav } from '../components/subscription/SubscriptionNav';
import {
  CreditQuantity,
  SubscriptionStatusBadge,
  downloadCsv,
  formatDate,
} from '../components/subscription/SubscriptionUI';
import { SubscriptionApiError, SubscriptionService } from '../services/subscription.service';
import type { CreditExposureItem, CreditExposureResponse } from '../types/subscription.types';

const PAGE_SIZE = 25;

function exposureColumns(onOpen: (item: CreditExposureItem) => void): ColumnDef<CreditExposureItem>[] {
  return [
    {
      accessorKey: 'organization_name',
      header: 'Organization',
      cell: ({ row }) => (
        <button type="button"
          className="text-left text-sm font-medium hover:underline"
          onClick={() => onOpen(row.original)}>
          {row.original.organization_name}
        </button>
      ),
    },
    {
      id: 'status',
      header: 'Subscription',
      cell: ({ row }) => <SubscriptionStatusBadge status={row.original.subscription_status} />,
    },
    {
      accessorKey: 'available',
      header: 'Available',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          <CreditQuantity value={row.original.available} />
        </span>
      ),
    },
    {
      id: 'reserved',
      header: 'Reserved',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-muted-foreground">
          <CreditQuantity value={row.original.reserved} />
        </span>
      ),
    },
    {
      id: 'expiring_30_days',
      header: 'Expiring in window',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums text-amber-600">
          <CreditQuantity value={row.original.expiring_30_days} />
        </span>
      ),
    },
    {
      id: 'earliest_expiry',
      header: 'Earliest expiry',
      cell: ({ row }) => <span className="text-xs">{formatDate(row.original.earliest_expiry)}</span>,
    },
    {
      id: 'overdue_invoices',
      header: 'Overdue',
      cell: ({ row }) =>
        row.original.overdue_invoices > 0 ? (
          <span className="text-sm font-medium text-destructive">{row.original.overdue_invoices}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    {
      id: 'outstanding_amount',
      header: 'Outstanding',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          <CreditQuantity value={row.original.outstanding_amount} />
        </span>
      ),
    },
  ];
}

function exposureTotal(data: CreditExposureResponse | null, fallback: number): number {
  return data?.pagination?.total_items ?? fallback;
}

function isExposureEmpty(loading: boolean, error: string | null, count: number): boolean {
  return !loading && !error && count === 0;
}

function Totals({ data }: { data: CreditExposureResponse | null }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Organizations</p>
          <p className="text-2xl font-bold">{data?.totals?.organizations ?? 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total available credits</p>
          <p className="text-2xl font-bold">
            <CreditQuantity value={data?.totals?.available ?? '0'} />
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Expiring in window</p>
          <p className="text-2xl font-bold text-amber-600">
            <CreditQuantity value={data?.totals?.expiring_30_days ?? '0'} />
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function SubscriptionExposurePage() {
  const navigate = useNavigate();
  const [days, setDays] = React.useState('30');
  const [status, setStatus] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [data, setData] = React.useState<CreditExposureResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    SubscriptionService.getExposure({
      expiring_within_days: Number(days),
      status: status === 'all' ? undefined : status,
      page,
      page_size: PAGE_SIZE,
    })
      .then((response) => {
        if (!cancelled) setData(response);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setData(null);
        setError(err instanceof SubscriptionApiError ? err.message : 'Could not load credit exposure.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days, status, page]);

  const columns = React.useMemo(() => exposureColumns((item) => navigate(`/subscriptions/customers/${item.organization_id}`)), [navigate]);
  const items = data?.items ?? [];

  const handleExport = () => {
    downloadCsv(
      `credit-exposure-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Organization', 'Organization ID', 'Status', 'Available', 'Reserved', 'Expiring in window', 'Earliest expiry', 'Overdue invoices', 'Outstanding'],
      items.map((item) => [
        item.organization_name,
        item.organization_id,
        item.subscription_status ?? '',
        item.available,
        item.reserved,
        item.expiring_30_days,
        item.earliest_expiry ?? '',
        item.overdue_invoices,
        item.outstanding_amount,
      ]),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Credit exposure</h1>
          <p className="text-sm text-muted-foreground">Cross-tenant available credit, expiry risk and outstanding balances.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={items.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <SubscriptionNav />

      <Totals data={data} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Select value={days}
              onValueChange={(value) => {
                setDays(value);
                setPage(1);
              }}>
              <SelectTrigger className="h-9 w-44" aria-label="Expiry window">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Expiring in 30 days</SelectItem>
                <SelectItem value="60">Expiring in 60 days</SelectItem>
                <SelectItem value="90">Expiring in 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status}
              onValueChange={(value) => {
                setStatus(value);
                setPage(1);
              }}>
              <SelectTrigger className="h-9 w-44" aria-label="Subscription status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={() => setPage((current) => current)}>
                Retry
              </Button>
            </div>
          ) : (
            <DataTableWrapper columns={columns}
              items={items}
              page={page}
              totalItems={exposureTotal(data, items.length)}
              onPageChange={setPage} />
          )}

          {isExposureEmpty(loading, error, items.length) && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <AlertTriangle className="h-7 w-7 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No organizations match these filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DataTableWrapper({
  columns,
  items,
  page,
  totalItems,
  onPageChange,
}: {
  columns: ColumnDef<CreditExposureItem>[];
  items: CreditExposureItem[];
  page: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <DataTable columns={columns}
      data={items}
      config={{
        showSerialNumber: true,
        enableRowSelection: false,
        enableFiltering: false,
        serverPagination: { totalItems, currentPage: page, pageSize: PAGE_SIZE, onPageChange: (next) => onPageChange(next) },
      }} />
  );
}
