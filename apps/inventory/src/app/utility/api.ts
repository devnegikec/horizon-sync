/**
 * API Utility Helpers
 * Provides standardized fetch functions for API calls with error handling
 */

import { environment } from '../../environments/environment';

const BASE_URL = environment.apiCoreUrl;

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
}

export interface ApiError {
  message: string;
  status: number;
  details?: unknown;
}

/**
 * Build URL with query parameters
 */
export function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

/**
 * Generic API request function with error handling
 */
export async function apiRequest<T>(endpoint: string, accessToken: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, headers = {} } = options;

  const url = buildUrl(endpoint, params);

  const requestHeaders: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    ...headers,
  };

  if (body && method !== 'GET') {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error: ApiError = {
      message: errorText || `HTTP ${response.status}`,
      status: response.status,
    };
    try {
      error.details = JSON.parse(errorText);
    } catch {
      // Text is not JSON
    }
    throw error;
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

/**
 * Standard pagination params builder
 */
export function buildPaginationParams(
  page: number,
  pageSize: number,
  sortBy = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc',
): Record<string, string | number> {
  return {
    page,
    page_size: pageSize,
    sort_by: sortBy,
    sort_order: sortOrder,
  };
}

// Warehouse API helpers
export const warehouseApi = {
  list: (accessToken: string, page = 1, pageSize = 20) =>
    apiRequest('/warehouses', accessToken, {
      params: buildPaginationParams(page, pageSize),
    }),

  get: (accessToken: string, id: string) => apiRequest(`/warehouses/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/warehouses', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/warehouses/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/warehouses/${id}`, accessToken, {
      method: 'DELETE',
    }),
};

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
};

// Item Suppliers API helpers
export const itemSupplierApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { item_id?: string; supplier_id?: string }) =>
    apiRequest('/item-suppliers', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...filters,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/item-suppliers/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/item-suppliers', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/item-suppliers/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/item-suppliers/${id}`, accessToken, {
      method: 'DELETE',
    }),
};

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
};
