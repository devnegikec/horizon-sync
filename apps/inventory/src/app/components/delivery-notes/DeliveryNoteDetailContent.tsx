import * as React from 'react';

import { Package, DollarSign } from 'lucide-react';

import { Badge, Separator } from '@horizon-sync/ui/components';

import type { DeliveryNote, DeliveryNoteItem } from '../../types/delivery-note.types';

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

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium mt-0.5 break-all">{value}</p>
    </div>
  );
}

function CustomerPanel({ customer }: { customer: DeliveryNote['customer'] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Customer</h3>
      <div className="grid gap-3">
        <InfoField label="Name" value={customer?.customer_name ?? '—'} />
        <InfoField label="Code" value={customer?.customer_code ?? '—'} />
        {customer?.phone && <InfoField label="Phone" value={customer.phone} />}
        {customer?.email && <InfoField label="Email" value={customer.email} />}
      </div>
    </div>
  );
}

function WarehousePanel({ dn }: { dn: DeliveryNote }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Warehouse & Delivery</h3>
      <div className="grid gap-3">
        <InfoField label="Warehouse" value={dn.warehouse?.warehouse_name ?? '—'} />
        <InfoField label="Code" value={dn.warehouse?.warehouse_code ?? '—'} />
        <InfoField label="Delivery Date" value={formatDate(dn.delivery_date)} />
        {dn.submitted_at && <InfoField label="Submitted At" value={formatDateTime(dn.submitted_at)} />}
      </div>
    </div>
  );
}

function ReferencesPanel({ dn }: { dn: DeliveryNote }) {
  const refType = dn.reference?.reference_type ?? dn.reference_type ?? '—';
  const refName = dn.reference?.name ?? '—';
  const refCode = dn.reference?.code ?? '—';

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">References</h3>
      <div className="grid gap-3">
        <InfoField label="Type" value={refType} />
        <InfoField label="Name" value={refName} />
        <InfoField label="Code" value={refCode} />
        {dn.pick_list_id && <InfoField label="Pick List" value={dn.pick_list_id} />}
      </div>
    </div>
  );
}

function ItemRow({ item, index }: { item: DeliveryNoteItem; index: number }) {
  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{item.item?.name ?? '—'}</p>
            <p className="text-xs text-muted-foreground font-mono">{item.item?.code ?? '—'}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right text-sm font-medium">{Number(item.qty).toFixed(3)}</td>
      <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{item.uom}</Badge></td>
      <td className="px-4 py-3 text-right text-sm">{formatCurrency(item.rate)}</td>
      <td className="px-4 py-3 text-right text-sm font-semibold">{formatCurrency(item.amount)}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {item.batch_no ?? (item.serial_nos?.length ? item.serial_nos.join(', ') : '—')}
      </td>
    </tr>
  );
}

function ItemsTable({ items }: { items: DeliveryNoteItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border">
        <div className="px-4 py-8 text-center text-muted-foreground">No line items</div>
      </div>
    );
  }

  const grandTotal = items.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">#</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Qty</th>
              <th className="px-4 py-3 text-left text-sm font-medium">UOM</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Rate</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Batch / Serial</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, idx) => (
              <ItemRow key={item.id} item={item} index={idx} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end">
        <div className="flex items-center gap-3 bg-muted/50 rounded-lg px-6 py-3">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Grand Total</span>
          <span className="text-lg font-bold">{formatCurrency(grandTotal)}</span>
        </div>
      </div>
    </>
  );
}

export function DeliveryNoteDetailContent({ deliveryNote }: { deliveryNote: DeliveryNote }) {
  return (
    <div className="p-2 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <CustomerPanel customer={deliveryNote.customer} />
        <WarehousePanel dn={deliveryNote} />
        <ReferencesPanel dn={deliveryNote} />
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Line Items ({deliveryNote.items?.length ?? 0})</h3>
        <ItemsTable items={deliveryNote.items ?? []} />
      </div>

      {deliveryNote.remarks && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Remarks</h3>
            <p className="text-sm">{deliveryNote.remarks}</p>
          </div>
        </>
      )}

      <Separator />

      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
        <div><span className="font-medium">Created:</span> {formatDateTime(deliveryNote.created_at)}</div>
        <div><span className="font-medium">Updated:</span> {formatDateTime(deliveryNote.updated_at)}</div>
      </div>
    </div>
  );
}
