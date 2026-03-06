import type { Invoice } from '../../types/invoice.types';

export function InvoiceHeader({ invoice }: { invoice: Invoice }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div>
        <p className="text-sm text-muted-foreground">Invoice Number</p>
        <p className="text-lg font-semibold font-mono">{invoice.invoice_no}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Type</p>
        <p className="text-lg font-semibold capitalize">{invoice.invoice_type}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Currency</p>
        <p className="text-lg font-semibold">{invoice.currency}</p>
      </div>
    </div>
  );
}
