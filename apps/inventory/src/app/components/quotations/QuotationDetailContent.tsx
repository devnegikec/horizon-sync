import * as React from 'react';

import { Separator } from '@horizon-sync/ui/components';

import type { Quotation } from '../../types/quotation.types';
import { PartyInfoCard, TaxSummaryCollapsible } from '../common';

import { buildTaxSummaryMap, formatDate } from './quotation.helpers';
import { QuotationLineItemsSection } from './QuotationLineItemsSection';

export function QuotationDetailContent({ quotation, currencySymbol }: { quotation: Quotation; currencySymbol: string }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">Quotation Date</p>
          <p className="font-medium">{formatDate(quotation.quotation_date)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Valid Until</p>
          <p className="font-medium">{formatDate(quotation.valid_until)}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Currency</p>
          <p className="font-medium">{quotation.currency}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Grand Total</p>
          <p className="font-medium">{currencySymbol} {Number(quotation.grand_total).toFixed(2)}</p>
        </div>
      </div>
      <div>
        <PartyInfoCard label="Customer" party={quotation.customer} fallbackName={quotation.customer_name || quotation.customer?.name} />
      </div>

      <Separator />
      <QuotationLineItemsSection quotation={quotation} currencySymbol={currencySymbol} />
      <TaxSummaryCollapsible taxSummary={buildTaxSummaryMap(quotation)} currencySymbol={currencySymbol} />

      {quotation.remarks && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Remarks</p>
          <p className="text-sm">{quotation.remarks}</p>
        </div>
      )}

      <Separator />
      <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
        <div><p>Created: {formatDate(quotation.created_at)}</p></div>
        {quotation.updated_at && <div><p>Updated: {formatDate(quotation.updated_at)}</p></div>}
      </div>
    </div>
  );
}
