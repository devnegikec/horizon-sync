import { DollarSign } from 'lucide-react';

import type { Invoice } from '../../types/invoice.types';
import { CurrencyIcon } from '@horizon-sync/ui';

export function InvoiceAmountsSummary({ invoice, currencySymbol }: { invoice: Invoice; currencySymbol: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Grand Total</span>
        <div className="flex items-center gap-2">
            {currencySymbol} {Number(invoice.grand_total).toFixed(2)}
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
