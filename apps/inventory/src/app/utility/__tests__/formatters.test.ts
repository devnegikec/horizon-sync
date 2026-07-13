import {
  formatCurrency,
  formatNumber,
  formatDecimal,
  formatQuantity,
  formatPercentage,
  truncateText,
} from '../formatters';

describe('formatCurrency', () => {
  it('formats a number as USD by default', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('rounds to 2 decimal places', () => {
    expect(formatCurrency(1234.567)).toBe('$1,234.57');
  });

  it('handles null as $0.00', () => {
    expect(formatCurrency(null)).toBe('$0.00');
  });

  it('handles undefined as $0.00', () => {
    expect(formatCurrency(undefined)).toBe('$0.00');
  });

  it('handles string input', () => {
    expect(formatCurrency('99.99')).toBe('$99.99');
  });

  it('formats with different currency', () => {
    const result = formatCurrency(1000, 'EUR', 'de-DE');
    expect(result).toContain('1.000,00');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('handles negative values', () => {
    expect(formatCurrency(-500)).toBe('-$500.00');
  });
});

describe('formatNumber', () => {
  it('formats with thousands separators', () => {
    expect(formatNumber(1234567)).toBe('1,234,567');
  });

  it('handles null as 0', () => {
    expect(formatNumber(null)).toBe('0');
  });

  it('handles undefined as 0', () => {
    expect(formatNumber(undefined)).toBe('0');
  });

  it('handles string input', () => {
    expect(formatNumber('1234')).toBe('1,234');
  });

  it('handles small numbers', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('formatDecimal', () => {
  it('formats with 2 decimal places by default', () => {
    expect(formatDecimal(1234.567)).toBe('1,234.57');
  });

  it('formats with custom decimal places', () => {
    expect(formatDecimal(1234.567, 3)).toBe('1,234.567');
  });

  it('handles null as 0.00', () => {
    expect(formatDecimal(null)).toBe('0.00');
  });

  it('pads with zeros when needed', () => {
    expect(formatDecimal(5, 2)).toBe('5.00');
  });
});

describe('formatQuantity', () => {
  it('formats as integer with thousands separators', () => {
    expect(formatQuantity(1234)).toBe('1,234');
  });

  it('rounds decimal values', () => {
    expect(formatQuantity(1234.56)).toBe('1,235');
  });

  it('handles null as 0', () => {
    expect(formatQuantity(null)).toBe('0');
  });

  it('handles string input', () => {
    expect(formatQuantity('999')).toBe('999');
  });
});

describe('formatPercentage', () => {
  it('formats percentage from 0-100 value', () => {
    expect(formatPercentage(25.5)).toBe('25.50%');
  });

  it('formats percentage from decimal value', () => {
    expect(formatPercentage(0.255, 2, true)).toBe('25.50%');
  });

  it('handles null as 0.00%', () => {
    expect(formatPercentage(null)).toBe('0.00%');
  });

  it('handles custom decimal places', () => {
    expect(formatPercentage(33.333, 1)).toBe('33.3%');
  });

  it('handles 100%', () => {
    expect(formatPercentage(100)).toBe('100.00%');
  });

  it('handles 0%', () => {
    expect(formatPercentage(0)).toBe('0.00%');
  });
});

describe('truncateText', () => {
  it('truncates long text with ellipsis', () => {
    expect(truncateText('This is a long text', 10)).toBe('This is a ...');
  });

  it('returns short text unchanged', () => {
    expect(truncateText('Short', 10)).toBe('Short');
  });

  it('returns empty string for null', () => {
    expect(truncateText(null, 10)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(truncateText(undefined, 10)).toBe('');
  });

  it('returns text unchanged when exactly at max length', () => {
    expect(truncateText('1234567890', 10)).toBe('1234567890');
  });
});
