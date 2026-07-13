import { Separator } from '@horizon-sync/ui/components';

import type { SalesOrderLineItem } from '../../types/sales-order.types';

interface FulfillmentStatusTableProps {
  items: SalesOrderLineItem[];
}

export function FulfillmentStatusTable({ items }: FulfillmentStatusTableProps) {
  const hasFulfillment = items.some(
    (i) => Number(i.billed_qty) > 0 || Number(i.delivered_qty) > 0
  );

  if (!hasFulfillment) return null;

  return (
    <>
      <Separator />
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Fulfillment Status</h3>
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Ordered</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Billed</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Delivered</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="px-4 py-3 text-sm">{item.item_name || item.item_id}</td>
                    <td className="px-4 py-3 text-sm text-right">{Number(item.qty)}</td>
                    <td className="px-4 py-3 text-sm text-right">{Number(item.billed_qty)}</td>
                    <td className="px-4 py-3 text-sm text-right">{Number(item.delivered_qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
