import * as React from 'react';

import { AlertTriangle } from 'lucide-react';

import { Card, CardContent, ConfirmationDialog } from '@horizon-sync/ui/components';

import { useInvoiceManagement } from '../../hooks/useInvoiceManagement';
import type { Invoice } from '../../types/invoice.types';
import { PaymentType, type CreatePaymentPayload } from '../../types/payment.types';
import { PaymentDialog } from '../payments/PaymentDialog';

import { InvoiceDetailDialog } from './InvoiceDetailDialog';
import { InvoiceManagementFilters } from './InvoiceManagementFilters';
import { InvoiceManagementHeader } from './InvoiceManagementHeader';
import { InvoicesTable } from './InvoicesTable';
import { InvoiceStats } from './InvoiceStats';

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

  // Handle create payment from invoice
  const handleCreatePayment = React.useCallback((invoice: Invoice) => {
    const payment_type = invoice.invoice_type === 'sales' 
      ? PaymentType.CUSTOMER_PAYMENT 
      : PaymentType.SUPPLIER_PAYMENT;
    setPaymentInitialData({
      payment_type,
      party_id: invoice.party_id,
      amount: invoice.outstanding_amount,
      currency_code: invoice.currency,
      payment_date: new Date().toISOString().split('T')[0],
    });
    setSelectedInvoiceId(invoice.id);
    setPaymentDialogOpen(true);
  }, []);

  // Error display component
  const ErrorDisplay = React.useMemo(() => {
    if (!error) return null;
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <InvoiceManagementHeader onRefresh={refetch} onCreateInvoice={handleCreate} isLoading={loading} />

      {/* Error State */}
      {ErrorDisplay}

      {/* Stats Cards */}
      <InvoiceStats total={stats.total}
        draft={stats.draft}
        pending={stats.pending}
        paid={stats.paid}
        overdue={stats.overdue}/>

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
        serverPagination={serverPaginationConfig}/>

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
        }}/>

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
        onConfirm={confirmMarkAsPaid}/>
    </div>
  );
}
