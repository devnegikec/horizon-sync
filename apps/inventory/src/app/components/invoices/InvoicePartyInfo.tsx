import type { Invoice } from '../../types/invoice.types';
import { PartyInfoCard } from '../common';
import type { PartyInfoData } from '../common';

export function InvoicePartyInfo({ invoice }: { invoice: Invoice }) {
  const raw = invoice.invoice_type === 'sales' ? invoice.customer : invoice.supplier;
  const partyLabel = invoice.invoice_type === 'sales' ? 'Customer' : 'Supplier';
  const fallbackName = raw?.customer_name || raw?.supplier_name || invoice.party_name;

  const party: PartyInfoData | undefined = raw
    ? {
        name: raw.customer_name || raw.supplier_name,
        code: raw.customer_code,
        email: raw.email,
        phone: raw.phone,
        tax_number: raw.tax_number,
        address: raw.address,
        address_line1: raw.address_line1,
        address_line2: raw.address_line2,
        city: raw.city,
        state: raw.state,
        postal_code: raw.postal_code,
        country: raw.country,
      }
    : undefined;

  return <PartyInfoCard label={partyLabel} party={party} fallbackName={fallbackName} />;
}
