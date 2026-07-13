import * as React from 'react';

import { Truck } from 'lucide-react';

import { Button, DialogFooter } from '@horizon-sync/ui/components';

import type { PickList } from '../../types/pick-list.types';

export interface PickListDetailFooterProps {
  pickList: PickList;
  onClose: () => void;
  onCreateDeliveryNote?: (pickList: PickList) => void;
}

export function PickListDetailFooter({ pickList, onClose, onCreateDeliveryNote }: PickListDetailFooterProps) {
  const canCreateDeliveryNote = pickList.status === 'draft' || pickList.status === 'in_progress';

  return (
    <DialogFooter className="p-6">
      {onCreateDeliveryNote && canCreateDeliveryNote && (
        <Button variant="default" onClick={() => onCreateDeliveryNote(pickList)} className="gap-2">
          <Truck className="h-4 w-4" />Create Delivery Note
        </Button>
      )}
      <Button variant="outline" onClick={onClose}>Close</Button>
    </DialogFooter>
  );
}
