import * as React from 'react';

import { useInvoiceManagement } from '../../hooks/useInvoiceManagement';
import type { Invoice } from '../../types/invoice';
import { DeleteConfirmationDialog } from '../common';
import { InvoiceDetailDialog } from './InvoiceDetailDialog';
import { InvoiceDialog } from './InvoiceDialog';
import { InvoiceManagementFilters } from './InvoiceManagementFilters';
import { InvoiceManagementHeader } from './InvoiceManagementHeader';
import { InvoicesTable } from './InvoicesTable';
import { InvoiceStats } from './InvoiceStats';
import { SendInvoiceEmailDialog } from './SendInvoiceEmailDialog';

interface InvoiceManagementProps {
  onRecordPayment?: (invoice: Invoice) => void;
  pendingInvoiceId?: string | null;
  onClearPendingInvoiceId?: () => void;
  onNavigateToSalesOrder?: (salesOrderId: string) => void;
  onNavigateToPayment?: (paymentId: string) => void;
}

export function InvoiceManagement({ 
  onRecordPayment,
  pendingInvoiceId,
  onClearPendingInvoiceId,
  onNavigateToSalesOrder,
  onNavigateToPayment,
}: InvoiceManagementProps) {
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
    emailDialogOpen,
    setEmailDialogOpen,
    deleteDialogOpen,
    setDeleteDialogOpen,
    selectedInvoice,
    editInvoice,
    invoiceToDelete,
    tableInstance,
    handleView,
    handleCreate,
    handleEdit,
    handleDelete,
    handleConfirmDelete,
    handleSendEmail,
    handleGeneratePDF,
    handleTableReady,
    handleSave,
    handleEmailSend,
    serverPaginationConfig,
  } = useInvoiceManagement();

  const hasActiveFilters = filters.search !== '' || filters.status !== 'all' || filters.date_from !== undefined || filters.date_to !== undefined;

  // Handle pending invoice ID from cross-document navigation
  React.useEffect(() => {
    if (pendingInvoiceId) {
      // Find the invoice and open its detail dialog
      const invoice = invoices.find(inv => inv.id === pendingInvoiceId);
      if (invoice) {
        handleView(invoice);
      }
      onClearPendingInvoiceId?.();
    }
  }, [pendingInvoiceId, invoices, handleView, onClearPendingInvoiceId]);

  return (
    <div className="space-y-6">
      <InvoiceManagementHeader
        isLoading={loading}
        onRefresh={refetch}
        onCreateInvoice={handleCreate}
      />

      <InvoiceStats
        total={stats.total}
        draft={stats.draft}
        submitted={stats.submitted}
        paid={stats.paid}
        overdue={stats.overdue}
        totalOutstanding={stats.total_outstanding}
      />

      <InvoiceManagementFilters
        filters={filters}
        setFilters={setFilters}
        tableInstance={tableInstance}
      />

      <InvoicesTable
        invoices={invoices}
        loading={loading}
        error={error}
        hasActiveFilters={hasActiveFilters}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSendEmail={handleSendEmail}
        onCreateInvoice={handleCreate}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}
      />

      {/* Detail Dialog */}
      <InvoiceDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        invoice={selectedInvoice}
        onEdit={handleEdit}
        onRecordPayment={(invoice) => {
          setDetailDialogOpen(false);
          onRecordPayment?.(invoice);
        }}
        onGeneratePDF={handleGeneratePDF}
        onSendEmail={handleSendEmail}
        onViewSalesOrder={(salesOrderId) => {
          setDetailDialogOpen(false);
          onNavigateToSalesOrder?.(salesOrderId);
        }}
        onViewPayment={(paymentId) => {
          setDetailDialogOpen(false);
          onNavigateToPayment?.(paymentId);
        }}
      />

      {/* Create/Edit Dialog */}
      <InvoiceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        invoice={editInvoice}
        onSave={handleSave}
        saving={false}
      />

      {/* Send Email Dialog */}
      <SendInvoiceEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        invoice={selectedInvoice}
        onSend={handleEmailSend}
        sending={false}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Invoice"
        description={
          invoiceToDelete
            ? `Are you sure you want to delete invoice ${invoiceToDelete.invoice_number}? This action cannot be undone.`
            : 'Are you sure you want to delete this invoice?'
        }
      />
    </div>
  );
}

