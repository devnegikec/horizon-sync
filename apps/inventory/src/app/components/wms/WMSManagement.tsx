import * as React from 'react';

import { Warehouse, ArrowDownToLine, ArrowUpFromLine, ShieldCheck, Truck, MapPin } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { cn } from '@horizon-sync/ui/lib';

import { useMyWarehouses } from '../../hooks/useMyWarehouses';
import { DispatchList } from './DispatchList';
import { GateVerificationPanel } from './GateVerificationPanel';
import { InboundScanPanel } from './InboundScanPanel';
import { LocationTreeView } from './LocationTreeView';
import { PickListView } from './PickListView';
import { ReceivingSlipList } from './ReceivingSlipList';

type WMSView = 'layout' | 'inbound' | 'receiving' | 'outbound' | 'gate' | 'dispatch';

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

export function WMSManagement() {
  const [activeView, setActiveView] = React.useState<WMSView>('layout');
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string>('');
  const [gatePickListId, setGatePickListId] = React.useState<string>('');

  const { warehouses, loading: warehousesLoading } = useMyWarehouses();

  // Auto-select first warehouse
  React.useEffect(() => {
    if (!selectedWarehouseId && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

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
          <NavItem icon={ArrowDownToLine} label="Inbound Scan" isActive={activeView === 'inbound'} onClick={() => setActiveView('inbound')} />
          <NavItem icon={Warehouse} label="Receiving Slips" isActive={activeView === 'receiving'} onClick={() => setActiveView('receiving')} />
          <NavItem icon={ArrowUpFromLine} label="Pick Lists" isActive={activeView === 'outbound'} onClick={() => setActiveView('outbound')} />
          <NavItem icon={ShieldCheck} label="Gate Verification" isActive={activeView === 'gate'} onClick={() => setActiveView('gate')} />
          <NavItem icon={Truck} label="Dispatches" isActive={activeView === 'dispatch'} onClick={() => setActiveView('dispatch')} />
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeView === 'layout' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Warehouse Layout</h2>
              <p className="text-sm text-muted-foreground">
                Hierarchical view of zones, aisles, bays, levels, and bins with capacity indicators.
              </p>
            </div>
            {selectedWarehouseId ? (
              <div className="border rounded-lg p-4 bg-card">
                <LocationTreeView warehouseId={selectedWarehouseId} />
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-4">Select a warehouse to view its layout.</div>
            )}
          </div>
        )}

        {activeView === 'inbound' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Inbound Scan Session</h2>
              <p className="text-sm text-muted-foreground">
                Start a dock scanning session to receive incoming boxes. End the session to generate a receiving slip.
              </p>
            </div>
            {selectedWarehouseId ? (
              <InboundScanPanel
                warehouseId={selectedWarehouseId}
                onSlipGenerated={() => setActiveView('receiving')}
              />
            ) : (
              <div className="text-sm text-muted-foreground">Select a warehouse to start scanning.</div>
            )}
          </div>
        )}

        {activeView === 'receiving' && (
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

        {activeView === 'outbound' && (
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

        {activeView === 'gate' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Gate Verification</h2>
              <p className="text-sm text-muted-foreground">
                Verify outbound shipments at the gate before dispatch. Enter a pick list ID to start.
              </p>
            </div>
            <div className="max-w-lg space-y-3">
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded-md px-3 py-2 text-sm bg-background font-mono"
                  placeholder="Enter Pick List ID..."
                  value={gatePickListId}
                  onChange={(e) => setGatePickListId(e.target.value)}
                />
              </div>
              {gatePickListId && (
                <div className="border rounded-lg p-4 bg-card">
                  <GateVerificationPanel
                    pickListId={gatePickListId}
                    onDispatchCreated={() => setActiveView('dispatch')}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'dispatch' && (
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
  );
}
