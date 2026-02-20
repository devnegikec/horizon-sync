/**
 * Property-Based Tests for Formatting Utilities
 * Feature: stock-management
 * Property 10: Currency formatting consistency
 * Property 11: Date and time formatting consistency
 * Property 13: Number formatting in stats
 * Validates: Requirements 7.5, 7.6, 9.6
 */

import fc from 'fast-check';
import { formatCurrency, formatNumber, formatDecimal, formatQuantity, formatPercentage } from '../../../app/utility/formatters';
import { formatDate } from '../../../app/utility/formatDate';

describe('Stock Management - Property 10: Currency formatting consistency', () => {
  it('should format any number as currency with exactly 2 decimal places', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1000000, max: 1000000, noNaN: true }), // value
        (value) => {
          const formatted = formatCurrency(value);

          // Verify currency symbol is present (may be preceded by minus sign)
          expect(formatted).toMatch(/^-?\$/);

          // Verify exactly 2 decimal places
          const decimalMatch = formatted.match(/\.(\d+)$/);
          expect(decimalMatch).toBeTruthy();
          expect(decimalMatch![1].length).toBe(2);

          // Verify thousands separators for large numbers
          if (Math.abs(value) >= 1000) {
            expect(formatted).toContain(',');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle null and undefined values as zero', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined),
        (value) => {
          const formatted = formatCurrency(value);
          expect(formatted).toBe('$0.00');
        },
      ),
      { numRuns: 10 },
    );
  });

  it('should format string numbers correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10000, noNaN: true }),
        (value) => {
          const stringValue = value.toString();
          const formatted = formatCurrency(stringValue);

          // Should produce same result as number input
          const formattedFromNumber = formatCurrency(value);
          expect(formatted).toBe(formattedFromNumber);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Stock Management - Property 11: Date and time formatting consistency', () => {
  it('should format any valid date string consistently', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        (date) => {
          const formatted = formatDate(date, 'DD-MMM-YY');

          // Verify format matches DD-MMM-YY pattern
          expect(formatted).toMatch(/^\d{2}-[A-Z][a-z]{2}-\d{2}$/);

          // Verify components are valid
          const [day, month, year] = formatted.split('-');
          expect(parseInt(day)).toBeGreaterThanOrEqual(1);
          expect(parseInt(day)).toBeLessThanOrEqual(31);
          expect(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']).toContain(month);
          expect(parseInt(year)).toBeGreaterThanOrEqual(0);
          expect(parseInt(year)).toBeLessThanOrEqual(99);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should format dates with time consistently when includeTime is true', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        (date) => {
          const formatted = formatDate(date, 'DD-MMM-YY', { includeTime: true });

          // Verify format includes time in HH:mm format
          expect(formatted).toMatch(/^\d{2}-[A-Z][a-z]{2}-\d{2} \d{2}:\d{2}$/);

          // Extract time component
          const timeMatch = formatted.match(/(\d{2}):(\d{2})$/);
          expect(timeMatch).toBeTruthy();
          const [, hours, minutes] = timeMatch!;
          expect(parseInt(hours)).toBeGreaterThanOrEqual(0);
          expect(parseInt(hours)).toBeLessThanOrEqual(23);
          expect(parseInt(minutes)).toBeGreaterThanOrEqual(0);
          expect(parseInt(minutes)).toBeLessThanOrEqual(59);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle ISO date strings correctly', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date('2020-01-01'), max: new Date('2030-12-31') }).filter(d => !isNaN(d.getTime())),
        (date) => {
          const isoString = date.toISOString();
          const formatted = formatDate(isoString, 'DD-MMM-YY');

          // Should produce valid formatted date
          expect(formatted).toMatch(/^\d{2}-[A-Z][a-z]{2}-\d{2}$/);
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe('Stock Management - Property 13: Number formatting in stats', () => {
  it('should format any number greater than 999 with thousands separators', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 10000000 }),
        (value) => {
          const formatted = formatNumber(value);

          // Verify thousands separators are present
          expect(formatted).toContain(',');

          // Verify format is correct (e.g., 1,234 or 1,234,567)
          expect(formatted).toMatch(/^[\d,]+$/);

          // Verify no decimal places for integers
          expect(formatted).not.toContain('.');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should format numbers less than 1000 without separators', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 999 }),
        (value) => {
          const formatted = formatNumber(value);

          // Verify no thousands separators
          expect(formatted).not.toContain(',');

          // Verify it's just the number as string
          expect(formatted).toBe(value.toString());
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should handle null and undefined as zero', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(null, undefined),
        (value) => {
          const formatted = formatNumber(value);
          expect(formatted).toBe('0');
        },
      ),
      { numRuns: 10 },
    );
  });

  it('should format quantities as integers with thousands separators', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100000, noNaN: true }),
        (value) => {
          const formatted = formatQuantity(value);

          // Verify no decimal places (rounded)
          expect(formatted).not.toContain('.');

          // Verify thousands separators for large numbers
          if (Math.round(value) >= 1000) {
            expect(formatted).toContain(',');
          }

          // Verify the value is rounded correctly
          const parsedValue = parseInt(formatted.replace(/,/g, ''));
          expect(parsedValue).toBe(Math.round(value));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should format decimal numbers with specified decimal places', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10000, noNaN: true }),
        fc.integer({ min: 0, max: 5 }),
        (value, decimals) => {
          const formatted = formatDecimal(value, decimals);

          // Verify decimal places match specification
          if (decimals > 0) {
            const decimalMatch = formatted.match(/\.(\d+)$/);
            expect(decimalMatch).toBeTruthy();
            expect(decimalMatch![1].length).toBe(decimals);
          }

          // Verify thousands separators for large numbers
          if (value >= 1000) {
            expect(formatted).toContain(',');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should format percentages correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 100, noNaN: true }),
        (value) => {
          const formatted = formatPercentage(value);

          // Verify percentage symbol is present
          expect(formatted).toMatch(/%$/);

          // Verify exactly 2 decimal places
          const decimalMatch = formatted.match(/(\d+\.\d+)%$/);
          if (decimalMatch) {
            const [, numberPart] = decimalMatch;
            const decimalPart = numberPart.split('.')[1];
            expect(decimalPart.length).toBe(2);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
