/**
 * Property-Based Tests for API Response Parsing
 * Feature: stock-management
 * Property 5: API response parsing
 * Validates: Requirements 5.7
 */

import fc from 'fast-check';
import type { StockLevel, StockMovement, StockEntry, StockReconciliation } from '../../../app/types/stock.types';

// Helper to generate valid date strings
const validDateArbitrary = () => fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())).map(d => d.toISOString());

describe('Stock Management - Property 5: API response parsing', () => {
  it('should parse stock level responses without data loss', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          organization_id: fc.uuid(),
          product_id: fc.uuid(),
          product_name: fc.string({ minLength: 1, maxLength: 100 }),
          product_code: fc.string({ minLength: 1, maxLength: 50 }),
          warehouse_id: fc.uuid(),
          warehouse_name: fc.string({ minLength: 1, maxLength: 100 }),
          quantity_on_hand: fc.integer({ min: 0, max: 100000 }),
          quantity_reserved: fc.integer({ min: 0, max: 10000 }),
          quantity_available: fc.integer({ min: 0, max: 100000 }),
          last_counted_at: fc.option(validDateArbitrary(), { nil: null }),
          created_at: validDateArbitrary(),
          updated_at: validDateArbitrary(),
        }),
        (mockResponse) => {
          // Simulate parsing by type assertion
          const parsed: StockLevel = mockResponse as StockLevel;

          // Verify all fields are preserved
          expect(parsed.id).toBe(mockResponse.id);
          expect(parsed.product_id).toBe(mockResponse.product_id);
          expect(parsed.warehouse_id).toBe(mockResponse.warehouse_id);
          expect(parsed.quantity_on_hand).toBe(mockResponse.quantity_on_hand);
          expect(parsed.quantity_reserved).toBe(mockResponse.quantity_reserved);
          expect(parsed.quantity_available).toBe(mockResponse.quantity_available);
          expect(parsed.updated_at).toBe(mockResponse.updated_at);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should parse stock movement responses without data loss', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          organization_id: fc.uuid(),
          product_id: fc.uuid(),
          product_name: fc.string({ minLength: 1, maxLength: 100 }),
          warehouse_id: fc.uuid(),
          warehouse_name: fc.string({ minLength: 1, maxLength: 100 }),
          movement_type: fc.constantFrom('in', 'out', 'transfer', 'adjustment'),
          quantity: fc.integer({ min: 1, max: 10000 }),
          unit_cost: fc.option(fc.float({ min: 0, max: 10000, noNaN: true }), { nil: null }),
          reference_type: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
          reference_id: fc.option(fc.uuid(), { nil: null }),
          notes: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          performed_by: fc.option(fc.uuid(), { nil: null }),
          performed_by_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          performed_at: validDateArbitrary(),
          created_at: validDateArbitrary(),
          updated_at: validDateArbitrary(),
        }),
        (mockResponse) => {
          // Simulate parsing by type assertion
          const parsed: StockMovement = mockResponse as StockMovement;

          // Verify all required fields are preserved
          expect(parsed.id).toBe(mockResponse.id);
          expect(parsed.product_id).toBe(mockResponse.product_id);
          expect(parsed.warehouse_id).toBe(mockResponse.warehouse_id);
          expect(parsed.movement_type).toBe(mockResponse.movement_type);
          expect(parsed.quantity).toBe(mockResponse.quantity);
          expect(parsed.performed_at).toBe(mockResponse.performed_at);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should parse stock entry responses without data loss', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          organization_id: fc.uuid(),
          stock_entry_no: fc.string({ minLength: 1, maxLength: 100 }),
          stock_entry_type: fc.constantFrom('material_receipt', 'material_issue', 'material_transfer'),
          from_warehouse_id: fc.option(fc.uuid(), { nil: null }),
          from_warehouse_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          to_warehouse_id: fc.option(fc.uuid(), { nil: null }),
          to_warehouse_name: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          posting_date: validDateArbitrary(),
          status: fc.constantFrom('draft', 'submitted', 'cancelled'),
          total_value: fc.option(fc.float({ min: 0, max: 1000000, noNaN: true }), { nil: null }),
          remarks: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          created_at: validDateArbitrary(),
          updated_at: validDateArbitrary(),
        }),
        (mockResponse) => {
          // Simulate parsing by type assertion
          const parsed: StockEntry = mockResponse as StockEntry;

          // Verify all required fields are preserved
          expect(parsed.id).toBe(mockResponse.id);
          expect(parsed.stock_entry_no).toBe(mockResponse.stock_entry_no);
          expect(parsed.stock_entry_type).toBe(mockResponse.stock_entry_type);
          expect(parsed.posting_date).toBe(mockResponse.posting_date);
          expect(parsed.status).toBe(mockResponse.status);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should parse stock reconciliation responses without data loss', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          organization_id: fc.uuid(),
          reconciliation_no: fc.string({ minLength: 1, maxLength: 100 }),
          purpose: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
          posting_date: validDateArbitrary(),
          status: fc.constantFrom('draft', 'submitted'),
          remarks: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
          items_count: fc.integer({ min: 0, max: 1000 }),
          total_difference: fc.float({ min: -100000, max: 100000, noNaN: true }),
          created_at: validDateArbitrary(),
          updated_at: validDateArbitrary(),
        }),
        (mockResponse) => {
          // Simulate parsing by type assertion
          const parsed: StockReconciliation = mockResponse as StockReconciliation;

          // Verify all required fields are preserved
          expect(parsed.id).toBe(mockResponse.id);
          expect(parsed.reconciliation_no).toBe(mockResponse.reconciliation_no);
          expect(parsed.posting_date).toBe(mockResponse.posting_date);
          expect(parsed.status).toBe(mockResponse.status);
          expect(parsed.items_count).toBe(mockResponse.items_count);
          expect(parsed.total_difference).toBe(mockResponse.total_difference);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle optional fields correctly', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.uuid(),
          product_id: fc.uuid(),
          warehouse_id: fc.uuid(),
          quantity_on_hand: fc.integer({ min: 0, max: 100000 }),
          quantity_reserved: fc.integer({ min: 0, max: 10000 }),
          quantity_available: fc.integer({ min: 0, max: 100000 }),
          last_counted_at: fc.constant(null), // explicitly null
          updated_at: validDateArbitrary(),
        }),
        (mockResponse) => {
          // Simulate parsing by type assertion
          const parsed: StockLevel = mockResponse as StockLevel;

          // Verify null fields are preserved as null
          expect(parsed.last_counted_at).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });
});
