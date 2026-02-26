import * as React from 'react';

import { BookOpen, FileText, CreditCard, Settings, BarChart3 } from 'lucide-react';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import { AccountManagement, SystemConfiguration, Reports } from '../components/accounts';
import { PaymentManagement } from '../components/payments/PaymentManagement';

type ActiveView = 'coa' | 'journal_entries' | 'payments' | 'reports' | 'configuration';

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
export function BooksPage() {
  const [activeView, setActiveView] = React.useState<ActiveView>('coa');
  
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        {/* Top Navigation Bar */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center px-4">
            <nav className="flex items-center gap-2">
              <NavItem 
                icon={BookOpen} 
                label="Chart of Accounts" 
                isActive={activeView === 'coa'} 
                onClick={() => setActiveView('coa')} 
              />
              <NavItem 
                icon={BarChart3} 
                label="Reports" 
                isActive={activeView === 'reports'} 
                onClick={() => setActiveView('reports')} 
              />
              <NavItem 
                icon={FileText} 
                label="Journal Entries" 
                isActive={activeView === 'journal_entries'} 
                onClick={() => setActiveView('journal_entries')} 
              />
              <NavItem 
                icon={CreditCard} 
                label="Payments" 
                isActive={activeView === 'payments'} 
                onClick={() => setActiveView('payments')} 
              />
              <NavItem 
                icon={Settings} 
                label="Configuration" 
                isActive={activeView === 'configuration'} 
                onClick={() => setActiveView('configuration')} 
              />
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="container px-4 py-8">
          {activeView === 'coa' && <AccountManagement />}
          {activeView === 'reports' && <Reports />}
          {activeView === 'journal_entries' && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-2xl font-semibold mb-2">Journal Entries</h2>
                <p className="text-muted-foreground">Coming soon - Phase 2</p>
              </div>
            </div>
          )}
          {activeView === 'payments' && <PaymentManagement />}
          {activeView === 'configuration' && <SystemConfiguration />}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default BooksPage;
