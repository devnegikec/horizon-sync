import * as React from 'react';

import type { Quotation } from '../../types/quotation.types';
import { LineItemsDetailTable } from '../common';

import { LineItemsFooterRows } from './LineItemsFooterRows';

export function QuotationLineItemsSection({ quotation, currencySymbol }: { quotation: Quotation; currencySymbol: string }) {
  const lineItems = quotation.items || quotation.line_items || [];
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Line Items</h3>
      <LineItemsDetailTable items={lineItems}
        currencySymbol={currencySymbol}
        hasTaxInfo
        getItemSKU={(item) => item.item_code}
        getItemTotalAmount={(item) => Number(item.total_amount || item.amount || 0)}
        getItemDiscountAmount={(item) => Number(item.discount_amount ?? 0)}
        renderFooter={(items) => (
          <LineItemsFooterRows items={items} quotation={quotation} currencySymbol={currencySymbol} />
        )}/>
    </div>
  );
}
