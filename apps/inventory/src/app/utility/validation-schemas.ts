import { z } from 'zod';

/**
 * Shared validation schemas for all inventory module entities.
 * Rules sourced from fe_validation_rules_guid.md
 */

// ============================================
// ITEMS
// ============================================

export const ITEM_TYPES = ['stock', 'service', 'fixed_asset', 'consumable'] as const;

export const itemFormSchema = z.object({
  itemCode: z.string().optional().or(z.literal('')),
  sku: z.string().optional().or(z.literal('')),
  brandId: z.string().optional().or(z.literal('')),
  gtin: z.string().max(20, 'GTIN must be 20 characters or less').optional().or(z.literal('')),
  industry: z.string().max(100, 'Industry must be 100 characters or less').optional().or(z.literal('')),
  landingPage: z.string().optional().or(z.literal('')),
  warrantyPeriodMonths: z.string().optional().or(z.literal('')),
  qrType: z.string().max(30, 'QR type must be 30 characters or less').optional().or(z.literal('')),
  activationMethod: z.string().optional().or(z.literal('')),
  srNumberType: z.string().max(50, 'SR number type must be 50 characters or less').optional().or(z.literal('')),
  name: z.string().min(1, 'Item name is required').max(255, 'Item name must be 255 characters or less'),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional().or(z.literal('')),
  itemGroupId: z.string().optional().or(z.literal('')),
  itemGroupName: z.string().optional().or(z.literal('')),
  itemType: z.enum(ITEM_TYPES, { message: 'Item type must be one of: stock, service, fixed_asset, consumable' }),
  unitOfMeasure: z.string().min(1, 'Unit of measure is required').max(50, 'Unit of measure must be 50 characters or less'),
  status: z.string().min(1, 'Status is required'),
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
  defaultPrice: z.string(),
  valuationRate: z.string(),
  weightPerUnit: z.string(),
  weightUom: z.string(),
  enableAutoReorder: z.boolean(),
  reorderLevel: z.number().min(0),
  reorderQty: z.number().min(0),
  minOrderQty: z.number().min(0),
  maxOrderQty: z.number().min(0),
  inspectionRequiredBeforePurchase: z.boolean(),
  inspectionRequiredBeforeDelivery: z.boolean(),
  qualityInspectionTemplate: z.string().nullable(),
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

// ============================================
// WAREHOUSES
// ============================================

export const WAREHOUSE_TYPES = ['warehouse', 'store', 'virtual', 'transit'] as const;

export const warehouseFormSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required').max(255, 'Name must be 255 characters or less'),
  code: z.string().max(50, 'Code must be 50 characters or less').optional().or(z.literal('')),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional().or(z.literal('')),
  warehouse_type: z.enum(WAREHOUSE_TYPES, { message: 'Warehouse type must be one of: warehouse, store, virtual, transit' }),
  parent_warehouse_id: z.string().optional().or(z.literal('')),
  // Address
  address_line1: z.string().max(255, 'Address line 1 must be 255 characters or less').optional().or(z.literal('')),
  address_line2: z.string().max(255, 'Address line 2 must be 255 characters or less').optional().or(z.literal('')),
  city: z.string().max(100, 'City must be 100 characters or less').optional().or(z.literal('')),
  state: z.string().max(100, 'State must be 100 characters or less').optional().or(z.literal('')),
  postal_code: z.string().max(20, 'Postal code must be 20 characters or less').optional().or(z.literal('')),
  country: z.string().max(100, 'Country must be 100 characters or less').optional().or(z.literal('')),
  // Contact
  contact_name: z.string().max(255, 'Contact name must be 255 characters or less').optional().or(z.literal('')),
  contact_phone: z.string().max(50, 'Phone must be 50 characters or less').optional().or(z.literal('')),
  contact_email: z.string().max(255, 'Email must be 255 characters or less').email('Must be a valid email').optional().or(z.literal('')),
  // Capacity
  total_capacity: z.number().min(0, 'Capacity must be 0 or greater').optional(),
  capacity_uom: z.string().max(50, 'Capacity UOM must be 50 characters or less').optional().or(z.literal('')),
  // Accounting & Status
  stock_account_id: z.string().optional().or(z.literal('')),
  is_active: z.boolean(),
  is_default: z.boolean(),
});

export type WarehouseFormSchemaType = z.infer<typeof warehouseFormSchema>;

// ============================================
// ITEM GROUPS
// ============================================

export const VALUATION_METHODS = ['FIFO', 'LIFO', 'Moving_Average'] as const;

export const itemGroupFormSchema = z.object({
  name: z.string().min(1, 'Item group name is required').max(255, 'Name must be 255 characters or less'),
  code: z.string().max(50, 'Code must be 50 characters or less').optional().or(z.literal('')),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional().or(z.literal('')),
  parent_id: z.string().optional().or(z.literal('')),
  default_valuation_method: z.string().optional().or(z.literal('')),
  default_uom: z.string().max(50, 'Default UOM must be 50 characters or less').optional().or(z.literal('')),
  sales_tax_template_id: z.string().optional().or(z.literal('')).nullable(),
  purchase_tax_template_id: z.string().optional().or(z.literal('')).nullable(),
  is_active: z.boolean(),
});

export type ItemGroupFormSchemaType = z.infer<typeof itemGroupFormSchema>;

// ============================================
// STOCK ENTRIES
// ============================================

export const STOCK_ENTRY_TYPES = [
  'material_receipt',
  'material_issue',
  'material_transfer',
  'manufacture',
  'repack',
] as const;

export const STOCK_ENTRY_STATUSES = ['draft', 'submitted', 'cancelled'] as const;

export const stockEntryLineSchema = z.object({
  item_id: z.string().min(1, 'Item is required'),
  source_warehouse_id: z.string().optional().or(z.literal('')),
  target_warehouse_id: z.string().optional().or(z.literal('')),
  qty: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().min(1, 'UOM is required').max(50, 'UOM must be 50 characters or less'),
  basic_rate: z.number().min(0, 'Rate must be 0 or greater').optional(),
  valuation_rate: z.number().min(0, 'Valuation rate must be 0 or greater').optional(),
  batch_no: z.string().max(100, 'Batch number must be 100 characters or less').optional().or(z.literal('')),
  serial_nos: z.array(z.string()).optional(),
  description: z.string().max(1000, 'Description must be 1000 characters or less').optional().or(z.literal('')),
});

export const stockEntryFormSchema = z.object({
  stock_entry_no: z.string().max(100, 'Entry number must be 100 characters or less').optional().or(z.literal('')),
  stock_entry_type: z.enum(STOCK_ENTRY_TYPES, { message: 'Invalid stock entry type' }),
  from_warehouse_id: z.string().optional().or(z.literal('')),
  to_warehouse_id: z.string().optional().or(z.literal('')),
  posting_date: z.string().min(1, 'Posting date is required'),
  posting_time: z.string().max(10, 'Posting time must be 10 characters or less').optional().or(z.literal('')),
  status: z.enum(STOCK_ENTRY_STATUSES).optional(),
  reference_type: z.string().max(50, 'Reference type must be 50 characters or less').optional().or(z.literal('')),
  reference_id: z.string().optional().or(z.literal('')),
  remarks: z.string().max(1000, 'Remarks must be 1000 characters or less').optional().or(z.literal('')),
  expense_account_id: z.string().optional().or(z.literal('')),
  cost_center_id: z.string().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  const needsFrom = data.stock_entry_type === 'material_issue' || data.stock_entry_type === 'material_transfer';
  const needsTo = data.stock_entry_type === 'material_receipt' || data.stock_entry_type === 'material_transfer';

  if (needsFrom && !data.from_warehouse_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Source warehouse is required for this entry type',
      path: ['from_warehouse_id'],
    });
  }
  if (needsTo && !data.to_warehouse_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Target warehouse is required for this entry type',
      path: ['to_warehouse_id'],
    });
  }
});

export type StockEntryFormSchemaType = z.infer<typeof stockEntryFormSchema>;
export type StockEntryLineSchemaType = z.infer<typeof stockEntryLineSchema>;

// ============================================
// CUSTOMERS
// ============================================

export const CUSTOMER_STATUSES = ['active', 'inactive', 'blocked'] as const;

export const customerFormSchema = z.object({
  customer_name: z.string().min(1, 'Customer name is required').max(255, 'Name must be 255 characters or less'),
  customer_code: z.string().max(50, 'Code must be 50 characters or less').optional().or(z.literal('')),
  email: z.string().max(255, 'Email must be 255 characters or less').email('Must be a valid email').optional().or(z.literal('')),
  phone: z.string().max(50, 'Phone must be 50 characters or less').optional().or(z.literal('')),
  address: z.string().max(1000, 'Address must be 1000 characters or less').optional().or(z.literal('')),
  address_line1: z.string().max(255, 'Address line 1 must be 255 characters or less').optional().or(z.literal('')),
  address_line2: z.string().max(255, 'Address line 2 must be 255 characters or less').optional().or(z.literal('')),
  city: z.string().max(100, 'City must be 100 characters or less').optional().or(z.literal('')),
  state: z.string().max(100, 'State must be 100 characters or less').optional().or(z.literal('')),
  postal_code: z.string().max(20, 'Postal code must be 20 characters or less').optional().or(z.literal('')),
  country: z.string().max(100, 'Country must be 100 characters or less').optional().or(z.literal('')),
  tax_number: z.string().max(50, 'Tax number must be 50 characters or less').optional().or(z.literal('')),
  status: z.enum(CUSTOMER_STATUSES, { message: 'Status must be active, inactive, or blocked' }),
  credit_limit: z.number().min(0, 'Credit limit must be 0 or greater').optional(),
  outstanding_balance: z.number().min(0, 'Outstanding balance must be 0 or greater').optional(),
});

export type CustomerFormSchemaType = z.infer<typeof customerFormSchema>;

// ============================================
// SHARED VALIDATION HELPERS
// ============================================

/**
 * Validates a single field value against max length.
 * Returns error message or null.
 */
export function validateMaxLength(value: string | undefined | null, max: number, fieldName: string): string | null {
  if (!value) return null;
  if (value.length > max) return `${fieldName} must be ${max} characters or less`;
  return null;
}

/**
 * Validates a required field.
 * Returns error message or null.
 */
export function validateRequired(value: string | undefined | null, fieldName: string): string | null {
  if (!value?.trim()) return `${fieldName} is required`;
  return null;
}

/**
 * Validates an email field (optional — only validates format if non-empty).
 * Returns error message or null.
 */
export function validateEmail(value: string | undefined | null): string | null {
  if (!value?.trim()) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return 'Must be a valid email address';
  return null;
}

/**
 * Check if a field is at or over its max length (for showing inline warnings).
 */
export function isAtMaxLength(value: string | undefined | null, max: number): boolean {
  return (value?.length || 0) >= max;
}
