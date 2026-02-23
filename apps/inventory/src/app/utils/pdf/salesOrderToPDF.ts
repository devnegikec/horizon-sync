import { SUPPORTED_CURRENCIES } from '../../types/currency.types';
import type { SalesOrder } from '../../types/sales-order.types';

import type { PDFDocumentData, PDFLineItem } from './types';

export const convertSalesOrderToPDFData = (salesOrder: SalesOrder): PDFDocumentData => {
  const lineItems = salesOrder.items || [];

  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = SUPPORTED_CURRENCIES.find((c: { code: string; symbol: string }) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  // Convert line items with tax information
  const pdfLineItems: PDFLineItem[] = lineItems.map((item, index) => {
    const amount = Number(item.amount);
    
    // Get tax info from item directly or from extra_data
    const taxInfo = item.tax_info || (item.extra_data?.tax_info as typeof item.tax_info);
    const taxAmount = item.tax_amount || Number(item.extra_data?.tax_amount || 0);
    const totalAmount = item.total_amount || Number(item.extra_data?.total_amount || amount);

    return {
      index: index + 1,
      itemName: item.item_name || '',
      itemCode: item.item_sku || '',
      quantity: Number(item.qty),
      uom: item.uom || 'Unit',
      rate: Number(item.rate),
      amount,
      taxAmount: taxAmount > 0 ? taxAmount : undefined,
      totalAmount: totalAmount || amount,
      taxInfo: taxInfo ? {
        templateName: taxInfo.template_name,
        breakup: taxInfo.breakup.map(tax => ({
          rule_name: tax.rule_name,
          rate: tax.rate,
        })),
      } : undefined,
    };
  });

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalTax = lineItems.reduce((sum, item) => {
    const taxAmount = item.tax_amount || Number(item.extra_data?.tax_amount || 0);
    return sum + taxAmount;
  }, 0);

  // Get customer details
  const customer = salesOrder.customer;

  return {
    type: 'sales_order',
    documentNo: salesOrder.sales_order_no,
    date: salesOrder.order_date,
    dueDate: salesOrder.delivery_date || undefined,
    currency: salesOrder.currency,
    currencySymbol: getCurrencySymbol(salesOrder.currency),
    status: salesOrder.status,

    // Company info - you can customize this based on your organization data
    companyName: 'Your Company Name',
    companyAddress: '123 Business Street, City, State 12345',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'info@yourcompany.com',

    // Customer info
    customerName: customer?.customer_name || salesOrder.customer_name || 'N/A',
    customerCode: customer?.customer_code,
    customerAddress: customer?.address || customer?.address_line1 
      ? [
          customer?.address,
          customer?.address_line1,
          customer?.address_line2,
          [customer?.city, customer?.state, customer?.postal_code].filter(Boolean).join(', '),
          customer?.country,
        ].filter(Boolean).join('\n')
      : undefined,
    customerPhone: customer?.phone,
    customerEmail: customer?.email,

    // Line items with tax info
    lineItems: pdfLineItems,

    // Totals
    subtotal,
    totalTax,
    grandTotal: Number(salesOrder.grand_total),

    // Additional info
    remarks: salesOrder.remarks || undefined,
  };
};
