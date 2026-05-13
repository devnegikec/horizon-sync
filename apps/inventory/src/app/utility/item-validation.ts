import { z } from 'zod';

/**
 * Allowed item types per backend validation
 */
export const ITEM_TYPES = ['stock', 'service', 'fixed_asset', 'consumable'] as const;

/**
 * Allowed item statuses per backend validation
 */
export const ITEM_STATUSES = ['ACTIVE', 'INACTIVE', 'active', 'inactive'] as const;

/**
 * Zod schema for Item create/edit form validation.
 * Rules sourced from fe_validation_rules_guid.md
 */
export const itemFormSchema = z.object({
  // Basic Information
  itemCode: z.string().optional().or(z.literal('')),
  name: z
    .string()
    .min(1, 'Item name is required')
    .max(255, 'Item name must be 255 characters or less'),
  description: z
    .string()
    .max(1000, 'Description must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  itemGroupId: z.string().optional().or(z.literal('')),
  itemGroupName: z.string().optional().or(z.literal('')),
  itemType: z.enum(ITEM_TYPES, {
    message: 'Item type must be one of: stock, service, fixed_asset, consumable',
  }),
  unitOfMeasure: z
    .string()
    .min(1, 'Unit of measure is required')
    .max(50, 'Unit of measure must be 50 characters or less'),
  status: z.string().min(1, 'Status is required'),

  // Stock & Inventory
  maintainStock: z.boolean(),
  valuationMethod: z.string(),
  allowNegativeStock: z.boolean(),
  hasVariants: z.boolean(),
  variantOf: z.string().nullable(),
  variantAttributes: z.record(z.string(), z.unknown()),
  hasBatchNo: z.boolean(),
  batchNumberSeries: z.string(),
  hasSerialNo: z.boolean(),
  serialNumberSeries: z.string(),

  // Pricing & Valuation
  defaultPrice: z.string(),
  valuationRate: z.string(),
  weightPerUnit: z.string(),
  weightUom: z.string(),

  // Reordering
  enableAutoReorder: z.boolean(),
  reorderLevel: z.number().min(0),
  reorderQty: z.number().min(0),
  minOrderQty: z.number().min(0),
  maxOrderQty: z.number().min(0),

  // Quality & Inspection
  inspectionRequiredBeforePurchase: z.boolean(),
  inspectionRequiredBeforeDelivery: z.boolean(),
  qualityInspectionTemplate: z.string().nullable(),

  // Tax & Additional
  salesTaxTemplateId: z.string().nullable(),
  purchaseTaxTemplateId: z.string().nullable(),
  barcode: z.string(),
  imageUrl: z.string(),
  images: z.array(z.string()),
  tags: z.array(z.string()),
  customFields: z.record(z.string(), z.unknown()),
  extraData: z.record(z.string(), z.unknown()),
});

export type ItemFormSchemaType = z.infer<typeof itemFormSchema>;
