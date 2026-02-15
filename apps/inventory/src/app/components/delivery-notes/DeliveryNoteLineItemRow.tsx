import * as React from 'react';

import { Trash2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import type { DeliveryNoteCreateItem } from '../../types/delivery-note.types';

import {
  formatSerialNumbers,
  parseSerialNumbers,
  type WarehouseOption,
  type DeliveryNoteCreateItemField
} from '../../utility/delivery-note';
import { DialogField } from './FormComponents';

interface DeliveryNoteLineItemRowProps {
  item: DeliveryNoteCreateItem;
  index: number;
  warehouses: WarehouseOption[];
  onUpdateItem: (index: number, field: Exclude<DeliveryNoteCreateItemField, 'serial_nos'>, value: string | number) => void;
  onUpdateSerialNumbers: (index: number, serials: string[]) => void;
  onRemoveItem: (index: number) => void;
}

export const DeliveryNoteLineItemRow = React.memo(function DeliveryNoteLineItemRow({
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
          <Input value={item.item_id}
            onChange={(event) => onUpdateItem(index, 'item_id', event.target.value)}
            placeholder="Item UUID"
            required />
        </DialogField>

        <DialogField label="Quantity *" labelClassName="text-xs">
          <Input type="number"
            min="0"
            value={item.qty}
            onChange={(event) => onUpdateItem(index, 'qty', Number(event.target.value))}
            required />
        </DialogField>

        <DialogField label="UOM" labelClassName="text-xs">
          <Input value={item.uom}
            onChange={(event) => onUpdateItem(index, 'uom', event.target.value)}
            placeholder="pcs" />
        </DialogField>

        <DialogField label="Rate" labelClassName="text-xs">
          <Input type="number"
            min="0"
            step="0.01"
            value={item.rate}
            onChange={(event) => onUpdateItem(index, 'rate', Number(event.target.value))} />
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
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.warehouse_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </DialogField>

        <DialogField label="Batch No" labelClassName="text-xs">
          <Input value={item.batch_no}
            onChange={(event) => onUpdateItem(index, 'batch_no', event.target.value)}
            placeholder="Batch"/>
        </DialogField>

        <DialogField label="Serial Nos" labelClassName="text-xs">
          <Input value={formatSerialNumbers(item.serial_nos)}
            onChange={(event) => onUpdateSerialNumbers(index, parseSerialNumbers(event.target.value))}
            placeholder="Comma-separated" />
        </DialogField>
      </div>
    </div>
  );
});
