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
        // Skip if already loaded (cache for 10 minutes), but always fetch if baseCurrency is null
        const { lastFetched, loading, baseCurrency } = get();
        if (loading) return;
        if (baseCurrency && lastFetched && Date.now() - lastFetched < 10 * 60 * 1000) return;

        set({ loading: true, error: null }, false, 'fetchCurrencies/start');

        try {
          const res = await fetch(`${apiBaseUrl}/api/v1/currency/currencies`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const data = await res.json();
          const fetchedBase = data.base_currency ?? null;

          set(
            {
              currencies: data.currencies ?? [],
              baseCurrency: fetchedBase,
              loading: false,
              lastFetched: Date.now(),
            },
            false,
            'fetchCurrencies/success'
          );

          // If baseCurrency is still null/USD-default after org creation,
          // retry once after 3s (backend seeding may still be in progress)
          if (!fetchedBase || fetchedBase === 'USD') {
            const retryCount = (get() as any)._retryCount ?? 0;
            if (retryCount < 2) {
              (get() as any)._retryCount = retryCount + 1;
              setTimeout(() => {
                set({ lastFetched: null }, false, 'fetchCurrencies/retryInvalidate');
                get().fetchCurrencies(apiBaseUrl, accessToken);
              }, 3000);
            }
          }
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
