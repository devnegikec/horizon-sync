import * as React from 'react';

import { Package, Warehouse, Boxes, Layers } from 'lucide-react';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import { ItemGroupManagement } from './components/item-groups';
import { ItemManagement } from './components/items';
import { StockManagement } from './components/stock';
import { WarehouseManagement } from './components/warehouses';

type ActiveView = 'items' | 'warehouses' | 'stock' | 'item-group';

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
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center px-4">
            <nav className="flex items-center gap-2">
              <NavItem icon={Package} label="Items" isActive={activeView === 'items'} onClick={() => setActiveView('items')} />
              <NavItem icon={Warehouse} label="Warehouses" isActive={activeView === 'warehouses'} onClick={() => setActiveView('warehouses')} />
              <NavItem icon={Layers} label="Item Groups" isActive={activeView === 'item-group'} onClick={() => setActiveView('item-group')} />
              <NavItem icon={Boxes} label="Stock" isActive={activeView === 'stock'} onClick={() => setActiveView('stock')} />
            </nav>
          </div>
        </header>

        <main className="container px-4 py-8">
          {activeView === 'items' && <ItemManagement />}
          {activeView === 'warehouses' && <WarehouseManagement />}
          {activeView === 'item-group' && <ItemGroupManagement />}
          {activeView === 'stock' && <StockManagement />}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
