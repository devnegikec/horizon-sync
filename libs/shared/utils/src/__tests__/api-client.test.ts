import { ApiClient, setTokenResolver, getToken } from '../api-client';
import { ApiError } from '../api-error';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
  const client = new ApiClient({ baseUrl: 'http://localhost:8001' });

  beforeEach(() => {
    jest.clearAllMocks();
    setTokenResolver(() => 'test-token');
  });

  describe('constructor', () => {
    it('strips trailing slash from baseUrl', () => {
      const c = new ApiClient({ baseUrl: 'http://localhost:8001/' });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
      c.get('/test');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/v1/test',
        expect.anything(),
      );
    });

    it('uses custom pathPrefix when provided', () => {
      const c = new ApiClient({ baseUrl: 'http://localhost:8001', pathPrefix: '/api/v2' });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) });
      c.get('/test');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/v2/test',
        expect.anything(),
      );
    });
  });

  describe('get', () => {
    it('makes a GET request with auth header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200, json: async () => ({ items: [] }),
      });

      const result = await client.get('/products');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/v1/products',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        }),
      );
      expect(result).toEqual({ items: [] });
    });

    it('appends query params and skips undefined values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200, json: async () => ({}),
      });

      await client.get('/items', { page: 1, status: 'active', empty: undefined });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('page=1');
      expect(url).toContain('status=active');
      expect(url).not.toContain('empty');
    });

    it('skips empty string params', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200, json: async () => ({}),
      });

      await client.get('/items', { search: '' });

      const url = mockFetch.mock.calls[0][0];
      expect(url).not.toContain('search');
    });
  });

  describe('post', () => {
    it('sends JSON body with POST method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 201, json: async () => ({ id: '123' }),
      });

      const result = await client.post('/products', { name: 'Widget' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/v1/products',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Widget' }),
        }),
      );
      expect(result).toEqual({ id: '123' });
    });

    it('sends POST without body when body is undefined', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200, json: async () => ({}),
      });

      await client.post('/trigger');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST', body: undefined }),
      );
    });
  });

  describe('put', () => {
    it('sends PUT request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200, json: async () => ({ id: '1', name: 'Updated' }),
      });

      await client.put('/products/1', { name: 'Updated' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/v1/products/1',
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  describe('patch', () => {
    it('sends PATCH request with body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200, json: async () => ({ id: '1' }),
      });

      await client.patch('/products/1', { name: 'Patched' });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/v1/products/1',
        expect.objectContaining({ method: 'PATCH' }),
      );
    });
  });

  describe('delete', () => {
    it('sends DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 204,
      });

      await client.delete('/products/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/v1/products/1',
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('error handling', () => {
    it('throws ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false, status: 404, statusText: 'Not Found',
        text: async () => '{"detail":"Product not found"}',
      });

      await expect(client.get('/products/999')).rejects.toThrow(ApiError);
      await expect(client.get('/products/999').catch(e => e.message))
        .resolves.toBe('Product not found');
    });

    it('throws ApiError with status code preserved', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false, status: 422, statusText: 'Unprocessable Entity',
        text: async () => '{"detail":"Validation failed"}',
      });

      try {
        await client.post('/products', {});
        fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ApiError);
        expect((e as ApiError).status).toBe(422);
        expect((e as ApiError).isValidation).toBe(true);
      }
    });
  });

  describe('204 No Content', () => {
    it('returns undefined for 204 responses', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204 });

      const result = await client.delete('/products/1');
      expect(result).toBeUndefined();
    });
  });

  describe('raw', () => {
    it('returns raw Response for blob downloads', async () => {
      const mockResponse = {
        ok: true, status: 200,
        blob: async () => new Blob(['csv-data']),
      };
      mockFetch.mockResolvedValueOnce(mockResponse);

      const response = await client.raw('/report/export/csv');
      expect(response).toBe(mockResponse);
    });

    it('throws ApiError on non-ok raw response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false, status: 500, statusText: 'Internal Server Error',
        text: async () => 'Server error',
      });

      await expect(client.raw('/report/export/csv')).rejects.toThrow(ApiError);
    });
  });
});

describe('setTokenResolver / getToken', () => {
  it('uses the custom resolver', () => {
    setTokenResolver(() => 'custom-token');
    expect(getToken()).toBe('custom-token');
  });

  it('throws when resolver throws', () => {
    setTokenResolver(() => { throw new Error('No token'); });
    expect(() => getToken()).toThrow('No token');
  });
});
