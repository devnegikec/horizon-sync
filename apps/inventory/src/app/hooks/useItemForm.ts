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

const getInitialFormData = (): ItemFormData & { itemGroupName: string } => ({
  itemCode: '',
  name: '',
  description: '',
  unitOfMeasure: 'Piece',
  defaultPrice: '',
  itemGroupId: '',
  itemGroupName: '',
  itemType: 'Product',
  status: 'Active',
  maintainStock: true,
  valuationMethod: 'FIFO',
  allowNegativeStock: false,
  hasVariants: false,
  variantOf: null,
  variantAttributes: {},
  hasBatchNo: false,
  batchNumberSeries: '',
  hasSerialNo: false,
  serialNumberSeries: '',
  valuationRate: '0',
  weightPerUnit: '0',
  weightUom: 'kg',
  enableAutoReorder: false,
  reorderLevel: 0,
  reorderQty: 0,
  minOrderQty: 0,
  maxOrderQty: 0,
  inspectionRequiredBeforePurchase: false,
  inspectionRequiredBeforeDelivery: false,
  qualityInspectionTemplate: null,
  salesTaxTemplateId: null,
  purchaseTaxTemplateId: null,
  barcode: '',
  imageUrl: '',
  images: [],
  tags: [],
  customFields: {},
  extraData: {},
});

export function useItemForm({ item, open }: UseItemFormProps): UseItemFormResult {
  const [formData, setFormData] = useState<ItemFormData & { itemGroupName: string }>(getInitialFormData());

  const resetForm = () => {
    setFormData(getInitialFormData());
  };

  useEffect(() => {
    if (item) {
      setFormData({
        ...getInitialFormData(),
        itemCode: item.itemCode,
        name: item.name,
        description: item.description,
        unitOfMeasure: item.unitOfMeasure,
        defaultPrice: item.defaultPrice.toString(),
        itemGroupId: item.itemGroupId,
        itemGroupName: item.itemGroupName,
        status: item.status === 'active' ? 'Active' : 'Inactive',
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
