import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Download, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button, DataTable } from '@horizon-sync/ui/components';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import { SubscriptionNav } from '../components/subscription/SubscriptionNav';
import { downloadCsv, formatDate, formatDateTime } from '../components/subscription/SubscriptionUI';
import { SubscriptionApiError, SubscriptionService } from '../services/subscription.service';
import type { ReconciliationIssue, ReconciliationRow } from '../types/subscription.types';

const ISSUE_COPY: Record<ReconciliationIssue, { label: string; action: string; variant: 'destructive' | 'warning' | 'outline' }> = {
  paid_invoice_without_grant: { label: 'Paid invoice, no grant', action: 'Open customer and re-run the webhook', variant: 'destructive' },
  grant_without_payment: { label: 'Grant without payment', action: 'Investigate — never delete the batch', variant: 'destructive' },
  batch_sum_mismatch: { label: 'Batch sum mismatch', action: 'Rebuild the balance projection', variant: 'warning' },
  duplicate_grant: { label: 'Duplicate grant', action: 'Alert finance for review', variant: 'warning' },
  stuck_reservation: { label: 'Stuck reservation', action: 'Release the reservation', variant: 'warning' },
  expired_batch_consumed: { label: 'Expired batch consumed', action: 'Alert only', variant: 'outline' },
};

function referenceText(row: ReconciliationRow): string {
  const parts = [row.invoice_id && `invoice:${row.invoice_id}`, row.payment_id && `payment:${row.payment_id}`, row.batch_id && `batch:${row.batch_id}`, row.operation_id && `op:${row.operation_id}`];
  return parts.filter(Boolean).join(' · ') || '—';
}

function reconciliationColumns(onOpen: (row: ReconciliationRow) => void): ColumnDef<ReconciliationRow>[] {
  return [
    {
      accessorKey: 'issue',
      header: 'Finding',
      cell: ({ row }) => {
        const copy = ISSUE_COPY[row.original.issue] ?? { label: row.original.issue, variant: 'outline' as const };
        return <Badge variant={copy.variant}>{copy.label}</Badge>;
      },
    },
    {
      id: 'organization',
      header: 'Organization',
      cell: ({ row }) => (
        <button type="button"
          className="text-left text-sm font-medium hover:underline"
          onClick={() => onOpen(row.original)}>
          {row.original.organization_name || row.original.organization_id}
        </button>
      ),
    },
    {
      id: 'references',
      header: 'References',
      cell: ({ row }) => (
        <span className="block max-w-[280px] truncate font-mono text-xs text-muted-foreground" title={referenceText(row.original)}>
          {referenceText(row.original)}
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount / quantity',
      cell: ({ row }) => (
        <span className="text-xs tabular-nums">{row.original.amount ?? row.original.quantity ?? '—'}</span>
      ),
    },
    {
      id: 'detected_at',
      header: 'Detected',
      cell: ({ row }) => <span className="text-xs">{formatDateTime(row.original.detected_at)}</span>,
    },
    {
      id: 'action',
      header: 'Suggested action',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{ISSUE_COPY[row.original.issue]?.action ?? 'Review manually'}</span>
      ),
    },
  ];
}

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function SubscriptionReconciliationPage() {
  const navigate = useNavigate();
  const [from, setFrom] = React.useState(isoDaysAgo(30));
  const [to, setTo] = React.useState(new Date().toISOString().slice(0, 10));
  const [applied, setApplied] = React.useState({ from: isoDaysAgo(30), to: new Date().toISOString().slice(0, 10) });
  const [rows, setRows] = React.useState<ReconciliationRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [reloadToken, setReloadToken] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    SubscriptionService.getReconciliation({ from: applied.from, to: applied.to })
      .then((response) => {
        if (!cancelled) setRows(response.items ?? []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRows([]);
        setError(err instanceof SubscriptionApiError ? err.message : 'Could not load reconciliation findings.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applied, reloadToken]);

  const columns = React.useMemo(() => reconciliationColumns((row) => navigate(`/subscriptions/customers/${row.organization_id}`)), [navigate]);

  const handleExport = () => {
    downloadCsv(
      `reconciliation-${applied.from}-to-${applied.to}.csv`,
      ['Issue', 'Organization', 'Organization ID', 'Invoice', 'Payment', 'Batch', 'Operation', 'Amount', 'Quantity', 'Detected at'],
      rows.map((row) => [
        row.issue,
        row.organization_name ?? '',
        row.organization_id,
        row.invoice_id ?? '',
        row.payment_id ?? '',
        row.batch_id ?? '',
        row.operation_id ?? '',
        row.amount ?? '',
        row.quantity ?? '',
        row.detected_at ?? '',
      ]),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reconciliation</h1>
          <p className="text-sm text-muted-foreground">Invoice, payment and credit-batch discrepancies. Rows are findings, not invoices.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={rows.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => setReloadToken((token) => token + 1)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <SubscriptionNav />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reconciliation-from">From</Label>
              <Input id="reconciliation-from"
                type="date"
                className="h-9 w-44"
                value={from}
                onChange={(event) => setFrom(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reconciliation-to">To</Label>
              <Input id="reconciliation-to"
                type="date"
                className="h-9 w-44"
                value={to}
                onChange={(event) => setTo(event.target.value)} />
            </div>
            <Button size="sm" onClick={() => setApplied({ from, to })}>
              Apply
            </Button>
            <p className="ml-auto text-xs text-muted-foreground">Window: {formatDate(applied.from)} → {formatDate(applied.to)}</p>
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
              config={{ showSerialNumber: true, enableRowSelection: false, enableFiltering: false }} />
          )}

          {!loading && !error && rows.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              <p className="text-sm text-muted-foreground">No discrepancies found in this window.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
