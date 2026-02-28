import * as React from 'react';

export interface CustomerAddressData {
  name?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  tax_number?: string;
}

interface CustomerAddressBlockProps {
  label?: string;
  customerName?: string;
  customer?: CustomerAddressData | null;
}

function CustomerAddressLines({ customer }: { customer: CustomerAddressData }) {
  const cityLine = [customer.city, customer.state, customer.postal_code].filter(Boolean).join(', ');
  return (
    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
      {customer.address_line1 && <p>{customer.address_line1}</p>}
      {customer.address_line2 && <p>{customer.address_line2}</p>}
      {cityLine && <p>{cityLine}</p>}
      {customer.country && <p>{customer.country}</p>}
      {customer.phone && <p>{customer.phone}</p>}
      {customer.email && <p>{customer.email}</p>}
      {customer.tax_number && <p className="text-xs">Tax No: {customer.tax_number}</p>}
    </div>
  );
}

export function CustomerAddressBlock({ label = 'Customer', customerName, customer }: CustomerAddressBlockProps) {
  const displayName = customerName || customer?.name || 'N/A';
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{displayName}</p>
      {customer && <CustomerAddressLines customer={customer} />}
    </div>
  );
}
