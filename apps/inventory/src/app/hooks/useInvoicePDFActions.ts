import { useCallback, useState } from 'react';

import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import type { Invoice } from '../types/invoice.types';
import { convertInvoiceToPDFData } from '../utils/pdf/invoiceToPDF';

import { usePDFGeneration } from './usePDFGeneration';

export interface PDFAttachment {
  filename: string;
  content: string;
  content_type: string;
}

export function useInvoicePDFActions(invoice: Invoice | null) {
  const { toast } = useToast();
  const { loading: pdfLoading, download, preview, generateBase64 } = usePDFGeneration();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [pdfAttachment, setPdfAttachment] = useState<PDFAttachment | null>(null);

  const handleDownloadPDF = useCallback(async () => {
    if (!invoice) return;
    try {
      const pdfData = convertInvoiceToPDFData(invoice);
      await download(pdfData, `${invoice.invoice_no}.pdf`);
      toast({ title: 'PDF Downloaded', description: `${invoice.invoice_no}.pdf has been downloaded` });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  }, [invoice, download, toast]);

  const handlePreviewPDF = useCallback(async () => {
    if (!invoice) return;
    try {
      const pdfData = convertInvoiceToPDFData(invoice);
      await preview(pdfData);
    } catch (error) {
      toast({
        title: 'Preview Failed',
        description: error instanceof Error ? error.message : 'Failed to preview PDF',
        variant: 'destructive',
      });
    }
  }, [invoice, preview, toast]);

  const handleSendEmail = useCallback(async () => {
    if (!invoice) return;
    try {
      const pdfData = convertInvoiceToPDFData(invoice);
      const base64Content = await generateBase64(pdfData);

      if (base64Content) {
        setPdfAttachment({
          filename: `${invoice.invoice_no}.pdf`,
          content: base64Content,
          content_type: 'application/pdf',
        });
        setEmailDialogOpen(true);
      } else {
        toast({
          title: 'PDF Generation Failed',
          description: 'Could not generate PDF attachment',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to prepare email',
        variant: 'destructive',
      });
    }
  }, [invoice, generateBase64, toast]);

  const closeEmailDialog = useCallback(() => {
    setEmailDialogOpen(false);
    setPdfAttachment(null);
  }, []);

  return {
    pdfLoading,
    emailDialogOpen,
    setEmailDialogOpen,
    pdfAttachment,
    handleDownloadPDF,
    handlePreviewPDF,
    handleSendEmail,
    closeEmailDialog,
  };
}
