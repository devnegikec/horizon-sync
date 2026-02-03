export interface Customer {
  id: string;
  customer_code: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  tax_number: string | null;
  status: 'active' | 'inactive' | 'on-hold';
  tags: string[] | null;
  credit_limit: string;
  outstanding_balance: string;
  custom_fields: any | null;
  extra_data: any | null;
  created_at: string;
}

export interface CustomerResponse {
  customers: Customer[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
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
