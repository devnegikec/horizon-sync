import * as React from 'react';

import { Package, Warehouse, Boxes, Layers, QrCode, Forklift } from 'lucide-react';
import { Routes, Route } from 'react-router-dom';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import { ItemGroupManagement } from './components/item-groups';
import { ItemManagement } from './components/items';
import { QSealManagement } from './components/qseal';
import { StockManagement } from './components/stock';
import { WarehouseManagement } from './components/warehouses';
import { WMSManagement } from './components/wms/WMSManagement';
import PublicQRValidation from './pages/PublicQRValidation';

type ActiveView = 'items' | 'warehouses' | 'stock' | 'item-group' | 'qseal';

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

function MainApp() {
  const [activeView, setActiveView] = React.useState<ActiveView>('items');
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background">
        <div className="container flex h-16 items-center px-4">
          <nav className="flex items-center gap-2">
            <NavItem icon={Package} label="Items" isActive={activeView === 'items'} onClick={() => setActiveView('items')} />
            <NavItem icon={Warehouse} label="Warehouses" isActive={activeView === 'warehouses'} onClick={() => setActiveView('warehouses')} />
            <NavItem icon={Layers} label="Item Groups" isActive={activeView === 'item-group'} onClick={() => setActiveView('item-group')} />
            <NavItem icon={Boxes} label="Stock" isActive={activeView === 'stock'} onClick={() => setActiveView('stock')} />
            <NavItem icon={QrCode} label="QSeal" isActive={activeView === 'qseal'} onClick={() => setActiveView('qseal')} />
          </nav>
        </div>
      </header>

      <main className="container px-4 py-8">
        {activeView === 'items' && <ItemManagement />}
        {activeView === 'warehouses' && <WarehouseManagement />}
        {activeView === 'item-group' && <ItemGroupManagement />}
        {activeView === 'stock' && <StockManagement />}
        {activeView === 'qseal' && <QSealManagement />}
      </main>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Public QR verification route — no auth required */}
        <Route path="/g/:gtin/s/:serial/:timestamp" element={<PublicQRValidation />} />
        {/* Main authenticated app */}
        <Route path="*" element={<MainApp />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
