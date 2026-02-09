import * as React from 'react';

import { Dialog, DialogContent } from '@horizon-sync/ui/components/ui/dialog';

import { useItemForm } from '../../hooks/useItemForm';
import { useItemSubmission } from '../../hooks/useItemSubmission';
import type { ApiItemGroup } from '../../types/item-groups.types';
import type { Item } from '../../types/item.types';

import { ItemDialogFooter } from './ItemDialogFooter';
import { ItemDialogHeader } from './ItemDialogHeader';
import { ItemFormFields } from './ItemFormFields';

interface ItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  itemGroups: ApiItemGroup[];
  onSave: (item: Partial<Item>) => void;
  onCreated?: () => void;
  onUpdated?: () => void;
  onItemGroupsRefresh?: () => void;
}

export function ItemDialog({ 
  open, 
  onOpenChange, 
  item, 
  itemGroups, 
  onSave, 
  onCreated, 
  onUpdated, 
  onItemGroupsRefresh 
}: ItemDialogProps) {
  const isEditing = !!item;

  const { formData, setFormData } = useItemForm({ item, open });

  const { handleSubmit, isLoading, error } = useItemSubmission({
    item,
    itemGroups,
    onCreated,
    onUpdated,
    onClose: () => onOpenChange(false),
  });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleSubmit(formData);
    } catch {
      // Error is handled by useItemSubmission hook
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <ItemDialogHeader isEditing={isEditing} />

        <form onSubmit={handleFormSubmit}>
          <ItemFormFields 
            formData={formData} 
            setFormData={setFormData} 
            itemGroups={itemGroups}
            onItemGroupsRefresh={onItemGroupsRefresh}
          />

          <ItemDialogFooter isEditing={isEditing} isLoading={isLoading} onCancel={handleCancel} submitError={error} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
