import { useState, useEffect } from 'react';

import type { Item } from '../types/item.types';
import type { ItemFormData } from '../utility/item-payload-builders';

interface UseItemFormProps {
  item?: Item | null;
  open: boolean;
}

interface UseItemFormResult {
  formData: ItemFormData & { itemGroupName: string };
  setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>>;
  resetForm: () => void;
}

const getInitialFormData = () => ({
  itemCode: '',
  name: '',
  description: '',
  unitOfMeasure: 'Piece',
  defaultPrice: '',
  itemGroupId: '',
  itemGroupName: '',
});

export function useItemForm({ item, open }: UseItemFormProps): UseItemFormResult {
  const [formData, setFormData] = useState(getInitialFormData());

  const resetForm = () => {
    setFormData(getInitialFormData());
  };

  useEffect(() => {
    if (item) {
      setFormData({
        itemCode: item.itemCode,
        name: item.name,
        description: item.description,
        unitOfMeasure: item.unitOfMeasure,
        defaultPrice: item.defaultPrice.toString(),
        itemGroupId: item.itemGroupId,
        itemGroupName: item.itemGroupName,
      });
    } else {
      resetForm();
    }
  }, [item, open]);

  return {
    formData,
    setFormData,
    resetForm,
  };
}
