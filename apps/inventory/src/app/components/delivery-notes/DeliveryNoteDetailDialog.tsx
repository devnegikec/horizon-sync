import * as React from 'react';

import { Truck, Calendar } from 'lucide-react';

import { Separator } from '@horizon-sync/ui/components';

import type { DeliveryNote } from '../../types/delivery-note.types';
import { DetailDialogContainer } from '../common';

import { DeliveryNoteDetailContent } from './DeliveryNoteDetailContent';
import { DeliveryNoteDetailFooter } from './DeliveryNoteDetailFooter';
import { DeliveryNoteStatusBadge } from './DeliveryNoteStatusBadge';

interface DeliveryNoteDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNote: DeliveryNote | null;
  onConvertToInvoice?: (
    deliveryNoteId: string,
    data: { items: { item_id: string; qty_to_bill: number }[] },
  ) => Promise<void>;
  convertingInvoice?: boolean;
  onEdit?: (deliveryNote: DeliveryNote) => void;
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function DeliveryNoteDetailDialog({ open, onOpenChange, deliveryNote, onConvertToInvoice, convertingInvoice, onEdit }: DeliveryNoteDetailDialogProps) {
  if (!deliveryNote) return null;

  return (
    <DetailDialogContainer open={open}
      onOpenChange={onOpenChange}
      icon={Truck}
      title={deliveryNote.delivery_note_no}
      status={deliveryNote.status}
      statusBadge={<DeliveryNoteStatusBadge status={deliveryNote.status} />}
      subtitle={
        <p className="text-sm text-muted-foreground mt-1.5 flex items-center gap-1.5 font-medium">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(deliveryNote.delivery_date)}
        </p>
      }>
      <Separator />
      <DeliveryNoteDetailContent deliveryNote={deliveryNote} />
      <DeliveryNoteDetailFooter deliveryNote={deliveryNote} onClose={() => onOpenChange(false)} onConvertToInvoice={onConvertToInvoice} convertingInvoice={convertingInvoice} onEdit={onEdit} />
    </DetailDialogContainer>
  );
}
