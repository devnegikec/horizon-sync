// eslint-disable-next-line @nx/enforce-module-boundaries
import { useUserStore } from '@horizon-sync/store';

import { useItemSubmission } from '../../hooks/useItemSubmission';
import { useTaxTemplates } from '../../hooks/useTaxTemplates';
import type { ApiItemGroup } from '../../types/item-groups.types';
import type { Item } from '../../types/item.types';
import type { ItemFormData } from '../../utility/item-payload-builders';

import { ItemMultiStepDialog } from './multi-step/ItemMultiStepDialog';

interface ItemDialogMultiStepProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item | null;
  itemGroups: ApiItemGroup[];
  onSave: (item: Partial<Item>) => void;
  onCreated?: () => void;
  onUpdated?: () => void;
  onItemGroupsRefresh?: () => void;
}

export function ItemDialogMultiStep({
  open,
  onOpenChange,
  item,
  itemGroups,
  onCreated,
  onUpdated,
}: ItemDialogMultiStepProps) {
  const { accessToken } = useUserStore();
  const { salesTaxTemplates, purchaseTaxTemplates, isLoading: isLoadingTaxTemplates } = useTaxTemplates();

  const { handleSubmit } = useItemSubmission({
    item,
    itemGroups,
    onCreated,
    onUpdated,
    onClose: () => onOpenChange(false),
  });

  const handleSave = async (formData: ItemFormData) => {
    await handleSubmit(formData);
  };

  return (
    <ItemMultiStepDialog open={open}
      onOpenChange={onOpenChange}
      itemGroups={itemGroups}
      accessToken={accessToken || ''}
      salesTaxTemplates={salesTaxTemplates}
      purchaseTaxTemplates={purchaseTaxTemplates}
      isLoadingTaxTemplates={isLoadingTaxTemplates}
      onSave={handleSave}/>
  );
}
