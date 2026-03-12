import * as React from 'react';

import { Edit, Mail, Download, Eye, Receipt, Truck } from 'lucide-react';

import { Button, DialogFooter } from '@horizon-sync/ui/components';

import type { SalesOrder } from '../../types/sales-order.types';

export interface SalesOrderDetailFooterProps {
  salesOrder: SalesOrder;
  pdfLoading: boolean;
  onClose: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onSendEmail: () => void;
  onEdit: (so: SalesOrder) => void;
  onCreateInvoice: (so: SalesOrder) => void;
  onCreateDeliveryNote: (so: SalesOrder) => void;
}

export function SalesOrderDetailFooter({ salesOrder, pdfLoading, onClose, onPreview, onDownload, onSendEmail, onEdit, onCreateInvoice, onCreateDeliveryNote }: SalesOrderDetailFooterProps) {
  const isClosedOrCancelled = salesOrder.status === 'closed' || salesOrder.status === 'cancelled';
  const canCreateInvoice = salesOrder.status === 'confirmed' || salesOrder.status === 'partially_delivered' || salesOrder.status === 'delivered';
  const canCreateDeliveryNote = salesOrder.status === 'confirmed' || salesOrder.status === 'partially_delivered';
  
  // Check if all items are fully billed
  const allItemsFullyBilled = salesOrder.items?.every((item) => {
    const qty = Number(item.qty);
    const billedQty = Number(item.billed_qty || 0);
    return billedQty >= qty;
  }) ?? false;
  
  // Disable Create Invoice button if all items are fully billed
  const canShowCreateInvoice = canCreateInvoice && !allItemsFullyBilled;

  return (
    <DialogFooter>
      <Button variant="outline" onClick={onClose}>Close</Button>
      <Button variant="outline" onClick={onPreview} disabled={pdfLoading} className="gap-2">
        <Eye className="h-4 w-4" />Preview PDF
      </Button>
      <Button variant="outline" onClick={onDownload} disabled={pdfLoading} className="gap-2">
        <Download className="h-4 w-4" />Download PDF
      </Button>
      <Button variant="outline" onClick={onSendEmail} disabled={pdfLoading} className="gap-2">
        <Mail className="h-4 w-4" />Send Email
      </Button>
      {canShowCreateInvoice && (
        <Button variant="default" onClick={() => onCreateInvoice(salesOrder)} className="gap-2">
          <Receipt className="h-4 w-4" />Create Invoice
        </Button>
      )}
      {canCreateDeliveryNote && (
        <Button variant="default" onClick={() => onCreateDeliveryNote(salesOrder)} className="gap-2">
          <Truck className="h-4 w-4" />Create Delivery Note
        </Button>
      )}
      {!isClosedOrCancelled && (
        <Button variant="default" onClick={() => onEdit(salesOrder)} className="gap-2">
          <Edit className="h-4 w-4" />Edit
        </Button>
      )}
    </DialogFooter>
  );
}
