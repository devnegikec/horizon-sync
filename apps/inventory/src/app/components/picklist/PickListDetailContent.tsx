import * as React from 'react';

import { Package, FileText, Warehouse, Calendar, Hash, Link2 } from 'lucide-react';

import { Badge, Separator } from '@horizon-sync/ui/components';

import type { PickList, PickListItem } from '../../types/pick-list.types';

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

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
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

function ItemCell({ item }: { item: PickListItem }) {
  return (
    <div className="flex items-center gap-2">
      <Package className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">{item.item?.name ?? item.item_name ?? '—'}</p>
        <p className="text-xs text-muted-foreground font-mono">{item.item?.code ?? item.item_code ?? '—'}</p>
      </div>
    </div>
  );
}

function WarehouseCell({ item }: { item: PickListItem }) {
  return (
    <div className="flex items-center gap-2">
      <Warehouse className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">{item.warehouse?.name ?? item.warehouse_name ?? '—'}</p>
        <p className="text-xs text-muted-foreground font-mono">{item.warehouse?.code ?? item.warehouse_code ?? '—'}</p>
      </div>
    </div>
  );
}

function ItemRow({ item, index }: { item: PickListItem; index: number }) {
  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
      <td className="px-4 py-3"><ItemCell item={item} /></td>
      <td className="px-4 py-3"><WarehouseCell item={item} /></td>
      <td className="px-4 py-3 text-right text-sm font-medium">{Number(item.qty).toFixed(3)}</td>
      <td className="px-4 py-3 text-right text-sm">{Number(item.picked_qty).toFixed(3)}</td>
      <td className="px-4 py-3"><Badge variant="outline" className="text-xs">{item.uom}</Badge></td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{item.batch_no ?? '—'}</td>
    </tr>
  );
}

function ItemsTable({ items }: { items: PickListItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-lg border">
        <div className="px-4 py-8 text-center text-muted-foreground">No items in this pick list</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">#</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Warehouse</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Picked</th>
            <th className="px-4 py-3 text-left text-sm font-medium">UOM</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Batch</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item, index) => (
            <ItemRow key={item.id} item={item} index={index} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InfoPanel({ pickList }: { pickList: PickList }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Warehouse className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Warehouse</h3>
        </div>
        <div className="grid gap-4">
          <InfoRow icon={Warehouse} label="Name" value={pickList.warehouse?.name ?? '—'} />
          <InfoRow icon={Hash} label="Code" value={pickList.warehouse?.code ?? '—'} />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Reference</h3>
        </div>
        <div className="grid gap-4">
          <InfoRow icon={FileText} label="Type" value={pickList.reference?.reference_type ?? pickList.reference_type ?? '—'} />
          <InfoRow icon={Hash} label="Number" value={pickList.reference?.name ?? '—'} />
          <InfoRow icon={Hash} label="Code" value={pickList.reference?.code ?? '—'} />
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">Timeline</h3>
        </div>
        <div className="grid gap-4">
          <InfoRow icon={Calendar} label="Pick Date" value={formatDateTime(pickList.pick_date)} />
          <InfoRow icon={Calendar} label="Completed At" value={formatDateTime(pickList.completed_at)} />
        </div>
      </div>
    </div>
  );
}

export function PickListDetailContent({ pickList }: { pickList: PickList }) {
  return (
    <div className="p-2 space-y-4">
      <InfoPanel pickList={pickList} />

      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-bold">Items to Pick ({pickList.items?.length ?? 0})</h3>
        <ItemsTable items={pickList.items ?? []} />
      </div>

      {pickList.remarks && (
        <>
          <Separator />
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Remarks</h3>
            <p className="text-sm">{pickList.remarks}</p>
          </div>
        </>
      )}

      <Separator />

      <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
        <div><span className="font-medium">Created:</span> {formatDateTime(pickList.created_at)}</div>
        <div><span className="font-medium">Updated:</span> {formatDateTime(pickList.updated_at)}</div>
      </div>
    </div>
  );
}
