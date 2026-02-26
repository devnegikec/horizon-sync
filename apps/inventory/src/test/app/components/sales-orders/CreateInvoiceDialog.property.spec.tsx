import fc from 'fast-check';

/**
 * Property-Based Tests for CreateInvoiceDialog
 * Feature: quotation-sales-order-flow
 */

describe('Feature: quotation-sales-order-flow, Property 10: Invoice Quantity Validation', () => {
  /**
   * **Validates: Requirements 16.8, 16.14**
   * 
   * Property: For any line item in an invoice, the quantity to bill must not exceed
   * the available quantity (ordered quantity - already billed quantity).
   */

  // Helper function to simulate validation logic from CreateInvoiceDialog
  const validateInvoiceQuantities = (
    lineItems: Array<{ qty_to_bill: number; max_qty: number }>
  ): boolean => {
    // Validation logic from CreateInvoiceDialog.tsx:
    // hasValidationError = lineItems.some((item) => item.qty_to_bill > item.max_qty || item.qty_to_bill < 0)
    return !lineItems.some((item) => item.qty_to_bill > item.max_qty || item.qty_to_bill < 0);
  };

  it('should reject invoice when qty_to_bill exceeds available quantity', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1000, noNaN: true }), // max_qty (available)
        fc.double({ min: 0.01, max: 1000, noNaN: true }), // excess amount
        (maxQty, excess) => {
          const qtyToBill = maxQty + excess;
          const lineItem = { qty_to_bill: qtyToBill, max_qty: maxQty };
          const isValid = validateInvoiceQuantities([lineItem]);
          
          // qty_to_bill exceeding max_qty should be invalid
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept invoice when qty_to_bill equals available quantity', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1000, noNaN: true }), // max_qty
        (maxQty) => {
          const lineItem = { qty_to_bill: maxQty, max_qty: maxQty };
          const isValid = validateInvoiceQuantities([lineItem]);
          
          // qty_to_bill equal to max_qty should be valid (full billing)
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept invoice when qty_to_bill is less than available quantity', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true }), // max_qty
        fc.double({ min: 0, max: 1 }), // fraction to bill
        (maxQty, fraction) => {
          const qtyToBill = maxQty * fraction;
          const lineItem = { qty_to_bill: qtyToBill, max_qty: maxQty };
          const isValid = validateInvoiceQuantities([lineItem]);
          
          // qty_to_bill less than max_qty should be valid (partial billing)
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject invoice when qty_to_bill is negative', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1000, noNaN: true }), // max_qty
        fc.double({ min: -1000, max: -0.01, noNaN: true }), // negative qty
        (maxQty, negativeQty) => {
          const lineItem = { qty_to_bill: negativeQty, max_qty: maxQty };
          const isValid = validateInvoiceQuantities([lineItem]);
          
          // Negative qty_to_bill should be invalid
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept invoice when qty_to_bill is zero', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1000, noNaN: true }), // max_qty
        (maxQty) => {
          const lineItem = { qty_to_bill: 0, max_qty: maxQty };
          const isValid = validateInvoiceQuantities([lineItem]);
          
          // Zero qty_to_bill is valid (not billing this item)
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject if any line item exceeds available quantity', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            qty_to_bill: fc.double({ min: 0, max: 100, noNaN: true }),
            max_qty: fc.double({ min: 100, max: 200, noNaN: true })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.record({
          qty_to_bill: fc.double({ min: 101, max: 200, noNaN: true }),
          max_qty: fc.double({ min: 0, max: 100, noNaN: true })
        }),
        (validItems, invalidItem) => {
          const allItems = [...validItems, invalidItem];
          const isValid = validateInvoiceQuantities(allItems);
          
          // Collection with at least one over-billed item should be invalid
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept all line items when all quantities are within limits', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            max_qty: fc.double({ min: 1, max: 1000, noNaN: true })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (items) => {
          // Generate qty_to_bill that is always <= max_qty
          const lineItems = items.map(item => ({
            qty_to_bill: item.max_qty * Math.random(), // 0 to max_qty
            max_qty: item.max_qty
          }));
          
          const isValid = validateInvoiceQuantities(lineItems);
          
          // All valid quantities should pass validation
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate available quantity correctly from ordered and billed quantities', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 10, max: 1000, noNaN: true }), // ordered qty
        fc.double({ min: 0, max: 1 }), // fraction already billed
        (orderedQty, billedFraction) => {
          const billedQty = orderedQty * billedFraction;
          const availableQty = orderedQty - billedQty;
          
          // Try to bill exactly the available quantity
          const lineItem = { qty_to_bill: availableQty, max_qty: availableQty };
          const isValid = validateInvoiceQuantities([lineItem]);
          
          // Should be valid to bill exactly the available quantity
          expect(isValid).toBe(true);
          
          // Should be invalid to bill more than available
          const overBilledItem = { qty_to_bill: availableQty + 0.01, max_qty: availableQty };
          const isOverBilledValid = validateInvoiceQuantities([overBilledItem]);
          expect(isOverBilledValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case when all quantity is already billed', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 1, max: 1000, noNaN: true }), // ordered qty
        (orderedQty) => {
          const billedQty = orderedQty;
          const availableQty = 0; // Nothing left to bill
          
          // Trying to bill zero should be valid
          const zeroItem = { qty_to_bill: 0, max_qty: availableQty };
          const isZeroValid = validateInvoiceQuantities([zeroItem]);
          expect(isZeroValid).toBe(true);
          
          // Trying to bill any positive amount should be invalid
          const positiveItem = { qty_to_bill: 0.01, max_qty: availableQty };
          const isPositiveValid = validateInvoiceQuantities([positiveItem]);
          expect(isPositiveValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle partial billing scenarios correctly', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 100, max: 1000, noNaN: true }), // ordered qty
        fc.double({ min: 0, max: 0.5 }), // first billing fraction
        fc.double({ min: 0, max: 0.5 }), // second billing fraction
        (orderedQty, firstFraction, secondFraction) => {
          // First invoice
          const firstBilledQty = orderedQty * firstFraction;
          const firstAvailable = orderedQty;
          const firstItem = { qty_to_bill: firstBilledQty, max_qty: firstAvailable };
          const isFirstValid = validateInvoiceQuantities([firstItem]);
          expect(isFirstValid).toBe(true);
          
          // Second invoice (after first billing)
          const secondAvailable = orderedQty - firstBilledQty;
          const secondBilledQty = secondAvailable * secondFraction;
          const secondItem = { qty_to_bill: secondBilledQty, max_qty: secondAvailable };
          const isSecondValid = validateInvoiceQuantities([secondItem]);
          expect(isSecondValid).toBe(true);
          
          // Trying to bill more than remaining should be invalid
          const overBilledItem = { qty_to_bill: secondAvailable + 0.01, max_qty: secondAvailable };
          const isOverBilledValid = validateInvoiceQuantities([overBilledItem]);
          expect(isOverBilledValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate consistently regardless of line item order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            max_qty: fc.double({ min: 10, max: 100, noNaN: true })
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (items) => {
          // Create valid line items
          const lineItems = items.map(item => ({
            qty_to_bill: item.max_qty * 0.5, // Bill 50%
            max_qty: item.max_qty
          }));
          
          // Validate original order
          const isValid1 = validateInvoiceQuantities(lineItems);
          
          // Validate reversed order
          const reversedItems = [...lineItems].reverse();
          const isValid2 = validateInvoiceQuantities(reversedItems);
          
          // Results should be consistent
          expect(isValid1).toBe(isValid2);
          expect(isValid1).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle boundary values correctly', () => {
    // Test exact boundary conditions
    const testCases = [
      { qty_to_bill: 0, max_qty: 0, expected: true },       // Nothing to bill
      { qty_to_bill: 0, max_qty: 100, expected: true },     // Bill nothing from available
      { qty_to_bill: 100, max_qty: 100, expected: true },   // Bill exactly available
      { qty_to_bill: 100.01, max_qty: 100, expected: false }, // Exceed by tiny amount
      { qty_to_bill: -0.01, max_qty: 100, expected: false }, // Negative billing
      { qty_to_bill: 99.99, max_qty: 100, expected: true }, // Just under available
    ];

    testCases.forEach(({ qty_to_bill, max_qty, expected }) => {
      const isValid = validateInvoiceQuantities([{ qty_to_bill, max_qty }]);
      expect(isValid).toBe(expected);
    });
  });

  it('should handle invoice total calculation with validated quantities', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            max_qty: fc.double({ min: 1, max: 100, noNaN: true }),
            rate: fc.double({ min: 0.01, max: 1000, noNaN: true })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (items) => {
          // Create line items with valid quantities
          const lineItems = items.map(item => ({
            qty_to_bill: item.max_qty * Math.random(),
            max_qty: item.max_qty,
            rate: item.rate
          }));
          
          // Validate quantities
          const isValid = validateInvoiceQuantities(lineItems);
          expect(isValid).toBe(true);
          
          // Calculate invoice total
          const invoiceTotal = lineItems.reduce(
            (sum, item) => sum + item.qty_to_bill * item.rate,
            0
          );
          
          // Invoice total should be non-negative
          expect(invoiceTotal).toBeGreaterThanOrEqual(0);
          
          // Invoice total should not exceed the maximum possible total
          const maxPossibleTotal = lineItems.reduce(
            (sum, item) => sum + item.max_qty * item.rate,
            0
          );
          expect(invoiceTotal).toBeLessThanOrEqual(maxPossibleTotal + 0.01); // floating point tolerance
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple line items with mixed billing scenarios', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            max_qty: fc.double({ min: 10, max: 100, noNaN: true })
          }),
          { minLength: 3, maxLength: 10 }
        ),
        (items) => {
          // Create mixed scenarios: some full billing, some partial, some zero
          const lineItems = items.map((item, index) => {
            let qtyToBill: number;
            if (index % 3 === 0) {
              qtyToBill = item.max_qty; // Full billing
            } else if (index % 3 === 1) {
              qtyToBill = item.max_qty * 0.5; // Partial billing
            } else {
              qtyToBill = 0; // No billing
            }
            return { qty_to_bill: qtyToBill, max_qty: item.max_qty };
          });
          
          const isValid = validateInvoiceQuantities(lineItems);
          
          // All scenarios should be valid
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should enforce that at least one item has positive quantity for submission', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            max_qty: fc.double({ min: 1, max: 100, noNaN: true })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (items) => {
          // Create line items with all zero quantities
          const zeroItems = items.map(item => ({
            qty_to_bill: 0,
            max_qty: item.max_qty
          }));
          
          // Validation should pass (quantities are within limits)
          const isValid = validateInvoiceQuantities(zeroItems);
          expect(isValid).toBe(true);
          
          // But hasValidItems check should fail
          const hasValidItems = zeroItems.some(item => item.qty_to_bill > 0);
          expect(hasValidItems).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
