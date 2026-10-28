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

  // Keep organization-specific currencies, but also offer standard ISO
  // currencies so destinations such as India (INR) or Dubai (AED) are not
  // limited by an incomplete organization seed.
  const availableCurrencies = React.useMemo(() => {
    const currenciesByCode = new Map(SUPPORTED_CURRENCIES.map((currency) => [currency.code, currency]));
    currencies.forEach((currency) => currenciesByCode.set(currency.code, currency));
    if (baseCurrency && !currenciesByCode.has(baseCurrency)) {
      currenciesByCode.set(baseCurrency, resolveFallbackCurrency(baseCurrency));
    }
    return Array.from(currenciesByCode.values()).sort((a, b) => a.code.localeCompare(b.code));
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
