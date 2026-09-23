import * as React from 'react';

import { StockManagement } from '../../stock';
import { AsnManagement } from '../AsnManagement';
import { OutboundManagement } from '../OutboundManagement';

import { InboundManagement } from './InboundManagement';
import { ManageManagement } from './ManageManagement';
import type { WMSContentProps, WMSView } from './types';

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

/** Renders the content for the active top-level WMS view. */
const wmsViewComponents: Record<WMSView, React.ComponentType<WMSContentProps>> = {
  asn: AsnContent,
  inbound: InboundManagement,
  outbound: OutboundContent,
  stock: StockContent,
  manage: ManageContent,
};

export function WMSContent({ activeView, ...props }: WMSContentProps) {
  const Content = wmsViewComponents[activeView];
  return <Content activeView={activeView} {...props} />;
}
