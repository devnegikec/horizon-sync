import { Package } from 'lucide-react';

import { DialogDescription, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';

interface ItemDialogHeaderProps {
  isEditing: boolean;
}

export function ItemDialogHeader({ isEditing }: ItemDialogHeaderProps) {
  return (
    <DialogHeader>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Package className="h-5 w-5 text-primary" />
        </div>
        <div>
          <DialogTitle>{isEditing ? 'Edit Item' : 'Create New Item'}</DialogTitle>
          <DialogDescription>{isEditing ? 'Update the item details below' : 'Add a new item to your inventory catalog'}</DialogDescription>
        </div>
      </div>
    </DialogHeader>
  );
}
