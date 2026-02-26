/**
 * Core API Utilities
 * Provides standardized fetch functions for API calls with error handling
 */

import { environment } from '../../../environments/environment';

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
