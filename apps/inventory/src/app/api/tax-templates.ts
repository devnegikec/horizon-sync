import type {
  TaxTemplate,
  TaxTemplateCreate,
  TaxTemplateUpdate,
  TaxTemplateListResponse,
} from '../types/tax-template.types';
import { apiRequest, buildPaginationParams } from '../utility/api/core';

export const taxTemplateApi = {
  list: async (
    accessToken: string,
    page = 1,
    limit = 20,
    filters?: {
      tax_category?: 'Input' | 'Output' | 'Both';
      is_active?: boolean;
    }
  ): Promise<TaxTemplateListResponse> => {
    const response = await apiRequest<{
      templates: TaxTemplate[];
      pagination: {
        page: number;
        page_size: number;
        total_items: number;
        total_pages: number;
      };
    }>('/tax-templates', accessToken, {
      params: {
        ...buildPaginationParams(page, limit),
        ...(filters?.tax_category && { tax_category: filters.tax_category }),
        ...(filters?.is_active !== undefined && { is_active: filters.is_active }),
      },
    });

    return {
      data: response.templates || [],
      pagination: {
        page: response.pagination.page,
        limit: response.pagination.page_size,
        total: response.pagination.total_items,
        pages: response.pagination.total_pages,
      },
    };
  },

  getById: (accessToken: string, id: string): Promise<TaxTemplate> =>
    apiRequest<TaxTemplate>(`/tax-templates/${id}`, accessToken),

  create: (accessToken: string, data: TaxTemplateCreate): Promise<TaxTemplate> =>
    apiRequest<TaxTemplate>('/tax-templates', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: TaxTemplateUpdate): Promise<TaxTemplate> =>
    apiRequest<TaxTemplate>(`/tax-templates/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string): Promise<void> =>
    apiRequest<void>(`/tax-templates/${id}`, accessToken, {
      method: 'DELETE',
    }),
};
