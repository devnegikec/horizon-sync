import { User, Mail, Phone, MapPin } from 'lucide-react';

export interface PartyInfoData {
  name?: string;
  code?: string;
  email?: string;
  phone?: string;
  tax_number?: string;
  address?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface PartyInfoCardProps {
  label?: string;
  party: PartyInfoData | null | undefined;
  fallbackName?: string;
}

function formatAddress(party: PartyInfoData): string[] {
  const lines: string[] = [];
  if (party.address) lines.push(party.address);
  if (party.address_line1) lines.push(party.address_line1);
  if (party.address_line2) lines.push(party.address_line2);
  const cityLine = [party.city, party.state, party.postal_code].filter(Boolean).join(', ');
  if (cityLine) lines.push(cityLine);
  if (party.country) lines.push(party.country);
  return lines;
}

function AddressLines({ lines }: { lines: string[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </>
  );
}

function NameCell({ name, code, taxNumber }: { name: string; code?: string; taxNumber?: string }) {
  return (
    <div className="flex items-start gap-2">
      <User className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">{name}</p>
        {code && <p className="text-xs text-muted-foreground">Code: {code}</p>}
        {taxNumber && <p className="text-xs text-muted-foreground">Tax: {taxNumber}</p>}
      </div>
    </div>
  );
}

function ContactCell({ email, phone }: { email?: string; phone?: string }) {
  if (!email && !phone) {
    return <p className="text-sm text-muted-foreground">No contact info</p>;
  }

  return (
    <div className="flex items-start gap-2">
      <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="space-y-1">
        {email && (
          <a href={`mailto:${email}`} className="block text-sm text-primary hover:underline">
            {email}
          </a>
        )}
        {phone && (
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <a href={`tel:${phone}`} className="text-sm text-primary hover:underline">
              {phone}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function AddressCells({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;

  const mid = Math.ceil(lines.length / 2);
  const col1 = lines.slice(0, mid);
  const col2 = lines.slice(mid);

  return (
    <>
      <div className="flex items-start gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="text-sm text-muted-foreground">
          <AddressLines lines={col1} />
        </div>
      </div>
      {col2.length > 0 && (
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 invisible" />
          <div className="text-sm text-muted-foreground">
            <AddressLines lines={col2} />
          </div>
        </div>
      )}
    </>
  );
}

export function PartyInfoCard({ label = 'Party', party, fallbackName }: PartyInfoCardProps) {
  const displayName = party?.name || fallbackName || 'N/A';
  const addressLines = party ? formatAddress(party) : [];

  return (
    <div className="rounded-lg border p-4 bg-muted/30">
      <p className="text-sm text-muted-foreground mb-3">{label} Information</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        <NameCell name={displayName} code={party?.code} taxNumber={party?.tax_number} />
        <ContactCell email={party?.email} phone={party?.phone} />
        <AddressCells lines={addressLines} />
      </div>
    </div>
  );
}
