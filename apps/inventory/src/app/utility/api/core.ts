/**
 * Core API Utilities
 * Provides standardized fetch functions for API calls with error handling
 */

import { environment } from '../../../environments/environment';
import { useUserStore } from '@horizon-sync/store';

const BASE_URL = environment.apiCoreUrl;

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  responseType?: 'json' | 'blob';
  credentials?: 'include' | 'omit' | 'same-origin';
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
  const url = new URL(`${BASE_URL}/api/v1${endpoint}`);
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
export async function apiRequest<T>(endpoint: string, accessToken: string | undefined, options: ApiRequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, headers = {}, responseType = 'json', credentials } = options;

  const url = buildUrl(endpoint, params);

  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  // Only add Authorization header if accessToken is provided
  if (accessToken) {
    requestHeaders.Authorization = `Bearer ${accessToken}`;
  }

  // Don't set Content-Type for FormData - let the browser set it with boundary
  if (body && method !== 'GET' && !(body instanceof FormData)) {
    requestHeaders['Content-Type'] = 'application/json';
  }

  const fetchOptions: RequestInit = {
    method,
    headers: requestHeaders,
    body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
  };

  // Add credentials if specified
  if (credentials) {
    fetchOptions.credentials = credentials;
  }

  const response = await fetch(url, fetchOptions);

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

  // Handle different response types
  if (responseType === 'blob') {
    return response.blob() as T;
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

/**
 * Helper to get access token from auth context
 */
export function getAccessToken(): string {
  // First try to get token from user store
  const tokenFromStore = useUserStore.getState().accessToken;
  if (tokenFromStore) {
    return tokenFromStore;
  }

  // Fallback to localStorage
  const token = localStorage.getItem('accessToken');
  if (!token) {
    throw new Error('No access token available');
  }
  return token;
}
