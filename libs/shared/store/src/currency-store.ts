import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { isDevToolsEnabled } from './devtools';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface CurrencyStoreState {
  currencies: Currency[];
  baseCurrency: string | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  fetchCurrencies: (apiBaseUrl: string, accessToken: string) => Promise<void>;
}

export const useCurrencyStore = create<CurrencyStoreState>()(
  devtools(
    (set, get) => ({
      currencies: [],
      baseCurrency: null,
      loading: false,
      error: null,
      lastFetched: null,

      fetchCurrencies: async (apiBaseUrl: string, accessToken: string) => {
        // Skip if already loaded (cache for 10 minutes)
        const { lastFetched, loading } = get();
        if (loading) return;
        if (lastFetched && Date.now() - lastFetched < 10 * 60 * 1000) return;

        set({ loading: true, error: null }, false, 'fetchCurrencies/start');

        try {
          const res = await fetch(`${apiBaseUrl}/currency/currencies`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const data = await res.json();

          set(
            {
              currencies: data.currencies ?? [],
              baseCurrency: data.base_currency ?? null,
              loading: false,
              lastFetched: Date.now(),
            },
            false,
            'fetchCurrencies/success'
          );
        } catch (err: any) {
          set(
            { loading: false, error: err.message || 'Failed to fetch currencies' },
            false,
            'fetchCurrencies/error'
          );
        }
      },
    }),
    {
      name: 'currency-store',
      enabled: isDevToolsEnabled(),
    }
  )
);
