import * as React from 'react';

import { Package, Users, Warehouse, Boxes, Truck } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';
import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';

import { CustomerManagement } from './components/customers';
import { ItemManagement } from './components/items';
import { StockManagement } from './components/stock';
import { SupplierManagement } from './components/suppliers';
import { WarehouseManagement } from './components/warehouses';

type ActiveView = 'items' | 'warehouses' | 'stock' | 'suppliers' | 'stock_movements' | 'pick_lists' | 'put_aways_rules' | 'replenishments' | 'batches' | 'stock_settings';

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

export function App() {
  const [activeView, setActiveView] = React.useState<ActiveView>('items');
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center px-4">
            {/* <div className="flex items-center gap-2 mr-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Inventory</span>
            </div> */}
            <nav className="flex items-center gap-2">
              <NavItem icon={Package} label="Items" isActive={activeView === 'items'} onClick={() => setActiveView('items')} />
              {/* <NavItem icon={Users} label="Customers" isActive={activeView === 'customers'} onClick={() => setActiveView('customers')} /> */}
              <NavItem icon={Warehouse} label="Warehouses" isActive={activeView === 'warehouses'} onClick={() => setActiveView('warehouses')} />
              <NavItem icon={Boxes} label="Stock" isActive={activeView === 'stock'} onClick={() => setActiveView('stock')} />
              {/* <NavItem icon={Truck} label="Suppliers" isActive={activeView === 'suppliers'} onClick={() => setActiveView('suppliers')} /> */}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="container px-4 py-8">
          {activeView === 'items' && <ItemManagement />}
          {activeView === 'warehouses' && <WarehouseManagement />}
          {activeView === 'stock' && <StockManagement />}
          {activeView === 'suppliers' && <SupplierManagement />}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
