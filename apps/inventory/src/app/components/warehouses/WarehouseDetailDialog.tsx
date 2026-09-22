import * as React from 'react';

import { Warehouse as WarehouseIcon, MapPin, Phone, Mail, User, Calendar, Building2, Boxes, Hash, Layers, Info } from 'lucide-react';

import { DetailDialog } from '@horizon-sync/ui/components';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { cn } from '@horizon-sync/ui/lib';

import type { Warehouse } from '../../types/warehouse.types';
import { formatDate } from '../../utility/formatDate';

interface WarehouseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse: Warehouse | null;
}

interface DetailRowProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}

function DetailRow({ icon: Icon, label, value, className }: DetailRowProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || '—'}</p>
      </div>
    </div>
  );
}

function getWarehouseTypeBadge(type: string) {
  switch (type) {
    case 'warehouse':
      return { variant: 'default' as const, label: 'Warehouse' };
    case 'store':
      return { variant: 'secondary' as const, label: 'Store' };
    case 'transit':
      return { variant: 'outline' as const, label: 'Transit' };
    default:
      return { variant: 'outline' as const, label: type };
  }
}

function SectionHeader({ icon: Icon, title }: { icon: React.ComponentType<{ className?: string }>; title: string }) {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Icon className="h-4 w-4" />
      <h4 className="text-sm font-semibold">{title}</h4>
    </div>
  );
}

export function WarehouseDetailDialog({ open, onOpenChange, warehouse }: WarehouseDetailDialogProps) {
  if (!warehouse) return null;

  const typeBadge = getWarehouseTypeBadge(warehouse.warehouse_type);

  return (
    <DetailDialog open={open}
      onOpenChange={onOpenChange}
      size="lg"
      contentClassName="max-w-4xl flex flex-col"
      style={{ height: 'min(85vh, 820px)' }}
      title={
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <WarehouseIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{warehouse.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs bg-muted px-2 py-0.5 rounded">{warehouse.code}</code>
              <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
              <Badge variant={warehouse.is_active ? 'success' : 'secondary'}>{warehouse.is_active ? 'Active' : 'Inactive'}</Badge>
              {warehouse.is_default && <Badge variant="outline">Default</Badge>}
            </div>
          </div>
        </div>
      }>
      <div className="space-y-6">
        <div className="space-y-3">
          <SectionHeader icon={Info} title="Basic Information" />
          <div className="grid grid-cols-2 gap-4">
            <DetailRow icon={Hash} label="Warehouse Code" value={warehouse.code} />
            <DetailRow icon={Layers} label="Type" value={typeBadge.label} />
          </div>
          {warehouse.description && <DetailRow icon={Info} label="Description" value={warehouse.description} />}
          {warehouse.parent && <DetailRow icon={Building2} label="Parent Warehouse" value={`${warehouse.parent.name} (${warehouse.parent.code})`} />}
        </div>

        <div className="space-y-3">
          <SectionHeader icon={MapPin} title="Address Information" />
          <div className="grid grid-cols-2 gap-4">
            <DetailRow icon={MapPin} label="Address Line 1" value={warehouse.address_line1} />
            <DetailRow icon={MapPin} label="Address Line 2" value={warehouse.address_line2} />
            <DetailRow icon={MapPin} label="City" value={warehouse.city} />
            <DetailRow icon={MapPin} label="State" value={warehouse.state} />
            <DetailRow icon={MapPin} label="Postal Code" value={warehouse.postal_code} />
            <DetailRow icon={MapPin} label="Country" value={warehouse.country} />
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader icon={User} title="Contact Information" />
          <div className="grid grid-cols-2 gap-4">
            <DetailRow icon={User} label="Contact Name" value={warehouse.contact_name} />
            <DetailRow icon={Phone} label="Phone" value={warehouse.contact_phone} />
            <DetailRow icon={Mail} label="Email" value={warehouse.contact_email} />
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader icon={Boxes} title="Capacity" />
          <div className="grid grid-cols-2 gap-4">
            <DetailRow icon={Boxes}
              label="Total Capacity"
              value={warehouse.total_capacity != null ? warehouse.total_capacity.toLocaleString() : undefined}/>
            <DetailRow icon={Boxes} label="Unit of Measure" value={warehouse.capacity_uom} />
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeader icon={Calendar} title="Timestamps" />
          <div className="grid grid-cols-2 gap-4">
            <DetailRow icon={Calendar} label="Created At" value={formatDate(warehouse.created_at, 'DD-MMM-YY', true)} />
            {warehouse.updated_at && <DetailRow icon={Calendar} label="Updated At" value={formatDate(warehouse.updated_at, 'DD-MMM-YY', true)} />}
          </div>
        </div>
      </div>
    </DetailDialog>
  );
}
