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

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (networkErr) {
    // Network error (service down, DNS failure, CORS, etc.)
    const error: ApiError = {
      message: 'Unable to connect to the server. Please check your internet connection or try again later.',
      status: 0,
    };
    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();

    // Parse JSON error details if available
    let details: unknown = undefined;
    let serverMessage = '';
    try {
      const parsed = JSON.parse(errorText);
      details = parsed;
      // Extract message from common backend error formats
      serverMessage = parsed.message || parsed.detail?.message || parsed.detail || '';
    } catch {
      // Not JSON — could be HTML (nginx 502) or plain text
    }

    // Produce user-friendly message based on status code
    let friendlyMessage: string;
    switch (response.status) {
      case 401:
        friendlyMessage = 'Your session has expired. Please log in again.';
        // Dispatch event so the app can redirect to login
        window.dispatchEvent(new CustomEvent('app:session-expired'));
        break;
      case 403:
        friendlyMessage = 'You do not have permission to perform this action.';
        break;
      case 404:
        friendlyMessage = serverMessage || 'The requested resource was not found.';
        break;
      case 409:
        friendlyMessage = serverMessage || 'This action conflicts with the current state.';
        break;
      case 422:
        friendlyMessage = serverMessage || 'The submitted data is invalid. Please check your input.';
        break;
      case 429:
        friendlyMessage = 'Too many requests. Please wait a moment and try again.';
        break;
      case 500:
        friendlyMessage = 'An unexpected server error occurred. Please try again later.';
        break;
      case 502:
      case 503:
      case 504:
        friendlyMessage = 'The service is temporarily unavailable. Please try again in a few moments.';
        break;
      default:
        friendlyMessage = serverMessage || `Something went wrong (Error ${response.status}). Please try again.`;
    }

    const error: ApiError = {
      message: friendlyMessage,
      status: response.status,
      details,
    };
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

/**
 * Convert a raw error (from fetch or any source) into a user-friendly message.
 * Use this in hooks that do direct fetch() calls instead of apiRequest().
 */
export function getFriendlyErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    // Network errors
    if (msg === 'Failed to fetch' || msg.includes('NetworkError') || msg.includes('net::ERR_')) {
      return 'Unable to connect to the server. Please check your connection.';
    }
    // HTML responses (nginx 502, etc.)
    if (msg.startsWith('<') || msg.includes('<!DOCTYPE') || msg.includes('<html')) {
      return 'The service is temporarily unavailable. Please try again in a few moments.';
    }
    // Already friendly (from our apiRequest or custom throw)
    return msg;
  }
  // ApiError object from apiRequest
  if (err && typeof err === 'object' && 'message' in err) {
    return (err as { message: string }).message;
  }
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Get a user-friendly error message for a given HTTP status code.
 */
export function getHttpErrorMessage(status: number): string {
  switch (status) {
    case 401:
      window.dispatchEvent(new CustomEvent('app:session-expired'));
      return 'Your session has expired. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 422:
      return 'The submitted data is invalid. Please check your input.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'An unexpected server error occurred. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'The service is temporarily unavailable. Please try again in a few moments.';
    default:
      return `Something went wrong (Error ${status}). Please try again.`;
  }
}
