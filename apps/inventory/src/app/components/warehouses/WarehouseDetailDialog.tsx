import * as React from 'react';

import { Warehouse as WarehouseIcon, MapPin, Phone, Mail, User, Calendar, Building2, Boxes } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
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

export function WarehouseDetailDialog({ open, onOpenChange, warehouse }: WarehouseDetailDialogProps) {
  if (!warehouse) return null;

  const typeBadge = getWarehouseTypeBadge(warehouse.warehouse_type);
  const hasAddress = warehouse.address_line1 || warehouse.city || warehouse.state || warehouse.postal_code || warehouse.country;
  const hasContact = warehouse.contact_name || warehouse.contact_phone || warehouse.contact_email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <WarehouseIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <DialogTitle className="text-xl">{warehouse.name}</DialogTitle>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-2 py-0.5 rounded">{warehouse.code}</code>
                <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                <Badge variant={warehouse.is_active ? 'success' : 'secondary'}>{warehouse.is_active ? 'Active' : 'Inactive'}</Badge>
                {warehouse.is_default && <Badge variant="outline">Default</Badge>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {warehouse.description && <p className="text-sm text-muted-foreground">{warehouse.description}</p>}

          {warehouse.parent && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Parent Warehouse</h4>
                <DetailRow icon={Building2} label="Parent" value={`${warehouse.parent.name} (${warehouse.parent.code})`} />
              </div>
              <Separator />
            </>
          )}

          {hasAddress && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Address</h4>
                <DetailRow
                  icon={MapPin}
                  label="Location"
                  value={
                    <span className="whitespace-pre-line">
                      {[
                        warehouse.address_line1,
                        warehouse.address_line2,
                        [warehouse.city, warehouse.state].filter(Boolean).join(', '),
                        warehouse.postal_code,
                        warehouse.country,
                      ]
                        .filter(Boolean)
                        .join('\n')}
                    </span>
                  }
                />
              </div>
              <Separator />
            </>
          )}

          {hasContact && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Contact Information</h4>
                <div className="grid gap-3">
                  {warehouse.contact_name && <DetailRow icon={User} label="Contact Name" value={warehouse.contact_name} />}
                  {warehouse.contact_phone && <DetailRow icon={Phone} label="Phone" value={warehouse.contact_phone} />}
                  {warehouse.contact_email && <DetailRow icon={Mail} label="Email" value={warehouse.contact_email} />}
                </div>
              </div>
              <Separator />
            </>
          )}

          {(warehouse.total_capacity || warehouse.capacity_uom) && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Capacity</h4>
                <DetailRow
                  icon={Boxes}
                  label="Total Capacity"
                  value={warehouse.total_capacity ? `${warehouse.total_capacity.toLocaleString()} ${warehouse.capacity_uom || ''}` : '—'}
                />
              </div>
              <Separator />
            </>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Timestamps</h4>
            <div className="grid gap-3">
              <DetailRow icon={Calendar} label="Created At" value={formatDate(warehouse.created_at, 'DD-MMM-YY', true)} />
              {warehouse.updated_at && <DetailRow icon={Calendar} label="Updated At" value={formatDate(warehouse.updated_at, 'DD-MMM-YY', true)} />}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
