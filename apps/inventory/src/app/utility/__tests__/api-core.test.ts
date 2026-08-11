import { apiRequest, buildUrl, buildPaginationParams } from '../api/core';

global.fetch = jest.fn();

describe('buildUrl', () => {
  it('builds URL with endpoint', () => {
    const url = buildUrl('/products');
    expect(url).toContain('/api/v1/products');
  });

  it('appends query params', () => {
    const url = buildUrl('/products', { page: 1, status: 'active' });
    expect(url).toContain('page=1');
    expect(url).toContain('status=active');
  });

  it('skips undefined params', () => {
    const url = buildUrl('/products', { page: 1, search: undefined });
    expect(url).toContain('page=1');
    expect(url).not.toContain('search');
  });

  it('skips null params', () => {
    const url = buildUrl('/products', { page: 1, filter: null as unknown as undefined });
    expect(url).toContain('page=1');
    expect(url).not.toContain('filter');
  });

  it('skips empty string params', () => {
    const url = buildUrl('/products', { page: 1, search: '' });
    expect(url).toContain('page=1');
    expect(url).not.toContain('search');
  });
});

describe('buildPaginationParams', () => {
  it('returns default sort params', () => {
    const params = buildPaginationParams(1, 20);
    expect(params).toEqual({
      page: 1,
      page_size: 20,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  });

  it('accepts custom sort params', () => {
    const params = buildPaginationParams(2, 50, 'name', 'asc');
    expect(params).toEqual({
      page: 2,
      page_size: 50,
      sort_by: 'name',
      sort_order: 'asc',
    });
  });
});

describe('apiRequest', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('makes a GET request by default', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ items: [] }),
    });

    const result = await apiRequest('/products', 'token-123');

    expect(result).toEqual({ items: [] });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/products'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      }),
    );
  });

  it('makes a POST request with JSON body', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: '1' }),
    });

    await apiRequest('/products', 'token-123', {
      method: 'POST',
      body: { name: 'Widget' },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Widget' }),
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    );
  });

  it('does not set Authorization header when token is undefined', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await apiRequest('/public-endpoint', undefined);

    const headers = (global.fetch as jest.Mock).mock.calls[0][1].headers;
    expect(headers.Authorization).toBeUndefined();
  });

  it('throws ApiError on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: async () => '{"detail":"Not found"}',
    });

    try {
      await apiRequest('/products/999', 'token-123');
      fail('Should have thrown');
    } catch (e: unknown) {
      const error = e as { status: number; message: string };
      expect(error.status).toBe(404);
      expect(error.message).toContain('Not found');
    }
  });

  it('returns empty object for 204 No Content', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    const result = await apiRequest('/products/1', 'token-123', { method: 'DELETE' });
    expect(result).toEqual({});
  });

  it('handles blob response type', async () => {
    const mockBlob = new Blob(['data']);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      blob: async () => mockBlob,
    });

    const result = await apiRequest('/export', 'token-123', { responseType: 'blob' });
    expect(result).toBe(mockBlob);
  });

  it('appends query params to URL', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({}),
    });

    await apiRequest('/products', 'token-123', {
      params: { page: 1, status: 'active' },
    });

    const url = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(url).toContain('page=1');
    expect(url).toContain('status=active');
  });
});
