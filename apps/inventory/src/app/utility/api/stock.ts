import { apiRequest, buildPaginationParams } from './core';

// Stock Levels API helpers
export const stockLevelApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { warehouse_id?: string; item_id?: string }) =>
    apiRequest('/stock-levels', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize, 'updated_at'),
        ...filters,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/stock-levels/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/stock-levels', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/stock-levels/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  getByLocation: (accessToken: string, itemId: string, warehouseId: string) =>
    apiRequest('/stock-levels', accessToken, {
      params: { item_id: itemId, warehouse_id: warehouseId, page: 1, page_size: 1 },
    }),

  updateByLocation: (accessToken: string, itemId: string, warehouseId: string, data: {
    quantity_on_hand: number;
    quantity_reserved: number;
    quantity_available: number;
    last_counted_at?: string;
  }) =>
    apiRequest(`/stock-levels/by-location`, accessToken, {
      method: 'PUT',
      params: { item_id: itemId, warehouse_id: warehouseId },
      body: data,
    }),
};

// Stock Movements API helpers
export const stockMovementApi = {
  list: (
    accessToken: string,
    page = 1,
    pageSize = 20,
    filters?: {
      warehouse_id?: string;
      item_id?: string;
      date_from?: string;
      date_to?: string;
    },
  ) =>
    apiRequest('/stock-movements', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...filters,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/stock-movements/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/stock-movements', accessToken, {
      method: 'POST',
      body: data,
    }),
};

// Stock Entries API helpers
export const stockEntryApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { stock_entry_type?: string; status?: string }) =>
    apiRequest('/stock-entries', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...filters,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/stock-entries/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/stock-entries', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/stock-entries/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/stock-entries/${id}`, accessToken, {
      method: 'DELETE',
    }),

  submit: (accessToken: string, id: string) =>
    apiRequest(`/stock-entries/${id}/submit`, accessToken, {
      method: 'POST',
    }),

  bulkUpload: async (accessToken: string, file: File): Promise<unknown> => {
    const { buildUrl } = await import('./core');
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(buildUrl('/stock-entries/bulk/upload'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    return response.status === 204 ? {} : response.json();
  },
};

// Stock Reconciliations API helpers
export const stockReconciliationApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { status?: string }) =>
    apiRequest('/stock-reconciliations', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...filters,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/stock-reconciliations/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/stock-reconciliations', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/stock-reconciliations/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/stock-reconciliations/${id}`, accessToken, {
      method: 'DELETE',
    }),

  /** GET /stock-reconciliations/template?warehouse_id={uuid} — download CSV */
  downloadTemplate: async (accessToken: string, warehouseId: string): Promise<Blob> => {
    const { buildUrl } = await import('./core');
    const url = buildUrl('/stock-reconciliations/template', { warehouse_id: warehouseId });
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    return response.blob();
  },

  /** POST /stock-reconciliations/upload — multipart form (warehouse_id + CSV) */
  upload: async (accessToken: string, warehouseId: string, file: File): Promise<unknown> => {
    const { buildUrl } = await import('./core');
    const formData = new FormData();
    formData.append('warehouse_id', warehouseId);
    formData.append('file', file);
    const response = await fetch(buildUrl('/stock-reconciliations/upload'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `HTTP ${response.status}`);
    }
    return response.json();
  },

  /** POST /stock-reconciliations/{id}/confirm — commit adjustments */
  confirm: (accessToken: string, id: string) =>
    apiRequest(`/stock-reconciliations/${id}/confirm`, accessToken, {
      method: 'POST',
    }),
};
