import * as React from 'react';

import { FileText, Pencil } from 'lucide-react';

import { Button, DialogFooter } from '@horizon-sync/ui/components';

import type { DeliveryNote } from '../../types/delivery-note.types';

export interface DeliveryNoteDetailFooterProps {
  deliveryNote: DeliveryNote;
  onClose: () => void;
  onConvertToInvoice?: (
    deliveryNoteId: string,
    data: { items: { item_id: string; qty_to_bill: number }[] },
  ) => Promise<void>;
  convertingInvoice?: boolean;
  onEdit?: (deliveryNote: DeliveryNote) => void;
}

export function DeliveryNoteDetailFooter({
  deliveryNote,
  onClose,
  onConvertToInvoice,
  convertingInvoice,
  onEdit,
}: DeliveryNoteDetailFooterProps) {
  const [converted, setConverted] = React.useState(false);

  const handleConvertToInvoice = async () => {
    if (!onConvertToInvoice || converted) return;

    const items = (deliveryNote.items ?? []).map((item) => ({
      item_id: item.id,
      qty_to_bill: Number(item.qty),
    }));

    if (items.length === 0) return;

    try {
      await onConvertToInvoice(deliveryNote.id, { items });
      setConverted(true);
    } catch {
      // Error is handled by the parent
    }
  };

  // Show convert button for non-cancelled delivery notes that haven't been converted yet
  const canConvert = deliveryNote.status !== 'cancelled' && !converted;

  return (
    <DialogFooter className="p-6">
      {onConvertToInvoice && canConvert && (
        <Button variant="default" onClick={handleConvertToInvoice} disabled={convertingInvoice} className="gap-2">
          <FileText className="h-4 w-4" />
          {convertingInvoice ? 'Converting...' : 'Convert to Invoice'}
        </Button>
      )}
      {onEdit && (
        <Button variant="outline" onClick={() => onEdit(deliveryNote)} className="gap-2">
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      )}
      <Button variant="outline" onClick={onClose}>Close</Button>
    </DialogFooter>
  );
}
