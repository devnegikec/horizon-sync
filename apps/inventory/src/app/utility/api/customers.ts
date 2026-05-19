import { apiRequest, buildPaginationParams } from './core';

// Customer API helpers
export const customerApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { search?: string; status?: string }) =>
    apiRequest('/customers', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...filters,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/customers/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/customers', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/customers/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/customers/${id}`, accessToken, {
      method: 'DELETE',
    }),

  /** Bulk import customers from CSV/XLSX/JSON file */
  bulkImport: (accessToken: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest<{
      success: boolean;
      total_rows: number;
      successful_rows: number;
      failed_rows: number;
      errors?: Array<{ row_number: number; errors: string[] }>;
      status: string;
    }>('/customers/bulk/import', accessToken, {
      method: 'POST',
      body: formData,
    });
  },

  /** Export customers as CSV (returns blob) */
  bulkExport: (accessToken: string, filters?: { status?: string; search?: string }) =>
    apiRequest<Blob>('/customers/bulk/export', accessToken, {
      params: filters,
      responseType: 'blob',
    }),

  /** Download import template CSV */
  downloadTemplate: (accessToken: string) =>
    apiRequest<Blob>('/customers/bulk/template', accessToken, {
      responseType: 'blob',
    }),
};
