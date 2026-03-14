import * as React from 'react';

import { useCurrencyStore, useUserStore } from '@horizon-sync/store';
import { CurrencySelect as SharedCurrencySelect } from '@horizon-sync/ui/components';

import { environment } from '../../../environments/environment';

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function CurrencySelect({ value, onValueChange, disabled = false }: CurrencySelectProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { currencies, fetchCurrencies } = useCurrencyStore();

  // Ensure INR is always available as an option
  const availableCurrencies = React.useMemo(() => {
    const hasINR = currencies.some(c => c.code === 'INR');
    if (!hasINR && currencies.length === 0) {
      // If currencies are not loaded yet, provide INR as default
      return [{ code: 'INR', name: 'Indian Rupee', symbol: '₹' }];
    }
    if (!hasINR) {
      // Add INR if it's missing from the loaded currencies
      return [...currencies, { code: 'INR', name: 'Indian Rupee', symbol: '₹' }];
    }
    return currencies;
  }, [currencies]);

  React.useEffect(() => {
    if (accessToken) {
      fetchCurrencies(environment.apiCoreUrl, accessToken);
    }
  }, [accessToken, fetchCurrencies]);

  return (
    <SharedCurrencySelect value={value}
      onChange={onValueChange}
      currencies={availableCurrencies}
      disabled={disabled} />
  );
}
