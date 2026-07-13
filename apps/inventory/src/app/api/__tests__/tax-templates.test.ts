import type { TaxTemplateCreate, TaxTemplateUpdate } from '../../types/tax-template.types';
import { taxTemplateApi } from '../tax-templates';

global.fetch = jest.fn();

const mockToken = 'test-token';

const mockTemplate = {
  id: 'tax-1',
  name: 'GST 18%',
  tax_category: 'Output',
  rate: 18,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('taxTemplateApi', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('list', () => {
    it('should fetch tax templates with pagination', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          templates: [mockTemplate],
          pagination: { page: 1, page_size: 20, total_items: 1, total_pages: 1 },
        }),
      });

      const result = await taxTemplateApi.list(mockToken);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(mockTemplate);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should pass tax_category filter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          templates: [],
          pagination: { page: 1, page_size: 20, total_items: 0, total_pages: 0 },
        }),
      });

      await taxTemplateApi.list(mockToken, 1, 20, { tax_category: 'Input' });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('tax_category=Input');
    });

    it('should pass is_active filter', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          templates: [],
          pagination: { page: 1, page_size: 20, total_items: 0, total_pages: 0 },
        }),
      });

      await taxTemplateApi.list(mockToken, 1, 20, { is_active: true });

      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('is_active=true');
    });

    it('should handle empty templates array', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          templates: undefined,
          pagination: { page: 1, page_size: 20, total_items: 0, total_pages: 0 },
        }),
      });

      const result = await taxTemplateApi.list(mockToken);
      expect(result.data).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should fetch a single tax template', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockTemplate,
      });

      const result = await taxTemplateApi.getById(mockToken, 'tax-1');

      expect(result).toEqual(mockTemplate);
      const url = (global.fetch as jest.Mock).mock.calls[0][0];
      expect(url).toContain('/tax-templates/tax-1');
    });
  });

  describe('create', () => {
    it('should create a tax template', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockTemplate,
      });

      const result = await taxTemplateApi.create(mockToken, {
        name: 'GST 18%',
        tax_category: 'Output',
        rate: 18,
      } as TaxTemplateCreate);

      expect(result).toEqual(mockTemplate);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tax-templates'),
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  describe('update', () => {
    it('should update a tax template', async () => {
      const updated = { ...mockTemplate, name: 'GST 28%', rate: 28 };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => updated,
      });

      const result = await taxTemplateApi.update(mockToken, 'tax-1', { name: 'GST 28%', rate: 28 } as TaxTemplateUpdate);

      expect(result.name).toBe('GST 28%');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tax-templates/tax-1'),
        expect.objectContaining({ method: 'PUT' }),
      );
    });
  });

  describe('delete', () => {
    it('should delete a tax template', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await taxTemplateApi.delete(mockToken, 'tax-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/tax-templates/tax-1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });
});
