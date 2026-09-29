import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';
import { INVOICES_ENABLED } from '@horizon-sync/ui';
import { ManagementContainer } from '@horizon-sync/ui/components';
import { useFeatureVisibilities } from '@horizon-sync/ui/hooks';

import { environment } from '../../../../environments/environment';
import type { Invoice } from '../../../types/invoice';

import { RevenueContent } from './RevenueContent';
import { RevenueHeader } from './RevenueHeader';
import { RevenueNavigation } from './RevenueNavigation';
import type { RevenueView } from './types';

/**
 * Revenue shell: owns the active view state, the invoices feature flag and the
 * cross-document navigation state, then delegates rendering to the
 * view-specific components — Customers, Quotations, Sales Orders, Pick Lists,
 * Delivery Notes, Invoices and Payments.
 */
export function RevenueManagement() {
  const [activeView, setActiveView] = React.useState<RevenueView>('customers');
  const [preSelectedInvoice, setPreSelectedInvoice] = React.useState<Invoice | null>(null);
  const accessToken = useUserStore((s) => s.accessToken);

  // Feature flag visibility with loading state to prevent flash
  const invoicesFlagStates = useFeatureVisibilities([INVOICES_ENABLED], `${environment.apiCoreUrl}/api/v1`, accessToken);
  const invoicesFlag = invoicesFlagStates[INVOICES_ENABLED];
  const invoicesFlagLoading = invoicesFlag?.loading ?? true;
  const showInvoices = !invoicesFlagLoading && (invoicesFlag?.visible ?? false);

  // State for cross-document navigation
  const [pendingSalesOrderId, setPendingSalesOrderId] = React.useState<string | null>(null);
  const [pendingInvoiceId, setPendingInvoiceId] = React.useState<string | null>(null);
  const [pendingPaymentId, setPendingPaymentId] = React.useState<string | null>(null);

  // Handler for recording payment from invoice
  const handleRecordPayment = React.useCallback((invoice: Invoice) => {
    setPreSelectedInvoice(invoice);
    setActiveView('payments');
  }, []);

  // Handlers for cross-document navigation
  const handleNavigateToSalesOrder = React.useCallback((salesOrderId: string) => {
    setPendingSalesOrderId(salesOrderId);
    setActiveView('sales_orders');
  }, []);

  const handleNavigateToInvoice = React.useCallback((invoiceId: string) => {
    setPendingInvoiceId(invoiceId);
    setActiveView('invoices');
  }, []);

  const handleNavigateToPayment = React.useCallback((paymentId: string) => {
    setPendingPaymentId(paymentId);
    setActiveView('payments');
  }, []);

  // Clear pre-selected invoice when switching away from payments
  React.useEffect(() => {
    if (activeView !== 'payments') {
      setPreSelectedInvoice(null);
    }
  }, [activeView]);

  return (
    <ManagementContainer>
      <RevenueHeader />
      <RevenueNavigation activeView={activeView} showInvoices={showInvoices} onViewChange={setActiveView} />
      <RevenueContent activeView={activeView}
        showInvoices={showInvoices}
        pendingSalesOrderId={pendingSalesOrderId}
        pendingPaymentId={pendingPaymentId}
        preSelectedInvoice={preSelectedInvoice}
        onClearPendingSalesOrderId={() => setPendingSalesOrderId(null)}
        onClearPendingPaymentId={() => setPendingPaymentId(null)}
        onNavigateToInvoice={handleNavigateToInvoice}/>
    </ManagementContainer>
  );
}
