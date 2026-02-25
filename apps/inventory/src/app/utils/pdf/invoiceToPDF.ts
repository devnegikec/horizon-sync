import type { Invoice } from '../../types/invoice.types';

import type { PDFDocumentData, PDFLineItem } from './types';
import { getCurrencySymbolForPDF } from './pdfCurrency';

export const convertInvoiceToPDFData = (invoice: Invoice): PDFDocumentData => {
  const lineItems = invoice.line_items || [];

  // Convert line items
  const pdfLineItems: PDFLineItem[] = lineItems.map((item, index) => ({
    index: index + 1,
    itemName: item.item_name || '',
    itemCode: item.item_code || '',
    quantity: Number(item.quantity),
    uom: item.uom || 'Unit',
    rate: Number(item.unit_price),
    amount: Number(item.amount),
    taxAmount: item.tax_amount ? Number(item.tax_amount) : undefined,
    totalAmount: Number(item.total_amount),
  }));

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalTax = lineItems.reduce((sum, item) => sum + Number(item.tax_amount || 0), 0);
  const discountAmount = Number(invoice.discount_amount ?? 0);

  return {
    type: 'invoice',
    documentNo: invoice.invoice_no,
    date: invoice.posting_date,
    dueDate: invoice.due_date,
    currency: invoice.currency,
    currencySymbol: getCurrencySymbolForPDF(invoice.currency ?? 'INR'),
    status: invoice.status,

    // Company info - you can customize this based on your organization data
    companyName: 'Your Company Name',
    companyAddress: '123 Business Street, City, State 12345',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'info@yourcompany.com',

    // Party info (customer or supplier)
    customerName: invoice.party_name || invoice.party_id,
    customerCode: invoice.party_id,

    // Line items
    lineItems: pdfLineItems,

    // Totals
    subtotal,
    discountAmount: discountAmount > 0 ? discountAmount : undefined,
    totalTax,
    grandTotal: Number(invoice.grand_total),

    // Additional info - convert null to undefined
    remarks: invoice.remarks || undefined,
  };
};
