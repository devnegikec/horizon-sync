import * as React from 'react';

import { Download, Loader2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
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
import type { AccountInvoice } from '../types';

import { Money, StatusPill, formatDate } from './BillingFormat';

const PAGE_SIZE = 20;
const STATUSES = ['all', 'issued', 'partially_paid', 'paid', 'overdue', 'void'];

export function InvoicesPanel() {
  const [invoices, setInvoices] = React.useState<AccountInvoice[]>([]);
  const [status, setStatus] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    AccountBillingService.getInvoices({ status: status === 'all' ? undefined : status, page, page_size: PAGE_SIZE })
      .then((response) => {
        if (cancelled) return;
        setInvoices(response.items);
        setTotalPages(response.pagination.total_pages);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setInvoices([]);
        setError(err instanceof BillingApiError ? err.message : 'Could not load invoices.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, page]);

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Select value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}>
            <SelectTrigger className="h-8 w-40" aria-label="Filter invoices by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === 'all' ? 'All statuses' : option.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Issued</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Outstanding</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-xs">{invoice.invoice_no}</TableCell>
                  <TableCell className="text-xs capitalize">{invoice.invoice_type.replace(/_/g, ' ')}</TableCell>
                  <TableCell className="text-xs">{formatDate(invoice.posting_date)}</TableCell>
                  <TableCell className="text-xs">{formatDate(invoice.due_date)}</TableCell>
                  <TableCell>
                    <StatusPill status={invoice.status} />
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    <Money value={invoice.grand_total} currency={invoice.currency} />
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    <Money value={invoice.outstanding_amount} currency={invoice.currency} />
                  </TableCell>
                  <TableCell className="text-right">
                    {invoice.download_url && (
                      <Button variant="ghost" size="sm" className="h-7 px-2" aria-label={`Download invoice ${invoice.invoice_no}`} asChild>
                        <a href={invoice.download_url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && invoices.length === 0 && !error && <p className="py-6 text-center text-sm text-muted-foreground">No invoices yet.</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}

        {totalPages > 1 && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
