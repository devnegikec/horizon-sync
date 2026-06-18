import * as React from 'react';

import { Warehouse, ArrowDownToLine, ArrowUpFromLine, Box, ShieldCheck, Truck, MapPin, PackageCheck, Boxes, Users, Monitor, Settings, Layers } from 'lucide-react';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { cn } from '@horizon-sync/ui/lib';

import { useMyWarehouses } from '../../hooks/useMyWarehouses';
import { StockManagement } from '../stock';
import { DeviceManagementPanel } from './DeviceManagementPanel';
import { DispatchList } from './DispatchList';
import { GateVerificationPanel } from './GateVerificationPanel';
import { LocationTreeView } from './LocationTreeView';
import { PickListView } from './PickListView';
import { PutAwayView } from './PutAwayView';
import { ReceivingSlipList } from './ReceivingSlipList';
import { Warehouse3DView } from './Warehouse3DView';
import { WarehouseLayoutDesigner } from './WarehouseLayoutDesigner';
import { WorkersManagementPanel } from './WorkersManagementPanel';

type WMSView = 'layout' | 'inbound' | 'outbound' | 'stock' | 'manage';
type LayoutTab = 'tree' | 'designer' | '3d';
type InboundSection = 'receiving' | 'putaway';
type OutboundSection = 'pick' | 'gate' | 'dispatch';

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
  const [activeView, setActiveView] = React.useState<WMSView>('layout');
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string>('');
  const [gatePickListId, setGatePickListId] = React.useState<string>('');
  const [manageSection, setManageSection] = React.useState<'workers' | 'devices'>('workers');
  const [inboundSection, setInboundSection] = React.useState<InboundSection>('receiving');
  const [outboundSection, setOutboundSection] = React.useState<OutboundSection>('pick');

  const { warehouses, loading: warehousesLoading, refetch: refetchWarehouses } = useMyWarehouses();

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
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouse Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage inbound receiving, put-away, outbound picking, and gate verification
          </p>
        </div>

        {/* Warehouse selector */}
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium shrink-0">Warehouse</Label>
          <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId} disabled={warehousesLoading}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder={warehousesLoading ? 'Loading...' : 'Select warehouse'} />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.name} ({wh.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sub-navigation */}
      <div className="border-b">
        <nav className="flex items-center gap-1 pb-0 overflow-x-auto">
          <NavItem icon={MapPin} label="Layout" isActive={activeView === 'layout'} onClick={() => setActiveView('layout')} />
          <NavItem icon={ArrowDownToLine} label="Inbound" isActive={activeView === 'inbound'} onClick={() => setActiveView('inbound')} />
          <NavItem icon={ArrowUpFromLine} label="Outbound" isActive={activeView === 'outbound'} onClick={() => setActiveView('outbound')} />
          <NavItem icon={Boxes} label="Stock" isActive={activeView === 'stock'} onClick={() => setActiveView('stock')} />
          <NavItem icon={Settings} label="Manage" isActive={activeView === 'manage'} onClick={() => setActiveView('manage')} />
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeView === 'layout' && (
          <LayoutView selectedWarehouseId={selectedWarehouseId} />
        )}

        {activeView === 'inbound' && (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="flex border-b">
                <button
                  className={cn('px-4 py-2 text-sm font-medium', inboundSection === 'receiving' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted')}
                  onClick={() => setInboundSection('receiving')}>
                  <span className="flex items-center gap-2">
                    <Warehouse className="h-4 w-4" />
                    Receiving Slips
                  </span>
                </button>
                <button
                  className={cn('px-4 py-2 text-sm font-medium', inboundSection === 'putaway' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted')}
                  onClick={() => setInboundSection('putaway')}>
                  <span className="flex items-center gap-2">
                    <PackageCheck className="h-4 w-4" />
                    Put-Away
                  </span>
                </button>
              </div>
              <div className="p-4 space-y-4">
                {inboundSection === 'receiving' && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold">Receiving Slips</h2>
                      <p className="text-sm text-muted-foreground">
                        Review and approve or reject receiving slips generated from inbound scan sessions.
                      </p>
                    </div>
                    <ReceivingSlipList warehouseId={selectedWarehouseId || undefined} />
                  </div>
                )}
                {inboundSection === 'putaway' && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold">Put-Away Lists</h2>
                      <p className="text-sm text-muted-foreground">
                        Put-away lists are generated automatically when a receiving slip is approved. Click a row to see its items.
                      </p>
                    </div>
                    <PutAwayView warehouseId={selectedWarehouseId || undefined} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'outbound' && (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="flex border-b">
                <button
                  className={cn('px-4 py-2 text-sm font-medium', outboundSection === 'pick' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted')}
                  onClick={() => setOutboundSection('pick')}>
                  <span className="flex items-center gap-2">
                    <ArrowUpFromLine className="h-4 w-4" />
                    Pick Lists
                  </span>
                </button>
                <button
                  className={cn('px-4 py-2 text-sm font-medium', outboundSection === 'gate' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted')}
                  onClick={() => setOutboundSection('gate')}>
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Gate Verification
                  </span>
                </button>
                <button
                  className={cn('px-4 py-2 text-sm font-medium', outboundSection === 'dispatch' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted')}
                  onClick={() => setOutboundSection('dispatch')}>
                  <span className="flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Dispatches
                  </span>
                </button>
              </div>
              <div className="p-4 space-y-4">
                {outboundSection === 'pick' && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold">Pick Lists</h2>
                      <p className="text-sm text-muted-foreground">
                        Manage outbound pick lists. Scan items to fulfil orders and track picking progress.
                      </p>
                    </div>
                    <PickListView warehouseId={selectedWarehouseId || undefined} />
                  </div>
                )}
                {outboundSection === 'gate' && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold">Gate Verification</h2>
                      <p className="text-sm text-muted-foreground">
                        Verify outbound shipments at the gate before dispatch. Enter a pick list ID to start.
                      </p>
                    </div>
                    <div className="max-w-lg space-y-3">
                      <div className="flex gap-2">
                        <input className="flex-1 border rounded-md px-3 py-2 text-sm bg-background font-mono"
                          placeholder="Enter Pick List ID..."
                          value={gatePickListId}
                          onChange={(e) => setGatePickListId(e.target.value)}/>
                      </div>
                      {gatePickListId && (
                        <div className="border rounded-lg p-4 bg-card">
                          <GateVerificationPanel pickListId={gatePickListId}
                            onDispatchCreated={() => setOutboundSection('dispatch')}/>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {outboundSection === 'dispatch' && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-lg font-semibold">Dispatch Records</h2>
                      <p className="text-sm text-muted-foreground">
                        End-to-end traceability for all outbound shipments.
                      </p>
                    </div>
                    <DispatchList />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'stock' && (
          <StockManagement />
        )}

        {activeView === 'manage' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Manage</h2>
              <p className="text-sm text-muted-foreground">
                Manage warehouse workers and devices.
              </p>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <div className="flex border-b">
                <button
                  className={cn('px-4 py-2 text-sm font-medium', manageSection === 'workers' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted')}
                  onClick={() => setManageSection('workers')}>
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Workers
                  </span>
                </button>
                <button
                  className={cn('px-4 py-2 text-sm font-medium', manageSection === 'devices' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted')}
                  onClick={() => setManageSection('devices')}>
                  <span className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Devices
                  </span>
                </button>
              </div>
              <div className="p-4">
                {manageSection === 'workers' && <WorkersManagementPanel warehouseId={selectedWarehouseId || undefined} />}
                {manageSection === 'devices' && <DeviceManagementPanel warehouseId={selectedWarehouseId || undefined} />}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutView({ selectedWarehouseId }: { selectedWarehouseId: string | null }) {
  const [layoutTab, setLayoutTab] = React.useState<LayoutTab>('tree');
  const [treeKey, setTreeKey] = React.useState(0);

  /** Refresh the location tree after a layout is applied/updated/deleted. */
  const handleLayoutChanged = React.useCallback(() => {
    setTreeKey((k) => k + 1);
    // Switch to tree tab so the user can see the change
    setLayoutTab('tree');
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Warehouse Layout</h2>
          <p className="text-sm text-muted-foreground">
            View the location hierarchy or design a new layout from scratch.
          </p>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="flex border-b">
          <button
            className={cn('px-4 py-2 text-sm font-medium', layoutTab === 'tree' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted')}
            onClick={() => setLayoutTab('tree')}>
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Location Tree
            </span>
          </button>
          <button
            className={cn('px-4 py-2 text-sm font-medium', layoutTab === 'designer' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted')}
            onClick={() => setLayoutTab('designer')}>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Layout Designer
            </span>
          </button>
          <button
            className={cn('px-4 py-2 text-sm font-medium', layoutTab === '3d' ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted')}
            onClick={() => setLayoutTab('3d')}>
            <span className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              3D View
            </span>
          </button>
        </div>
        <div className="p-4">
          {layoutTab === 'tree' && (
            selectedWarehouseId
              ? <LocationTreeView key={treeKey} warehouseId={selectedWarehouseId} />
              : <p className="text-sm text-muted-foreground">Select a warehouse to view its layout.</p>
          )}
          {layoutTab === 'designer' && (
            selectedWarehouseId
              ? <WarehouseLayoutDesigner warehouseId={selectedWarehouseId} onApplied={handleLayoutChanged} />
              : <p className="text-sm text-muted-foreground">Select a warehouse to use the Layout Designer.</p>
          )}
          {layoutTab === '3d' && (
            selectedWarehouseId
              ? <Warehouse3DView warehouseId={selectedWarehouseId} />
              : <p className="text-sm text-muted-foreground">Select a warehouse to view the 3D layout.</p>
          )}
        </div>
      </div>
    </div>
  );
}
