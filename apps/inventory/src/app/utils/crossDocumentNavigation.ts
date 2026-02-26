/**
 * Cross-document navigation utilities for navigating between related documents
 * (Sales Orders, Invoices, Payments) in the Revenue module.
 */

export type DocumentType = 'sales_order' | 'invoice' | 'payment';

export interface NavigationContext {
  setActiveView: (view: 'sales_orders' | 'invoices' | 'payments') => void;
  openSalesOrderDetail?: (salesOrderId: string) => void;
  openInvoiceDetail?: (invoiceId: string) => void;
  openPaymentDetail?: (paymentId: string) => void;
}

/**
 * Navigate to a related document by switching tabs and opening the detail dialog
 */
export function navigateToDocument(
  documentType: DocumentType,
  documentId: string,
  context: NavigationContext
): void {
  switch (documentType) {
    case 'sales_order':
      context.setActiveView('sales_orders');
      // Use setTimeout to ensure the tab switch completes before opening dialog
      setTimeout(() => {
        context.openSalesOrderDetail?.(documentId);
      }, 100);
      break;

    case 'invoice':
      context.setActiveView('invoices');
      setTimeout(() => {
        context.openInvoiceDetail?.(documentId);
      }, 100);
      break;

    case 'payment':
      context.setActiveView('payments');
      setTimeout(() => {
        context.openPaymentDetail?.(documentId);
      }, 100);
      break;
  }
}
