import * as React from 'react';

import {
  Truck,
  MapPin,
  Mail,
  Phone,
  User,
  Calendar,
  FileText,
  Pencil,
  Warehouse,
  DollarSign,
  Hash,
  Link2,
} from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Separator } from '@horizon-sync/ui/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components/ui/table';

import type { DeliveryNote } from '../../types/delivery-note.types';

interface DeliveryNoteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNote: DeliveryNote | null;
  onConvertToInvoice?: (id: string) => void;
  onEdit?: (deliveryNote: DeliveryNote) => void;
}

function getStatusBadge(status: DeliveryNote['status']) {
  switch (status) {
    case 'draft':
      return { variant: 'secondary' as const, label: 'Draft' };
    case 'submitted':
      return { variant: 'success' as const, label: 'Submitted' };
    case 'cancelled':
      return { variant: 'destructive' as const, label: 'Cancelled' };
  }
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(value: string | number | null | undefined) {
  if (value == null) return '—';
  return `$${Number(value).toFixed(2)}`;
}

function CustomerPanel({ customer }: { customer: DeliveryNote['customer'] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <User className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Customer</h3>
      </div>
      <div className="grid gap-4">
        <InfoRow icon={User} label="Name" value={customer?.customer_name ?? '—'} />
        <InfoRow icon={Hash} label="Code" value={customer?.customer_code ?? '—'} />
        <InfoRow icon={Phone} label="Phone" value={customer?.phone ?? '—'} />
        <InfoRow icon={Mail} label="Email" value={customer?.email ?? '—'} />
      </div>
    </div>
  );
}

function WarehousePanel({ dn }: { dn: DeliveryNote }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Warehouse className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">Warehouse & Delivery</h3>
      </div>
      <div className="grid gap-4">
        <InfoRow icon={Warehouse} label="Warehouse" value={dn.warehouse?.warehouse_name ?? '—'} />
        <InfoRow icon={Hash} label="Warehouse Code" value={dn.warehouse?.warehouse_code ?? '—'} />
        <InfoRow icon={Calendar} label="Delivery Date" value={formatDate(dn.delivery_date)} />
        <InfoRow icon={Calendar} label="Submitted At" value={formatDateTime(dn.submitted_at)} />
      </div>
    </div>
  );
}

function ReferencesPanel({ dn }: { dn: DeliveryNote }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold">References</h3>
      </div>
      <div className="grid gap-4">
        <InfoRow icon={FileText} label="Reference Type" value={dn.reference?.reference_type ?? dn.reference_type ?? '—'} />
        <InfoRow icon={Hash} label="Reference Name" value={dn.reference?.name ?? '—'} />
        <InfoRow icon={Hash} label="Reference Code" value={dn.reference?.code ?? '—'} />
        <InfoRow icon={Truck} label="Pick List ID" value={dn.pick_list_id ?? '—'} />
        {dn.remarks && <InfoRow icon={MapPin} label="Remarks" value={dn.remarks} />}
      </div>
    </div>
  );
}

export function DeliveryNoteDetailDialog({
  open,
  onOpenChange,
  deliveryNote,
  onConvertToInvoice,
  onEdit,
}: DeliveryNoteDetailDialogProps) {
  if (!deliveryNote) return null;

  const statusBadge = getStatusBadge(deliveryNote.status);
  const grandTotal = (deliveryNote.items ?? []).reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 p-8 pb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <DialogTitle className="text-2xl font-bold">{deliveryNote.delivery_note_no}</DialogTitle>
              <Badge variant={statusBadge.variant} className="px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                {statusBadge.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5 font-medium">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(deliveryNote.delivery_date)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onConvertToInvoice && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => onConvertToInvoice(deliveryNote.id)}>
                <FileText className="h-4 w-4" />
                Convert to Invoice
              </Button>
            )}
            {onEdit && (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => onEdit(deliveryNote)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <Separator />

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CustomerPanel customer={deliveryNote.customer} />
            <WarehousePanel dn={deliveryNote} />
            <ReferencesPanel dn={deliveryNote} />
          </div>

          <Separator />

          <LineItemsSection items={deliveryNote.items ?? []} grandTotal={grandTotal} />

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div><span className="font-medium">Created:</span> {formatDateTime(deliveryNote.created_at)}</div>
            <div><span className="font-medium">Updated:</span> {formatDateTime(deliveryNote.updated_at)}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LineItemsSection({ items, grandTotal }: { items: import('../../types/delivery-note.types').DeliveryNoteItem[]; grandTotal: number }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Line Items</h3>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Batch / Serial</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={item.id}>
                <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{item.item?.name ?? '—'}</p>
                    <p className="text-xs font-mono text-muted-foreground">{item.item?.code ?? '—'}</p>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">{Number(item.qty).toFixed(3)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">{item.uom}</Badge>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                <TableCell className="text-right font-semibold">{formatCurrency(item.amount)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {item.batch_no ?? (item.serial_nos?.length ? item.serial_nos.join(', ') : '—')}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No line items
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {items.length > 0 && (
        <div className="flex justify-end">
          <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-6 py-3">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">Grand Total</span>
            <span className="text-lg font-bold">{formatCurrency(grandTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 bg-primary/10 p-2 rounded-lg shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}
