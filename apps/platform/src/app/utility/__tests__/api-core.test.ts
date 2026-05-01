/**
 * Tests for the platform api-core utility.
 */

// Mock the Zustand store
jest.mock('@horizon-sync/store', () => ({
  useUserStore: {
    getState: jest.fn(() => ({ accessToken: null })),
  },
}));

// Track setTokenResolver calls
const mockSetTokenResolver = jest.fn();
jest.mock('@horizon-sync/utils', () => ({
  ApiClient: jest.fn().mockImplementation(() => ({})),
  setTokenResolver: (...args: unknown[]) => mockSetTokenResolver(...args),
}));

import { useUserStore } from '@horizon-sync/store';

describe('api-core', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('getAccessToken', () => {
    it('returns token from Zustand store when available', () => {
      (useUserStore.getState as jest.Mock).mockReturnValue({ accessToken: 'store-token' });

      const { getAccessToken } = require('../api-core');
      expect(getAccessToken()).toBe('store-token');
    });

    it('falls back to localStorage when store has no token', () => {
      (useUserStore.getState as jest.Mock).mockReturnValue({ accessToken: null });
      localStorage.setItem('access_token', 'local-token');

      const { getAccessToken } = require('../api-core');
      expect(getAccessToken()).toBe('local-token');
    });

    it('throws when no token is available anywhere', () => {
      (useUserStore.getState as jest.Mock).mockReturnValue({ accessToken: null });

      const { getAccessToken } = require('../api-core');
      expect(() => getAccessToken()).toThrow('No access token found');
    });

    it('prefers store token over localStorage', () => {
      (useUserStore.getState as jest.Mock).mockReturnValue({ accessToken: 'store-token' });
      localStorage.setItem('access_token', 'local-token');

      const { getAccessToken } = require('../api-core');
      expect(getAccessToken()).toBe('store-token');
    });
  });

  describe('module exports', () => {
    it('exports coreApiClient and identityApiClient', () => {
      const apiCore = require('../api-core');
      expect(apiCore.coreApiClient).toBeDefined();
      expect(apiCore.identityApiClient).toBeDefined();
    });

    it('exports getAccessToken function', () => {
      const apiCore = require('../api-core');
      expect(typeof apiCore.getAccessToken).toBe('function');
    });
  });
});
