import { environment } from '../../environments/environment';
import type {
  TaxTemplate,
  TaxTemplateCreate,
  TaxTemplateUpdate,
  TaxTemplateListResponse,
} from '../types/tax-template.types';

const API_BASE_URL = environment.apiCoreUrl;

export const taxTemplateApi = {
  list: async (
    accessToken: string,
    page = 1,
    limit = 20,
    filters?: {
      tax_category?: 'Input' | 'Output';
      is_active?: boolean;
    }
  ): Promise<TaxTemplateListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.tax_category && { tax_category: filters.tax_category }),
      ...(filters?.is_active !== undefined && { is_active: filters.is_active.toString() }),
    });

    const response = await fetch(`${API_BASE_URL}/tax-templates?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tax templates: ${response.statusText}`);
    }

    return response.json();
  },

  getById: async (accessToken: string, id: string): Promise<TaxTemplate> => {
    const response = await fetch(`${API_BASE_URL}/tax-templates/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tax template: ${response.statusText}`);
    }

    return response.json();
  },

  create: async (accessToken: string, data: TaxTemplateCreate): Promise<TaxTemplate> => {
    const response = await fetch(`${API_BASE_URL}/tax-templates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create tax template: ${response.statusText}`);
    }

    return response.json();
  },

  update: async (accessToken: string, id: string, data: TaxTemplateUpdate): Promise<TaxTemplate> => {
    const response = await fetch(`${API_BASE_URL}/tax-templates/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update tax template: ${response.statusText}`);
    }

    return response.json();
  },

  delete: async (accessToken: string, id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tax-templates/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Failed to delete tax template: ${response.statusText}`);
    }
  },
};
