import { User, Mail, Phone, MapPin } from 'lucide-react';

import type { Invoice, PartyDetails } from '../../types/invoice.types';

function getPartyName(party: PartyDetails | undefined, fallbackName?: string): string {
  return party?.customer_name || party?.supplier_name || fallbackName || 'N/A';
}

function PartyHeader({ party, partyName }: { party: PartyDetails | undefined; partyName: string }) {
  return (
    <div className="flex items-start gap-2">
      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-lg font-semibold">{partyName}</p>
        {party?.customer_code && <p className="text-sm text-muted-foreground">Code: {party.customer_code}</p>}
        {party?.tax_number && <p className="text-sm text-muted-foreground">Tax Number: {party.tax_number}</p>}
      </div>
    </div>
  );
}

function ContactDetails({ party }: { party: PartyDetails | undefined }) {
  if (!party?.email && !party?.phone) return null;

  return (
    <div className="space-y-2 pt-2 border-t">
      {party?.email && (
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <a href={`mailto:${party.email}`} className="text-primary hover:underline">
            {party.email}
          </a>
        </div>
      )}
      {party?.phone && (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <a href={`tel:${party.phone}`} className="text-primary hover:underline">
            {party.phone}
          </a>
        </div>
      )}
    </div>
  );
}

function AddressDetails({ party }: { party: PartyDetails | undefined }) {
  const hasAddress = party?.address || party?.address_line1 || party?.city || party?.country;
  if (!hasAddress) return null;

  const cityStatePostal = [party?.city, party?.state, party?.postal_code].filter(Boolean).join(', ');

  return (
    <div className="space-y-1 pt-2 border-t">
      <div className="flex items-start gap-2 text-sm">
        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div className="text-muted-foreground">
          {party?.address && <p>{party.address}</p>}
          {party?.address_line1 && <p>{party.address_line1}</p>}
          {party?.address_line2 && <p>{party.address_line2}</p>}
          {cityStatePostal && <p>{cityStatePostal}</p>}
          {party?.country && <p>{party.country}</p>}
        </div>
      </div>
    </div>
  );
}

export function InvoicePartyInfo({ invoice }: { invoice: Invoice }) {
  const party = invoice.invoice_type === 'sales' ? invoice.customer : invoice.supplier;
  const partyLabel = invoice.invoice_type === 'sales' ? 'Customer' : 'Supplier';
  const partyName = getPartyName(party, invoice.party_name);

  return (
    <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
      <p className="text-sm text-muted-foreground">{partyLabel} Information</p>
      <PartyHeader party={party} partyName={partyName} />
      <ContactDetails party={party} />
      <AddressDetails party={party} />
    </div>
  );
}
