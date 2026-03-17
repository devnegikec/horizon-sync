/**
 * Core API Utilities for Platform App
 * Provides standardized auth functions for API calls
 */

import { useUserStore } from '@horizon-sync/store';

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
  const token = localStorage.getItem('access_token');
  if (!token) {
    throw new Error('No access token found');
  }
  return token;
}