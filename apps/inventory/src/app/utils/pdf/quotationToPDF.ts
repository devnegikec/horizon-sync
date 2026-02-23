import { SUPPORTED_CURRENCIES } from '../../types/currency.types';
import type { Quotation } from '../../types/quotation.types';

import type { PDFDocumentData, PDFLineItem } from './types';

export const convertQuotationToPDFData = (quotation: Quotation): PDFDocumentData => {
  console.log('=== PDF CONVERSION DEBUG ===');
  console.log('1. Full quotation object:', JSON.stringify(quotation, null, 2));
  console.log('2. quotation.items:', quotation.items);
  console.log('3. quotation.line_items:', quotation.line_items);
  
  const lineItems = quotation.items || quotation.line_items || [];
  console.log('4. Selected lineItems array:', lineItems);
  console.log('5. lineItems.length:', lineItems.length);

  // Get currency symbol
  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = SUPPORTED_CURRENCIES.find((c: { code: string; symbol: string }) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  // Convert line items
  const pdfLineItems: PDFLineItem[] = lineItems.map((item, index) => {
    console.log(`6. Processing item ${index}:`, item);
    return {
      index: index + 1,
      itemName: item.item_name || '',
      itemCode: item.item_code || item.item_sku,
      quantity: Number(item.qty),
      uom: item.uom,
      rate: Number(item.rate),
      amount: Number(item.amount),
      taxAmount: item.tax_amount ? Number(item.tax_amount) : undefined,
      totalAmount: Number(item.total_amount || item.amount),
      taxInfo: item.tax_info
        ? {
            templateName: item.tax_info.template_name,
            breakup: item.tax_info.breakup.map((tax) => ({
              rule_name: tax.rule_name,
              rate: tax.rate,
            })),
          }
        : undefined,
    };
  });

  console.log('7. Converted pdfLineItems:', pdfLineItems);
  console.log('8. pdfLineItems.length:', pdfLineItems.length);

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalTax = lineItems.reduce((sum, item) => sum + Number(item.tax_amount || 0), 0);

  // Build tax summary
  const taxSummary = new Map<
    string,
    { name: string; amount: number; breakup: Array<{ rule_name: string; rate: number; amount: number }> }
  >();

  lineItems.forEach((item) => {
    if (item.tax_info) {
      const templateKey = item.tax_info.template_code;
      if (!taxSummary.has(templateKey)) {
        taxSummary.set(templateKey, {
          name: item.tax_info.template_name,
          amount: 0,
          breakup: item.tax_info.breakup.map((tax) => ({
            rule_name: tax.rule_name,
            rate: tax.rate,
            amount: 0,
          })),
        });
      }
      const summary = taxSummary.get(templateKey);
      if (summary) {
        summary.amount += Number(item.tax_amount || 0);

        // Calculate individual tax component amounts
        item.tax_info.breakup.forEach((tax, idx) => {
          const taxComponentAmount = (Number(item.amount) * tax.rate) / 100;
          summary.breakup[idx].amount += taxComponentAmount;
        });
      }
    }
  });

  const pdfData: PDFDocumentData = {
    type: 'quotation',
    documentNo: quotation.quotation_no,
    date: quotation.quotation_date,
    validUntil: quotation.valid_until,
    currency: quotation.currency,
    currencySymbol: getCurrencySymbol(quotation.currency),
    status: quotation.status,

    // Company info - you can customize this based on your organization data
    companyName: 'Your Company Name',
    companyAddress: '123 Business Street, City, State 12345',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'info@yourcompany.com',

    // Customer info
    customerName: quotation.customer_name || quotation.customer?.customer_name || 'N/A',
    customerCode: quotation.customer?.customer_code,
    customerEmail: quotation.customer?.email,
    customerPhone: quotation.customer?.phone,

    // Line items
    lineItems: pdfLineItems,

    // Totals
    subtotal,
    totalTax,
    grandTotal: Number(quotation.grand_total),

    // Tax summary
    taxSummary: Array.from(taxSummary.values()),

    // Additional info
    remarks: quotation.remarks,
  };

  console.log('9. Final PDFDocumentData:', JSON.stringify(pdfData, null, 2));
  console.log('10. Final lineItems in PDFDocumentData:', pdfData.lineItems);
  console.log('=== END PDF CONVERSION DEBUG ===');

  return pdfData;
};
