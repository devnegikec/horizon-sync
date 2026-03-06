import { DollarSign } from 'lucide-react';

import type { Invoice } from '../../types/invoice.types';

export function InvoiceAmountsSummary({ invoice, currencySymbol }: { invoice: Invoice; currencySymbol: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Grand Total</span>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-lg font-semibold">
            {currencySymbol} {Number(invoice.grand_total).toFixed(2)}
          </span>
        </div>
      </div>
      {invoice.outstanding_amount > 0 && (
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm font-medium">Outstanding Amount</span>
          <span className="text-xl font-bold text-destructive">
            {currencySymbol} {Number(invoice.outstanding_amount).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}
