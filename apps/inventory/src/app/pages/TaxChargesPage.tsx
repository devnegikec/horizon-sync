import * as React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Receipt, DollarSign } from 'lucide-react';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

// Lazy load tax and charge management components for better performance
const TaxTemplateManagement = React.lazy(() => import('../components/tax-templates').then(m => ({ default: m.TaxTemplateManagement })));
const ChargeTemplateManagement = React.lazy(() => import('../components/charge-templates').then(m => ({ default: m.ChargeTemplateManagement })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

type ActiveView = 'tax_templates' | 'charge_templates';

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, isActive, onClick }: NavItemProps) {
  return (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      className={cn('gap-2 justify-start', isActive && 'bg-primary text-primary-foreground')}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  );
}

export function TaxChargesPage() {
  const [activeView, setActiveView] = React.useState<ActiveView>('tax_templates');

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          {/* Top Navigation Bar */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center px-4">
              <nav className="flex items-center gap-2">
                <NavItem
                  icon={Receipt}
                  label="Tax Templates"
                  isActive={activeView === 'tax_templates'}
                  onClick={() => setActiveView('tax_templates')}
                />
                <NavItem
                  icon={DollarSign}
                  label="Charge Templates"
                  isActive={activeView === 'charge_templates'}
                  onClick={() => setActiveView('charge_templates')}
                />
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="container px-4 py-8">
            {activeView === 'tax_templates' && (
              <React.Suspense fallback={<div className="flex items-center justify-center p-8">Loading tax templates...</div>}>
                <TaxTemplateManagement />
              </React.Suspense>
            )}
            {activeView === 'charge_templates' && (
              <React.Suspense fallback={<div className="flex items-center justify-center p-8">Loading charge templates...</div>}>
                <ChargeTemplateManagement />
              </React.Suspense>
            )}
          </main>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default TaxChargesPage;
