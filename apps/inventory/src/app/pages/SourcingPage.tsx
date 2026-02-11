import * as React from 'react';

import { DollarSign, Package, Users, Warehouse, Boxes, Truck } from 'lucide-react';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import { SupplierManagement } from '../components/suppliers';

type ActiveView = 'suppliers' | 'purchase_receipts' | 'landed_costs';

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
  const [activeView, setActiveView] = React.useState<ActiveView>('suppliers');
  return (
    <ThemeProvider>

      <div className="min-h-screen bg-background">
              {/* Top Navigation Bar */}
              <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center px-4">
            <nav className="flex items-center gap-2">
              <NavItem icon={Truck} label="Suppliers" isActive={activeView === 'suppliers'} onClick={() => setActiveView('suppliers')} />
              <NavItem icon={Users} label="Purchase Receipts" isActive={activeView === 'purchase_receipts'} onClick={() => setActiveView('purchase_receipts')} />
              <NavItem icon={DollarSign} label="Landed Costs" isActive={activeView === 'landed_costs'} onClick={() => setActiveView('landed_costs')} />
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="container px-4 py-8">
          {activeView === 'suppliers' && <SupplierManagement/>}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default RevenuePage;

