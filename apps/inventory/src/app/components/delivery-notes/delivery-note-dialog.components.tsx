import * as React from 'react';

import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Separator } from '@horizon-sync/ui/components/ui/separator';

import type { DeliveryNoteCreateItem } from '../../types/delivery-note.types';
import { formatSerialNumbers, parseSerialNumbers, type WarehouseOption, type DeliveryNoteCreateItemField } from './delivery-note-dialog.utils';

interface DialogFieldGroupProps {
  title: string;
  children: React.ReactNode;
}

export function DialogFieldGroup({ title, children }: DialogFieldGroupProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{title}</h3>
      {children}
    </div>
  );
}

interface FieldContainerProps {
  label: string;
  htmlFor?: string;
  labelClassName?: string;
  children: React.ReactNode;
  className?: string;
}

export function DialogField({ label, htmlFor, children, labelClassName, className = '' }: FieldContainerProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={htmlFor} className={labelClassName}>
        {label}
      </Label>
      {children}
    </div>
  );
}

interface DeliveryNoteLineItemSectionProps {
  items: DeliveryNoteCreateItem[];
  warehouses: WarehouseOption[];
  onAddItem: () => void;
  onUpdateItem: (index: number, field: Exclude<DeliveryNoteCreateItemField, 'serial_nos'>, value: string | number) => void;
  onUpdateSerialNumbers: (index: number, serials: string[]) => void;
  onRemoveItem: (index: number) => void;
}

export function DeliveryNoteLineItemsSection({
  items,
  warehouses,
  onAddItem,
  onUpdateItem,
  onUpdateSerialNumbers,
  onRemoveItem,
}: DeliveryNoteLineItemSectionProps) {
  return (
    <>
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Line Items</h3>
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={onAddItem}>
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <DeliveryNoteLineItemRow
              key={`${item.item_id}-${index}`}
              item={item}
              index={index}
              onRemoveItem={onRemoveItem}
              onUpdateItem={onUpdateItem}
              onUpdateSerialNumbers={onUpdateSerialNumbers}
              warehouses={warehouses}
            />
          ))}
        </div>
      </div>
    </>
  );
}

interface DeliveryNoteLineItemRowProps {
  item: DeliveryNoteCreateItem;
  index: number;
  warehouses: WarehouseOption[];
  onUpdateItem: (index: number, field: Exclude<DeliveryNoteCreateItemField, 'serial_nos'>, value: string | number) => void;
  onUpdateSerialNumbers: (index: number, serials: string[]) => void;
  onRemoveItem: (index: number) => void;
}

const DeliveryNoteLineItemRow = React.memo(function DeliveryNoteLineItemRow({
  item,
  index,
  warehouses,
  onUpdateItem,
  onUpdateSerialNumbers,
  onRemoveItem,
}: DeliveryNoteLineItemRowProps) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
        {index + 1 > 1 && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemoveItem(index)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <DialogField label="Item ID *" labelClassName="text-xs">
          <Input
            value={item.item_id}
            onChange={(event) => onUpdateItem(index, 'item_id', event.target.value)}
            placeholder="Item UUID"
            required
          />
        </DialogField>

        <DialogField label="Quantity *" labelClassName="text-xs">
          <Input
            type="number"
            min="0"
            value={item.qty}
            onChange={(event) => onUpdateItem(index, 'qty', Number(event.target.value))}
            required
          />
        </DialogField>

        <DialogField label="UOM" labelClassName="text-xs">
          <Input value={item.uom} onChange={(event) => onUpdateItem(index, 'uom', event.target.value)} placeholder="pcs" />
        </DialogField>

        <DialogField label="Rate" labelClassName="text-xs">
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.rate}
            onChange={(event) => onUpdateItem(index, 'rate', Number(event.target.value))}
          />
        </DialogField>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <DialogField label="Amount" labelClassName="text-xs">
          <Input value={item.amount.toFixed(2)} disabled />
        </DialogField>

        <DialogField label="Warehouse" labelClassName="text-xs">
          <Select value={item.warehouse_id} onValueChange={(value) => onUpdateItem(index, 'warehouse_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              {warehouses.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>{warehouse.warehouse_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogField>

        <DialogField label="Batch No" labelClassName="text-xs">
          <Input
            value={item.batch_no}
            onChange={(event) => onUpdateItem(index, 'batch_no', event.target.value)}
            placeholder="Batch"
          />
        </DialogField>

        <DialogField label="Serial Nos" labelClassName="text-xs">
          <Input
            value={formatSerialNumbers(item.serial_nos)}
            onChange={(event) => onUpdateSerialNumbers(index, parseSerialNumbers(event.target.value))}
            placeholder="Comma-separated"
          />
        </DialogField>
      </div>
    </div>
  );
});

