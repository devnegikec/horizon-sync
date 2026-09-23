import * as React from 'react';

import { AlertTriangle, PackageCheck, RefreshCw, RotateCcw, Truck, Warehouse } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';

import type { PutAwayStatusCounts, ReceivingSlipStatusCounts } from '../../../types/wms.types';
import { hasPermission } from '../../../utils/permissions';
import { InboundExceptionQueue } from '../InboundExceptionQueue';
import { InboundStats } from '../InboundStats';
import { PutAwayView } from '../PutAwayView';
import { ReceivingSlipList } from '../ReceivingSlipList';
import { ReturnsView } from '../returns';
import { VehicleArrivalManagement } from '../VehicleArrivalManagement';

import { SectionTab } from './SectionTab';
import type { InboundSection, WMSContentProps } from './types';

export function InboundManagement({
  inboundSection,
  selectedWarehouseId,
  receivingStatusFilter,
  putawayStatusFilter,
  onInboundSectionChange,
  onReceivingStatusFilterChange,
  onPutawayStatusFilterChange,
}: WMSContentProps) {
  const [refreshKey, setRefreshKey] = React.useState(0);
  // Returns is a newer module with its own permission codes, so its tab only
  // appears once the caller has been granted `return.read`.
  const userPermissions = useUserStore((s) => s.permissions.permissions);
  const canViewReturns = hasPermission(userPermissions, 'return.read');
  // Both count sets are produced by the list requests in `ReceivingSlipList` /
  // `PutAwayView` so the stat cards don't fetch the same endpoints a second time.
  const [receivingCounts, setReceivingCounts] = React.useState<ReceivingSlipStatusCounts | null>(null);
  const [putawayCounts, setPutawayCounts] = React.useState<PutAwayStatusCounts | null>(null);

  const openReceiving = (status: string) => {
    onReceivingStatusFilterChange(status);
    onInboundSectionChange('receiving');
  };

  const openPutAway = (status: string) => {
    onPutawayStatusFilterChange(status);
    onInboundSectionChange('putaway');
  };

  const handleRefresh = React.useCallback(() => setRefreshKey((k) => k + 1), []);

  const heading = inboundHeading(inboundSection);

  return (
    <div className="space-y-4">
      {heading && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{heading.title}</h2>
            <p className="text-sm text-muted-foreground">{heading.subtitle}</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 shrink-0 self-start sm:self-auto">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      )}
      <InboundStats activeSection={inboundSection}
        receivingCounts={receivingCounts}
        putawayCounts={putawayCounts}
        onSelectReceivingStatus={openReceiving}
        onSelectPutAwayStatus={openPutAway}/>
      <div className="border rounded-lg overflow-hidden">
        <div className="flex border-b">
          <SectionTab active={inboundSection === 'receiving'} icon={Warehouse} label="Receiving Slips" onClick={() => openReceiving('all')} />
          <SectionTab active={inboundSection === 'putaway'} icon={PackageCheck} label="Put-Away" onClick={() => openPutAway('all')} />
          <SectionTab active={inboundSection === 'vehicle'} icon={Truck} label="Vehicle Arrivals" onClick={() => onInboundSectionChange('vehicle')} />
          <SectionTab active={inboundSection === 'exceptions'}
            icon={AlertTriangle}
            label="Holds & Quarantine"
            onClick={() => onInboundSectionChange('exceptions')}/>
          {canViewReturns && (
            <SectionTab active={inboundSection === 'returns'}
              icon={RotateCcw}
              label="Returns"
              onClick={() => onInboundSectionChange('returns')}/>
          )}
        </div>
        <div className="p-4 space-y-4">
          <InboundSectionContent section={inboundSection}
            warehouseId={selectedWarehouseId}
            receivingStatusFilter={receivingStatusFilter}
            putawayStatusFilter={putawayStatusFilter}
            refreshKey={refreshKey}
            onReceivingStatusFilterChange={onReceivingStatusFilterChange}
            onPutawayStatusFilterChange={onPutawayStatusFilterChange}
            onReceivingCountsChange={setReceivingCounts}
            onPutAwayCountsChange={setPutawayCounts}/>
        </div>
      </div>
    </div>
  );
}

/** Section-specific titles are only shown for the two list sections. */
function inboundHeading(section: InboundSection): { title: string; subtitle: string } | undefined {
  if (section === 'receiving') {
    return {
      title: 'Receiving Slips',
      subtitle: 'Review and approve or reject receiving slips generated from inbound scan sessions.',
    };
  }
  if (section === 'putaway') {
    return {
      title: 'Put-Away Lists',
      subtitle: 'Put-away lists are generated automatically when a receiving slip is approved.',
    };
  }
  return undefined;
}

interface InboundSectionContentProps {
  section: InboundSection;
  warehouseId: string;
  receivingStatusFilter: string;
  putawayStatusFilter: string;
  refreshKey: number;
  onReceivingStatusFilterChange: (status: string) => void;
  onPutawayStatusFilterChange: (status: string) => void;
  onReceivingCountsChange: (counts: ReceivingSlipStatusCounts | null) => void;
  onPutAwayCountsChange: (counts: PutAwayStatusCounts | null) => void;
}

function InboundSectionContent({
  section,
  warehouseId,
  receivingStatusFilter,
  putawayStatusFilter,
  refreshKey,
  onReceivingStatusFilterChange,
  onPutawayStatusFilterChange,
  onReceivingCountsChange,
  onPutAwayCountsChange,
}: InboundSectionContentProps) {
  switch (section) {
    case 'receiving':
      return (
        <ReceivingSlipSection warehouseId={warehouseId}
          statusFilter={receivingStatusFilter}
          refreshKey={refreshKey}
          onStatusFilterChange={onReceivingStatusFilterChange}
          onStatusCountsChange={onReceivingCountsChange}/>
      );
    case 'putaway':
      return (
        <PutAwaySection warehouseId={warehouseId}
          statusFilter={putawayStatusFilter}
          refreshKey={refreshKey}
          onStatusFilterChange={onPutawayStatusFilterChange}
          onStatusCountsChange={onPutAwayCountsChange}/>
      );
    case 'vehicle':
      return <VehicleArrivalManagement warehouseId={warehouseId || undefined} />;
    case 'exceptions':
      return <InboundExceptionQueue warehouseId={warehouseId || undefined} />;
    case 'returns':
      return <ReturnsView warehouseId={warehouseId || undefined} refreshKey={refreshKey} />;
  }
}

interface ReceivingSlipSectionProps {
  warehouseId: string;
  statusFilter: string;
  refreshKey: number;
  onStatusFilterChange: (status: string) => void;
  onStatusCountsChange: (counts: ReceivingSlipStatusCounts | null) => void;
}

function ReceivingSlipSection({
  warehouseId,
  statusFilter,
  refreshKey,
  onStatusFilterChange,
  onStatusCountsChange,
}: ReceivingSlipSectionProps) {
  return (
    <ReceivingSlipList warehouseId={warehouseId || undefined}
      statusFilter={statusFilter}
      refreshKey={refreshKey}
      onStatusFilterChange={onStatusFilterChange}
      onStatusCountsChange={onStatusCountsChange}/>
  );
}

interface PutAwaySectionProps {
  warehouseId: string;
  statusFilter: string;
  refreshKey: number;
  onStatusFilterChange: (status: string) => void;
  onStatusCountsChange: (counts: PutAwayStatusCounts | null) => void;
}

function PutAwaySection({
  warehouseId,
  statusFilter,
  refreshKey,
  onStatusFilterChange,
  onStatusCountsChange,
}: PutAwaySectionProps) {
  return (
    <PutAwayView warehouseId={warehouseId || undefined}
      statusFilter={statusFilter}
      refreshKey={refreshKey}
      onStatusFilterChange={onStatusFilterChange}
      onStatusCountsChange={onStatusCountsChange}/>
  );
}
