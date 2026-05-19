import * as React from 'react';

import { useCurrencyStore, useUserStore } from '@horizon-sync/store';
import { CurrencySelect as SharedCurrencySelect, SUPPORTED_CURRENCIES } from '@horizon-sync/ui';

import { environment } from '../../../environments/environment';

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

function resolveFallbackCurrency(code: string): { code: string; name: string; symbol: string } {
  const currency = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  return currency
    ? { code: currency.code, name: currency.name, symbol: currency.symbol }
    : { code, name: code, symbol: code };
}

export function CurrencySelect({ value, onValueChange, disabled = false }: CurrencySelectProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { currencies, baseCurrency, fetchCurrencies } = useCurrencyStore();

  // Provide a sensible fallback when currencies haven't loaded yet
  const availableCurrencies = React.useMemo(() => {
    if (currencies.length === 0) {
      const code = baseCurrency || 'USD';
      return [resolveFallbackCurrency(code)];
    }
    return currencies;
  }, [currencies, baseCurrency]);

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
