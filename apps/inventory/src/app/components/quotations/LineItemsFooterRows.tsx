import * as React from 'react';

import type { Quotation } from '../../types/quotation.types';

export function LineItemsFooterRows({
  items,
  quotation,
  currencySymbol,
}: {
  items: Quotation['items'];
  quotation: Quotation;
  currencySymbol: string;
}) {
  const safeItems = items ?? [];
  const subtotalAmount = safeItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const subtotalTax = safeItems.reduce((s, i) => s + Number(i.tax_amount || 0), 0);
  const subtotalTotal = safeItems.reduce((s, i) => s + Number(i.total_amount || i.amount || 0), 0);
  const discountAmount = Number(quotation.discount_amount ?? 0);
  const grandTotal = Number(quotation.grand_total ?? 0);
  const sym = currencySymbol;

  return (
    <>
      <tr>
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-right text-sm font-medium">Subtotal:</td>
        <td className="px-4 py-3 text-right text-sm font-medium">{sym}{subtotalAmount.toFixed(2)}</td>
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-right text-sm font-medium">{sym}{subtotalTax.toFixed(2)}</td>
        <td className="px-4 py-3 text-right text-sm font-medium">{sym}{subtotalTotal.toFixed(2)}</td>
      </tr>
      <tr>
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-right text-sm font-medium">Discount:</td>
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-right text-sm text-muted-foreground">
          {discountAmount > 0 ? `−${sym}${discountAmount.toFixed(2)}` : '—'}
        </td>
      </tr>
      <tr className="border-t-2 font-semibold">
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-right text-sm font-bold">Grand Total:</td>
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-right text-sm font-semibold">{sym}{grandTotal.toFixed(2)}</td>
      </tr>
    </>
  );
}
