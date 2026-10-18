import * as React from 'react';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components/ui/table';

import { AccountBillingService, BillingApiError } from '../services/account-billing.service';
import type { AccountCredits, CreditBatch, CreditLedgerEntry, ExpirationsResponse, Pagination } from '../types';

import { CreditQuantity, StatusPill, formatDate, formatDateTime, formatDecimal } from './BillingFormat';

const PAGE_SIZE = 20;
const LEDGER_TYPES = ['all', 'consume', 'grant', 'reserve', 'release', 'expire', 'adjust_positive', 'adjust_negative', 'reversal'];

function BalanceCards({ credits }: { credits: AccountCredits | null }) {
  const cards = [
    { label: 'Available', value: credits?.available },
    { label: 'Reserved', value: credits?.reserved },
    { label: 'Used this period', value: credits?.used_this_period },
    { label: 'Expiring in 30 days', value: credits?.expiring_30_days },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-xl font-semibold tabular-nums">
              <CreditQuantity value={card.value ?? '0'} />
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ExpiryTimeline({ expirations }: { expirations: ExpirationsResponse | null }) {
  if (!expirations || expirations.timeline.length === 0) {
    return <p className="text-sm text-muted-foreground">No expiring credits.</p>;
  }
  return (
    <div className="space-y-2">
      {expirations.timeline.map((item) => (
        <div key={item.batch_id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <div>
            <p className="font-medium">{formatDate(item.expires_at)}</p>
            <p className="text-xs capitalize text-muted-foreground">{item.source.replace(/_/g, ' ')}</p>
          </div>
          <CreditQuantity value={item.quantity} className="tabular-nums" />
        </div>
      ))}
    </div>
  );
}

function BatchesTable({ items }: { items: CreditBatch[] }) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No credit batches yet.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Source</TableHead>
          <TableHead className="text-right">Granted</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
          <TableHead>Issued</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((batch) => (
          <TableRow key={batch.id}>
            <TableCell className="text-xs capitalize">{batch.source_type.replace(/_/g, ' ')}</TableCell>
            <TableCell className="text-right text-xs tabular-nums">
              <CreditQuantity value={batch.granted} />
            </TableCell>
            <TableCell className="text-right text-xs tabular-nums">
              <CreditQuantity value={batch.remaining} />
            </TableCell>
            <TableCell className="text-xs">{formatDate(batch.issued_at)}</TableCell>
            <TableCell className="text-xs">{formatDate(batch.expires_at)}</TableCell>
            <TableCell>
              <StatusPill status={batch.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function LedgerTable({ entries }: { entries: CreditLedgerEntry[] }) {
  if (entries.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">No ledger entries yet.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>When</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Change</TableHead>
          <TableHead className="text-right">Balance after</TableHead>
          <TableHead>Reason</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="text-xs">{formatDateTime(entry.occurred_at)}</TableCell>
            <TableCell className="text-xs capitalize">{entry.type.replace(/_/g, ' ')}</TableCell>
            <TableCell className={`text-right text-xs tabular-nums ${entry.qty.startsWith('-') ? 'text-destructive' : 'text-emerald-600'}`}>
              <CreditQuantity value={entry.qty} />
            </TableCell>
            <TableCell className="text-right text-xs tabular-nums">
              <CreditQuantity value={entry.balance_after} />
            </TableCell>
            <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground" title={entry.reason ?? undefined}>
              {entry.reason ?? '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Pager({ pagination, onPage }: { pagination: Pagination; onPage: (page: number) => void }) {
  if (pagination.total_pages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
      <span>
        Page {pagination.page} of {pagination.total_pages}
      </span>
      <Button variant="outline" size="sm" className="h-7 px-2" aria-label="Previous page" disabled={pagination.page <= 1} onClick={() => onPage(pagination.page - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Button variant="outline"
        size="sm"
        className="h-7 px-2"
        aria-label="Next page"
        disabled={pagination.page >= pagination.total_pages}
        onClick={() => onPage(pagination.page + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function CreditsPanel({ credits }: { credits: AccountCredits | null }) {
  const [batches, setBatches] = React.useState<CreditBatch[]>([]);
  const [batchPagination, setBatchPagination] = React.useState<Pagination | null>(null);
  const [entries, setEntries] = React.useState<CreditLedgerEntry[]>([]);
  const [ledgerPagination, setLedgerPagination] = React.useState<Pagination | null>(null);
  const [ledgerType, setLedgerType] = React.useState('all');
  const [batchPage, setBatchPage] = React.useState(1);
  const [ledgerPage, setLedgerPage] = React.useState(1);
  const [expirations, setExpirations] = React.useState<ExpirationsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    AccountBillingService.getBatches({ page: batchPage, page_size: PAGE_SIZE })
      .then((response) => {
        if (cancelled) return;
        setBatches(response.items);
        setBatchPagination(response.pagination);
      })
      .catch(() => undefined);
    AccountBillingService.getExpirations()
      .then((response) => {
        if (!cancelled) setExpirations(response);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [batchPage]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    AccountBillingService.getLedger({ type: ledgerType === 'all' ? undefined : ledgerType, page: ledgerPage, page_size: PAGE_SIZE })
      .then((response) => {
        if (cancelled) return;
        setEntries(response.transactions);
        setLedgerPagination(response.pagination);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setEntries([]);
        setError(err instanceof BillingApiError ? err.message : 'Could not load the credit ledger.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ledgerType, ledgerPage]);

  return (
    <div className="space-y-6">
      <BalanceCards credits={credits} />

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Expiry timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpiryTimeline expirations={expirations} />
          {expirations && (
            <p className="mt-3 text-xs text-muted-foreground">
              Within 30 days: {formatDecimal(expirations.buckets.within_30_days, 2)} · 60 days: {formatDecimal(expirations.buckets.within_60_days, 2)} · 90 days:{' '}
              {formatDecimal(expirations.buckets.within_90_days, 2)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Credit batches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-0 px-4 pb-4">
          <BatchesTable items={batches} />
          {batchPagination && <Pager pagination={batchPagination} onPage={setBatchPage} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Ledger</CardTitle>
          <Select value={ledgerType}
            onValueChange={(value) => {
              setLedgerType(value);
              setLedgerPage(1);
            }}>
            <SelectTrigger className="h-8 w-40" aria-label="Filter ledger by type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEDGER_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'all' ? 'All types' : type.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="space-y-3 p-0 px-4 pb-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <LedgerTable entries={entries} />
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          {ledgerPagination && <Pager pagination={ledgerPagination} onPage={setLedgerPage} />}
        </CardContent>
      </Card>
    </div>
  );
}
