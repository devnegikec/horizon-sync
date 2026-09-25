export type WMSView = 'asn' | 'inbound' | 'outbound' | 'stock' | 'manage';

export type ManageSection = 'workers' | 'devices' | 'designer' | 'tree' | '3d' | 'location-qr';

export type InboundSection = 'receiving' | 'putaway' | 'vehicle' | 'exceptions' | 'shortages' | 'returns';

/** Shared prop contract every `WMSView` content component receives. */
export interface WMSContentProps {
  activeView: WMSView;
  canManage: boolean;
  inboundSection: InboundSection;
  manageSection: ManageSection;
  receivingStatusFilter: string;
  putawayStatusFilter: string;
  selectedWarehouseId: string;
  onInboundSectionChange: (section: InboundSection) => void;
  onManageSectionChange: (section: ManageSection) => void;
  onReceivingStatusFilterChange: (status: string) => void;
  onPutawayStatusFilterChange: (status: string) => void;
}
