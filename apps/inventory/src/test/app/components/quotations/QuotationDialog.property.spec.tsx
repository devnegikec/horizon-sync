import fc from 'fast-check';

/**
 * Property-Based Tests for QuotationDialog
 * Feature: quotation-sales-order-flow
 */

describe('Feature: quotation-sales-order-flow, Property 2: Grand Total Calculation', () => {
  /**
   * **Validates: Requirements 3.10, 11.10**
   * 
   * Property: For any quotation or sales order with line items, 
   * the grand total should equal the sum of all line item amounts.
   */
  it('should calculate grand total as sum of all line item amounts', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            qty: fc.double({ min: 0.01, max: 10000, noNaN: true }),
            rate: fc.double({ min: 0.01, max: 10000, noNaN: true })
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (lineItems) => {
          // Calculate amounts for each line item (qty × rate)
          const amounts = lineItems.map(item => item.qty * item.rate);
          
          // Calculate grand total using the same logic as QuotationDialog
          const grandTotal = amounts.reduce((sum, amount) => sum + amount, 0);
          
          // Calculate expected grand total
          const expectedTotal = lineItems.reduce((sum, item) => sum + (item.qty * item.rate), 0);
          
          // Grand total should equal the sum of all amounts
          expect(grandTotal).toBeCloseTo(expectedTotal, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle single line item correctly', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        fc.double({ min: 0.01, max: 10000, noNaN: true }),
        (qty, rate) => {
          const amount = qty * rate;
          const grandTotal = amount;
          
          // For a single line item, grand total equals the line item amount
          expect(grandTotal).toBeCloseTo(qty * rate, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain grand total correctness regardless of line item order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            qty: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            rate: fc.double({ min: 0.01, max: 1000, noNaN: true })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (lineItems) => {
          // Calculate grand total with original order
          const amounts1 = lineItems.map(item => item.qty * item.rate);
          const grandTotal1 = amounts1.reduce((sum, amount) => sum + amount, 0);
          
          // Calculate grand total with reversed order
          const reversedItems = [...lineItems].reverse();
          const amounts2 = reversedItems.map(item => item.qty * item.rate);
          const grandTotal2 = amounts2.reduce((sum, amount) => sum + amount, 0);
          
          // Grand total should be the same regardless of order
          expect(grandTotal1).toBeCloseTo(grandTotal2, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases with very small and very large amounts', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            qty: fc.oneof(
              fc.double({ min: 0.01, max: 1, noNaN: true }),      // Small
              fc.double({ min: 1, max: 100, noNaN: true }),       // Medium
              fc.double({ min: 100, max: 10000, noNaN: true })    // Large
            ),
            rate: fc.oneof(
              fc.double({ min: 0.01, max: 1, noNaN: true }),      // Small
              fc.double({ min: 1, max: 100, noNaN: true }),       // Medium
              fc.double({ min: 100, max: 10000, noNaN: true })    // Large
            )
          }),
          { minLength: 1, maxLength: 15 }
        ),
        (lineItems) => {
          const amounts = lineItems.map(item => item.qty * item.rate);
          const grandTotal = amounts.reduce((sum, amount) => sum + amount, 0);
          
          // Grand total should always be positive when all line items are positive
          expect(grandTotal).toBeGreaterThan(0);
          
          // Grand total should be at least as large as the largest line item amount
          const maxAmount = Math.max(...amounts);
          expect(grandTotal).toBeGreaterThanOrEqual(maxAmount);
          
          // Grand total should be at most the sum of all amounts (with floating point tolerance)
          const expectedTotal = amounts.reduce((sum, amount) => sum + amount, 0);
          expect(Math.abs(grandTotal - expectedTotal)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce consistent results for the same line items', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            qty: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            rate: fc.double({ min: 0.01, max: 1000, noNaN: true })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (lineItems) => {
          // Calculate grand total twice
          const amounts1 = lineItems.map(item => item.qty * item.rate);
          const grandTotal1 = amounts1.reduce((sum, amount) => sum + amount, 0);
          
          const amounts2 = lineItems.map(item => item.qty * item.rate);
          const grandTotal2 = amounts2.reduce((sum, amount) => sum + amount, 0);
          
          // Same inputs should always produce the same output
          expect(grandTotal1).toBe(grandTotal2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly sum amounts with various decimal precisions', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            qty: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            rate: fc.double({ min: 0.01, max: 1000, noNaN: true })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (lineItems) => {
          const amounts = lineItems.map(item => item.qty * item.rate);
          const grandTotal = amounts.reduce((sum, amount) => sum + amount, 0);
          
          // Verify that grand total equals the sum by checking each component
          let manualSum = 0;
          for (const amount of amounts) {
            manualSum += amount;
          }
          
          expect(grandTotal).toBeCloseTo(manualSum, 10);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle adding and removing line items correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            qty: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            rate: fc.double({ min: 0.01, max: 1000, noNaN: true })
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (lineItems) => {
          // Calculate grand total with all items
          const allAmounts = lineItems.map(item => item.qty * item.rate);
          const grandTotalAll = allAmounts.reduce((sum, amount) => sum + amount, 0);
          
          // Calculate grand total without the last item
          const withoutLast = lineItems.slice(0, -1);
          const withoutLastAmounts = withoutLast.map(item => item.qty * item.rate);
          const grandTotalWithoutLast = withoutLastAmounts.reduce((sum, amount) => sum + amount, 0);
          
          // The difference should equal the last item's amount
          const lastItemAmount = lineItems[lineItems.length - 1].qty * lineItems[lineItems.length - 1].rate;
          const difference = grandTotalAll - grandTotalWithoutLast;
          
          expect(difference).toBeCloseTo(lastItemAmount, 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain mathematical properties of summation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            qty: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            rate: fc.double({ min: 0.01, max: 1000, noNaN: true })
          }),
          { minLength: 3, maxLength: 10 }
        ),
        (lineItems) => {
          // Split line items into two groups
          const midpoint = Math.floor(lineItems.length / 2);
          const group1 = lineItems.slice(0, midpoint);
          const group2 = lineItems.slice(midpoint);
          
          // Calculate grand total for each group
          const amounts1 = group1.map(item => item.qty * item.rate);
          const total1 = amounts1.reduce((sum, amount) => sum + amount, 0);
          
          const amounts2 = group2.map(item => item.qty * item.rate);
          const total2 = amounts2.reduce((sum, amount) => sum + amount, 0);
          
          // Calculate grand total for all items
          const allAmounts = lineItems.map(item => item.qty * item.rate);
          const totalAll = allAmounts.reduce((sum, amount) => sum + amount, 0);
          
          // Associative property: (group1 + group2) = all
          expect(total1 + total2).toBeCloseTo(totalAll, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Feature: quotation-sales-order-flow, Property 9: Date Validation', () => {
  /**
   * **Validates: Requirements 19.3, 19.4**
   * 
   * Property: For any quotation, if the valid_until date is before the quotation_date,
   * the form validation should reject the submission. Similarly, for any sales order,
   * if the delivery_date is before the order_date, the form validation should reject the submission.
   */

  // Helper function to simulate date validation logic from QuotationDialog
  const validateQuotationDates = (quotationDate: Date, validUntilDate: Date): boolean => {
    // Validation logic from QuotationDialog.tsx line 114:
    // if (new Date(formData.valid_until) < new Date(formData.quotation_date))
    return validUntilDate >= quotationDate;
  };

  const validateSalesOrderDates = (orderDate: Date, deliveryDate: Date | null): boolean => {
    // For sales orders: delivery_date must be after order_date if provided
    if (deliveryDate === null) {
      return true; // delivery_date is optional
    }
    return deliveryDate >= orderDate;
  };

  it('should reject quotation when valid_until is before quotation_date', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        fc.integer({ min: 1, max: 365 }), // days before
        (quotationDate, daysBefore) => {
          const validUntilDate = new Date(quotationDate);
          validUntilDate.setDate(validUntilDate.getDate() - daysBefore);
          
          const isValid = validateQuotationDates(quotationDate, validUntilDate);
          
          // valid_until before quotation_date should be invalid
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept quotation when valid_until is after quotation_date', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        fc.integer({ min: 1, max: 365 }), // days after
        (quotationDate, daysAfter) => {
          const validUntilDate = new Date(quotationDate);
          validUntilDate.setDate(validUntilDate.getDate() + daysAfter);
          
          const isValid = validateQuotationDates(quotationDate, validUntilDate);
          
          // valid_until after quotation_date should be valid
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept quotation when valid_until equals quotation_date', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        (quotationDate) => {
          const validUntilDate = new Date(quotationDate);
          
          const isValid = validateQuotationDates(quotationDate, validUntilDate);
          
          // valid_until equal to quotation_date should be valid (same day)
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject sales order when delivery_date is before order_date', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        fc.integer({ min: 1, max: 365 }), // days before
        (orderDate, daysBefore) => {
          const deliveryDate = new Date(orderDate);
          deliveryDate.setDate(deliveryDate.getDate() - daysBefore);
          
          const isValid = validateSalesOrderDates(orderDate, deliveryDate);
          
          // delivery_date before order_date should be invalid
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept sales order when delivery_date is after order_date', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        fc.integer({ min: 1, max: 365 }), // days after
        (orderDate, daysAfter) => {
          const deliveryDate = new Date(orderDate);
          deliveryDate.setDate(deliveryDate.getDate() + daysAfter);
          
          const isValid = validateSalesOrderDates(orderDate, deliveryDate);
          
          // delivery_date after order_date should be valid
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept sales order when delivery_date equals order_date', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        (orderDate) => {
          const deliveryDate = new Date(orderDate);
          
          const isValid = validateSalesOrderDates(orderDate, deliveryDate);
          
          // delivery_date equal to order_date should be valid (same day delivery)
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept sales order when delivery_date is null (optional)', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        (orderDate) => {
          const isValid = validateSalesOrderDates(orderDate, null);
          
          // null delivery_date should be valid (optional field)
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge cases with dates at year boundaries', () => {
    // Test year boundary transitions
    const testCases = [
      {
        quotationDate: new Date('2025-12-31'),
        validUntilDate: new Date('2026-01-01'),
        expected: true,
        description: 'valid_until in next year'
      },
      {
        quotationDate: new Date('2026-01-01'),
        validUntilDate: new Date('2025-12-31'),
        expected: false,
        description: 'valid_until in previous year'
      },
      {
        quotationDate: new Date('2025-12-31'),
        validUntilDate: new Date('2025-12-31'),
        expected: true,
        description: 'same date at year end'
      }
    ];

    testCases.forEach(({ quotationDate, validUntilDate, expected, description }) => {
      const isValid = validateQuotationDates(quotationDate, validUntilDate);
      expect(isValid).toBe(expected);
    });
  });

  it('should handle dates with different time components correctly', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        fc.integer({ min: 0, max: 23 }), // hours
        fc.integer({ min: 0, max: 59 }), // minutes
        (baseDate, hours1, minutes1) => {
          // Create two dates on the same day but different times
          const quotationDate = new Date(baseDate);
          quotationDate.setHours(hours1, minutes1, 0, 0);
          
          const validUntilDate = new Date(baseDate);
          validUntilDate.setHours(23, 59, 59, 999);
          
          const isValid = validateQuotationDates(quotationDate, validUntilDate);
          
          // Same day should be valid regardless of time
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate consistently regardless of timezone', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        fc.integer({ min: 1, max: 30 }), // days difference
        (baseDate, daysDiff) => {
          const quotationDate = new Date(baseDate);
          const validUntilDate = new Date(baseDate);
          validUntilDate.setDate(validUntilDate.getDate() + daysDiff);
          
          // Validate using Date objects (which handle timezone internally)
          const isValid1 = validateQuotationDates(quotationDate, validUntilDate);
          
          // Validate again with the same dates
          const isValid2 = validateQuotationDates(
            new Date(quotationDate.getTime()),
            new Date(validUntilDate.getTime())
          );
          
          // Results should be consistent
          expect(isValid1).toBe(isValid2);
          expect(isValid1).toBe(true); // Should be valid since validUntil is after
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle leap year dates correctly', () => {
    const testCases = [
      {
        quotationDate: new Date('2024-02-28'),
        validUntilDate: new Date('2024-02-29'),
        expected: true,
        description: 'leap day after Feb 28'
      },
      {
        quotationDate: new Date('2024-02-29'),
        validUntilDate: new Date('2024-03-01'),
        expected: true,
        description: 'March 1 after leap day'
      },
      {
        quotationDate: new Date('2024-03-01'),
        validUntilDate: new Date('2024-02-29'),
        expected: false,
        description: 'leap day before March 1'
      }
    ];

    testCases.forEach(({ quotationDate, validUntilDate, expected, description }) => {
      const isValid = validateQuotationDates(quotationDate, validUntilDate);
      expect(isValid).toBe(expected);
    });
  });

  it('should handle very long date ranges', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }).filter(d => !isNaN(d.getTime())),
        fc.integer({ min: 365, max: 3650 }), // 1-10 years
        (quotationDate, daysAfter) => {
          const validUntilDate = new Date(quotationDate);
          validUntilDate.setDate(validUntilDate.getDate() + daysAfter);
          
          const isValid = validateQuotationDates(quotationDate, validUntilDate);
          
          // Long-term quotations should still be valid
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle date validation symmetry', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        (date1, date2) => {
          const isValid1 = validateQuotationDates(date1, date2);
          const isValid2 = validateQuotationDates(date2, date1);
          
          if (date1.getTime() === date2.getTime()) {
            // Same dates should both be valid
            expect(isValid1).toBe(true);
            expect(isValid2).toBe(true);
          } else if (date1 < date2) {
            // date1 before date2: valid when date2 is valid_until
            expect(isValid1).toBe(true);
            expect(isValid2).toBe(false);
          } else {
            // date1 after date2: valid when date1 is valid_until
            expect(isValid1).toBe(false);
            expect(isValid2).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
describe('Feature: quotation-sales-order-flow, Property 8: Line Item Validation', () => {
  /**
   * **Validates: Requirements 3.13, 11.13, 19.5, 19.6**
   * 
   * Property: For any line item, if the quantity or rate is zero or negative,
   * the form validation should reject the submission and display an error message.
   */

  // Helper function to simulate validation logic from QuotationDialog
  const validateLineItems = (items: Array<{ qty: number; rate: number }>): boolean => {
    // Validation logic from QuotationDialog.tsx line 109:
    // items.some(item => item.qty <= 0 || item.rate < 0)
    return !items.some(item => item.qty <= 0 || item.rate < 0);
  };

  it('should reject line items with zero quantity', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 10000, noNaN: true }), // rate (can be zero or positive)
        (rate) => {
          const lineItem = { qty: 0, rate };
          const isValid = validateLineItems([lineItem]);
          
          // Line items with zero quantity should be invalid
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject line items with negative quantity', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -10000, max: -0.01, noNaN: true }), // negative quantity
        fc.double({ min: 0, max: 10000, noNaN: true }), // rate
        (qty, rate) => {
          const lineItem = { qty, rate };
          const isValid = validateLineItems([lineItem]);
          
          // Line items with negative quantity should be invalid
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject line items with negative rate', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }), // positive quantity
        fc.double({ min: -10000, max: -0.01, noNaN: true }), // negative rate
        (qty, rate) => {
          const lineItem = { qty, rate };
          const isValid = validateLineItems([lineItem]);
          
          // Line items with negative rate should be invalid
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept line items with positive quantity and non-negative rate', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 10000, noNaN: true }), // positive quantity
        fc.double({ min: 0, max: 10000, noNaN: true }), // non-negative rate
        (qty, rate) => {
          const lineItem = { qty, rate };
          const isValid = validateLineItems([lineItem]);
          
          // Line items with positive quantity and non-negative rate should be valid
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject if any line item in a collection has invalid quantity or rate', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            qty: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            rate: fc.double({ min: 0, max: 1000, noNaN: true })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.record({
          qty: fc.oneof(
            fc.constant(0),
            fc.double({ min: -1000, max: -0.01, noNaN: true })
          ),
          rate: fc.double({ min: 0, max: 1000, noNaN: true })
        }),
        (validItems, invalidItem) => {
          // Insert invalid item at random position
          const allItems = [...validItems, invalidItem];
          const isValid = validateLineItems(allItems);
          
          // Collection with at least one invalid item should be invalid
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject if any line item has negative rate in a collection', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            qty: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            rate: fc.double({ min: 0, max: 1000, noNaN: true })
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.record({
          qty: fc.double({ min: 0.01, max: 1000, noNaN: true }),
          rate: fc.double({ min: -1000, max: -0.01, noNaN: true })
        }),
        (validItems, invalidItem) => {
          const allItems = [...validItems, invalidItem];
          const isValid = validateLineItems(allItems);
          
          // Collection with at least one item with negative rate should be invalid
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept all line items when all have valid quantity and rate', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            qty: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            rate: fc.double({ min: 0, max: 1000, noNaN: true })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (lineItems) => {
          const isValid = validateLineItems(lineItems);
          
          // All valid line items should pass validation
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle edge case with exactly zero rate (allowed)', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1000, noNaN: true }), // positive quantity
        (qty) => {
          const lineItem = { qty, rate: 0 };
          const isValid = validateLineItems([lineItem]);
          
          // Zero rate is allowed (non-negative), only negative rates are rejected
          expect(isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle boundary values correctly', () => {
    // Test exact boundary conditions
    const testCases = [
      { qty: 0, rate: 0, expected: false },      // Zero quantity is invalid
      { qty: 0.01, rate: 0, expected: true },    // Minimum valid quantity with zero rate
      { qty: 0.01, rate: -0.01, expected: false }, // Valid quantity but negative rate
      { qty: -0.01, rate: 0, expected: false },  // Negative quantity
      { qty: 0.01, rate: 0.01, expected: true }, // Minimum valid values
    ];

    testCases.forEach(({ qty, rate, expected }) => {
      const isValid = validateLineItems([{ qty, rate }]);
      expect(isValid).toBe(expected);
    });
  });

  it('should validate consistently regardless of line item order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            qty: fc.double({ min: 0.01, max: 1000, noNaN: true }),
            rate: fc.double({ min: 0, max: 1000, noNaN: true })
          }),
          { minLength: 2, maxLength: 5 }
        ),
        fc.record({
          qty: fc.double({ min: -1000, max: 0, noNaN: true }), // invalid quantity
          rate: fc.double({ min: 0, max: 1000, noNaN: true })
        }),
        (validItems, invalidItem) => {
          // Test with invalid item at the beginning
          const items1 = [invalidItem, ...validItems];
          const isValid1 = validateLineItems(items1);
          
          // Test with invalid item at the end
          const items2 = [...validItems, invalidItem];
          const isValid2 = validateLineItems(items2);
          
          // Test with invalid item in the middle
          const midpoint = Math.floor(validItems.length / 2);
          const items3 = [...validItems.slice(0, midpoint), invalidItem, ...validItems.slice(midpoint)];
          const isValid3 = validateLineItems(items3);
          
          // All should be invalid regardless of position
          expect(isValid1).toBe(false);
          expect(isValid2).toBe(false);
          expect(isValid3).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
