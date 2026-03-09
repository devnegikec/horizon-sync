import * as React from 'react';

import { FileText, Receipt, ExternalLink } from 'lucide-react';

import { Button, Separator } from '@horizon-sync/ui/components';

import type { SalesOrder } from '../../types/sales-order.types';
import { LineItemsDetailTable, PartyInfoCard, TaxSummaryCollapsible } from '../common';

interface SalesOrderDetailContentProps {
  salesOrder: SalesOrder;
  currencySymbol: string;
  onViewInvoice?: (invoiceId: string) => void;
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getItemTaxInfo(item: any) {
  return (item.tax_info || item.extra_data?.tax_info) as {
    template_name: string;
    template_code: string;
    breakup: Array<{ rule_name: string; tax_type: string; rate: number; is_compound: boolean }>;
  } | null | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getItemTaxAmount(item: any): number {
  return Number(item.tax_amount || item.extra_data?.tax_amount || 0);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getItemTotalAmount(item: any): number {
  return Number(item.total_amount || item.extra_data?.total_amount || item.amount || 0);
}

function buildTaxSummaryMap(lineItems: SalesOrder['items']) {
  const taxSummary = new Map<string, { name: string; amount: number; breakup: Array<{ rule_name: string; rate: number; amount: number }> }>();
  lineItems.forEach(item => {
    const taxInfo = getItemTaxInfo(item);
    if (taxInfo) {
      const templateKey = taxInfo.template_code;
      if (!taxSummary.has(templateKey)) {
        taxSummary.set(templateKey, {
          name: taxInfo.template_name,
          amount: 0,
          breakup: taxInfo.breakup.map(tax => ({ rule_name: tax.rule_name, rate: tax.rate, amount: 0 })),
        });
      }
      const summary = taxSummary.get(templateKey);
      if (summary) {
        summary.amount += getItemTaxAmount(item);
        taxInfo.breakup.forEach((tax, idx) => {
          const taxComponentAmount = (Number(item.amount) * tax.rate) / 100;
          summary.breakup[idx].amount += taxComponentAmount;
        });
      }
    }
  });
  return taxSummary;
}

export function SalesOrderDetailContent({ salesOrder, currencySymbol, onViewInvoice }: SalesOrderDetailContentProps) {
  const lineItems = salesOrder.items || [];
  const hasTaxInfo = lineItems.some(item => getItemTaxInfo(item));
  const taxSummary = buildTaxSummaryMap(lineItems);

  return (
    <div className="space-y-6">
      {/* Dates, Currency & Grand Total */}
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">Order Date</p>
          <p className="font-medium">{formatDate(salesOrder.order_date)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Delivery Date</p>
          <p className="font-medium">{salesOrder.delivery_date ? formatDate(salesOrder.delivery_date) : 'Not set'}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Currency</p>
          <p className="font-medium">{salesOrder.currency}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Grand Total</p>
          <p className="font-medium">{currencySymbol} {Number(salesOrder.grand_total).toFixed(2)}</p>
        </div>
      </div>

      {/* Customer Info */}
      <PartyInfoCard label="Customer" party={salesOrder.customer} fallbackName={salesOrder.customer_name} />

      {/* Reference */}
      {salesOrder.reference_type && salesOrder.reference_id && (
        <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-900 dark:text-blue-100">
              Created from {salesOrder.reference_type} (Ref: {salesOrder.reference_id.slice(0, 8)}...)
            </span>
          </div>
        </div>
      )}

      <Separator />
      <div>
        <h3 className="text-lg font-medium mb-4">Line Items</h3>
        <LineItemsDetailTable items={lineItems}
          currencySymbol={currencySymbol}
          hasTaxInfo={hasTaxInfo}
          showBilledDelivered
          getItemTaxInfo={getItemTaxInfo}
          getItemTaxAmount={getItemTaxAmount}
          getItemTotalAmount={getItemTotalAmount}
          getItemDiscountAmount={(item) => Number(item.discount_amount ?? 0)}
          renderFooter={(items) => {
            const safeItems = items ?? [];
            const subtotalAmount = safeItems.reduce((s, item) => s + Number(item.amount || 0), 0);
            const subtotalTax = safeItems.reduce((s, item) => s + getItemTaxAmount(item), 0);
            const subtotalTotal = safeItems.reduce((s, item) => s + getItemTotalAmount(item), 0);
            const discountAmount = Number(salesOrder.discount_amount ?? 0);
            const grandTotal = Number(salesOrder.grand_total ?? 0);
            const sym = currencySymbol;
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
                  {hasTaxInfo && <td className="px-4 py-3 text-right text-sm font-medium">{sym}{subtotalTax.toFixed(2)}</td>}
                  {hasTaxInfo && <td className="px-4 py-3 text-right text-sm font-medium">{sym}{subtotalTotal.toFixed(2)}</td>}
                </tr>
                <tr>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-sm font-medium">Discount:</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                  {!hasTaxInfo ? (
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                      {discountAmount > 0 ? `−${sym}${discountAmount.toFixed(2)}` : '—'}
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {discountAmount > 0 ? `−${sym}${discountAmount.toFixed(2)}` : '—'}
                      </td>
                    </>
                  )}
                </tr>
                <tr className="border-t-2 font-semibold">
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3 text-sm font-semibold">Grand Total:</td>
                  <td className="px-4 py-3" />
                  <td className="px-4 py-3" />
                  {!hasTaxInfo ? (
                    <td className="px-4 py-3 text-right text-sm font-semibold">{sym}{grandTotal.toFixed(2)}</td>
                  ) : (
                    <>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-right text-sm font-semibold">{sym}{grandTotal.toFixed(2)}</td>
                    </>
                  )}
                </tr>
              </>
            );
          }} />
      </div>

      {/* Tax Summary */}
      <TaxSummaryCollapsible taxSummary={taxSummary} currencySymbol={currencySymbol} defaultCollapsed />

      {/* Related Invoices */}
      {salesOrder.items && salesOrder.items.some(item => Number(item.billed_qty) > 0) && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Related Invoices</h3>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-900 dark:text-blue-100">This sales order has been invoiced</span>
                </div>
                {onViewInvoice && (
                  <Button variant="ghost"
                    size="sm"
                    onClick={() => console.log('View invoices for sales order:', salesOrder.id)}
                    className="h-7 gap-1 text-blue-600 dark:text-blue-400">
                    View Invoices
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Remarks */}
      {salesOrder.remarks && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Remarks</p>
          <p className="text-sm">{salesOrder.remarks}</p>
        </div>
      )}

      {/* Timestamps */}
      <Separator />
      <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
        <div>
          <p>Created: {formatDate(salesOrder.created_at)}</p>
        </div>
        {salesOrder.updated_at && (
          <div>
            <p>Updated: {formatDate(salesOrder.updated_at)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
