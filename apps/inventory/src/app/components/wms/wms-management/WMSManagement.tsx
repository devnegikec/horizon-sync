import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { useSelectedWarehouse } from '../../../hooks/useSelectedWarehouse';
import { hasPermission } from '../../../utils/permissions';

import type { InboundSection, ManageSection, WMSView } from './types';
import { WMSContent } from './WMSContent';
import { WMSHeader } from './WMSHeader';
import { WMSNavigation } from './WMSNavigation';

/**
 * Warehouse Management shell: owns the selected view/section state and the
 * shared filters, then delegates rendering to the view-specific components in
 * this folder (`WMSContent` routes to `InboundManagement` / `ManageManagement`
 * and the ASN / Outbound / Stock views).
 */
export function WMSManagement() {
  const [activeView, setActiveView] = React.useState<WMSView>('asn');
  const [manageSection, setManageSection] = React.useState<ManageSection>('workers');
  const [inboundSection, setInboundSection] = React.useState<InboundSection>('receiving');
  const [receivingStatusFilter, setReceivingStatusFilter] = React.useState<string>('all');
  const [putawayStatusFilter, setPutawayStatusFilter] = React.useState<string>('all');

  // App-wide warehouse selection, kept in a persisted store (not component state)
  // so it survives tab switches, route changes and reloads instead of snapping
  // back to the first assigned warehouse on every remount.
  const { warehouses, loading: warehousesLoading, warehouseId: selectedWarehouseId, setWarehouseId: setSelectedWarehouseId, refetch: refetchWarehouses } = useSelectedWarehouse();
  const userPermissions = useUserStore((s) => s.permissions.permissions);
  const userType = useUserStore((s) => s.user?.user_type);
  const isAdmin = userType === 'system_admin' || userType === 'organization_admin';
  const canManage = isAdmin || hasPermission(userPermissions, 'warehouse.manage');

  // Redirect away from manage view if user lacks permission
  React.useEffect(() => {
    if (activeView === 'manage' && !canManage) {
      setActiveView('asn');
    }
  }, [activeView, canManage]);

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
        onWarehouseChange={setSelectedWarehouseId}/>
      <WMSNavigation activeView={activeView} canManage={canManage} onViewChange={setActiveView} />
      <WMSContent activeView={activeView}
        canManage={canManage}
        inboundSection={inboundSection}
        manageSection={manageSection}
        receivingStatusFilter={receivingStatusFilter}
        putawayStatusFilter={putawayStatusFilter}
        selectedWarehouseId={selectedWarehouseId}
        onInboundSectionChange={setInboundSection}
        onManageSectionChange={setManageSection}
        onReceivingStatusFilterChange={setReceivingStatusFilter}
        onPutawayStatusFilterChange={setPutawayStatusFilter}/>
    </div>
  );
}
