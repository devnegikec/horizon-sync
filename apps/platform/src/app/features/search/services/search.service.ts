/**
 * Search Service
 * Handles API communication with the search-service backend
 */

import { environment } from '../../../../environments/environment';
import type { SearchRequest, SearchResponse } from '../types/search.types';

// Use search-specific API base URL (port 8002) instead of general API base URL (port 8000)
const API_BASE_URL = environment.searchApiBaseUrl || environment.apiBaseUrl;

// Log the API base URL on module load for debugging
console.log('[SearchService] Initialized with API_BASE_URL:', API_BASE_URL);
console.log('[SearchService] Environment:', environment);

/**
 * Get authentication token from the auth store
 * This function should be called with the token from useAuth hook
 */
function validateAuthToken(token: string | null | undefined): string {
  if (!token) {
    throw new Error('Authentication required');
  }
  return token;
}

/**
 * Search Service class
 * Provides methods for global and local search operations
 */
export class SearchService {
  /**
   * Perform global search across all entity types
   * @param request - Search request parameters
   * @param token - Authentication token from useAuth hook
   * @returns Search response with results
   */
  static async globalSearch(request: SearchRequest, token?: string): Promise<SearchResponse> {
    // Try to get token from parameter, or fall back to localStorage for backward compatibility
    const authToken = token || localStorage.getItem('access_token');
    const validToken = validateAuthToken(authToken);
    const url = `${API_BASE_URL}/search/global`;

    console.log('[SearchService] Global search request:', { url, request });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify(request),
      });

      console.log('[SearchService] Response status:', response.status);

      if (!response.ok) {
        await this.handleError(response);
      }

      const data = await response.json();
      console.log('[SearchService] Global search response:', data);
      return data;
    } catch (error) {
      console.error('[SearchService] Global search error:', error);
      throw error;
    }
  }

  /**
   * Perform local search within a specific entity type
   * @param entityType - Entity type to search within
   * @param request - Search request parameters
   * @param token - Authentication token from useAuth hook
   * @returns Search response with results
   */
  static async localSearch(
    entityType: string,
    request: SearchRequest,
    token?: string
  ): Promise<SearchResponse> {
    // Try to get token from parameter, or fall back to localStorage for backward compatibility
    const authToken = token || localStorage.getItem('access_token');
    const validToken = validateAuthToken(authToken);
    const url = `${API_BASE_URL}/search/${entityType}`;

    console.log('[SearchService] Local search request:', {
      url,
      entityType,
      request,
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${validToken}`,
        },
        body: JSON.stringify(request),
      });

      console.log('[SearchService] Response status:', response.status);

      if (!response.ok) {
        await this.handleError(response, entityType);
      }

      const data = await response.json();
      console.log('[SearchService] Local search response:', data);
      return data;
    } catch (error) {
      console.error('[SearchService] Local search error:', error);
      throw error;
    }
  }

  /**
   * Handle API errors and throw appropriate error messages
   * @param response - Fetch response object
   * @param entityType - Optional entity type for context
   */
  private static async handleError(
    response: Response,
    entityType?: string
  ): Promise<never> {
    let message: string;

    // Handle specific status codes with user-friendly messages
    switch (response.status) {
      case 401:
        message = 'Session expired. Please log in again.';
        console.error('[SearchService] Authentication error');
        break;

      case 400:
        if (entityType) {
          message = `Invalid entity type: ${entityType}`;
        } else {
          message = 'Invalid request. Please check your search parameters.';
        }
        console.error('[SearchService] Bad request:', message);
        break;

      case 500:
        message = 'Search service unavailable. Please try again later.';
        console.error('[SearchService] Server error');
        break;

      default:
        message = 'Unable to connect. Please check your connection and try again.';
        console.error('[SearchService] Network error:', response.status);
    }

    // Try to get additional error details from response body
    try {
      const errorData = await response.json();
      if (errorData?.detail) {
        console.error('[SearchService] Error details:', errorData.detail);
        // Optionally append backend error details
        if (typeof errorData.detail === 'string') {
          message = `${message} (${errorData.detail})`;
        }
      }
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(message);
  }
}
