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
