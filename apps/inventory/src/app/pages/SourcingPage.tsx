import * as React from 'react';

import { DollarSign, Package, Boxes, Truck, FileText, MessageSquare } from 'lucide-react';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import { SupplierManagement } from '../components/suppliers';
import { MaterialRequestManagement } from '../components/material-requests';
import { RFQManagement } from '../components/rfqs';

type ActiveView = 'material_requests' | 'rfqs' | 'purchase_orders' | 'suppliers' | 'purchase_receipts' | 'landed_costs';

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
  const [activeView, setActiveView] = React.useState<ActiveView>('material_requests');
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    // Reset error when view changes
    setError(null);
  }, [activeView]);

  if (error) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold text-destructive mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={() => setError(null)}>Try Again</Button>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>

      <div className="min-h-screen bg-background">
              {/* Top Navigation Bar */}
              <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center px-4">
            <nav className="flex items-center gap-2">
              <NavItem icon={FileText} label="Material Requests" isActive={activeView === 'material_requests'} onClick={() => setActiveView('material_requests')} />
              <NavItem icon={MessageSquare} label="RFQs" isActive={activeView === 'rfqs'} onClick={() => setActiveView('rfqs')} />
              <NavItem icon={Package} label="Purchase Orders" isActive={activeView === 'purchase_orders'} onClick={() => setActiveView('purchase_orders')} />
              <NavItem icon={Truck} label="Suppliers" isActive={activeView === 'suppliers'} onClick={() => setActiveView('suppliers')} />
              <NavItem icon={Boxes} label="Purchase Receipts" isActive={activeView === 'purchase_receipts'} onClick={() => setActiveView('purchase_receipts')} />
              <NavItem icon={DollarSign} label="Landed Costs" isActive={activeView === 'landed_costs'} onClick={() => setActiveView('landed_costs')} />
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="container px-4 py-8">
          {activeView === 'material_requests' && <MaterialRequestManagement />}
          {activeView === 'rfqs' && <RFQManagement />}
          {activeView === 'suppliers' && <SupplierManagement/>}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default SourcingPage;

