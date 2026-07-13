import type { Customer } from '../../types/customer.types';

export interface CustomerFormData {
  customer_code: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  tax_number: string;
  credit_limit: string;
  outstanding_balance: string;
  status: Customer['status'];
  tags: string[];
}

export interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onSave: (customer: Partial<Customer>) => void;
  saving?: boolean;
}
