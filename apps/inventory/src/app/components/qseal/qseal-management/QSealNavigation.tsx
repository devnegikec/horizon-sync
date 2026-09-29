import * as React from 'react';

import { BarChart3, Layers, Package, Palette, QrCode, Settings, Zap } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import type { QSealView } from './types';

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

interface QSealNavigationProps {
  activeView: QSealView;
  canViewAnalytics: boolean;
  onViewChange: (view: QSealView) => void;
}

/** Top-level QSeal view switcher (Products / QR Blocks / SKU Customization / Analytics / Activation / Aggregation / Settings). */
export function QSealNavigation({ activeView, canViewAnalytics, onViewChange }: QSealNavigationProps) {
  return (
    <div className="border-b">
      <nav className="flex items-center gap-1 pb-0 overflow-x-auto">
        <NavItem icon={Package} label="Products" isActive={activeView === 'products'} onClick={() => onViewChange('products')} />
        <NavItem icon={QrCode} label="QR Blocks" isActive={activeView === 'blocks'} onClick={() => onViewChange('blocks')} />
        <NavItem icon={Palette}
          label="SKU Customization"
          isActive={activeView === 'sku_customization'}
          onClick={() => onViewChange('sku_customization')} />
        {canViewAnalytics && <NavItem icon={BarChart3} label="Analytics" isActive={activeView === 'analytics'} onClick={() => onViewChange('analytics')} />}
        <NavItem icon={Zap} label="Activation" isActive={activeView === 'activation'} onClick={() => onViewChange('activation')} />
        <NavItem icon={Layers} label="Aggregation" isActive={activeView === 'aggregation'} onClick={() => onViewChange('aggregation')} />
        <NavItem icon={Settings}
          label="Settings"
          isActive={activeView === 'product_settings'}
          onClick={() => onViewChange('product_settings')} />
      </nav>
    </div>
  );
}
