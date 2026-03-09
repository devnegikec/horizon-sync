import * as React from 'react';

import { ShoppingCart } from 'lucide-react';

import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useEmailWithPdfAttachment } from '../../hooks/useEmailWithPdfAttachment';
import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { SUPPORTED_CURRENCIES } from '../../types/currency.types';
import type { SalesOrder } from '../../types/sales-order.types';
import { convertSalesOrderToPDFData } from '../../utils/pdf/salesOrderToPDF';
import { DetailDialogContainer, EmailComposer } from '../common';

import { SalesOrderDetailContent } from './SalesOrderDetailContent';
import { SalesOrderDetailFooter } from './SalesOrderDetailFooter';

interface SalesOrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null;
  onEdit: (salesOrder: SalesOrder) => void;
  onCreateInvoice: (salesOrder: SalesOrder) => void;
  onCreateDeliveryNote: (salesOrder: SalesOrder) => void;
  onViewInvoice?: (invoiceId: string) => void;
}

function useSalesOrderPDFActions() {
  const { toast } = useToast();
  const { loading, download, preview, generateBase64 } = usePDFGeneration();

  const handleDownload = async (salesOrder: SalesOrder) => {
    try {
      const pdfData = convertSalesOrderToPDFData(salesOrder);
      await download(pdfData, `${salesOrder.sales_order_no}.pdf`);
      toast({ title: 'PDF Downloaded', description: `${salesOrder.sales_order_no}.pdf has been downloaded` });
    } catch (error) {
      toast({ title: 'Download Failed', description: error instanceof Error ? error.message : 'Failed to download PDF', variant: 'destructive' });
    }
  };

  const handlePreview = async (salesOrder: SalesOrder) => {
    try {
      const pdfData = convertSalesOrderToPDFData(salesOrder);
      await preview(pdfData);
    } catch (error) {
      toast({ title: 'Preview Failed', description: error instanceof Error ? error.message : 'Failed to preview PDF', variant: 'destructive' });
    }
  };

  const handleGenerateBase64 = async (salesOrder: SalesOrder): Promise<string | null> => {
    const pdfData = convertSalesOrderToPDFData(salesOrder);
    return generateBase64(pdfData);
  };

  return { loading, handleDownload, handlePreview, handleGenerateBase64 };
}

function SalesOrderEmailComposer({ salesOrder, emailDialogOpen, pdfAttachment, onOpenChange, onSuccess }: {
  salesOrder: SalesOrder;
  emailDialogOpen: boolean;
  pdfAttachment: { filename: string; content: string; content_type: string } | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  return (
    <EmailComposer open={emailDialogOpen}
      onOpenChange={onOpenChange}
      docType="sales_order"
      docId={salesOrder.id}
      docNo={salesOrder.sales_order_no}
      defaultRecipient={salesOrder.customer?.email || ''}
      defaultSubject={`Sales Order ${salesOrder.sales_order_no}`}
      defaultMessage={`Dear ${salesOrder.customer_name || 'Customer'},\n\nPlease find attached sales order ${salesOrder.sales_order_no} for your reference.\n\nBest regards`}
      defaultAttachments={pdfAttachment ? [pdfAttachment] : undefined}
      onSuccess={onSuccess} />
  );
}

export function SalesOrderDetailDialog({ open, onOpenChange, salesOrder, onEdit, onCreateInvoice, onCreateDeliveryNote, onViewInvoice }: SalesOrderDetailDialogProps) {
  const { loading: pdfLoading, handleDownload, handlePreview, handleGenerateBase64 } = useSalesOrderPDFActions();
  const { emailDialogOpen, pdfAttachment, openEmailWithPdf, handleEmailClose, handleEmailSuccess } = useEmailWithPdfAttachment();

  const currencySymbol = React.useMemo(() => {
    if (!salesOrder) return '';
    const currency = SUPPORTED_CURRENCIES.find((c: { code: string; symbol: string }) => c.code === salesOrder.currency);
    return currency?.symbol || salesOrder.currency;
  }, [salesOrder]);

  const handleSendEmail = () => {
    if (!salesOrder) return;
    openEmailWithPdf(() => handleGenerateBase64(salesOrder), `${salesOrder.sales_order_no}.pdf`);
  };

  return (
    <>
      <DetailDialogContainer open={open} onOpenChange={onOpenChange} icon={ShoppingCart} title={salesOrder?.sales_order_no ?? ''} status={salesOrder?.status ?? ''}>
        {salesOrder && (
          <>
            <SalesOrderDetailContent salesOrder={salesOrder} currencySymbol={currencySymbol} onViewInvoice={onViewInvoice} />
            <SalesOrderDetailFooter salesOrder={salesOrder}
              pdfLoading={pdfLoading}
              onClose={() => onOpenChange(false)}
              onPreview={() => handlePreview(salesOrder)}
              onDownload={() => handleDownload(salesOrder)}
              onSendEmail={handleSendEmail}
              onEdit={onEdit}
              onCreateInvoice={onCreateInvoice}
              onCreateDeliveryNote={onCreateDeliveryNote} />
          </>
        )}
      </DetailDialogContainer>

      {salesOrder && (
        <SalesOrderEmailComposer salesOrder={salesOrder}
          emailDialogOpen={emailDialogOpen}
          pdfAttachment={pdfAttachment}
          onOpenChange={handleEmailClose}
          onSuccess={handleEmailSuccess} />
      )}
    </>
  );
}
