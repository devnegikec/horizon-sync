import * as React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DollarSign, Package, Users, Truck, FileText, ShoppingCart } from 'lucide-react';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import { CustomerManagement } from '../components/customers';
import { DeliveryNoteManagement } from '../components/delivery-notes';
import { QuotationManagement } from '../components/quotations';
import { SalesOrderManagement } from '../components/sales-orders';
import type { Invoice } from '../types/invoice';

// Lazy load invoice and payment management components for better performance
const InvoiceManagement = React.lazy(() => import('../components/invoices').then(m => ({ default: m.InvoiceManagement })));
const PaymentManagement = React.lazy(() => import('../components/payments').then(m => ({ default: m.PaymentManagement })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

type ActiveView = 'customers' | 'quotations' | 'sales_orders' | 'delivery_notes' | 'invoices' | 'payments';

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}
function NavItem({ icon: Icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Button variant={isActive ? 'default' : 'ghost'}
      className={cn('gap-2 justify-start', isActive && 'bg-primary text-primary-foreground')}
      onClick={onClick}>
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}
export function RevenuePage() {
  const [activeView, setActiveView] = React.useState<ActiveView>('customers');
  const [preSelectedInvoice, setPreSelectedInvoice] = React.useState<Invoice | null>(null);
  
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
    <QueryClientProvider client={queryClient}>
    <ThemeProvider>

      <div className="min-h-screen bg-background">
              {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center px-4">
            <nav className="flex items-center gap-2">
              <NavItem icon={Users} label="Customers" isActive={activeView === 'customers'} onClick={() => setActiveView('customers')} />
              <NavItem icon={FileText} label="Quotations" isActive={activeView === 'quotations'} onClick={() => setActiveView('quotations')} />
              <NavItem icon={ShoppingCart} label="Sales Orders" isActive={activeView === 'sales_orders'} onClick={() => setActiveView('sales_orders')} />
              <NavItem icon={Truck} label="Delivery Notes" isActive={activeView === 'delivery_notes'} onClick={() => setActiveView('delivery_notes')} />
              <NavItem icon={DollarSign} label="Invoices" isActive={activeView === 'invoices'} onClick={() => setActiveView('invoices')} />
              <NavItem icon={Package} label="Payments" isActive={activeView === 'payments'} onClick={() => setActiveView('payments')} />
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="container px-4 py-8">
          {activeView === 'customers' && <CustomerManagement />}
          {activeView === 'quotations' && <QuotationManagement />}
          {activeView === 'sales_orders' && (
            <SalesOrderManagement 
              pendingSalesOrderId={pendingSalesOrderId}
              onClearPendingSalesOrderId={() => setPendingSalesOrderId(null)}
              onNavigateToInvoice={handleNavigateToInvoice}
            />
          )}
          {activeView === 'delivery_notes' && <DeliveryNoteManagement />}
          {activeView === 'invoices' && (
            <React.Suspense fallback={<div className="flex items-center justify-center p-8">Loading invoices...</div>}>
              <InvoiceManagement 
                onRecordPayment={handleRecordPayment}
                pendingInvoiceId={pendingInvoiceId}
                onClearPendingInvoiceId={() => setPendingInvoiceId(null)}
                onNavigateToSalesOrder={handleNavigateToSalesOrder}
                onNavigateToPayment={handleNavigateToPayment}
              />
            </React.Suspense>
          )}
          {activeView === 'payments' && (
            <React.Suspense fallback={<div className="flex items-center justify-center p-8">Loading payments...</div>}>
              <PaymentManagement />
            </React.Suspense>
          )}
        </main>
      </div>
    </ThemeProvider>
    </QueryClientProvider>
  );
}

export default RevenuePage;
