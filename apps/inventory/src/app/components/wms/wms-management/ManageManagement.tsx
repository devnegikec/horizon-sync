import * as React from 'react';

import { Box, Layers, MapPin, Monitor, QrCode, Users } from 'lucide-react';

import { DeviceManagementPanel } from '../DeviceManagementPanel';
import { LocationQRPanel } from '../LocationQRPanel';
import { LocationTreeView } from '../LocationTreeView';
import { Warehouse3DView } from '../Warehouse3DView';
import { WarehouseLayoutDesigner } from '../WarehouseLayoutDesigner';
import { WorkersManagementPanel } from '../WorkersManagementPanel';

import { SectionTab } from './SectionTab';
import type { ManageSection, WMSContentProps } from './types';

export function ManageManagement({ manageSection, selectedWarehouseId, onManageSectionChange, canManage }: WMSContentProps) {
  const [treeKey, setTreeKey] = React.useState(0);

  /** Refresh the location tree after a layout is applied/updated/deleted. */
  const handleLayoutChanged = React.useCallback(() => {
    setTreeKey((k) => k + 1);
    onManageSectionChange('tree');
  }, [onManageSectionChange]);

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
          {canManage && (
            <SectionTab active={manageSection === 'designer'}
              icon={MapPin}
              label="Layout Designer"
              onClick={() => onManageSectionChange('designer')}/>
          )}
          <SectionTab active={manageSection === 'tree'} icon={Layers} label="Location Tree" onClick={() => onManageSectionChange('tree')} />
          <SectionTab active={manageSection === '3d'} icon={Box} label="3D View" onClick={() => onManageSectionChange('3d')} />
          <SectionTab active={manageSection === 'location-qr'}
            icon={QrCode}
            label="Location QR"
            onClick={() => onManageSectionChange('location-qr')}/>
        </div>
        <div className="p-4">
          <ManageSectionContent section={manageSection}
            warehouseId={selectedWarehouseId}
            canDesignLayout={canManage}
            treeKey={treeKey}
            onLayoutChanged={handleLayoutChanged}/>
        </div>
      </div>
    </div>
  );
}

interface ManageSectionContentProps {
  section: ManageSection;
  warehouseId: string;
  canDesignLayout: boolean;
  treeKey: number;
  onLayoutChanged: () => void;
}

function ManageSectionContent({
  section,
  warehouseId,
  canDesignLayout,
  treeKey,
  onLayoutChanged,
}: ManageSectionContentProps) {
  switch (section) {
    case 'workers':
      return <WorkersManagementPanel warehouseId={warehouseId || undefined} />;
    case 'devices':
      return <DeviceManagementPanel warehouseId={warehouseId || undefined} />;
    case 'location-qr':
      return <LocationQRPanel warehouseId={warehouseId || undefined} />;
    case 'designer':
      return <DesignerContent warehouseId={warehouseId} canDesignLayout={canDesignLayout} onLayoutChanged={onLayoutChanged} />;
    case 'tree':
      return <TreeContent warehouseId={warehouseId} treeKey={treeKey} />;
    case '3d':
      return <Warehouse3DContent warehouseId={warehouseId} />;
  }
}

function DesignerContent({
  warehouseId,
  canDesignLayout,
  onLayoutChanged,
}: {
  warehouseId: string;
  canDesignLayout: boolean;
  onLayoutChanged: () => void;
}) {
  if (!warehouseId || !canDesignLayout) {
    return <p className="text-sm text-muted-foreground">Select a warehouse to design its layout.</p>;
  }
  return <WarehouseLayoutDesigner key={warehouseId} warehouseId={warehouseId} onApplied={onLayoutChanged} />;
}

function TreeContent({ warehouseId, treeKey }: { warehouseId: string; treeKey: number }) {
  if (!warehouseId) {
    return <p className="text-sm text-muted-foreground">Select a warehouse to view its location tree.</p>;
  }
  return <LocationTreeView key={treeKey} warehouseId={warehouseId} />;
}

function Warehouse3DContent({ warehouseId }: { warehouseId: string }) {
  if (!warehouseId) {
    return <p className="text-sm text-muted-foreground">Select a warehouse to view its 3D layout.</p>;
  }
  return <Warehouse3DView warehouseId={warehouseId} />;
}
