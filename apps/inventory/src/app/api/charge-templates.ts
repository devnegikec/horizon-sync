import type {
  ChargeTemplate,
  ChargeTemplateCreate,
  ChargeTemplateUpdate,
  ChargeTemplateListResponse,
} from '../types/charge-template.types';
import { apiRequest, buildPaginationParams } from '../utility/api/core';

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
    const response = await apiRequest<{
      templates: ChargeTemplate[];
      pagination: {
        page: number;
        page_size: number;
        total_items: number;
        total_pages: number;
      };
    }>('/charge-templates', accessToken, {
      params: {
        ...buildPaginationParams(page, limit),
        ...(filters?.charge_type && { charge_type: filters.charge_type }),
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

  getById: (accessToken: string, id: string): Promise<ChargeTemplate> =>
    apiRequest<ChargeTemplate>(`/charge-templates/${id}`, accessToken),

  create: (accessToken: string, data: ChargeTemplateCreate): Promise<ChargeTemplate> =>
    apiRequest<ChargeTemplate>('/charge-templates', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: ChargeTemplateUpdate): Promise<ChargeTemplate> =>
    apiRequest<ChargeTemplate>(`/charge-templates/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string): Promise<void> =>
    apiRequest<void>(`/charge-templates/${id}`, accessToken, {
      method: 'DELETE',
    }),
};
