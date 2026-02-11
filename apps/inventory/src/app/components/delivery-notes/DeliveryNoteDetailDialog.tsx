import * as React from 'react';

import {
  Truck,
  MapPin,
  Phone,
  User,
  Package,
  Hash,
  Calendar,
  ExternalLink,
  Weight,
  Boxes,
  Printer,
  FileText,
  Pencil,
  Clock,
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
      return { variant: 'success' as const, label: 'Shipped' };
    case 'cancelled':
      return { variant: 'destructive' as const, label: 'Cancelled' };
  }
}

function getTimelineIcon(action: string) {
  if (action.toLowerCase().includes('created')) return 'bg-blue-500';
  if (action.toLowerCase().includes('packed')) return 'bg-amber-500';
  if (action.toLowerCase().includes('shipped')) return 'bg-emerald-500';
  if (action.toLowerCase().includes('delivered')) return 'bg-primary';
  return 'bg-muted-foreground';
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
              {new Date(deliveryNote.shipping_date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Printer className="h-4 w-4" />
              Print Packing Slip
            </Button>
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
          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Customer Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Customer Details</h3>
              </div>
              <div className="grid gap-4">
                <InfoRow icon={User} label="Customer Name" value={deliveryNote.customer_name} />
                <InfoRow icon={MapPin} label="Shipping Address" value={deliveryNote.shipping_address} />
                <InfoRow icon={Phone} label="Contact" value={`${deliveryNote.contact_person} - ${deliveryNote.contact_phone}`} />
              </div>
            </div>

            {/* Logistics */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Logistics</h3>
              </div>
              <div className="grid gap-4">
                <InfoRow icon={Truck} label="Carrier" value={deliveryNote.carrier_name} />
                <div className="flex gap-3">
                  <div className="mt-1 bg-primary/10 p-2 rounded-lg">
                    <Hash className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tracking Number</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-sm font-medium">{deliveryNote.tracking_number}</p>
                      {deliveryNote.tracking_number && (
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(deliveryNote.tracking_number)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 text-xs font-medium"
                        >
                          Track <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <InfoRow icon={Calendar} label="Shipping Date" value={new Date(deliveryNote.shipping_date).toLocaleDateString()} />
              </div>
            </div>

            {/* References */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">References</h3>
              </div>
              <div className="grid gap-4">
                <InfoRow icon={FileText} label="Sales Order #" value={deliveryNote.sales_order_number} />
                <InfoRow icon={Weight} label="Total Weight" value={`${deliveryNote.total_weight} kg`} />
                <InfoRow icon={Boxes} label="Total Packages" value={String(deliveryNote.total_packages)} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Line Items Table */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold">Line Items</h3>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Image</TableHead>
                    <TableHead>Item Name / SKU</TableHead>
                    <TableHead className="text-right">Qty Ordered</TableHead>
                    <TableHead className="text-right">Qty Shipped</TableHead>
                    <TableHead>Warehouse Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryNote.line_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.item_image ? (
                          <img
                            src={item.item_image}
                            alt={item.item_name}
                            className="h-10 w-10 rounded-md object-cover border"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                            <Package className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{item.item_name}</p>
                          <p className="text-xs text-muted-foreground">{item.item_sku}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.quantity_ordered}</TableCell>
                      <TableCell className="text-right">
                        <span className={item.quantity_shipped < item.quantity_ordered ? 'text-amber-600 font-semibold' : 'font-medium'}>
                          {item.quantity_shipped}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs font-medium">
                          {item.warehouse_location}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {deliveryNote.line_items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No line items
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          {/* Timeline / Audit Trail */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Timeline</h3>
            </div>
            <div className="relative pl-6 space-y-6">
              {deliveryNote.timeline.map((entry, index) => (
                <div key={entry.id} className="relative flex gap-4">
                  <div className="absolute -left-6 mt-1.5">
                    <div className={`h-3 w-3 rounded-full ${getTimelineIcon(entry.action)}`} />
                    {index < deliveryNote.timeline.length - 1 && (
                      <div className="absolute left-1.5 top-3 w-px h-[calc(100%+12px)] bg-border" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{entry.action}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.performed_by} &middot;{' '}
                      {new Date(entry.timestamp).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {entry.notes && <p className="text-xs text-muted-foreground mt-1">{entry.notes}</p>}
                  </div>
                </div>
              ))}
              {deliveryNote.timeline.length === 0 && (
                <p className="text-sm text-muted-foreground">No timeline entries</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 bg-primary/10 p-2 rounded-lg">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}
