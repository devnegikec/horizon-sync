import { SUPPORTED_CURRENCIES } from '../../types/currency.types';

/**
 * PDF-safe currency prefix. The default PDF font (Helvetica) does not include
 * Unicode symbols like ₹, €, £, ¥, which can render as "1" or wrong characters.
 * Use ASCII or 3-letter codes so amounts display correctly in quotation/sales order/invoice PDFs.
 */
const PDF_CURRENCY_PREFIX: Record<string, string> = {
  USD: '$',
  INR: 'Rs.',
  EUR: 'EUR ',
  GBP: 'GBP ',
  JPY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  CHF: 'CHF ',
  CNY: 'CNY ',
};

export function getCurrencySymbolForPDF(code: string): string {
  const raw = String(code ?? 'INR').trim();
  const normalized = raw.toUpperCase();
  if (/^\d+$/.test(raw) || normalized.length !== 3) {
    return PDF_CURRENCY_PREFIX['INR'] ?? 'Rs.';
  }
  return (
    PDF_CURRENCY_PREFIX[normalized] ??
    (SUPPORTED_CURRENCIES.find((c) => c.code === normalized)?.code ?? 'INR') + ' '
  );
}
