/**
 * Formatting Utilities
 * Provides consistent formatting for currency, numbers, and other display values
 */

/**
 * Format a number as currency with symbol, thousands separators, and 2 decimal places
 * @param value - The numeric value to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 * 
 * @example
 * formatCurrency(1234.56) // => "$1,234.56"
 * formatCurrency(1234.567) // => "$1,234.57" (rounded)
 * formatCurrency(null) // => "$0.00"
 */
export function formatCurrency(
  value: number | string | null | undefined,
  currency = 'USD',
  locale = 'en-US'
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const safeValue = numValue ?? 0;

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeValue);
}

/**
 * Format a number with thousands separators
 * @param value - The numeric value to format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted number string
 * 
 * @example
 * formatNumber(1234) // => "1,234"
 * formatNumber(1234567) // => "1,234,567"
 * formatNumber(null) // => "0"
 */
export function formatNumber(
  value: number | string | null | undefined,
  locale = 'en-US'
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const safeValue = numValue ?? 0;

  return new Intl.NumberFormat(locale).format(safeValue);
}

/**
 * Format a number with decimal places
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 2)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted number string
 * 
 * @example
 * formatDecimal(1234.567, 2) // => "1,234.57"
 * formatDecimal(1234.567, 3) // => "1,234.567"
 */
export function formatDecimal(
  value: number | string | null | undefined,
  decimals = 2,
  locale = 'en-US'
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const safeValue = numValue ?? 0;

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safeValue);
}

/**
 * Format a quantity value (integer, no decimals)
 * @param value - The numeric value to format
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted quantity string
 * 
 * @example
 * formatQuantity(1234) // => "1,234"
 * formatQuantity(1234.56) // => "1,235" (rounded)
 */
export function formatQuantity(
  value: number | string | null | undefined,
  locale = 'en-US'
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const safeValue = Math.round(numValue ?? 0);

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(safeValue);
}

/**
 * Format a percentage value
 * @param value - The numeric value to format (0-100 or 0-1 based on isDecimal)
 * @param decimals - Number of decimal places (default: 2)
 * @param isDecimal - Whether input is decimal (0-1) or percentage (0-100) (default: false)
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted percentage string
 * 
 * @example
 * formatPercentage(25.5) // => "25.50%"
 * formatPercentage(0.255, 2, true) // => "25.50%"
 */
export function formatPercentage(
  value: number | string | null | undefined,
  decimals = 2,
  isDecimal = false,
  locale = 'en-US'
): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const safeValue = numValue ?? 0;
  const percentValue = isDecimal ? safeValue : safeValue / 100;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(percentValue);
}

/**
 * Truncate text with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 * 
 * @example
 * truncateText("This is a long text", 10) // => "This is a..."
 * truncateText("Short", 10) // => "Short"
 */
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}
