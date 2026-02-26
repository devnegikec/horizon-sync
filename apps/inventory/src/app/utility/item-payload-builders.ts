import type { ApiItemGroup } from '../types/item-groups.types';
import type { CreateItemPayload, UpdateItemPayload } from '../types/items-api.types';


export interface ItemFormData {
  // Basic Information
  itemCode: string;
  name: string;
  description: string;
  itemGroupId: string;
  itemType: string;
  unitOfMeasure: string;
  status: string;

  // Stock & Inventory
  maintainStock: boolean;
  valuationMethod: string;
  allowNegativeStock: boolean;
  hasVariants: boolean;
  variantOf: string | null;
  variantAttributes: Record<string, unknown>;
  hasBatchNo: boolean;
  batchNumberSeries: string;
  hasSerialNo: boolean;
  serialNumberSeries: string;

  // Pricing & Valuation
  defaultPrice: string;
  valuationRate: string;
  weightPerUnit: string;
  weightUom: string;

  // Reordering
  enableAutoReorder: boolean;
  reorderLevel: number;
  reorderQty: number;
  minOrderQty: number;
  maxOrderQty: number;

  // Quality & Inspection
  inspectionRequiredBeforePurchase: boolean;
  inspectionRequiredBeforeDelivery: boolean;
  qualityInspectionTemplate: string | null;

  // Tax & Additional
  salesTaxTemplateId: string | null;
  purchaseTaxTemplateId: string | null;
  barcode: string;
  imageUrl: string;
  images: string[];
  tags: string[];
  customFields: Record<string, unknown>;
  extraData: Record<string, unknown>;
}


export function buildCreateItemPayload(formData: ItemFormData): CreateItemPayload {
  const standardRate = parseFloat(formData.defaultPrice) || 0;
  const valuationRate = parseFloat(formData.valuationRate) || 0;
  const weightPerUnit = parseFloat(formData.weightPerUnit) || 0;

  return {
    item_code: formData.itemCode,
    item_name: formData.name,
    description: formData.description,
    item_group_id: formData.itemGroupId,
    item_type: formData.itemType,
    uom: formData.unitOfMeasure,
    maintain_stock: formData.maintainStock,
    valuation_method: formData.valuationMethod,
    allow_negative_stock: formData.allowNegativeStock,
    has_variants: formData.hasVariants,
    variant_of: formData.variantOf,
    variant_attributes: formData.variantAttributes,
    has_batch_no: formData.hasBatchNo,
    has_serial_no: formData.hasSerialNo,
    batch_number_series: formData.batchNumberSeries,
    serial_number_series: formData.serialNumberSeries,
    standard_rate: standardRate,
    valuation_rate: valuationRate,
    enable_auto_reorder: formData.enableAutoReorder,
    reorder_level: formData.reorderLevel,
    reorder_qty: formData.reorderQty,
    min_order_qty: formData.minOrderQty,
    max_order_qty: formData.maxOrderQty,
    weight_per_unit: weightPerUnit,
    weight_uom: formData.weightUom,
    inspection_required_before_purchase: formData.inspectionRequiredBeforePurchase,
    inspection_required_before_delivery: formData.inspectionRequiredBeforeDelivery,
    barcode: formData.barcode,
    status: formData.status,
    image_url: formData.imageUrl,
    images: formData.images,
    tags: formData.tags,
    custom_fields: formData.customFields,
    quality_inspection_template: formData.qualityInspectionTemplate,
    sales_tax_template_id: formData.salesTaxTemplateId,
    purchase_tax_template_id: formData.purchaseTaxTemplateId,
    extra_data: formData.extraData,
  };
}


export function buildUpdateItemPayload(formData: ItemFormData, itemGroup: ApiItemGroup | undefined): UpdateItemPayload {
  const standardRate = parseFloat(formData.defaultPrice) || 0;
  const valuationRate = parseFloat(formData.valuationRate) || 0;
  const weightPerUnit = parseFloat(formData.weightPerUnit) || 0;

  const group =
    itemGroup ??
    ({
      id: formData.itemGroupId,
      code: '',
      name: '',
    } as ApiItemGroup);

  return {
    item_code: formData.itemCode,
    item_name: formData.name,
    description: formData.description,
    item_group_id: formData.itemGroupId,
    item_group: {
      id: group.id,
      code: group.code,
      name: group.name,
    },
    item_type: formData.itemType,
    uom: formData.unitOfMeasure,
    maintain_stock: formData.maintainStock,
    valuation_method: formData.valuationMethod,
    allow_negative_stock: formData.allowNegativeStock,
    has_variants: formData.hasVariants,
    variant_of: formData.variantOf,
    variant_attributes: formData.variantAttributes,
    has_batch_no: formData.hasBatchNo,
    has_serial_no: formData.hasSerialNo,
    batch_number_series: formData.batchNumberSeries,
    serial_number_series: formData.serialNumberSeries,
    standard_rate: String(standardRate.toFixed(2)),
    valuation_rate: String(valuationRate.toFixed(2)),
    enable_auto_reorder: formData.enableAutoReorder,
    reorder_level: formData.reorderLevel,
    reorder_qty: formData.reorderQty,
    min_order_qty: formData.minOrderQty,
    max_order_qty: formData.maxOrderQty,
    weight_per_unit: String(weightPerUnit.toFixed(3)),
    weight_uom: formData.weightUom,
    inspection_required_before_purchase: formData.inspectionRequiredBeforePurchase,
    inspection_required_before_delivery: formData.inspectionRequiredBeforeDelivery,
    barcode: formData.barcode,
    status: formData.status,
    image_url: formData.imageUrl,
    images: formData.images,
    tags: formData.tags,
    custom_fields: formData.customFields,
    quality_inspection_template: formData.qualityInspectionTemplate,
    sales_tax_template_id: formData.salesTaxTemplateId,
    purchase_tax_template_id: formData.purchaseTaxTemplateId,
    extra_data: formData.extraData,
  };
}

