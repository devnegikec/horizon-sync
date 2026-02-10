/**
 * Property-Based Tests for API Utility Functions
 * Feature: stock-management
 * Property 4: API endpoint correctness
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4
 */

import fc from 'fast-check';
import { buildUrl, buildPaginationParams } from '../../../app/utility/api';

describe('Stock Management - Property 4: API endpoint correctness', () => {
  it('should build correct URLs with pagination parameters for any valid page and page size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // page
        fc.integer({ min: 1, max: 100 }), // pageSize
        fc.constantFrom('stock-levels', 'stock-movements', 'stock-entries', 'stock-reconciliations'), // endpoint
        (page, pageSize, endpoint) => {
          const params = buildPaginationParams(page, pageSize);
          const url = buildUrl(`/${endpoint}`, params);

          // Verify URL contains the endpoint
          expect(url).toContain(`/${endpoint}`);

          // Verify URL contains pagination parameters
          expect(url).toContain(`page=${page}`);
          expect(url).toContain(`page_size=${pageSize}`);
          expect(url).toContain('sort_by=created_at');
          expect(url).toContain('sort_order=desc');

          // Verify URL is properly formatted
          const urlObj = new URL(url);
          expect(urlObj.searchParams.get('page')).toBe(String(page));
          expect(urlObj.searchParams.get('page_size')).toBe(String(pageSize));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should build correct URLs with filter parameters for stock levels', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // item_id
        fc.uuid(), // warehouse_id
        (itemId, warehouseId) => {
          const params = {
            item_id: itemId,
            warehouse_id: warehouseId,
            page: 1,
            page_size: 20,
          };
          const url = buildUrl('/stock-levels', params);

          // Verify URL contains filter parameters
          expect(url).toContain(`item_id=${itemId}`);
          expect(url).toContain(`warehouse_id=${warehouseId}`);

          // Verify URL is properly formatted
          const urlObj = new URL(url);
          expect(urlObj.searchParams.get('item_id')).toBe(itemId);
          expect(urlObj.searchParams.get('warehouse_id')).toBe(warehouseId);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should build correct URLs with filter parameters for stock movements', () => {
    fc.assert(
      fc.property(
        fc.uuid(), // item_id
        fc.uuid(), // warehouse_id
        fc.constantFrom('in', 'out', 'transfer', 'adjustment'), // movement_type
        (itemId, warehouseId, movementType) => {
          const params = {
            item_id: itemId,
            warehouse_id: warehouseId,
            movement_type: movementType,
            page: 1,
            page_size: 20,
          };
          const url = buildUrl('/stock-movements', params);

          // Verify URL contains filter parameters
          expect(url).toContain(`item_id=${itemId}`);
          expect(url).toContain(`warehouse_id=${warehouseId}`);
          expect(url).toContain(`movement_type=${movementType}`);

          // Verify URL is properly formatted
          const urlObj = new URL(url);
          expect(urlObj.searchParams.get('movement_type')).toBe(movementType);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should build correct URLs with filter parameters for stock entries', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('material_receipt', 'material_issue', 'material_transfer'), // stock_entry_type
        fc.constantFrom('draft', 'submitted', 'cancelled'), // status
        fc.uuid(), // from_warehouse_id
        fc.uuid(), // to_warehouse_id
        (entryType, status, fromWarehouseId, toWarehouseId) => {
          const params = {
            stock_entry_type: entryType,
            status,
            from_warehouse_id: fromWarehouseId,
            to_warehouse_id: toWarehouseId,
            page: 1,
            page_size: 20,
          };
          const url = buildUrl('/stock-entries', params);

          // Verify URL contains filter parameters
          expect(url).toContain(`stock_entry_type=${entryType}`);
          expect(url).toContain(`status=${status}`);
          expect(url).toContain(`from_warehouse_id=${fromWarehouseId}`);
          expect(url).toContain(`to_warehouse_id=${toWarehouseId}`);

          // Verify URL is properly formatted
          const urlObj = new URL(url);
          expect(urlObj.searchParams.get('stock_entry_type')).toBe(entryType);
          expect(urlObj.searchParams.get('status')).toBe(status);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should build correct URLs with filter parameters for stock reconciliations', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('draft', 'submitted'), // status
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), // search (non-whitespace)
        (status, search) => {
          const params = {
            status,
            search,
            page: 1,
            page_size: 20,
          };
          const url = buildUrl('/stock-reconciliations', params);

          // Verify URL contains filter parameters
          expect(url).toContain(`status=${status}`);
          // URL encoding may vary, so check the parsed value instead
          const urlObj = new URL(url);
          expect(urlObj.searchParams.get('search')).toBe(search);
          expect(urlObj.searchParams.get('status')).toBe(status);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should omit undefined, null, and empty string parameters from URL', () => {
    fc.assert(
      fc.property(
        fc.record({
          defined: fc.string({ minLength: 1 }).filter(s => s.trim().length > 0), // non-whitespace string
          undefined: fc.constant(undefined),
          null: fc.constant(null),
          empty: fc.constant(''),
        }),
        (params) => {
          const url = buildUrl('/stock-levels', params);

          // Verify URL is properly formatted
          const urlObj = new URL(url);
          
          // Verify only defined parameter is in URL
          expect(urlObj.searchParams.get('defined')).toBe(params.defined);
          expect(urlObj.searchParams.has('undefined')).toBe(false);
          expect(urlObj.searchParams.has('null')).toBe(false);
          expect(urlObj.searchParams.has('empty')).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle sort parameters correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 50 }),
        fc.constantFrom('created_at', 'updated_at', 'posting_date', 'performed_at'),
        fc.constantFrom('asc', 'desc'),
        (page, pageSize, sortBy, sortOrder) => {
          const params = buildPaginationParams(page, pageSize, sortBy, sortOrder as 'asc' | 'desc');
          const url = buildUrl('/stock-levels', params);

          // Verify sort parameters are in URL
          expect(url).toContain(`sort_by=${sortBy}`);
          expect(url).toContain(`sort_order=${sortOrder}`);

          // Verify URL is properly formatted
          const urlObj = new URL(url);
          expect(urlObj.searchParams.get('sort_by')).toBe(sortBy);
          expect(urlObj.searchParams.get('sort_order')).toBe(sortOrder);
        },
      ),
      { numRuns: 100 },
    );
  });
});
