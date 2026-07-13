/**
 * Core API Utilities for Platform App
 *
 * - Provides the canonical `getAccessToken()` function.
 * - Wires the Zustand store into the shared ApiClient token resolver.
 * - Exports pre-built `coreApiClient` and `identityApiClient` instances
 *   so service classes don't need to configure base URLs themselves.
 */

import { useUserStore } from '@horizon-sync/store';
import { ApiClient, setTokenResolver } from '@horizon-sync/utils';
import { environment } from '../../environments/environment';

// ---------------------------------------------------------------------------
// Token helper — single source of truth
// ---------------------------------------------------------------------------

/**
 * Get the current access token.
 * Checks the Zustand store first, then falls back to localStorage.
 */
export function getAccessToken(): string {
  // Zustand store (in-memory, preferred)
  const tokenFromStore = useUserStore.getState().accessToken;
  if (tokenFromStore) {
    return tokenFromStore;
  }

  // localStorage fallback (covers page-reload edge cases)
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }
  return token;
}

// Wire the shared ApiClient to use our token resolver
setTokenResolver(getAccessToken);

// ---------------------------------------------------------------------------
// Pre-built API client instances
// ---------------------------------------------------------------------------

/** Core Service — inventory, banking, sourcing, etc. (port 8001) */
export const coreApiClient = new ApiClient({
  baseUrl: environment.apiCoreUrl || environment.apiBaseUrl || 'http://localhost:8001',
});

/** Identity Service — auth, users, orgs (port 8000) */
export const identityApiClient = new ApiClient({
  baseUrl: environment.apiBaseUrl || 'http://localhost:8000',
});
