import * as React from 'react';

import { ArrowDownToLine, ArrowUpFromLine, Boxes, Settings, Truck } from 'lucide-react';

import { Show } from '@horizon-sync/access';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { cn } from '@horizon-sync/ui/lib';

import type { WMSView } from './types';

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

interface WMSNavigationProps {
  activeView: WMSView;
  onViewChange: (view: WMSView) => void;
}

/** Top-level WMS view switcher (Advance Stock Notice / Inbound / Outbound / Stock / Manage). */
export function WMSNavigation({ activeView, onViewChange }: WMSNavigationProps) {
  return (
    <div className="border-b">
      <nav className="flex items-center gap-1 pb-0 overflow-x-auto">
        <NavItem icon={Truck} label="Advance Stock Notice" isActive={activeView === 'asn'} onClick={() => onViewChange('asn')} />
        <NavItem icon={ArrowDownToLine} label="Inbound" isActive={activeView === 'inbound'} onClick={() => onViewChange('inbound')} />
        <NavItem icon={ArrowUpFromLine} label="Outbound" isActive={activeView === 'outbound'} onClick={() => onViewChange('outbound')} />
        <NavItem icon={Boxes} label="Stock" isActive={activeView === 'stock'} onClick={() => onViewChange('stock')} />
        <Show module="wms" resource="manage">
          <NavItem icon={Settings} label="Manage" isActive={activeView === 'manage'} onClick={() => onViewChange('manage')} />
        </Show>
      </nav>
    </div>
  );
}
