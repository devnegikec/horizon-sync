import * as React from 'react';
import { useState } from 'react';
import { CurrencySettings } from './CurrencySettings';
import { ExchangeRateManagement } from './ExchangeRateManagement';

export function CurrencyManagement() {
  const [baseCurrency] = useState('USD'); // This would come from the settings component

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Currency Management</h1>
        <p className="text-muted-foreground mt-2">
          Configure base currency and manage exchange rates for multi-currency operations
        </p>
      </div>

      {/* Base Currency Settings */}
      <section>
        <CurrencySettings />
      </section>

      {/* Exchange Rate Management */}
      <section>
        <ExchangeRateManagement baseCurrency={baseCurrency} />
      </section>
    </div>
  );
}
