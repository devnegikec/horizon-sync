export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  email: string;
  phone: string;
  billingAddress: Address;
  shippingAddresses: Address[];
  creditLimit: number;
  currentBalance: number;
  paymentTerms: string;
  status: 'active' | 'inactive' | 'on-hold';
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface CustomerPricing {
  id: string;
  customerId: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  specialPrice: number;
  defaultPrice: number;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  date: string;
  dueDate: string;
  total: number;
  paidAmount: number;
  status: 'paid' | 'partial' | 'unpaid' | 'overdue';
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  customerId: string;
  date: string;
  status: 'pending' | 'shipped' | 'delivered';
  addressId: string;
}

export interface CustomerFilters {
  search: string;
  status: string;
}
