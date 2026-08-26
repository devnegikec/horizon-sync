import * as React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Package, QrCode, Palette, BarChart3, Zap, Settings } from 'lucide-react';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import {
  QSealManagement,
  BlocksManagement,
  SkuCustomizationManagement,
  AnalyticsManagement,
  ActivationManagement,
  ProductSettingsManagement,
} from '../components/qseal';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

type ActiveView = 'products' | 'blocks' | 'sku_customization' | 'analytics' | 'activation' | 'product_settings';

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

export function QSealPage() {
  const [activeView, setActiveView] = React.useState<ActiveView>('products');

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          <header className="sticky top-0 z-50 w-full border-b bg-background">
            <div className="container flex h-16 items-center px-4">
              <nav className="flex items-center gap-2">
                <NavItem icon={Package} label="Products" isActive={activeView === 'products'} onClick={() => setActiveView('products')} />
                <NavItem icon={QrCode} label="QR Blocks" isActive={activeView === 'blocks'} onClick={() => setActiveView('blocks')} />
                <NavItem icon={Palette}
                  label="SKU Customization"
                  isActive={activeView === 'sku_customization'}
                  onClick={() => setActiveView('sku_customization')}/>
                <NavItem icon={BarChart3} label="Analytics" isActive={activeView === 'analytics'} onClick={() => setActiveView('analytics')} />
                <NavItem icon={Zap} label="Activation" isActive={activeView === 'activation'} onClick={() => setActiveView('activation')} />
                <NavItem icon={Settings}
                  label="Settings"
                  isActive={activeView === 'product_settings'}
                  onClick={() => setActiveView('product_settings')}/>
              </nav>
            </div>
          </header>

          <main className="container px-4 py-8">
            {activeView === 'products' && <QSealManagement />}
            {activeView === 'blocks' && <BlocksManagement />}
            {activeView === 'sku_customization' && <SkuCustomizationManagement />}
            {activeView === 'analytics' && <AnalyticsManagement />}
            {activeView === 'activation' && <ActivationManagement />}
            {activeView === 'product_settings' && <ProductSettingsManagement />}
          </main>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default QSealPage;
