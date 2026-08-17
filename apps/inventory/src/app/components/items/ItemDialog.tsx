import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';

import { useUserStore } from '@horizon-sync/store';
import { Dialog, DialogContent } from '@horizon-sync/ui/components/ui/dialog';

import { useItemSubmission } from '../../hooks/useItemSubmission';
import { useTaxTemplates } from '../../hooks/useTaxTemplates';
import type { ApiItemGroup } from '../../types/item-groups.types';
import type { Item } from '../../types/item.types';
import { apiRequest } from '../../utility/api/core';
import type { ItemFormData } from '../../utility/item-payload-builders';
import { itemFormSchema, type ItemFormSchemaType } from '../../utility/item-validation';

import { ItemDialogHeader } from './ItemDialogHeader';
import { ItemFormFields } from './ItemFormFields';

// API response shape for GET /items/{id}
interface ItemDetailResponse {
  id: string;
  organization_id: string;
  item_code: string;
  item_name: string;
  sku: string | null;
  description: string;
  item_group_id: string | null;
  item_group: { id: string; code: string; name: string } | null;
  item_type: string;
  uom: string;
  maintain_stock: boolean;
  valuation_method: string;
  allow_negative_stock: boolean;
  has_variants: boolean;
  variant_of: string | null;
  variant_attributes: Record<string, unknown>;
  has_batch_no: boolean;
  has_serial_no: boolean;
  batch_number_series: string;
  serial_number_series: string;
  standard_rate: string;
  valuation_rate: string;
  enable_auto_reorder: boolean;
  reorder_level: number;
  reorder_qty: number;
  min_order_qty: number;
  max_order_qty: number;
  weight_per_unit: string;
  weight_uom: string;
  inspection_required_before_purchase: boolean;
  inspection_required_before_delivery: boolean;
  quality_inspection_template: string | null;
  sales_tax_template_id: string | null;
  purchase_tax_template_id: string | null;
  barcode: string;
  status: string;
  image_url: string;
  images: string[];
  tags: string[];
  custom_fields: Record<string, unknown>;
  extra_data: Record<string, unknown>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  brand_id: string | null;
  gtin: string | null;
}

// --- Mappers ---

function mapDetailToFormValues(detail: ItemDetailResponse): ItemFormSchemaType {
  return {
    ...mapFormBasicFields(detail),
    sku: detail.sku || '',
    brandId: detail.brand_id || '',
    gtin: detail.gtin || '',
    ...mapFormStockFields(detail),
    ...mapFormPricingFields(detail),
    ...mapFormAdditionalFields(detail),
  };
}

function mapFormBasicFields(d: ItemDetailResponse) {
  return {
    itemCode: d.item_code || '',
    name: d.item_name || '',
    description: d.description || '',
    itemGroupId: d.item_group_id || '',
    itemGroupName: d.item_group?.name || '',
    itemType: resolveItemType(d.item_type),
    unitOfMeasure: d.uom || 'Nos',
    status: d.status || 'ACTIVE',
  };
}

// eslint-disable-next-line complexity
function mapFormStockFields(d: ItemDetailResponse) {
  return {
    maintainStock: d.maintain_stock ?? true,
    valuationMethod: d.valuation_method || 'FIFO',
    allowNegativeStock: d.allow_negative_stock ?? false,
    hasVariants: d.has_variants ?? false,
    variantOf: d.variant_of || null,
    variantAttributes: d.variant_attributes || {},
    hasBatchNo: d.has_batch_no ?? false,
    batchNumberSeries: d.batch_number_series || '',
    hasSerialNo: d.has_serial_no ?? false,
    serialNumberSeries: d.serial_number_series || '',
  };
}

function mapFormPricingFields(d: ItemDetailResponse) {
  return {
    defaultPrice: d.standard_rate || '',
    valuationRate: d.valuation_rate || '0',
    weightPerUnit: d.weight_per_unit || '0',
    weightUom: d.weight_uom || '',
    enableAutoReorder: d.enable_auto_reorder ?? false,
    reorderLevel: d.reorder_level || 0,
    reorderQty: d.reorder_qty || 0,
    minOrderQty: d.min_order_qty || 1,
    maxOrderQty: d.max_order_qty || 0,
  };
}

// eslint-disable-next-line complexity
function mapFormAdditionalFields(d: ItemDetailResponse) {
  return {
    inspectionRequiredBeforePurchase: d.inspection_required_before_purchase ?? false,
    inspectionRequiredBeforeDelivery: d.inspection_required_before_delivery ?? false,
    qualityInspectionTemplate: d.quality_inspection_template || null,
    salesTaxTemplateId: d.sales_tax_template_id || null,
    purchaseTaxTemplateId: d.purchase_tax_template_id || null,
    barcode: d.barcode || '',
    imageUrl: d.image_url || '',
    images: d.images || [],
    tags: d.tags || [],
    customFields: d.custom_fields || {},
    extraData: d.extra_data || {},
  };
}

function resolveItemType(type: string): ItemFormSchemaType['itemType'] {
  const valid = ['stock', 'service', 'fixed_asset', 'consumable'] as const;
  return valid.includes(type as (typeof valid)[number]) ? (type as ItemFormSchemaType['itemType']) : 'stock';
}

// eslint-disable-next-line complexity
function mapDetailToItem(detail: ItemDetailResponse): Item {
  const status = detail.status === 'active' || detail.status === 'inactive'
    ? detail.status : 'active';
  return {
    id: detail.id,
    itemCode: detail.item_code,
    name: detail.item_name,
    description: detail.description || '',
    unitOfMeasure: detail.uom || '',
    defaultPrice: detail.standard_rate ? parseFloat(detail.standard_rate) : 0,
    itemGroupId: detail.item_group_id || '',
    itemGroupName: detail.item_group?.name || '',
    currentStock: 0,
    status: status as Item['status'],
    createdAt: detail.created_at || '',
    updatedAt: detail.updated_at || '',
    itemType: detail.item_type,
  };
}

// --- Default form values ---

const DEFAULT_FORM_VALUES: ItemFormSchemaType = {
  itemCode: '',
  name: '',
  description: '',
  itemGroupId: '',
  itemGroupName: '',
  itemType: 'stock',
  unitOfMeasure: 'Nos',
  status: 'ACTIVE',
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
  defaultPrice: '',
  valuationRate: '0',
  weightPerUnit: '0',
  weightUom: '',
  enableAutoReorder: false,
  reorderLevel: 0,
  reorderQty: 0,
  minOrderQty: 1,
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
  brandId: '',
  gtin: '',
};

// --- Component ---

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
  onItemGroupsRefresh,
}: ItemDialogProps) {
  const isEditing = !!item;
  const accessToken = useUserStore((s) => s.accessToken);

  // Fetch full item details from API when editing
  const [fullItem, setFullItem] = React.useState<Item | null>(null);
  const [fetchingDetail, setFetchingDetail] = React.useState(false);
  const [detailResponse, setDetailResponse] = React.useState<ItemDetailResponse | null>(null);

  React.useEffect(() => {
    if (!open || !item?.id || !accessToken) {
      setFullItem(null);
      setDetailResponse(null);
      return;
    }

    setFetchingDetail(true);
    apiRequest<ItemDetailResponse>(`/items/${item.id}`, accessToken)
      .then((data) => {
        setDetailResponse(data);
        setFullItem(mapDetailToItem(data));
      })
      .catch((err) => {
        console.error('Failed to fetch item details for edit:', err);
        setFullItem(item);
      })
      .finally(() => setFetchingDetail(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id, accessToken]);

  // react-hook-form with zod validation
  const methods = useForm<ItemFormSchemaType>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
    mode: 'onBlur',
  });

  // Reset form when dialog opens or detail data arrives
  React.useEffect(() => {
    if (!open) return;

    if (isEditing && detailResponse) {
      methods.reset(mapDetailToFormValues(detailResponse));
    } else if (!isEditing) {
      methods.reset(DEFAULT_FORM_VALUES);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, detailResponse, isEditing]);

  const { salesTaxTemplates, purchaseTaxTemplates, isLoading: isLoadingTaxTemplates } = useTaxTemplates();

  const { handleSubmit: submitItem, isLoading } = useItemSubmission({
    item: isEditing ? fullItem : null,
    itemGroups,
    onCreated,
    onUpdated,
    onClose: () => onOpenChange(false),
  });

  const onSubmit = async (data: ItemFormSchemaType) => {
    try {
      await submitItem(data as unknown as ItemFormData);
    } catch {
      // Error handled by useItemSubmission
    }
  };

  // Bridge: expose formData and setFormData for ItemFormFields (backward-compatible)
  const formData = methods.watch() as ItemFormData & { itemGroupName: string };
  const setFormData: React.Dispatch<React.SetStateAction<ItemFormData & { itemGroupName: string }>> = React.useCallback(
    (updater) => {
      const current = methods.getValues() as unknown as ItemFormData & { itemGroupName: string };
      const next = typeof updater === 'function' ? updater(current) : updater;
      Object.entries(next).forEach(([key, value]) => {
        if (current[key as keyof typeof current] !== value) {
          methods.setValue(key as keyof ItemFormSchemaType, value as never, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      });
    },
    [methods],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <ItemDialogHeader isEditing={isEditing} />

        {fetchingDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading item details...</span>
          </div>
        ) : (
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)}>
              <ItemFormFields formData={formData} setFormData={setFormData} itemGroups={itemGroups} onItemGroupsRefresh={onItemGroupsRefresh} isLoading={isLoading} salesTaxTemplates={salesTaxTemplates} purchaseTaxTemplates={purchaseTaxTemplates} isLoadingTaxTemplates={isLoadingTaxTemplates}/>
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
