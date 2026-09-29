import type { Invoice } from '../../../types/invoice';

/** Top-level Revenue views shown in `RevenueNavigation`. */
export type RevenueView = 'customers' | 'quotations' | 'sales_orders' | 'pick_lists' | 'delivery_notes' | 'invoices' | 'payments';

/**
 * Shared prop contract every `RevenueView` content component receives.
 *
 * The shell owns these (rather than each view) so cross-document navigation —
 * invoice → payment, sales order → invoice — keeps working when the active view
 * is swapped out, mirroring how `WMSManagement` owns the shared filters.
 */
export interface RevenueContentProps {
  activeView: RevenueView;
  /** False while the invoices feature flag is still loading, or when it is hidden. */
  showInvoices: boolean;
  pendingSalesOrderId: string | null;
  pendingPaymentId: string | null;
  preSelectedInvoice: Invoice | null;
  onClearPendingSalesOrderId: () => void;
  onClearPendingPaymentId: () => void;
  onNavigateToInvoice: (invoiceId: string) => void;
}
