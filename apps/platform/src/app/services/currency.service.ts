import { environment } from '../../environments/environment';

const API_BASE_URL = `${environment.apiCoreUrl}/currency/currencies`;

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  organization_id?: string;
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
    const response = await fetch(API_BASE_URL, {
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

  static async create(payload: CreateCurrencyPayload, token: string): Promise<Currency> {
    const response = await fetch(API_BASE_URL, {
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
    const response = await fetch(`${API_BASE_URL}/${id}`, {
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
