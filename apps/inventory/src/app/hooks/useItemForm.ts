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
  // Basic Information
  itemCode: '',
  name: '',
  sku: '',
  description: '',
  itemGroupId: '',
  itemGroupName: '',
  itemType: 'stock',
  unitOfMeasure: 'Piece',
  status: 'ACTIVE',

  // Stock & Inventory
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

  // Pricing & Valuation
  defaultPrice: '',
  valuationRate: '0',
  weightPerUnit: '0',
  weightUom: '',

  // Reordering
  enableAutoReorder: false,
  reorderLevel: 0,
  reorderQty: 0,
  minOrderQty: 1,
  maxOrderQty: 0,

  // Quality & Inspection
  inspectionRequiredBeforePurchase: false,
  inspectionRequiredBeforeDelivery: false,
  qualityInspectionTemplate: null,

  // Tax & Additional
  salesTaxTemplateId: null,
  purchaseTaxTemplateId: null,
  brandId: '',
  gtin: '',
  barcode: '',
  imageUrl: '',
  images: [],
  tags: [],
  customFields: {},
  extraData: {},

  // Packaging Details
  packagingUnitName: 'Each',
  packagingConversionFactor: '1',
  packagingLengthMm: '',
  packagingWidthMm: '',
  packagingHeightMm: '',
  packagingWeightGrams: '',
});

export function useItemForm({ item, open }: UseItemFormProps): UseItemFormResult {
  const [formData, setFormData] = useState(getInitialFormData());

  const resetForm = () => {
    setFormData(getInitialFormData());
  };

  useEffect(() => {
    if (item) {
      setFormData({
        // Basic Information
        itemCode: item.itemCode,
        name: item.name,
        sku: item.sku ?? '',
        description: item.description,
        itemGroupId: item.itemGroupId,
        itemGroupName: item.itemGroupName,
        itemType: item.itemType || 'stock',
        unitOfMeasure: item.unitOfMeasure || 'Piece',
        status: item.status || 'ACTIVE',

        // Stock & Inventory
        maintainStock: item.maintainStock ?? true,
        valuationMethod: item.valuationMethod || 'FIFO',
        allowNegativeStock: item.allowNegativeStock ?? false,
        hasVariants: item.hasVariants ?? false,
        variantOf: item.variantOf || null,
        variantAttributes: item.variantAttributes || {},
        hasBatchNo: item.hasBatchNo ?? false,
        batchNumberSeries: item.batchNumberSeries || '',
        hasSerialNo: item.hasSerialNo ?? false,
        serialNumberSeries: item.serialNumberSeries || '',

        // Pricing & Valuation
        defaultPrice: item.defaultPrice?.toString() || '',
        valuationRate: item.valuationRate?.toString() || '0',
        weightPerUnit: item.weightPerUnit?.toString() || '0',
        weightUom: item.weightUom || '',

        // Reordering
        enableAutoReorder: item.enableAutoReorder ?? false,
        reorderLevel: item.reorderLevel || 0,
        reorderQty: item.reorderQty || 0,
        minOrderQty: item.minOrderQty || 1,
        maxOrderQty: item.maxOrderQty || 0,

        // Quality & Inspection
        inspectionRequiredBeforePurchase: item.inspectionRequiredBeforePurchase ?? false,
        inspectionRequiredBeforeDelivery: item.inspectionRequiredBeforeDelivery ?? false,
        qualityInspectionTemplate: item.qualityInspectionTemplate || null,

        // Tax & Additional
        salesTaxTemplateId: item.salesTaxTemplateId || null,
        purchaseTaxTemplateId: item.purchaseTaxTemplateId || null,
        brandId: (item as Item & { brandId?: string }).brandId || '',
        gtin: (item as Item & { gtin?: string }).gtin || '',
        barcode: item.barcode || '',
        imageUrl: item.imageUrl || '',
        images: item.images || [],
        tags: item.tags || [],
        customFields: item.customFields || {},
        extraData: item.extraData || {},

        // Packaging Details
        packagingUnitName: item.packagingDetails?.unitName || 'Each',
        packagingConversionFactor: item.packagingDetails?.conversionFactor?.toString() || '1',
        packagingLengthMm: item.packagingDetails?.lengthMm?.toString() || '',
        packagingWidthMm: item.packagingDetails?.widthMm?.toString() || '',
        packagingHeightMm: item.packagingDetails?.heightMm?.toString() || '',
        packagingWeightGrams: item.packagingDetails?.weightGrams?.toString() || '',
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
