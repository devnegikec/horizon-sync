import * as React from 'react';

import { AlertTriangle, Lock } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Card, CardContent, ConfirmationDialog } from '@horizon-sync/ui/components';

import { useInvoiceManagement } from '../../hooks/useInvoiceManagement';
import { FEATURE_DISABLED_CODE } from '@horizon-sync/ui';
import type { Invoice } from '../../types/invoice.types';
import { PaymentType, type CreatePaymentPayload } from '../../types/payment.types';
import { invoiceApi } from '../../utility/api/invoices';
import { PaymentDialog } from '../payments/PaymentDialog';

import { InvoiceDetailDialog, InvoiceManagementFilters, InvoiceManagementHeader, InvoicesTable, InvoiceStats } from '@horizon-sync/ui';

export function InvoiceManagement() {
  const {
    filters,
    setFilters,
    invoices,
    loading,
    error,
    refetch,
    stats,
    detailDialogOpen,
    setDetailDialogOpen,
    createDialogOpen,
    setCreateDialogOpen,
    selectedInvoice,
    tableInstance,
    handleView,
    handleCreate,
    handleDelete,
    handleMarkAsPaid,
    handleTableReady,
    serverPaginationConfig,
    confirmMarkAsPaidOpen,
    setConfirmMarkAsPaidOpen,
    invoiceToMarkPaid,
    confirmMarkAsPaid,
    isMarkingAsPaid,
  } = useInvoiceManagement();

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [paymentInitialData, setPaymentInitialData] = React.useState<Partial<CreatePaymentPayload> | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string | null>(null);

  const accessToken = useUserStore((s) => s.accessToken);

  // Export all invoices to CSV
  const handleExport = React.useCallback(async () => {
    if (!accessToken) return;
    const firstPage = await invoiceApi.list(accessToken, 1, 100);
    let all = firstPage.invoices ?? [];
    const totalPages = firstPage.pagination?.total_pages ?? 1;
    for (let p = 2; p <= totalPages; p++) {
      const page = await invoiceApi.list(accessToken, p, 100);
      all = all.concat(page.invoices ?? []);
    }
    const headers = ['Invoice No', 'Party', 'Type', 'Status', 'Currency', 'Grand Total', 'Outstanding', 'Posting Date', 'Due Date', 'Created At'];
    const rows = all.map((r) => [
      r.invoice_no ?? '',
      r.party_name ?? '',
      r.invoice_type ?? '',
      r.status ?? '',
      r.currency ?? '',
      String(r.grand_total ?? ''),
      String(r.outstanding_amount ?? ''),
      r.posting_date ?? '',
      r.due_date ?? '',
      r.created_at ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'invoices.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [accessToken]);

  // Handle create payment from invoice
  const handleCreatePayment = React.useCallback((invoice: Invoice) => {
    const payment_type = invoice.invoice_type === 'sales'
      ? PaymentType.CUSTOMER_PAYMENT
      : PaymentType.SUPPLIER_PAYMENT;

    // For paid invoices, use the grand total as the payment amount
    // For unpaid invoices, use the outstanding amount
    const paymentAmount = invoice.status === 'paid' ? invoice.grand_total : invoice.outstanding_amount;

    setPaymentInitialData({
      payment_type,
      party_id: invoice.party_id,
      amount: paymentAmount,
      currency_code: invoice.currency,
      payment_date: new Date().toISOString().split('T')[0],
    });
    setSelectedInvoiceId(invoice.id);
    setPaymentDialogOpen(true);
  }, []);

  // Error display component
  const ErrorDisplay = React.useMemo(() => {
    if (!error || error === FEATURE_DISABLED_CODE) return null;
    return (
      <Card className="border-destructive">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Error loading invoices: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }, [error]);

  // Feature disabled — show informational banner instead of the full page
  if (error === FEATURE_DISABLED_CODE) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Invoices Not Available</h2>
          <p className="text-muted-foreground text-center max-w-md">
            The invoices feature is currently disabled by your administrator.
            Contact your admin to enable it from the Feature Controls panel.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <InvoiceManagementHeader onRefresh={refetch} onCreateInvoice={handleCreate} onExport={handleExport} isLoading={loading} />

      {/* Error State */}
      {ErrorDisplay}

      {/* Stats Cards */}
      <InvoiceStats total={stats.total}
        draft={stats.draft}
        pending={stats.pending}
        paid={stats.paid}
        overdue={stats.overdue} />

      {/* Filters */}
      <InvoiceManagementFilters filters={filters} setFilters={setFilters} tableInstance={tableInstance} />

      {/* Invoices Table */}
      <InvoicesTable invoices={invoices}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.status !== 'all' || filters.invoice_type !== 'all'}
        onView={handleView}
        onDelete={handleDelete}
        onMarkAsPaid={handleMarkAsPaid}
        onCreatePayment={handleCreatePayment}
        onCreateInvoice={handleCreate}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig} />

      {/* Detail Dialog */}
      <InvoiceDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} invoice={selectedInvoice} />

      {/* Payment Dialog */}
      <PaymentDialog open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        payment={null}
        initialData={paymentInitialData}
        preselectedInvoiceId={selectedInvoiceId}
        onSuccess={() => {
          setPaymentDialogOpen(false);
          setSelectedInvoiceId(null);
          refetch();
        }} />

      {/* TODO: Create Dialog */}
      {createDialogOpen && (
        <div>Create Invoice Dialog - To be implemented</div>
      )}

      {/* Mark as Paid Confirmation */}
      <ConfirmationDialog open={confirmMarkAsPaidOpen}
        onOpenChange={setConfirmMarkAsPaidOpen}
        title="Mark Invoice as Paid"
        description={`Are you sure you want to mark invoice ${invoiceToMarkPaid?.invoice_no ?? ''} as paid? This action cannot be undone.`}
        confirmLabel="Mark as Paid"
        cancelLabel="Cancel"
        loading={isMarkingAsPaid}
        onConfirm={confirmMarkAsPaid} />
    </div>
  );
}
