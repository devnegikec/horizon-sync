import type { Item, ItemPackagingDetails } from '../types/item.types';
import type { ApiItem } from '../types/items-api.types';

function toNullableNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

function mapPackagingDetails(units: unknown): ItemPackagingDetails | null {
  if (!Array.isArray(units) || units.length === 0) return null;
  const list = units as Array<Record<string, unknown>>;
  const base = list.find((u) => u?.is_base_unit === true) ?? list[0];
  if (!base) return null;
  return {
    unitName: (base.unit_name as string) ?? 'Each',
    conversionFactor: Number(base.conversion_factor ?? 1) || 1,
    lengthMm: toNullableNumber(base.length_mm),
    widthMm: toNullableNumber(base.width_mm),
    heightMm: toNullableNumber(base.height_mm),
    weightGrams: toNullableNumber(base.weight_grams),
  };
}

/**
 * Maps an API item response to the frontend Item type.
 * Handles both list items (minimal fields) and full detail items (all fields).
 */
export function apiItemToItem(api: ApiItem): Item {
  return {
    id: api.id,
    itemCode: api.item_code,
    name: api.item_name,
    sku: api.sku ?? null,
    description: (api as any).description ?? '',
    unitOfMeasure: api.uom ?? '',
    defaultPrice: api.standard_rate != null ? parseFloat(api.standard_rate) : 0,
    itemGroupId: api.item_group_id ?? '',
    itemGroupName: api.item_group_name ?? '',
    currentStock: 0,
    status: (api.status === 'active' || api.status === 'inactive' ? api.status : 'active') as Item['status'],
    createdAt: api.created_at ?? '',
    updatedAt: (api as any).updated_at ?? '',

    // Extended fields from full item detail response
    itemType: (api as any).item_type ?? api.item_type ?? 'stock',
    maintainStock: (api as any).maintain_stock ?? api.maintain_stock ?? true,
    valuationMethod: (api as any).valuation_method ?? 'FIFO',
    allowNegativeStock: (api as any).allow_negative_stock ?? false,
    hasVariants: (api as any).has_variants ?? false,
    variantOf: (api as any).variant_of ?? null,
    variantAttributes: (api as any).variant_attributes ?? {},
    hasBatchNo: (api as any).has_batch_no ?? false,
    batchNumberSeries: (api as any).batch_number_series ?? '',
    hasSerialNo: (api as any).has_serial_no ?? false,
    serialNumberSeries: (api as any).serial_number_series ?? '',
    valuationRate: (api as any).valuation_rate != null ? parseFloat(String((api as any).valuation_rate)) : 0,
    weightPerUnit: (api as any).weight_per_unit != null ? parseFloat(String((api as any).weight_per_unit)) : 0,
    weightUom: (api as any).weight_uom ?? '',
    enableAutoReorder: (api as any).enable_auto_reorder ?? false,
    reorderLevel: (api as any).reorder_level ?? 0,
    reorderQty: (api as any).reorder_qty ?? 0,
    minOrderQty: (api as any).min_order_qty ?? 1,
    maxOrderQty: (api as any).max_order_qty ?? 0,
    inspectionRequiredBeforePurchase: (api as any).inspection_required_before_purchase ?? false,
    inspectionRequiredBeforeDelivery: (api as any).inspection_required_before_delivery ?? false,
    qualityInspectionTemplate: (api as any).quality_inspection_template ?? null,
    salesTaxTemplateId: (api as any).sales_tax_template_id ?? null,
    purchaseTaxTemplateId: (api as any).purchase_tax_template_id ?? null,
    barcode: (api as any).barcode ?? api.barcode ?? '',
    imageUrl: (api as any).image_url ?? api.image_url ?? '',
    images: (api as any).images ?? [],
    tags: (api as any).tags ?? [],
    customFields: (api as any).custom_fields ?? {},
    extraData: (api as any).extra_data ?? {},
    packagingDetails: mapPackagingDetails((api as any).packaging_units),
  };
}
