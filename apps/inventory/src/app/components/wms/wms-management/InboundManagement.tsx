import * as React from 'react';

import { AlertTriangle, PackageCheck, PackageX, Plus, RefreshCw, RotateCcw, Truck, Warehouse, X } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';

import type { PutAwayStatusCounts, ReceivingSlipStatusCounts } from '../../../types/wms.types';
import { hasPermission } from '../../../utils/permissions';
import { InboundExceptionQueue } from '../InboundExceptionQueue';
import { InboundStats } from '../InboundStats';
import { PutAwayView } from '../PutAwayView';
import { ReceivingSlipList } from '../ReceivingSlipList';
import { ReturnsView } from '../returns';
import { ShortageLedger } from '../shortage';
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
  // The Vehicle Arrivals register form is toggled from the panel heading (above
  // the stat cards), so its open state is owned here and passed to the section.
  const [vehicleFormOpen, setVehicleFormOpen] = React.useState(false);

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
  const vehicleActions = inboundSection === 'vehicle' ? (
    <Button size="sm" className="gap-2" onClick={() => setVehicleFormOpen((open) => !open)}>
      {vehicleFormOpen ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      {vehicleFormOpen ? 'Cancel' : 'Register Arrival'}
    </Button>
  ) : undefined;

  return (
    <div className="space-y-4">
      {heading && (
        <SectionHeading title={heading.title}
          subtitle={heading.subtitle}
          onRefresh={handleRefresh}
          actions={vehicleActions}/>
      )}
      <InboundStats activeSection={inboundSection}
        receivingCounts={receivingCounts}
        putawayCounts={putawayCounts}
        onSelectReceivingStatus={openReceiving}
        onSelectPutAwayStatus={openPutAway}/>
      <div className="border rounded-lg overflow-hidden">
        <InboundTabs active={inboundSection}
          canViewReturns={canViewReturns}
          onSelectReceiving={() => openReceiving('all')}
          onSelectPutAway={() => openPutAway('all')}
          onSelect={onInboundSectionChange}/>
        <div className="p-4 space-y-4">
          <InboundSectionContent section={inboundSection}
            warehouseId={selectedWarehouseId}
            receivingStatusFilter={receivingStatusFilter}
            putawayStatusFilter={putawayStatusFilter}
            refreshKey={refreshKey}
            onReceivingStatusFilterChange={onReceivingStatusFilterChange}
            onPutawayStatusFilterChange={onPutawayStatusFilterChange}
            onReceivingCountsChange={setReceivingCounts}
            onPutAwayCountsChange={setPutawayCounts}
            vehicleFormOpen={vehicleFormOpen}
            onVehicleFormClose={() => setVehicleFormOpen(false)}/>
        </div>
      </div>
    </div>
  );
}

/** The inbound section switcher. Each section is one inbound problem to clear. */
function InboundTabs({
  active,
  canViewReturns,
  onSelectReceiving,
  onSelectPutAway,
  onSelect,
}: {
  active: InboundSection;
  canViewReturns: boolean;
  onSelectReceiving: () => void;
  onSelectPutAway: () => void;
  onSelect: (section: InboundSection) => void;
}) {
  return (
    <div className="flex border-b">
      <SectionTab active={active === 'receiving'} icon={Warehouse} label="Receiving Slips" onClick={onSelectReceiving} />
      <SectionTab active={active === 'putaway'} icon={PackageCheck} label="Put-Away" onClick={onSelectPutAway} />
      <SectionTab active={active === 'vehicle'} icon={Truck} label="Vehicle Arrivals" onClick={() => onSelect('vehicle')} />
      <SectionTab active={active === 'exceptions'} icon={AlertTriangle} label="Hold / Quarantine" onClick={() => onSelect('exceptions')} />
      <SectionTab active={active === 'shortages'} icon={PackageX} label="Shortage Ledger" onClick={() => onSelect('shortages')} />
      {canViewReturns && (
        <SectionTab active={active === 'returns'} icon={RotateCcw} label="Returns" onClick={() => onSelect('returns')}/>
      )}
    </div>
  );
}

/** Section-specific titles, shown above the stat cards for the list sections. */
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
  if (section === 'vehicle') {
    return {
      title: 'Vehicle Arrivals',
      subtitle: 'Register vehicles arriving at the dock and associate them with one or more ASNs.',
    };
  }
  if (section === 'exceptions') {
    return {
      title: 'Hold / Quarantine Queue',
      subtitle:
        'Non-pickable inbound stock awaiting a manager decision. Exceptions sharing a SKU and batch — for example the units of one excepted master pack — are grouped into one expandable row.',
    };
  }
  if (section === 'shortages') {
    return {
      title: 'Shortage Ledger',
      subtitle:
        'Units missing against an ASN. Nothing is segregated — a residual short stays open until a later receipt covers it or a manager writes it off.',
    };
  }
  return undefined;
}

/** Panel heading: title and subtitle on the left, Refresh and section actions on the right. */
function SectionHeading({
  title,
  subtitle,
  onRefresh,
  actions,
}: {
  title: string;
  subtitle: string;
  onRefresh: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex shrink-0 gap-2 self-start sm:self-auto">
        <Button variant="outline" size="sm" className="gap-2" onClick={onRefresh}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
        {actions}
      </div>
    </div>
  );
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
  vehicleFormOpen: boolean;
  onVehicleFormClose: () => void;
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
  vehicleFormOpen,
  onVehicleFormClose,
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
      return (
        <VehicleArrivalManagement warehouseId={warehouseId || undefined}
          refreshKey={refreshKey}
          registerFormOpen={vehicleFormOpen}
          onRegisterFormClose={onVehicleFormClose}/>
      );
    case 'exceptions':
      return <InboundExceptionQueue warehouseId={warehouseId || undefined} refreshKey={refreshKey} />;
    case 'shortages':
      return <ShortageLedger refreshKey={refreshKey} />;
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
