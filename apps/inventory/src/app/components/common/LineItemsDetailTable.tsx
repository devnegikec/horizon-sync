import * as React from 'react';

export interface LineItemsDetailTableProps<T> {
  items: T[];
  currencySymbol: string;
  renderFooter?: (items: T[]) => React.ReactNode;
  hasTaxInfo?: boolean;
  showBilledDelivered?: boolean;
  getItemName?: (item: T) => string;
  getItemSKU?: (item: T) => string | undefined;
  getItemQty?: (item: T) => number;
  getItemUOM?: (item: T) => string;
  getItemRate?: (item: T) => number;
  getItemAmount?: (item: T) => number;
  getItemTaxInfo?: (item: T) => { template_name: string; template_code: string; breakup: Array<{ rule_name: string; tax_type: string; rate: number; is_compound: boolean }> } | null | undefined;
  getItemTaxAmount?: (item: T) => number;
  getItemTotalAmount?: (item: T) => number;
  getItemBilledQty?: (item: T) => number;
  getItemDeliveredQty?: (item: T) => number;
}

export function LineItemsDetailTable<T>({
  items,
  currencySymbol,
  renderFooter,
  hasTaxInfo = false,
  showBilledDelivered = false,
  getItemName = (item: any) => item.item_name || item.item_id,
  getItemSKU = (item: any) => item.item_sku || item.item_code,
  getItemQty = (item: any) => Number(item.qty),
  getItemUOM = (item: any) => item.uom,
  getItemRate = (item: any) => Number(item.rate),
  getItemAmount = (item: any) => Number(item.amount),
  getItemTaxInfo = (item: any) => item.tax_info,
  getItemTaxAmount = (item: any) => Number(item.tax_amount || 0),
  getItemTotalAmount = (item: any) => Number(item.total_amount || item.amount || 0),
  getItemBilledQty = (item: any) => Number(item.billed_qty || 0),
  getItemDeliveredQty = (item: any) => Number(item.delivered_qty || 0),
}: LineItemsDetailTableProps<T>) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No line items</p>;
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">#</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Qty</th>
              <th className="px-4 py-3 text-left text-sm font-medium">UOM</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Rate</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
              {hasTaxInfo && <th className="px-4 py-3 text-right text-sm font-medium">Tax</th>}
              {hasTaxInfo && <th className="px-4 py-3 text-right text-sm font-medium">Total</th>}
              {showBilledDelivered && <th className="px-4 py-3 text-right text-sm font-medium">Billed</th>}
              {showBilledDelivered && <th className="px-4 py-3 text-right text-sm font-medium">Delivered</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, index) => {
              const qty = getItemQty(item);
              const billedQty = getItemBilledQty(item);
              const deliveredQty = getItemDeliveredQty(item);
              const billedPct = qty > 0 ? Math.min((billedQty / qty) * 100, 100) : 0;
              const deliveredPct = qty > 0 ? Math.min((deliveredQty / qty) * 100, 100) : 0;
              const taxInfo = getItemTaxInfo(item);
              const taxAmount = getItemTaxAmount(item);
              const totalAmount = getItemTotalAmount(item);
              const sku = getItemSKU(item);

              return (
                <tr key={(item as any).id || index} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{getItemName(item)}</p>
                      {sku && <p className="text-xs text-muted-foreground">{sku}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-right">{qty}</td>
                  <td className="px-4 py-3 text-sm">{getItemUOM(item)}</td>
                  <td className="px-4 py-3 text-sm text-right">{currencySymbol} {getItemRate(item).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right">{currencySymbol} {getItemAmount(item).toFixed(2)}</td>
                  {hasTaxInfo && (
                    <td className="px-4 py-3 text-right">
                      {taxInfo ? (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{currencySymbol} {taxAmount.toFixed(2)}</p>
                          <div className="flex flex-wrap gap-1 justify-end">
                            {taxInfo.breakup.map((tax, taxIdx) => (
                              <span key={taxIdx} className="text-xs text-muted-foreground">
                                {tax.rule_name} {tax.rate}%
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </td>
                  )}
                  {hasTaxInfo && (
                    <td className="px-4 py-3 text-sm text-right font-semibold">{currencySymbol} {totalAmount.toFixed(2)}</td>
                  )}
                  {showBilledDelivered && (
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span>{billedQty} / {qty}</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${billedPct}%` }} />
                        </div>
                      </div>
                    </td>
                  )}
                  {showBilledDelivered && (
                    <td className="px-4 py-3 text-sm text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span>{deliveredQty} / {qty}</span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${deliveredPct}%` }} />
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          {renderFooter && <tfoot className="bg-muted/30 border-t-2">{renderFooter(items)}</tfoot>}
        </table>
      </div>
    </div>
  );
}
