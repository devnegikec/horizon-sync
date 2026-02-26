/**
 * SearchService Unit Tests
 * Tests for search API client service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SearchService } from '../../../../../app/features/search/../../../../app/features/search/services/search.service';
import type { SearchRequest, SearchResponse } from '../../../../../app/features/search/types/search.types';

// Mock environment
vi.mock('../../../../environments/environment', () => ({
  environment: {
    production: false,
    apiBaseUrl: 'http://localhost:8000/api/v1',
  },
}));

describe('SearchService', () => {
  const mockToken = 'mock-jwt-token';
  const mockSearchRequest: SearchRequest = {
    query: 'test query',
    page: 1,
    page_size: 20,
  };

  const mockSearchResponse: SearchResponse = {
    results: [
      {
        entity_id: '1',
        entity_type: 'items',
        title: 'Test Item',
        snippet: 'This is a test item',
        relevance_score: 0.95,
        metadata: {},
      },
    ],
    total_count: 1,
    page: 1,
    page_size: 20,
    total_pages: 1,
    has_next_page: false,
    has_previous_page: false,
    query_time_ms: 50,
  };

  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(() => mockToken),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    // Mock console methods to reduce noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('globalSearch', () => {
    it('should successfully perform global search', async () => {
      // Mock successful fetch
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockSearchResponse),
        } as Response)
      );

      const result = await SearchService.globalSearch(mockSearchRequest);

      expect(result).toEqual(mockSearchResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/search/global',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          }),
          body: JSON.stringify(mockSearchRequest),
        })
      );
    });

    it('should include Authorization header in request', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockSearchResponse),
        } as Response)
      );

      await SearchService.globalSearch(mockSearchRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should handle 401 authentication error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ detail: 'Unauthorized' }),
        } as Response)
      );

      await expect(SearchService.globalSearch(mockSearchRequest)).rejects.toThrow(
        'Session expired. Please log in again.'
      );
    });

    it('should handle 500 server error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ detail: 'Internal server error' }),
        } as Response)
      );

      await expect(SearchService.globalSearch(mockSearchRequest)).rejects.toThrow(
        'Search service unavailable. Please try again later.'
      );
    });

    it('should handle network error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 503,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await expect(SearchService.globalSearch(mockSearchRequest)).rejects.toThrow(
        'Unable to connect. Please check your connection and try again.'
      );
    });

    it('should throw error when no auth token is available', async () => {
      // Mock localStorage to return null
      global.localStorage.getItem = vi.fn(() => null);

      await expect(SearchService.globalSearch(mockSearchRequest)).rejects.toThrow(
        'Authentication required'
      );
    });
  });

  describe('localSearch', () => {
    const entityType = 'items';

    it('should successfully perform local search', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockSearchResponse),
        } as Response)
      );

      const result = await SearchService.localSearch(entityType, mockSearchRequest);

      expect(result).toEqual(mockSearchResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        `http://localhost:8000/api/v1/search/${entityType}`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          }),
          body: JSON.stringify(mockSearchRequest),
        })
      );
    });

    it('should include Authorization header in request', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockSearchResponse),
        } as Response)
      );

      await SearchService.localSearch(entityType, mockSearchRequest);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it('should handle 400 error with invalid entity type', async () => {
      const invalidEntityType = 'invalid_type';
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ detail: 'Invalid entity type' }),
        } as Response)
      );

      await expect(
        SearchService.localSearch(invalidEntityType, mockSearchRequest)
      ).rejects.toThrow(`Invalid entity type: ${invalidEntityType}`);
    });

    it('should handle 401 authentication error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ detail: 'Unauthorized' }),
        } as Response)
      );

      await expect(
        SearchService.localSearch(entityType, mockSearchRequest)
      ).rejects.toThrow('Session expired. Please log in again.');
    });

    it('should handle 500 server error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ detail: 'Internal server error' }),
        } as Response)
      );

      await expect(
        SearchService.localSearch(entityType, mockSearchRequest)
      ).rejects.toThrow('Search service unavailable. Please try again later.');
    });

    it('should handle network error', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 503,
          json: () => Promise.resolve({}),
        } as Response)
      );

      await expect(
        SearchService.localSearch(entityType, mockSearchRequest)
      ).rejects.toThrow('Unable to connect. Please check your connection and try again.');
    });
  });
});
