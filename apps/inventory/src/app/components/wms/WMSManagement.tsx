import * as React from 'react';

import {
  Warehouse,
  ArrowDownToLine,
  ArrowUpFromLine,
  Box,
  MapPin,
  PackageCheck,
  Boxes,
  Users,
  Monitor,
  Settings,
  Layers,
  QrCode,
  Truck,
  LayoutDashboard,
  AlertTriangle,
  ScanLine,
} from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { cn } from '@horizon-sync/ui/lib';

import { useMyWarehouses } from '../../hooks/useMyWarehouses';
import { StockManagement } from '../stock';

import { AsnManagement } from './AsnManagement';
import { DashboardPanel } from './DashboardPanel';
import { DeviceManagementPanel } from './DeviceManagementPanel';
import { InboundExceptionQueue } from './InboundExceptionQueue';
import { InboundScanPanel } from './InboundScanPanel';
import { LocationQRPanel } from './LocationQRPanel';
import { LocationTreeView } from './LocationTreeView';
import { OutboundManagement } from './OutboundManagement';
import { PutAwayView } from './PutAwayView';
import { ReceivingSlipList } from './ReceivingSlipList';
import { VehicleArrivalManagement } from './VehicleArrivalManagement';
import { Warehouse3DView } from './Warehouse3DView';
import { WarehouseCapacityCard } from './WarehouseCapacityCard';
import { WarehouseLayoutDesigner } from './WarehouseLayoutDesigner';
import { WorkersManagementPanel } from './WorkersManagementPanel';

type WMSView = 'asn' | 'inbound' | 'outbound' | 'stock' | 'manage';
type LayoutTab = 'tree' | 'designer' | '3d';
type InboundSection = 'scan' | 'receiving' | 'putaway' | 'vehicle' | 'exceptions';

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

export function WMSManagement() {
  const [activeView, setActiveView] = React.useState<WMSView>('asn');
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string>('');
  const [manageSection, setManageSection] = React.useState<'workers' | 'devices' | 'layout' | 'location-qr'>('workers');
  const [inboundSection, setInboundSection] = React.useState<InboundSection>('receiving');

  const { warehouses, loading: warehousesLoading, refetch: refetchWarehouses } = useMyWarehouses();
  const userPermissions = useUserStore((s) => s.permissions.permissions);
  const canManage = userPermissions.includes('warehouse.manage') || userPermissions.includes('*.*');

  // Redirect away from manage view if user lacks permission
  React.useEffect(() => {
    if (activeView === 'manage' && !canManage) {
      setActiveView('asn');
    }
  }, [activeView, canManage]);

  // Auto-select first warehouse
  React.useEffect(() => {
    if (!selectedWarehouseId && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  // Refresh warehouse list when warehouses are created/imported elsewhere
  React.useEffect(() => {
    const handleWarehouseChange = () => {
      refetchWarehouses();
    };
    window.addEventListener('warehouse:changed', handleWarehouseChange);
    return () => window.removeEventListener('warehouse:changed', handleWarehouseChange);
  }, [refetchWarehouses]);

  if (warehousesLoading && !selectedWarehouseId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3058EE] mx-auto mb-4" />
          <p className="text-muted-foreground">Loading WMS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <WMSHeader warehouses={warehouses}
        warehousesLoading={warehousesLoading}
        selectedWarehouseId={selectedWarehouseId}
        onWarehouseChange={setSelectedWarehouseId} />
      <WMSNavigation activeView={activeView} canManage={canManage} onViewChange={setActiveView} />
      <WMSContent activeView={activeView}
        canManage={canManage}
        inboundSection={inboundSection}
        manageSection={manageSection}
        selectedWarehouseId={selectedWarehouseId}
        onInboundSectionChange={setInboundSection}
        onManageSectionChange={setManageSection} />
    </div>
  );
}

interface WMSHeaderProps {
  warehouses: Array<{ id: string; name: string; code: string }>;
  warehousesLoading: boolean;
  selectedWarehouseId: string;
  onWarehouseChange: (warehouseId: string) => void;
}

function WMSHeader({ warehouses, warehousesLoading, selectedWarehouseId, onWarehouseChange }: WMSHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Warehouse Management</h1>
        <p className="text-muted-foreground mt-1">Manage inbound receiving, put-away, outbound picking, and gate verification</p>
      </div>
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium shrink-0">Warehouse</Label>
        <Select value={selectedWarehouseId} onValueChange={onWarehouseChange} disabled={warehousesLoading}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder={warehousesLoading ? 'Loading...' : 'Select warehouse'} />
          </SelectTrigger>
          <SelectContent>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name} ({warehouse.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function WMSNavigation({ activeView, canManage, onViewChange }: { activeView: WMSView; canManage: boolean; onViewChange: (view: WMSView) => void }) {
  return (
    <div className="border-b">
      <nav className="flex items-center gap-1 pb-0 overflow-x-auto">
        <NavItem icon={Truck} label="Advance Stock Notice" isActive={activeView === 'asn'} onClick={() => onViewChange('asn')} />
        <NavItem icon={ArrowDownToLine} label="Inbound" isActive={activeView === 'inbound'} onClick={() => onViewChange('inbound')} />
        <NavItem icon={ArrowUpFromLine} label="Outbound" isActive={activeView === 'outbound'} onClick={() => onViewChange('outbound')} />
        <NavItem icon={Boxes} label="Stock" isActive={activeView === 'stock'} onClick={() => onViewChange('stock')} />
        {canManage && <NavItem icon={Settings} label="Manage" isActive={activeView === 'manage'} onClick={() => onViewChange('manage')} />}
      </nav>
    </div>
  );
}

interface WMSContentProps {
  activeView: WMSView;
  canManage: boolean;
  inboundSection: InboundSection;
  manageSection: 'workers' | 'devices' | 'layout' | 'location-qr';
  selectedWarehouseId: string;
  onInboundSectionChange: (section: InboundSection) => void;
  onManageSectionChange: (section: 'workers' | 'devices' | 'layout' | 'location-qr') => void;
}

const wmsViewComponents: Record<WMSView, React.ComponentType<WMSContentProps>> = {
  asn: AsnContent,
  inbound: InboundManagement,
  outbound: OutboundContent,
  stock: StockContent,
  manage: ManageContent,
};

function WMSContent({ activeView, ...props }: WMSContentProps) {
  const Content = wmsViewComponents[activeView];
  return <Content activeView={activeView} {...props} />;
}

function AsnContent({ selectedWarehouseId }: WMSContentProps) {
  return <AsnManagement warehouseId={selectedWarehouseId || undefined} />;
}

function OutboundContent({ selectedWarehouseId }: WMSContentProps) {
  return <OutboundManagement warehouseId={selectedWarehouseId || null} />;
}

function StockContent({ selectedWarehouseId }: WMSContentProps) {
  return <StockManagement warehouseId={selectedWarehouseId || undefined} />;
}

function ManageContent({ canManage, ...props }: WMSContentProps) {
  return canManage ? <ManageManagement canManage={canManage} {...props} /> : null;
}

function SectionTab({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) {
  return (
    <button className={cn('px-4 py-2 text-sm font-medium', active ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted')}
      onClick={onClick}>
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </span>
    </button>
  );
}

function InboundManagement({ inboundSection, selectedWarehouseId, onInboundSectionChange }: WMSContentProps) {
  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="flex border-b">
          <SectionTab active={inboundSection === 'scan'} icon={ScanLine} label="Scan & Reconcile" onClick={() => onInboundSectionChange('scan')} />
          <SectionTab active={inboundSection === 'receiving'}
            icon={Warehouse}
            label="Receiving Slips"
            onClick={() => onInboundSectionChange('receiving')} />
          <SectionTab active={inboundSection === 'putaway'} icon={PackageCheck} label="Put-Away" onClick={() => onInboundSectionChange('putaway')} />
          <SectionTab active={inboundSection === 'vehicle'} icon={Truck} label="Vehicle Arrivals" onClick={() => onInboundSectionChange('vehicle')} />
          <SectionTab active={inboundSection === 'exceptions'}
            icon={AlertTriangle}
            label="Holds & Quarantine"
            onClick={() => onInboundSectionChange('exceptions')} />
        </div>
        <div className="p-4 space-y-4">
          <InboundSectionContent section={inboundSection}
            warehouseId={selectedWarehouseId}
            onSlipGenerated={() => onInboundSectionChange('receiving')} />
        </div>
      </div>
    </div>
  );
}

function InboundSectionContent({
  section,
  warehouseId,
  onSlipGenerated,
}: {
  section: InboundSection;
  warehouseId: string;
  onSlipGenerated: () => void;
}) {
  switch (section) {
    case 'scan':
      return warehouseId ? (
        <InboundScanView warehouseId={warehouseId} onSlipGenerated={onSlipGenerated} />
      ) : (
        <p className="text-sm text-muted-foreground">Select a warehouse to start an inbound session.</p>
      );
    case 'receiving':
      return <ReceivingSlipSection warehouseId={warehouseId} />;
    case 'putaway':
      return <PutAwaySection warehouseId={warehouseId} />;
    case 'vehicle':
      return <VehicleArrivalManagement warehouseId={warehouseId || undefined} />;
    case 'exceptions':
      return <InboundExceptionQueue warehouseId={warehouseId || undefined} />;
  }
}

function InboundScanView({ warehouseId, onSlipGenerated }: { warehouseId: string; onSlipGenerated: () => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Inbound Scan & Reconciliation</h2>
        <p className="text-sm text-muted-foreground">Scan inbound items against an ASN and monitor the live expected-versus-received balance.</p>
      </div>
      <InboundScanPanel warehouseId={warehouseId} onSlipGenerated={onSlipGenerated} />
    </div>
  );
}

function ReceivingSlipSection({ warehouseId }: { warehouseId: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Receiving Slips</h2>
        <p className="text-sm text-muted-foreground">Review and approve or reject receiving slips generated from inbound scan sessions.</p>
      </div>
      <ReceivingSlipList warehouseId={warehouseId || undefined} />
    </div>
  );
}

function PutAwaySection({ warehouseId }: { warehouseId: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Put-Away Lists</h2>
        <p className="text-sm text-muted-foreground">
          Put-away lists are generated automatically when a receiving slip is approved. Click a row to see its items.
        </p>
      </div>
      <PutAwayView warehouseId={warehouseId || undefined} />
    </div>
  );
}

function ManageManagement({ manageSection, selectedWarehouseId, onManageSectionChange }: WMSContentProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Manage</h2>
        <p className="text-sm text-muted-foreground">Manage warehouse layout, workers, devices, and location QR codes.</p>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="flex border-b">
          <SectionTab active={manageSection === 'workers'} icon={Users} label="Workers" onClick={() => onManageSectionChange('workers')} />
          <SectionTab active={manageSection === 'devices'} icon={Monitor} label="Devices" onClick={() => onManageSectionChange('devices')} />
          <SectionTab active={manageSection === 'layout'} icon={MapPin} label="Layout" onClick={() => onManageSectionChange('layout')} />
          <SectionTab active={manageSection === 'location-qr'}
            icon={QrCode}
            label="Location QR"
            onClick={() => onManageSectionChange('location-qr')} />
        </div>
        <div className="p-4">
          <ManageSectionContent section={manageSection} warehouseId={selectedWarehouseId} />
        </div>
      </div>
    </div>
  );
}

function ManageSectionContent({ section, warehouseId }: { section: WMSContentProps['manageSection']; warehouseId: string }) {
  switch (section) {
    case 'workers':
      return <WorkersManagementPanel warehouseId={warehouseId || undefined} />;
    case 'devices':
      return <DeviceManagementPanel warehouseId={warehouseId || undefined} />;
    case 'layout':
      return <LayoutView selectedWarehouseId={warehouseId} />;
    case 'location-qr':
      return <LocationQRPanel warehouseId={warehouseId || undefined} />;
  }
}

function LayoutView({ selectedWarehouseId }: { selectedWarehouseId: string | null }) {
  const userPermissions = useUserStore((s) => s.permissions.permissions);
  const canDesignLayout = userPermissions.includes('warehouse.manage') || userPermissions.includes('*.*');
  const [layoutTab, setLayoutTab] = React.useState<LayoutTab>(canDesignLayout ? 'designer' : 'tree');
  const [treeKey, setTreeKey] = React.useState(0);

  /** Refresh the location tree after a layout is applied/updated/deleted. */
  const handleLayoutChanged = React.useCallback(() => {
    setTreeKey((k) => k + 1);
    setLayoutTab('tree');
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Warehouse Layout</h2>
          <p className="text-sm text-muted-foreground">View the location hierarchy or design a new layout from scratch.</p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="flex border-b">
          {canDesignLayout && (
            <SectionTab active={layoutTab === 'designer'} icon={MapPin} label="Layout Designer" onClick={() => setLayoutTab('designer')} />
          )}
          <SectionTab active={layoutTab === 'tree'} icon={Layers} label="Location Tree" onClick={() => setLayoutTab('tree')} />
          <SectionTab active={layoutTab === '3d'} icon={Box} label="3D View" onClick={() => setLayoutTab('3d')} />
        </div>
        <div className="p-4">
          <LayoutTabContent canDesignLayout={canDesignLayout}
            layoutTab={layoutTab}
            selectedWarehouseId={selectedWarehouseId}
            treeKey={treeKey}
            onLayoutChanged={handleLayoutChanged} />
        </div>
      </div>
    </div>
  );
}

interface LayoutTabContentProps {
  canDesignLayout: boolean;
  layoutTab: LayoutTab;
  selectedWarehouseId: string | null;
  treeKey: number;
  onLayoutChanged: () => void;
}

function LayoutTabContent({ canDesignLayout, layoutTab, selectedWarehouseId, treeKey, onLayoutChanged }: LayoutTabContentProps) {
  if (!selectedWarehouseId) {
    return <p className="text-sm text-muted-foreground">Select a warehouse to view its layout.</p>;
  }

  switch (layoutTab) {
    case 'designer':
      return canDesignLayout ? <WarehouseLayoutDesigner warehouseId={selectedWarehouseId} onApplied={onLayoutChanged} /> : null;
    case 'tree':
      return <LocationTreeView key={treeKey} warehouseId={selectedWarehouseId} />;
    case '3d':
      return <Warehouse3DView warehouseId={selectedWarehouseId} />;
  }
}
