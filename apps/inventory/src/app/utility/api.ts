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

// Suppliers API helpers
export const supplierApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { search?: string; status?: string }) =>
    apiRequest('/suppliers', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...filters,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/suppliers/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/suppliers', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/suppliers/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/suppliers/${id}`, accessToken, {
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

// Delivery Notes API helpers
export const deliveryNoteApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { customer_id?: string; status?: string; search?: string; sort_by?: string; sort_order?: 'asc' | 'desc' }) =>
    apiRequest('/delivery-notes', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize, filters?.sort_by || 'delivery_date', filters?.sort_order || 'desc'),
        customer_id: filters?.customer_id,
        status: filters?.status,
        search: filters?.search,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/delivery-notes/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/delivery-notes', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/delivery-notes/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/delivery-notes/${id}`, accessToken, {
      method: 'DELETE',
    }),
};

// Quotations API helpers
export const quotationApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { status?: string; search?: string; sort_by?: string; sort_order?: 'asc' | 'desc' }) =>
    apiRequest('/quotations', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize, filters?.sort_by || 'quotation_date', filters?.sort_order || 'desc'),
        status: filters?.status,
        search: filters?.search,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/quotations/${id}`, accessToken),

  create: (accessToken: string, data: unknown) =>
    apiRequest('/quotations', accessToken, {
      method: 'POST',
      body: data,
    }),

  update: (accessToken: string, id: string, data: unknown) =>
    apiRequest(`/quotations/${id}`, accessToken, {
      method: 'PUT',
      body: data,
    }),

  delete: (accessToken: string, id: string) =>
    apiRequest(`/quotations/${id}`, accessToken, {
      method: 'DELETE',
    }),

  convertToSalesOrder: (accessToken: string, id: string, data?: unknown) =>
    apiRequest(`/quotations/${id}/convert-to-sales-order`, accessToken, {
      method: 'POST',
      body: data || {},
    }),
};

// Items API helpers
export const itemApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { search?: string; status?: string }) =>
    apiRequest('/items', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...filters,
      },
    }),

  get: (accessToken: string, id: string) => apiRequest(`/items/${id}`, accessToken),
};

// Bulk Import API helpers
export const bulkImportApi = {
  upload: async (accessToken: string, file: File): Promise<unknown> => {
    const url = buildUrl('/bulk-import/upload');

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
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
      return {};
    }

    return response.json();
  },
};

// Bulk Export API helpers
export interface BulkExportPayload {
  file_format: 'csv' | 'xlsx' | 'json' | 'pdf';
  file_name: string;
  filters?: {
    item_type?: string;
    status?: string;
  } | null;
  selected_columns?: string[] | null;
}

export interface BulkExportResponse {
  id: string;
  organization_id: string;
  created_by_id: string;
  file_name: string;
  file_format: string;
  status: string;
  total_rows: number;
  filters: unknown;
  selected_columns: string[] | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  expires_at: string | null;
  file_content?: string;
}

export const bulkExportApi = {
  export: async (accessToken: string, payload: BulkExportPayload): Promise<Blob> => {
    const url = buildUrl('/bulk-export');

    console.log('[bulkExportApi] Sending export request:', { url, payload });

    // Step 1: Create export job
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    console.log('[bulkExportApi] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[bulkExportApi] Error response:', errorText);
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

    // Parse JSON response from backend
    const data: BulkExportResponse = await response.json();
    console.log('[bulkExportApi] Job created:', data);

    // Check if export completed
    if (data.status !== 'COMPLETED') {
      console.error('[bulkExportApi] Export not completed, status:', data.status);
      throw {
        message: `Export status: ${data.status}`,
        status: 500,
        details: data,
      } as ApiError;
    }

    // Step 2: Download the exported file
    const downloadUrl = buildUrl(`/bulk-export/${data.id}/download`);
    console.log('[bulkExportApi] Downloading file from:', downloadUrl);

    const downloadResponse = await fetch(downloadUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('[bulkExportApi] Download response status:', downloadResponse.status);

    if (!downloadResponse.ok) {
      const errorText = await downloadResponse.text();
      console.error('[bulkExportApi] Download error:', errorText);
      throw {
        message: `Failed to download file: ${errorText || downloadResponse.status}`,
        status: downloadResponse.status,
      } as ApiError;
    }

    const blob = await downloadResponse.blob();
    console.log('[bulkExportApi] File downloaded, size:', blob.size);
    return blob;
  },
};

// Material Request API helpers
import type {
  MaterialRequest,
  MaterialRequestListResponse,
  CreateMaterialRequestPayload,
  UpdateMaterialRequestPayload,
  MaterialRequestFilters,
} from '../types/material-request.types';

export const materialRequestApi = {
  /**
   * List material requests with pagination and filters
   */
  async list(accessToken: string, filters: Partial<MaterialRequestFilters> = {}): Promise<MaterialRequestListResponse> {
    const params: Record<string, string | number> = {
      ...buildPaginationParams(
        filters.page || 1,
        filters.page_size || 10,
        filters.sort_by || 'created_at',
        filters.sort_order || 'desc'
      ),
    };

    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }

    if (filters.search) {
      params.search = filters.search;
    }

    const response = await apiRequest<any>('/material-requests', accessToken, { params });
    
    // Backend returns: { material_requests: [], pagination: {} }
    // Transform to: { data: [], total_count: number, page: number, page_size: number }
    if (response.material_requests && response.pagination) {
      // Transform material requests
      const materialRequests = response.material_requests.map((mr: any) => ({
        ...mr,
        // Keep line_items_count for display, add empty line_items array
        line_items: mr.line_items || [],
        line_items_count: mr.line_items_count || 0,
        status: mr.status?.toUpperCase() || 'DRAFT',
        updated_at: mr.updated_at || mr.created_at,
      }));

      return {
        data: materialRequests,
        total_count: response.pagination.total_items,
        page: response.pagination.page,
        page_size: response.pagination.page_size,
      };
    }
    
    // Fallback: return as-is if already in expected format
    return {
      data: response.data || [],
      total_count: response.total_count || 0,
      page: response.page || 1,
      page_size: response.page_size || 10,
    };
  },

  /**
   * Get a single material request by ID
   */
  async getById(accessToken: string, id: string): Promise<MaterialRequest> {
    const response = await apiRequest<any>(`/material-requests/${id}`, accessToken);
    
    // Transform response to ensure consistent format
    return {
      ...response,
      status: response.status?.toUpperCase() || 'DRAFT',
      updated_at: response.updated_at || response.created_at,
      line_items: response.line_items || [],
    };
  },

  /**
   * Create a new material request
   */
  async create(accessToken: string, payload: CreateMaterialRequestPayload): Promise<MaterialRequest> {
    return apiRequest<MaterialRequest>('/material-requests', accessToken, {
      method: 'POST',
      body: payload,
    });
  },

  /**
   * Update an existing material request (DRAFT only)
   */
  async update(accessToken: string, id: string, payload: UpdateMaterialRequestPayload): Promise<MaterialRequest> {
    return apiRequest<MaterialRequest>(`/material-requests/${id}`, accessToken, {
      method: 'PUT',
      body: payload,
    });
  },

  /**
   * Delete a material request (DRAFT only)
   */
  async delete(accessToken: string, id: string): Promise<void> {
    return apiRequest<void>(`/material-requests/${id}`, accessToken, {
      method: 'DELETE',
    });
  },

  /**
   * Submit a material request
   */
  async submit(accessToken: string, id: string): Promise<MaterialRequest> {
    return apiRequest<MaterialRequest>(`/material-requests/${id}/submit`, accessToken, {
      method: 'POST',
    });
  },

  /**
   * Cancel a material request
   */
  async cancel(accessToken: string, id: string): Promise<MaterialRequest> {
    return apiRequest<MaterialRequest>(`/material-requests/${id}/cancel`, accessToken, {
      method: 'POST',
    });
  },
};


// RFQ API helpers
import type {
  RFQ,
  RFQListResponse,
  RFQListItem,
  CreateRFQPayload,
  UpdateRFQPayload,
  RecordQuotePayload,
  RFQFilters,
  RFQStatus,
} from '../types/rfq.types';

/**
 * Transform backend status (lowercase) to frontend status (uppercase)
 */
function transformStatus(status: string): RFQStatus {
  return status.toUpperCase() as RFQStatus;
}

/**
 * Transform backend RFQ response to frontend RFQ type
 */
function transformRFQ(rfq: any): RFQ {
  return {
    ...rfq,
    status: transformStatus(rfq.status),
    // Extract supplier IDs from suppliers array for convenience
    supplier_ids: rfq.suppliers?.map((s: any) => s.supplier_id) || [],
    // Ensure arrays exist
    line_items: rfq.line_items || [],
    suppliers: rfq.suppliers || [],
  };
}

/**
 * Transform backend RFQ list item to frontend type
 */
function transformListItem(item: any): RFQListItem {
  return {
    ...item,
    status: transformStatus(item.status),
  };
}

export const rfqApi = {
  /**
   * List RFQs with pagination and filters
   */
  async list(accessToken: string, filters: Partial<RFQFilters> = {}): Promise<RFQListResponse> {
    const params: Record<string, string | number> = {
      ...buildPaginationParams(
        filters.page || 1,
        filters.page_size || 10,
        filters.sort_by || 'created_at',
        filters.sort_order || 'desc'
      ),
    };

    if (filters.status && filters.status !== 'all') {
      // Backend expects lowercase status
      params.status = filters.status.toLowerCase();
    }

    if (filters.search) {
      params.search = filters.search;
    }

    const response = await apiRequest<any>('/rfqs', accessToken, { params });
    
    // Backend returns: { rfqs: [], pagination: {} }
    if (response.rfqs && response.pagination) {
      return {
        data: response.rfqs.map(transformListItem),
        total_count: response.pagination.total_items,
        page: response.pagination.page,
        page_size: response.pagination.page_size,
      };
    }
    
    // Fallback: return empty if format is unexpected
    return {
      data: [],
      total_count: 0,
      page: 1,
      page_size: 10,
    };
  },

  /**
   * Get a single RFQ by ID
   */
  async getById(accessToken: string, id: string): Promise<RFQ> {
    const response = await apiRequest<any>(`/rfqs/${id}`, accessToken);
    return transformRFQ(response);
  },

  /**
   * Create a new RFQ
   */
  async create(accessToken: string, payload: CreateRFQPayload): Promise<RFQ> {
    const response = await apiRequest<any>('/rfqs', accessToken, {
      method: 'POST',
      body: payload,
    });
    return transformRFQ(response);
  },

  /**
   * Update an existing RFQ (DRAFT only)
   */
  async update(accessToken: string, id: string, payload: UpdateRFQPayload): Promise<RFQ> {
    const response = await apiRequest<any>(`/rfqs/${id}`, accessToken, {
      method: 'PUT',
      body: payload,
    });
    return transformRFQ(response);
  },

  /**
   * Delete an RFQ (DRAFT only)
   */
  async delete(accessToken: string, id: string): Promise<void> {
    return apiRequest<void>(`/rfqs/${id}`, accessToken, {
      method: 'DELETE',
    });
  },

  /**
   * Send RFQ to suppliers
   */
  async send(accessToken: string, id: string): Promise<RFQ> {
    const response = await apiRequest<any>(`/rfqs/${id}/send`, accessToken, {
      method: 'POST',
    });
    return transformRFQ(response);
  },

  /**
   * Record a supplier quote
   */
  async recordQuote(accessToken: string, id: string, payload: RecordQuotePayload): Promise<RFQ> {
    const response = await apiRequest<any>(`/rfqs/${id}/quotes`, accessToken, {
      method: 'POST',
      body: payload,
    });
    return transformRFQ(response);
  },

  /**
   * Close an RFQ
   */
  async close(accessToken: string, id: string): Promise<RFQ> {
    const response = await apiRequest<any>(`/rfqs/${id}/close`, accessToken, {
      method: 'POST',
    });
    return transformRFQ(response);
  },
};
