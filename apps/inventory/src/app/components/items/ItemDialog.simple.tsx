import * as React from 'react';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Button } from '@horizon-sync/ui/components/ui/button';

import { useItemForm } from '../../hooks/useItemForm';
import { useItemSubmission } from '../../hooks/useItemSubmission';
import type { ApiItemGroup } from '../../types/item-groups.types';
import type { Item } from '../../types/item.types';

import { SimpleItemFormFields } from './SimpleItemFormFields';
import { useTaxTemplates } from '../../hooks/useTaxTemplates';

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

export function ItemDialogSimple({
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
  const { salesTaxTemplates, purchaseTaxTemplates, isLoading: isLoadingTaxTemplates } = useTaxTemplates();

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
      <DialogContent className="sm:max-w-[800px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Item' : 'Create New Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <SimpleItemFormFields
            formData={formData}
            setFormData={setFormData}
            itemGroups={itemGroups}
            salesTaxTemplates={salesTaxTemplates}
            purchaseTaxTemplates={purchaseTaxTemplates}
            isLoadingTaxTemplates={isLoadingTaxTemplates}
          />

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Item' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
