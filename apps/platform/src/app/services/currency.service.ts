import { environment } from '../../environments/environment';

const CURRENCIES_URL = `${environment.apiCoreUrl}/api/v1/currency/currencies`;
const BASE_CURRENCY_URL = `${environment.apiCoreUrl}/api/v1/currency/base-currency`;

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  organization_id?: string;
  is_base_currency?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateCurrencyPayload {
  code: string;
  name: string;
  symbol: string;
}

interface CurrencyListResponse {
  currencies: Currency[];
  base_currency: string;
}

export class CurrencyService {
  static async list(token: string): Promise<Currency[]> {
    const response = await fetch(CURRENCIES_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch currencies' }));
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data: CurrencyListResponse = await response.json();
    return data.currencies;
  }

  static async listWithBase(token: string): Promise<{ currencies: Currency[]; base_currency: string }> {
    const response = await fetch(CURRENCIES_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch currencies' }));
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json() as Promise<CurrencyListResponse>;
  }

  static async getBaseCurrency(token: string): Promise<string> {
    const response = await fetch(BASE_CURRENCY_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to fetch base currency' }));
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as { base_currency: string };
    return data.base_currency;
  }

  static async setBaseCurrency(code: string, token: string): Promise<string> {
    const response = await fetch(BASE_CURRENCY_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ base_currency: code }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update base currency' }));
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as { base_currency: string };
    return data.base_currency;
  }

  static async create(payload: CreateCurrencyPayload, token: string): Promise<Currency> {
    const response = await fetch(CURRENCIES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create currency' }));
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  static async delete(id: string, token: string): Promise<void> {
    const response = await fetch(`${CURRENCIES_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to delete currency' }));
      throw new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
    }
  }
}
