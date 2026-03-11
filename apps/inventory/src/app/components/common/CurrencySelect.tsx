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

  React.useEffect(() => {
    if (accessToken) {
      fetchCurrencies(environment.apiCoreUrl, accessToken);
    }
  }, [accessToken, fetchCurrencies]);

  return (
    <SharedCurrencySelect value={value}
      onChange={onValueChange}
      currencies={currencies}
      disabled={disabled} />
  );
}
