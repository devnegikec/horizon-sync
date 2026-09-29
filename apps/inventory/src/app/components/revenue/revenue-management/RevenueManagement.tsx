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

  const handleClearPendingInvoice = React.useCallback(() => setPendingInvoiceId(null), []);

  const handleNavigateToInvoice = React.useCallback((invoiceId: string) => {
    // Invoices can be hidden by the feature flag — never switch to a view that
    // would render nothing.
    if (!showInvoices) return;
    setPendingInvoiceId(invoiceId);
    setActiveView('invoices');
  }, [showInvoices]);

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

  // Fall back to Customers if Invoices becomes unavailable while it is active
  React.useEffect(() => {
    if (activeView === 'invoices' && !showInvoices) {
      setActiveView('customers');
    }
  }, [activeView, showInvoices]);

  return (
    <ManagementContainer>
      <RevenueHeader />
      <RevenueNavigation activeView={activeView} showInvoices={showInvoices} onViewChange={setActiveView} />
      <RevenueContent activeView={activeView}
        showInvoices={showInvoices}
        pendingSalesOrderId={pendingSalesOrderId}
        pendingInvoiceId={pendingInvoiceId}
        pendingPaymentId={pendingPaymentId}
        preSelectedInvoice={preSelectedInvoice}
        onClearPendingSalesOrderId={() => setPendingSalesOrderId(null)}
        onClearPendingInvoiceId={handleClearPendingInvoice}
        onClearPendingPaymentId={() => setPendingPaymentId(null)}
        onNavigateToInvoice={handleNavigateToInvoice}/>
    </ManagementContainer>
  );
}
