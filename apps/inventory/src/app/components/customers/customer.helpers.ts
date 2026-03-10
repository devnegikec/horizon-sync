import type { Customer } from '../../types/customer.types';
import type { CustomerFormData } from './types';

export const EMPTY_FORM: CustomerFormData = {
  customer_code: '',
  customer_name: '',
  email: '',
  phone: '',
  address: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'IN',
  tax_number: '',
  credit_limit: '0',
  outstanding_balance: '0',
  status: 'active',
  tags: [],
};

export function initFormData(customer: Customer | null): CustomerFormData {
  if (!customer) return { ...EMPTY_FORM };
  return {
    customer_code: customer.customer_code,
    customer_name: customer.customer_name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address || '',
    address_line1: customer.address_line1 || '',
    address_line2: customer.address_line2 || '',
    city: customer.city,
    state: customer.state || '',
    postal_code: customer.postal_code || '',
    country: customer.country || 'IN',
    tax_number: customer.tax_number || '',
    credit_limit: customer.credit_limit,
    outstanding_balance: customer.outstanding_balance,
    status: customer.status,
    tags: customer.tags || [],
  };
}

export function buildSavePayload(formData: CustomerFormData): Partial<Customer> {
  return {
    ...formData,
    address: formData.address || null,
    address_line1: formData.address_line1 || null,
    address_line2: formData.address_line2 || null,
    state: formData.state || null,
    postal_code: formData.postal_code || null,
    country: formData.country || null,
    tax_number: formData.tax_number || null,
    tags: formData.tags.length > 0 ? formData.tags : null,
    custom_fields: {},
    extra_data: {},
  };
}

export const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'SG', name: 'Singapore' },
] as const;
