/**
 * Search Service
 * Handles API communication with the search-service backend
 */

import { ApiClient } from '@horizon-sync/utils';
import { environment } from '../../../../environments/environment';
import type { SearchRequest, SearchResponse } from '../types/search.types';

// Search service runs on a separate port (8002)
const searchApiClient = new ApiClient({
  baseUrl: environment.searchApiBaseUrl || environment.apiBaseUrl || 'http://localhost:8002',
});

/**
 * Search Service class
 * Provides methods for global and local search operations
 */
export class SearchService {
  /**
   * Perform global search across all entity types
   * @param request - Search request parameters
   * @param token - Authentication token (optional, falls back to store/localStorage)
   * @returns Search response with results
   */
  static async globalSearch(request: SearchRequest, token?: string): Promise<SearchResponse> {
    // If a token is explicitly passed, use it; otherwise rely on the shared resolver
    if (token) {
      return SearchService.postWithToken<SearchResponse>('/search/global', request, token);
    }
    return searchApiClient.post<SearchResponse>('/search/global', request);
  }

  /**
   * Perform local search within a specific entity type
   * @param entityType - Entity type to search within
   * @param request - Search request parameters
   * @param token - Authentication token (optional, falls back to store/localStorage)
   * @returns Search response with results
   */
  static async localSearch(
    entityType: string,
    request: SearchRequest,
    token?: string
  ): Promise<SearchResponse> {
    if (token) {
      return SearchService.postWithToken<SearchResponse>(`/search/${entityType}`, request, token);
    }
    return searchApiClient.post<SearchResponse>(`/search/${entityType}`, request);
  }

  /**
   * POST with an explicitly provided token (overrides the shared resolver).
   * Used when callers pass a token directly instead of relying on the store.
   */
  private static async postWithToken<T>(endpoint: string, body: unknown, token: string): Promise<T> {
    const baseUrl = (environment.searchApiBaseUrl || environment.apiBaseUrl || 'http://localhost:8002').replace(/\/+$/, '');
    const url = `${baseUrl}/api/v1${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      await SearchService.handleError(response, endpoint);
    }

    return response.json();
  }

  /**
   * Handle API errors and throw appropriate error messages
   */
  private static async handleError(
    response: Response,
    context?: string
  ): Promise<never> {
    let message: string;

    switch (response.status) {
      case 401:
        message = 'Session expired. Please log in again.';
        break;
      case 400:
        message = context?.startsWith('/search/')
          ? `Invalid entity type: ${context.replace('/search/', '')}`
          : 'Invalid request. Please check your search parameters.';
        break;
      case 500:
        message = 'Search service unavailable. Please try again later.';
        break;
      default:
        message = 'Unable to connect. Please check your connection and try again.';
    }

    // Try to get additional error details from response body
    try {
      const errorData = await response.json();
      if (typeof errorData?.detail === 'string') {
        message = `${message} (${errorData.detail})`;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(message);
  }
}
