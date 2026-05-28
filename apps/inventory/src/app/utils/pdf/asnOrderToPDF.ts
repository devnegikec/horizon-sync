import type { AsnOrder } from '../../types/asn-order.types';
import type { Warehouse } from '../../types/warehouse.types';

import { getCurrencySymbolForPDF } from './pdfCurrency';
import type { PDFDocumentData, PDFLineItem } from './types';

export const convertAsnOrderToPDFData = (asnOrder: AsnOrder, targetWarehouse?: Warehouse | null): PDFDocumentData => {
  const lineItems = asnOrder.items || [];

  const pdfLineItems: PDFLineItem[] = lineItems.map((item, index) => {
    const qty = typeof item.qty === 'object' ? item.qty.qty : Number(item.qty) || 0;
    return {
      index: index + 1,
      itemName: item.item_name || '',
      itemCode: item.item_sku || '',
      quantity: qty,
      uom: item.uom || 'pcs',
      rate: 0,
      amount: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
    };
  });

  const totalQty = lineItems.reduce((sum, item) => {
    const qty = typeof item.qty === 'object' ? item.qty.qty : Number(item.qty) || 0;
    return sum + qty;
  }, 0);

  const fromWarehouse = asnOrder.from_warehouse;
  const toWarehouse = asnOrder.to_warehouse;
  const toWarehouseDetails = targetWarehouse || asnOrder.warehouse;

  const buildAddress = (w: typeof toWarehouseDetails) => {
    if (!w) return undefined;
    const parts = [
      (w as Warehouse).address_line1,
      (w as Warehouse).address_line2,
      [(w as Warehouse).city, (w as Warehouse).state].filter(Boolean).join(', '),
      (w as Warehouse).postal_code,
      (w as Warehouse).country,
      (w as { address?: string }).address,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join('\n') : undefined;
  };

  const toWarehouseAddress = buildAddress(toWarehouseDetails) || (toWarehouse
    ? [toWarehouse.name, toWarehouse.code].filter(Boolean).join('\n')
    : undefined);

  const targetName = toWarehouse?.name || toWarehouseDetails?.name || 'N/A';
  const targetCode = toWarehouse?.code || (toWarehouseDetails as Warehouse | undefined)?.code || undefined;
  const targetPhone = (toWarehouseDetails as Warehouse | undefined)?.contact_phone || (toWarehouseDetails as { phone?: string } | undefined)?.phone || undefined;
  const targetEmail = (toWarehouseDetails as Warehouse | undefined)?.contact_email || (toWarehouseDetails as { email?: string } | undefined)?.email || undefined;

  return {
    type: 'asn',
    documentNo: asnOrder.asn_order_no,
    date: asnOrder.order_date,
    dueDate: asnOrder.delivery_date || undefined,
    currency: 'INR',
    currencySymbol: getCurrencySymbolForPDF('INR'),
    status: asnOrder.status,

    companyName: fromWarehouse?.name || 'Your Company Name',
    companyAddress: fromWarehouse?.code || undefined,

    customerName: targetName,
    customerCode: targetCode,
    customerAddress: toWarehouseAddress,
    customerPhone: targetPhone,
    customerEmail: targetEmail,

    lineItems: pdfLineItems,

    subtotal: 0,
    discountAmount: 0,
    totalTax: 0,
    grandTotal: totalQty,

    remarks: asnOrder.remarks || undefined,
  };
};
