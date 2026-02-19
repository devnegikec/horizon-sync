import * as React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DollarSign, Package, Boxes, Truck, FileText, MessageSquare } from 'lucide-react';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import { SupplierManagement } from '../components/suppliers';
import { MaterialRequestManagement } from '../components/material-requests';
import { RFQManagement } from '../components/rfqs';
import { PurchaseOrderManagement } from '../components/purchase-orders';
import { PurchaseReceiptManagement } from '../components/purchase-receipts';
import { LandedCostManagement } from '../components/landed-costs';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

type ActiveView = 'suppliers' | 'material_requests' | 'rfqs' | 'purchase_orders' | 'purchase_receipts' | 'landed_costs';

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
export function SourcingPage() {
  const [activeView, setActiveView] = React.useState<ActiveView>('suppliers');

  return (
    <QueryClientProvider client={queryClient}>
    <ThemeProvider>

      <div className="min-h-screen bg-background">
              {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center px-4">
            <nav className="flex items-center gap-2">
              <NavItem icon={Truck} label="Suppliers" isActive={activeView === 'suppliers'} onClick={() => setActiveView('suppliers')} />
              <NavItem icon={FileText} label="Material Requests" isActive={activeView === 'material_requests'} onClick={() => setActiveView('material_requests')} />
              <NavItem icon={MessageSquare} label="RFQs" isActive={activeView === 'rfqs'} onClick={() => setActiveView('rfqs')} />
              <NavItem icon={Package} label="Purchase Orders" isActive={activeView === 'purchase_orders'} onClick={() => setActiveView('purchase_orders')} />
              <NavItem icon={Boxes} label="Purchase Receipts" isActive={activeView === 'purchase_receipts'} onClick={() => setActiveView('purchase_receipts')} />
              <NavItem icon={DollarSign} label="Landed Costs" isActive={activeView === 'landed_costs'} onClick={() => setActiveView('landed_costs')} />
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="container px-4 py-8">
          {activeView === 'suppliers' && <SupplierManagement/>}
          {activeView === 'material_requests' && <MaterialRequestManagement />}
          {activeView === 'rfqs' && <RFQManagement />}
          {activeView === 'purchase_orders' && <PurchaseOrderManagement />}
          {activeView === 'purchase_receipts' && <PurchaseReceiptManagement />}
          {activeView === 'landed_costs' && <LandedCostManagement />}
        </main>
      </div>
    </ThemeProvider>
    </QueryClientProvider>
  );
}

export default SourcingPage;

