import * as React from 'react';

import { Input, TableCell, TableRow } from '@horizon-sync/ui/components';

import { getCurrencySymbol } from '../../types/currency.types';

import type { QuotationSummary } from './QuotationLineItemsTable';

function emptyCells(count: number, keyStart: number) {
  return Array.from({ length: count }, (_, i) => <TableCell key={keyStart + i} />);
}

export function SummaryFooterRows({
  summary,
  currency,
}: {
  summary: QuotationSummary;
  currency: string;
}) {
  const sym = getCurrencySymbol(currency);
  const doc = summary.documentDiscount;
  console.log({summary})

  return (
    <>
      {/* Subtotal */}
      <TableRow>
        {emptyCells(3, 0)}
        <TableCell className="font-medium">Subtotal:</TableCell>
        <TableCell className="text-left font-medium">{sym}{summary.subtotalAmount.toFixed(2)}</TableCell>
        <TableCell className="text-left font-medium">
          {summary.subtotalLineDiscount > 0 ? `−${sym}${summary.subtotalLineDiscount.toFixed(2)}` : null}
        </TableCell>
        <TableCell />
        <TableCell className="text-left font-medium">{sym}{summary.subtotalTax.toFixed(2)}</TableCell>
        <TableCell className="text-left font-medium">{sym}{summary.subtotalTotal.toFixed(2)}</TableCell>
        <TableCell />
      </TableRow>
      {/* Discount */}
      <TableRow>
        {emptyCells(3, 0)}
        <TableCell className="font-medium">Discount:</TableCell>
        <TableCell />
        <TableCell className="align-top">
          {doc ? (
            <div className="flex gap-1 items-center min-w-[100px]">
              <select className="h-8 w-14 rounded-md border border-input bg-background px-1.5 text-xs"
                value={doc.type}
                onChange={(e) => doc.onTypeChange(e.target.value)}
                disabled={doc.disabled}
                aria-label="Discount type on total">
                <option value="percentage">%</option>
                <option value="flat">Flat</option>
              </select>
              <Input type="number"
                min={0}
                step={doc.type === 'percentage' ? 1 : 0.01}
                className="h-8 w-16 text-xs"
                value={doc.value}
                onChange={(e) => doc.onValueChange(e.target.value)}
                placeholder="0"
                disabled={doc.disabled}
                aria-label="Discount value on total"/>
            </div>
          ) : null}
        </TableCell>
        <TableCell />
        <TableCell />
        <TableCell className="text-left text-muted-foreground">
          {summary.discountAmount > 0 ? `−${sym}${summary.discountAmount.toFixed(2)}` : null}
        </TableCell>
        <TableCell />
      </TableRow>
      {/* Grand Total */}
      <TableRow className="border-t-2 font-semibold">
        {emptyCells(3, 0)}
        <TableCell className="font-semibold">Grand Total:</TableCell>
        {emptyCells(4, 0)}
        <TableCell className="text-left font-semibold">{sym}{summary.grandTotal.toFixed(2)}</TableCell>
        <TableCell />
      </TableRow>
    </>
  );
}
