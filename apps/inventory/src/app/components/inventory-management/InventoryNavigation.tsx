import * as React from 'react';

import { Boxes, Layers, Package, Warehouse } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import type { InventoryView } from './types';

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

interface InventoryNavigationProps {
  activeView: InventoryView;
  onViewChange: (view: InventoryView) => void;
  /** Views the current user is permitted to see; forbidden views are hidden. */
  visibleViews: InventoryView[];
}

/** Top-level Inventory view switcher (Items / Warehouses / Item Groups / Stock). */
export function InventoryNavigation({ activeView, onViewChange, visibleViews }: InventoryNavigationProps) {
  return (
    <div className="border-b">
      <nav className="flex items-center gap-1 pb-0 overflow-x-auto">
        {visibleViews.includes('items') && (
          <NavItem icon={Package} label="Items" isActive={activeView === 'items'} onClick={() => onViewChange('items')} />
        )}
        {visibleViews.includes('warehouses') && (
          <NavItem icon={Warehouse} label="Warehouses" isActive={activeView === 'warehouses'} onClick={() => onViewChange('warehouses')} />
        )}
        {visibleViews.includes('item_groups') && (
          <NavItem icon={Layers} label="Item Groups" isActive={activeView === 'item_groups'} onClick={() => onViewChange('item_groups')} />
        )}
        {visibleViews.includes('stock') && (
          <NavItem icon={Boxes} label="Stock" isActive={activeView === 'stock'} onClick={() => onViewChange('stock')} />
        )}
      </nav>
    </div>
  );
}
