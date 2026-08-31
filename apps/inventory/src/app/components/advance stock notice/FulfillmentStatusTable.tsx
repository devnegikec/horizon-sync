import { Separator } from '@horizon-sync/ui/components';

import type { AsnOrderLineItem } from '../../types/asn-order.types';

interface FulfillmentStatusTableProps {
  items: AsnOrderLineItem[];
}

export function FulfillmentStatusTable({ items }: FulfillmentStatusTableProps) {
  const hasFulfillment = items.some(
    (i) => Number(i.qty) > 0 || Number(i.delivered_qty) > 0
  );

  if (!hasFulfillment) return null;

  const totalOrdered = items.reduce((s, i) => s + (Number(i.qty) || 0), 0);
  const totalDelivered = items.reduce((s, i) => s + (Number(i.delivered_qty) || 0), 0);

  return (
    <>
      <Separator />
      <div className="space-y-2">
        <h3 className="text-lg font-medium">ASN Fulfillment Status</h3>
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">SKU</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Ordered</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Delivered</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="px-4 py-3 text-sm">{item.item_name || item.item_id}</td>
                    <td className="px-4 py-3 text-sm font-mono text-muted-foreground">
                      {item.sku || item.item_code || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{Number(item.qty)}</td>
                    <td className="px-4 py-3 text-sm text-right">{Number(item.delivered_qty)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t">
                  <td colSpan={2} className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    Total Quantity:
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-semibold">{totalOrdered}</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold">{totalDelivered}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
