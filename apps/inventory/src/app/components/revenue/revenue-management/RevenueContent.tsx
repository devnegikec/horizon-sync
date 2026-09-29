import * as React from 'react';

import { CustomerManagement } from '../../customers';
import { DeliveryNoteManagement } from '../../delivery-notes';
import { PickListManagement } from '../../picklist';
import { QuotationManagement } from '../../quotations';
import { SalesOrderManagement } from '../../sales-orders';

import type { RevenueContentProps, RevenueView } from './types';

// Lazy load invoice and payment management components for better performance
const InvoiceManagement = React.lazy(() => import('../../invoices').then(m => ({ default: m.InvoiceManagement })));
const PaymentManagement = React.lazy(() => import('../../payments').then(m => ({ default: m.PaymentManagement })));

function LoadingState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3058EE] mx-auto mb-4" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

function SalesOrdersContent({ pendingSalesOrderId, onClearPendingSalesOrderId, onNavigateToInvoice }: RevenueContentProps) {
  return (
    <SalesOrderManagement pendingSalesOrderId={pendingSalesOrderId}
      onClearPendingSalesOrderId={onClearPendingSalesOrderId}
      onNavigateToInvoice={onNavigateToInvoice}/>
  );
}

function InvoicesContent({ showInvoices }: RevenueContentProps) {
  if (!showInvoices) return null;
  return (
    <React.Suspense fallback={<LoadingState message="Loading invoices..." />}>
      <InvoiceManagement />
    </React.Suspense>
  );
}

function PaymentsContent({ preSelectedInvoice, pendingPaymentId, onClearPendingPaymentId, onNavigateToInvoice }: RevenueContentProps) {
  return (
    <React.Suspense fallback={<LoadingState message="Loading payments..." />}>
      <PaymentManagement preSelectedInvoice={preSelectedInvoice}
        pendingPaymentId={pendingPaymentId}
        onClearPendingPaymentId={onClearPendingPaymentId}
        onNavigateToInvoice={onNavigateToInvoice}/>
    </React.Suspense>
  );
}

const revenueViewComponents: Record<RevenueView, React.ComponentType<RevenueContentProps>> = {
  customers: CustomerManagement,
  quotations: QuotationManagement,
  sales_orders: SalesOrdersContent,
  pick_lists: PickListManagement,
  delivery_notes: DeliveryNoteManagement,
  invoices: InvoicesContent,
  payments: PaymentsContent,
};

/** Renders the content for the active top-level Revenue view. */
export function RevenueContent({ activeView, ...props }: RevenueContentProps) {
  const Content = revenueViewComponents[activeView];
  return <Content activeView={activeView} {...props} />;
}
