/**
 * Shared API Client
 *
 * Eliminates the duplicated `request<T>()` / `getAuthToken()` boilerplate
 * that was copy-pasted across every service class.
 *
 * Usage — extend or compose:
 *
 *   class ProductService extends ApiClient {
 *     list(params?: Record<string, string>) {
 *       return this.get<ProductListResponse>('/products', params);
 *     }
 *   }
 *
 * Or compose with the pre-built `coreApiClient` instance:
 *
 *   export const productService = {
 *     list: (params) => coreApiClient.get<ProductListResponse>('/products', params),
 *   };
 */

import { ApiError } from './api-error';

// ---------------------------------------------------------------------------
// Token resolver — pluggable so the platform app can wire in its Zustand store
// ---------------------------------------------------------------------------

export type TokenResolver = () => string;

let _resolveToken: TokenResolver = () => {
  // Default: try common localStorage keys (covers legacy code paths)
  const token =
    localStorage.getItem('access_token') ||
    localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No access token found');
  }
  return token;
};

/**
 * Call once at app startup to wire in the real token source
 * (e.g. Zustand store → localStorage fallback).
 */
export function setTokenResolver(resolver: TokenResolver): void {
  _resolveToken = resolver;
}

export function getToken(): string {
  return _resolveToken();
}

// ---------------------------------------------------------------------------
// ApiClient
// ---------------------------------------------------------------------------

export interface ApiClientOptions {
  /** Full base URL including protocol, e.g. `http://localhost:8001` */
  baseUrl: string;
  /** Path prefix prepended to every request, e.g. `/api/v1` */
  pathPrefix?: string;
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly pathPrefix: string;

  constructor(options: ApiClientOptions) {
    // Strip trailing slash from baseUrl
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.pathPrefix = options.pathPrefix ?? '/api/v1';
  }

  // -- Public convenience methods -------------------------------------------

  async get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    const query = ApiClient.buildQuery(params);
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request<T>(url);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T = void>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  /**
   * Raw fetch that returns a `Response` — useful for blob downloads
   * (CSV, PDF) where you don't want automatic JSON parsing.
   */
  async raw(endpoint: string, options?: RequestInit): Promise<Response> {
    const url = `${this.baseUrl}${this.pathPrefix}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new ApiError(response.status, response.statusText, body);
    }

    return response;
  }

  // -- Internal -------------------------------------------------------------

  protected async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${this.pathPrefix}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new ApiError(response.status, response.statusText, body);
    }

    // 204 No Content — nothing to parse
    if (response.status === 204) {
      return undefined as unknown as T;
    }

    return response.json();
  }

  // -- Helpers --------------------------------------------------------------

  private static buildQuery(
    params?: Record<string, string | number | boolean | undefined>,
  ): string {
    if (!params) return '';
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        sp.append(key, String(value));
      }
    }
    return sp.toString();
  }
}
