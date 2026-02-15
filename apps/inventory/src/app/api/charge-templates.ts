import { environment } from '../../environments/environment';

import type {
  ChargeTemplate,
  ChargeTemplateCreate,
  ChargeTemplateUpdate,
  ChargeTemplateListResponse,
} from '../types/charge-template.types';

const API_BASE_URL = environment.apiCoreUrl;
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const chargeTemplateApi = {
  list: async (
    accessToken: string,
    page = 1,
    limit = 20,
    filters?: {
      charge_type?: string;
      is_active?: boolean;
    }
  ): Promise<ChargeTemplateListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.charge_type && { charge_type: filters.charge_type }),
      ...(filters?.is_active !== undefined && { is_active: filters.is_active.toString() }),
    });

    const response = await fetch(`${API_BASE_URL}/api/v1/charge-templates?${params}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch charge templates: ${response.statusText}`);
    }

    return response.json();
  },

  getById: async (accessToken: string, id: string): Promise<ChargeTemplate> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/charge-templates/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch charge template: ${response.statusText}`);
    }

    return response.json();
  },

  create: async (accessToken: string, data: ChargeTemplateCreate): Promise<ChargeTemplate> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/charge-templates`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create charge template: ${response.statusText}`);
    }

    return response.json();
  },

  update: async (accessToken: string, id: string, data: ChargeTemplateUpdate): Promise<ChargeTemplate> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/charge-templates/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update charge template: ${response.statusText}`);
    }

    return response.json();
  },

  delete: async (accessToken: string, id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/v1/charge-templates/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Failed to delete charge template: ${response.statusText}`);
    }
  },
};
