
import { useUserStore } from '@horizon-sync/store';

import { useItemSubmission } from '../../hooks/useItemSubmission';
import { useTaxTemplates } from '../../hooks/useTaxTemplates';
import type { ApiItemGroup } from '../../types/item-groups.types';
import type { ApiItem } from '../../types/items-api.types';
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

/**
 * Map an Item (from apiItemToItem) back to ItemFormData for the edit form.
 * The Item type only has a subset of fields; the rest default to safe values.
 */
function itemToFormData(item: Item): Partial<ItemFormData> {
  return {
    itemCode: item.itemCode ?? '',
    name: item.name ?? '',
    sku: item.sku ?? '',
    description: item.description ?? '',
    itemGroupId: item.itemGroupId ?? '',
    itemType: item.itemType ?? 'stock',
    unitOfMeasure: item.unitOfMeasure ?? 'unit',
    status: item.status ?? 'active',
    defaultPrice: item.defaultPrice != null ? String(item.defaultPrice) : '',
    valuationRate: item.valuationRate != null ? String(item.valuationRate) : '',
    maintainStock: item.maintainStock ?? true,
    allowNegativeStock: item.allowNegativeStock ?? false,
    valuationMethod: item.valuationMethod ?? 'FIFO',
    barcode: item.barcode ?? '',
    imageUrl: item.imageUrl ?? '',
    salesTaxTemplateId: item.salesTaxTemplateId ?? null,
    purchaseTaxTemplateId: item.purchaseTaxTemplateId ?? null,
    hasVariants: item.hasVariants ?? false,
    variantOf: item.variantOf ?? null,
    variantAttributes: item.variantAttributes ?? {},
    hasBatchNo: item.hasBatchNo ?? false,
    batchNumberSeries: item.batchNumberSeries ?? '',
    hasSerialNo: item.hasSerialNo ?? false,
    serialNumberSeries: item.serialNumberSeries ?? '',
    weightPerUnit: item.weightPerUnit != null ? String(item.weightPerUnit) : '',
    weightUom: item.weightUom ?? '',
    enableAutoReorder: item.enableAutoReorder ?? false,
    reorderLevel: item.reorderLevel ?? 0,
    reorderQty: item.reorderQty ?? 0,
    minOrderQty: item.minOrderQty ?? 1,
    maxOrderQty: item.maxOrderQty ?? 0,
    inspectionRequiredBeforePurchase: item.inspectionRequiredBeforePurchase ?? false,
    inspectionRequiredBeforeDelivery: item.inspectionRequiredBeforeDelivery ?? false,
    qualityInspectionTemplate: item.qualityInspectionTemplate ?? null,
    images: item.images ?? [],
    tags: item.tags ?? [],
    customFields: item.customFields ?? {},
    extraData: item.extraData ?? {},
    packagingUnitName: item.packagingDetails?.unitName ?? 'Each',
    packagingConversionFactor: item.packagingDetails?.conversionFactor != null
      ? String(item.packagingDetails.conversionFactor)
      : '1',
    packagingItemsPerMasterPack: item.packagingDetails?.itemsPerMasterPack != null
      ? String(item.packagingDetails.itemsPerMasterPack)
      : '',
    packagingLengthMm: item.packagingDetails?.lengthMm != null
      ? String(item.packagingDetails.lengthMm)
      : '',
    packagingWidthMm: item.packagingDetails?.widthMm != null
      ? String(item.packagingDetails.widthMm)
      : '',
    packagingHeightMm: item.packagingDetails?.heightMm != null
      ? String(item.packagingDetails.heightMm)
      : '',
    packagingWeightGrams: item.packagingDetails?.weightGrams != null
      ? String(item.packagingDetails.weightGrams)
      : '',
  };
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

  // Convert item to initialData for the multi-step form
  const initialData = item ? itemToFormData(item) : undefined;

  return (
    <ItemMultiStepDialog open={open}
      onOpenChange={onOpenChange}
      itemGroups={itemGroups}
      accessToken={accessToken || ''}
      salesTaxTemplates={salesTaxTemplates}
      purchaseTaxTemplates={purchaseTaxTemplates}
      isLoadingTaxTemplates={isLoadingTaxTemplates}
      onSave={handleSave}
      initialData={initialData}
      isEditing={!!item} />
  );
}
