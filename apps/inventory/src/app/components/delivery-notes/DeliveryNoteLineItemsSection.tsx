import * as React from 'react';

import { Plus } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Separator } from '@horizon-sync/ui/components/ui/separator';

import type { DeliveryNoteCreateItem } from '../../types/delivery-note.types';
import { type WarehouseOption, type DeliveryNoteCreateItemField } from '../../utility/delivery-note';

import { DeliveryNoteLineItemRow } from './DeliveryNoteLineItemRow';

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
            <DeliveryNoteLineItemRow key={`${item.item_id}-${index}`}
              item={item}
              index={index}
              onRemoveItem={onRemoveItem}
              onUpdateItem={onUpdateItem}
              onUpdateSerialNumbers={onUpdateSerialNumbers}
              warehouses={warehouses} />
          ))}
        </div>
      </div>
    </>
  );
}
