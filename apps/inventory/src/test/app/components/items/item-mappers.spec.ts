import type { ApiItem } from '../../../../app/types/items-api.types';
import { apiItemToItem } from '../../../../app/utility/item-mappers';

describe('item-mappers', () => {
  describe('apiItemToItem', () => {
    it('should map ApiItem to Item correctly', () => {
      const apiItem: ApiItem = {
        id: '1',
        item_code: 'ITEM001',
        item_name: 'Test Item',
        item_type: 'Product',
        uom: 'Unit',
        item_group_id: 'group1',
        item_group_name: 'Group 1',
        standard_rate: '100.50',
        status: 'active',
        maintain_stock: true,
        barcode: '123456',
        image_url: 'http://image.com',
        created_at: '2023-01-01T00:00:00Z',
      };

      const result = apiItemToItem(apiItem);

      expect(result).toEqual({
        id: '1',
        itemCode: 'ITEM001',
        name: 'Test Item',
        description: '',
        unitOfMeasure: 'Unit',
        defaultPrice: 100.50,
        itemGroupId: 'group1',
        itemGroupName: 'Group 1',
        currentStock: 0,
        status: 'active',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '',
      });
    });

    it('should handle null values in ApiItem', () => {
      const apiItem: ApiItem = {
        id: '2',
        item_code: 'ITEM002',
        item_name: 'Test Item 2',
        item_type: 'Service',
        uom: null,
        item_group_id: null,
        item_group_name: null,
        standard_rate: null,
        status: null,
        maintain_stock: null,
        barcode: null,
        image_url: null,
        created_at: null,
      };

      const result = apiItemToItem(apiItem);

      expect(result).toEqual({
        id: '2',
        itemCode: 'ITEM002',
        name: 'Test Item 2',
        description: '',
        unitOfMeasure: '',
        defaultPrice: 0,
        itemGroupId: '',
        itemGroupName: '',
        currentStock: 0,
        status: 'active', // defaults to active in mapper
        createdAt: '',
        updatedAt: '',
      });
    });

    it('should map status correctly when it is inactive', () => {
      const apiItem: ApiItem = {
        id: '3',
        item_code: 'ITEM003',
        item_name: 'Inactive Item',
        item_type: 'Product',
        uom: 'Unit',
        item_group_id: 'group1',
        item_group_name: 'Group 1',
        standard_rate: '50.00',
        status: 'inactive',
        maintain_stock: true,
        barcode: null,
        image_url: null,
        created_at: '2023-01-01T00:00:00Z',
      };

      const result = apiItemToItem(apiItem);
      expect(result.status).toBe('inactive');
    });
  });
});
