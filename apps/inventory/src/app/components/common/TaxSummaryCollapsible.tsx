import * as React from 'react';

import { ChevronDown } from 'lucide-react';

import { Separator } from '@horizon-sync/ui/components';

interface TaxBreakup {
  rule_name: string;
  rate: number;
  amount: number;
}

interface TaxSummaryData {
  name: string;
  amount: number;
  breakup: TaxBreakup[];
}

interface TaxSummaryCollapsibleProps {
  taxSummary: Map<string, TaxSummaryData>;
  currencySymbol: string;
  defaultCollapsed?: boolean;
}

export function TaxSummaryCollapsible({
  taxSummary,
  currencySymbol,
  defaultCollapsed = false,
}: TaxSummaryCollapsibleProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  if (taxSummary.size === 0) {
    return null;
  }

  const totalTax = Array.from(taxSummary.values()).reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between group"
      >
        <h3 className="text-lg font-medium group-hover:text-primary transition-colors">Tax Summary</h3>
        <ChevronDown
          className="h-5 w-5 transition-transform duration-200"
          style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}
        />
      </button>

      {!isCollapsed && (
        <div className="rounded-lg border p-4 space-y-2">
          {Array.from(taxSummary.entries()).map(([key, summary]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">{summary.name}</span>
                <span className="text-sm font-semibold">
                  {currencySymbol} {summary.amount.toFixed(2)}
                </span>
              </div>
              <div className="pl-4 space-y-1">
                {summary.breakup.map((tax, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>
                      {tax.rule_name} ({tax.rate}%)
                    </span>
                    <span>{currencySymbol} {tax.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="flex justify-between items-center font-semibold">
            <span className="text-sm">Total Tax</span>
            <span className="text-sm">{currencySymbol} {totalTax.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
