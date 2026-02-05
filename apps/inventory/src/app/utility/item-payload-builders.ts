import type { ApiItemGroup } from '../types/item-groups.types';
import type { CreateItemPayload, UpdateItemPayload } from '../types/items-api.types';

export interface ItemFormData {
  itemCode: string;
  name: string;
  description: string;
  unitOfMeasure: string;
  defaultPrice: string;
  itemGroupId: string;
}

export function buildCreateItemPayload(formData: ItemFormData): CreateItemPayload {
  const standardRate = parseFloat(formData.defaultPrice) || 0;

  return {
    item_code: formData.itemCode,
    item_name: formData.name,
    description: formData.description,
    item_group_id: formData.itemGroupId,
    item_type: 'stock',
    uom: formData.unitOfMeasure,
    maintain_stock: true,
    valuation_method: 'fifo',
    allow_negative_stock: false,
    has_variants: false,
    variant_of: null,
    variant_attributes: {},
    has_batch_no: false,
    has_serial_no: false,
    batch_number_series: '',
    serial_number_series: '',
    standard_rate: standardRate,
    valuation_rate: 0,
    enable_auto_reorder: false,
    reorder_level: 0,
    reorder_qty: 0,
    min_order_qty: 1,
    max_order_qty: 0,
    weight_per_unit: 0,
    weight_uom: '',
    inspection_required_before_purchase: false,
    inspection_required_before_delivery: false,
    barcode: '',
    status: 'ACTIVE',
    image_url: '',
    images: [],
    tags: [],
    custom_fields: {},
  };
}

export function buildUpdateItemPayload(formData: ItemFormData, itemGroup: ApiItemGroup | undefined): UpdateItemPayload {
  const standardRate = parseFloat(formData.defaultPrice) || 0;
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
    item_type: 'stock',
    uom: formData.unitOfMeasure,
    maintain_stock: true,
    valuation_method: 'fifo',
    allow_negative_stock: false,
    has_variants: false,
    variant_of: null,
    variant_attributes: {},
    has_batch_no: false,
    has_serial_no: false,
    batch_number_series: '',
    serial_number_series: '',
    standard_rate: String(standardRate.toFixed(2)),
    valuation_rate: '0.00',
    enable_auto_reorder: false,
    reorder_level: 0,
    reorder_qty: 0,
    min_order_qty: 1,
    max_order_qty: 0,
    weight_per_unit: '0.000',
    weight_uom: '',
    inspection_required_before_purchase: false,
    inspection_required_before_delivery: false,
    barcode: '',
    status: 'active',
    image_url: '',
    images: [],
    tags: [],
    custom_fields: {},
  };
}
