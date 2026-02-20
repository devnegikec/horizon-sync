import { SUPPORTED_CURRENCIES } from '../../types/currency.types';
import type { SalesOrder } from '../../types/sales-order.types';

import type { PDFDocumentData, PDFLineItem } from './types';

export const convertSalesOrderToPDFData = (salesOrder: SalesOrder): PDFDocumentData => {
  const lineItems = salesOrder.items || [];

  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = SUPPORTED_CURRENCIES.find((c: { code: string; symbol: string }) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  const pdfLineItems: PDFLineItem[] = lineItems.map((item, index) => {
    const amount = Number(item.amount);
    const extra = item.extra_data || {};
    const taxAmount = Number(extra.tax_amount || 0);
    const totalAmount = Number(extra.total_amount || amount);
    const taxInfo = extra.tax_info as PDFLineItem['taxInfo'] | undefined;

    return {
      index: index + 1,
      itemName: item.item_name || '',
      itemCode: item.item_sku,
      quantity: Number(item.qty),
      uom: item.uom,
      rate: Number(item.rate),
      amount,
      taxAmount: taxAmount || undefined,
      totalAmount: totalAmount || amount,
      taxInfo: taxInfo || undefined,
    };
  });

  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalTax = lineItems.reduce((sum, item) => {
    const extra = item.extra_data || {};
    return sum + Number(extra.tax_amount || 0);
  }, 0);

  return {
    type: 'sales_order',
    documentNo: salesOrder.sales_order_no,
    date: salesOrder.order_date,
    dueDate: salesOrder.delivery_date || undefined,
    currency: salesOrder.currency,
    currencySymbol: getCurrencySymbol(salesOrder.currency),
    status: salesOrder.status,

    companyName: 'Your Company Name',
    companyAddress: '123 Business Street, City, State 12345',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'info@yourcompany.com',

    customerName: salesOrder.customer_name || 'N/A',

    lineItems: pdfLineItems,
    subtotal,
    totalTax,
    grandTotal: Number(salesOrder.grand_total),

    remarks: salesOrder.remarks || undefined,
  };
};
