import * as React from 'react';

import { ClipboardList, DollarSign, FileText, ShoppingCart, Truck, Users } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import type { RevenueView } from './types';

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

interface RevenueNavigationProps {
  activeView: RevenueView;
  showInvoices: boolean;
  onViewChange: (view: RevenueView) => void;
}

/** Top-level Revenue view switcher (Customers / Quotations / Sales Orders / Pick Lists / Delivery Notes / Invoices). */
export function RevenueNavigation({ activeView, showInvoices, onViewChange }: RevenueNavigationProps) {
  return (
    <div className="border-b">
      <nav className="flex items-center gap-1 pb-0 overflow-x-auto">
        <NavItem icon={Users} label="Customers" isActive={activeView === 'customers'} onClick={() => onViewChange('customers')} />
        <NavItem icon={FileText} label="Quotations" isActive={activeView === 'quotations'} onClick={() => onViewChange('quotations')} />
        <NavItem icon={ShoppingCart} label="Sales Orders" isActive={activeView === 'sales_orders'} onClick={() => onViewChange('sales_orders')} />
        <NavItem icon={ClipboardList} label="Pick Lists" isActive={activeView === 'pick_lists'} onClick={() => onViewChange('pick_lists')} />
        <NavItem icon={Truck} label="Delivery Notes" isActive={activeView === 'delivery_notes'} onClick={() => onViewChange('delivery_notes')} />
        {showInvoices && <NavItem icon={DollarSign} label="Invoices" isActive={activeView === 'invoices'} onClick={() => onViewChange('invoices')} />}
        {/* Payments is deliberately not a tab — it is only reachable by recording a payment from an invoice. */}
      </nav>
    </div>
  );
}
