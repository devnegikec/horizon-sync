/**
 * Currency and Exchange Rate types
 */

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_date: string;
  created_at: string;
}

export interface CreateExchangeRatePayload {
  from_currency: string;
  to_currency: string;
  rate: number;
  effective_date: string;
}

export interface UpdateExchangeRatePayload {
  rate: number;
  effective_date: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

export function getCurrencySymbol(code: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
  return currency?.symbol || code;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${amount.toFixed(2)}`;
}
