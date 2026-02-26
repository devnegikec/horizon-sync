export interface Item {
  id: string;
  itemCode: string;
  name: string;
  description: string;
  unitOfMeasure: string;
  defaultPrice: number;
  itemGroupId: string;
  itemGroupName: string;
  currentStock: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;

  // New API Fields
  itemType?: string;
  maintainStock?: boolean;
  valuationMethod?: string;
  allowNegativeStock?: boolean;
  hasVariants?: boolean;
  variantOf?: string | null;
  variantAttributes?: Record<string, unknown>;
  hasBatchNo?: boolean;
  batchNumberSeries?: string;
  hasSerialNo?: boolean;
  serialNumberSeries?: string;
  valuationRate?: number;
  weightPerUnit?: number;
  weightUom?: string;
  enableAutoReorder?: boolean;
  reorderLevel?: number;
  reorderQty?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  inspectionRequiredBeforePurchase?: boolean;
  inspectionRequiredBeforeDelivery?: boolean;
  qualityInspectionTemplate?: string | null;
  salesTaxTemplateId?: string | null;
  purchaseTaxTemplateId?: string | null;
  barcode?: string;
  imageUrl?: string;
  images?: string[];
  tags?: string[];
  customFields?: Record<string, unknown>;
  extraData?: Record<string, unknown>;
}

export interface ItemGroup {
  id: string;
  name: string;
  parentId: string | null;
  itemCount: number;
}

export interface PriceLevel {
  id: string;
  itemId: string;
  customerId?: string;
  customerName?: string;
  minQuantity: number;
  maxQuantity?: number;
  price: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface ItemTransaction {
  id: string;
  itemId: string;
  type: 'purchase' | 'sale' | 'adjustment';
  quantity: number;
  unitPrice: number;
  date: string;
  reference: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone: string;
}

export interface ItemFilters {
  search: string;
  groupId: string;
  status: string;
}
