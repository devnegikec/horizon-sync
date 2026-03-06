import { Separator } from '@horizon-sync/ui/components';

import type { Invoice, InvoiceLineItem } from '../../types/invoice.types';
import { formatDate } from '../../utility/formatDate';
import { LineItemsDetailTable, TaxSummaryCollapsible } from '../common';

import { InvoiceAmountsSummary } from './InvoiceAmountsSummary';
import { InvoiceDates } from './InvoiceDates';
import { InvoiceHeader } from './InvoiceHeader';
import { InvoicePartyInfo } from './InvoicePartyInfo';

function buildTaxSummary(lineItems: InvoiceLineItem[]) {
  const taxSummary = new Map<
    string,
    { name: string; amount: number; breakup: Array<{ rule_name: string; rate: number; amount: number }> }
  >();

  lineItems.forEach((item) => {
    if (item.tax_info) {
      const templateKey = item.tax_info.template_code;
      if (!taxSummary.has(templateKey)) {
        taxSummary.set(templateKey, {
          name: item.tax_info.template_name,
          amount: 0,
          breakup: item.tax_info.breakup.map((tax) => ({
            rule_name: tax.rule_name,
            rate: tax.rate,
            amount: 0,
          })),
        });
      }
      const summary = taxSummary.get(templateKey);
      if (summary) {
        summary.amount += Number(item.tax_amount || 0);
        item.tax_info.breakup.forEach((tax, idx) => {
          const taxComponentAmount = (Number(item.amount) * tax.rate) / 100;
          summary.breakup[idx].amount += taxComponentAmount;
        });
      }
    }
  });

  return taxSummary;
}

function LineItemsFooter({ items, invoice, currencySymbol: sym }: { items: InvoiceLineItem[] | undefined; invoice: Invoice; currencySymbol: string }) {
  const safeItems = items ?? [];
  const subtotalAmount = safeItems.reduce((s, item) => s + Number(item.amount || 0), 0);
  const subtotalTax = safeItems.reduce((s, item) => s + Number(item.tax_amount || 0), 0);
  const subtotalTotal = safeItems.reduce((s, item) => s + Number(item.total_amount || item.amount || 0), 0);
  const discountAmount = Number(invoice.discount_amount ?? 0);
  const grandTotal = Number(invoice.grand_total ?? 0);

  return (
    <>
      <tr>
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-sm font-medium">Subtotal:</td>
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
        <td className="px-4 py-3 text-sm font-medium">Discount:</td>
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
        <td className="px-4 py-3 text-sm font-semibold">Grand Total:</td>
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-right text-sm font-semibold">{sym}{grandTotal.toFixed(2)}</td>
      </tr>
    </>
  );
}

export function InvoiceContent({ invoice, currencySymbol }: { invoice: Invoice; currencySymbol: string }) {
  const lineItems = invoice.items || invoice.line_items || [];
  const taxSummary = buildTaxSummary(lineItems);

  return (
    <div className="space-y-6">
      <InvoiceHeader invoice={invoice} />
      <InvoicePartyInfo invoice={invoice} />
      <InvoiceDates invoice={invoice} />

      {lineItems.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Line Items</h3>
            <LineItemsDetailTable items={lineItems}
              currencySymbol={currencySymbol}
              hasTaxInfo
              getItemSKU={(item: InvoiceLineItem) => item.item_code}
              getItemTotalAmount={(item: InvoiceLineItem) => Number(item.total_amount || item.amount || 0)}
              getItemDiscountAmount={(item: InvoiceLineItem) => Number(item.discount_amount ?? 0)}
              renderFooter={(items) => (
                <LineItemsFooter items={items} invoice={invoice} currencySymbol={currencySymbol} />
              )}/>
          </div>
        </>
      )}

      <Separator />
       <TaxSummaryCollapsible taxSummary={taxSummary} currencySymbol={currencySymbol} />
      <InvoiceAmountsSummary invoice={invoice} currencySymbol={currencySymbol} />

      {(invoice.reference_type || invoice.reference_id) && (
        <div className="rounded-lg border p-4 bg-muted/20">
          <p className="text-sm text-muted-foreground mb-1">Reference</p>
          <p className="text-sm font-medium">
            {invoice.reference_type && <span className="capitalize">{invoice.reference_type}: </span>}
            {invoice.reference_id}
          </p>
        </div>
      )}

      {invoice.remarks && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Remarks</p>
          <p className="text-sm">{invoice.remarks}</p>
        </div>
      )}

      <Separator />
      <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
        <div>
          <p>Created: {formatDate(invoice.created_at, 'DD-MMM-YY', { includeTime: true })}</p>
        </div>
        {invoice.updated_at && (
          <div>
            <p>Updated: {formatDate(invoice.updated_at, 'DD-MMM-YY', { includeTime: true })}</p>
          </div>
        )}
      </div>
    </div>
  );
}
