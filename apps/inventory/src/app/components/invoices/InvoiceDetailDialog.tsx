import * as React from 'react';

import { FileText, Mail, Download, Eye } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components';

import { useInvoicePDFActions } from '../../hooks/useInvoicePDFActions';
import { SUPPORTED_CURRENCIES } from '../../types/currency.types';
import type { Invoice } from '../../types/invoice.types';
import { EmailComposer } from '../common';

import { InvoiceContent } from './InvoiceContent';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface InvoiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find((c: { code: string; symbol: string }) => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

export function InvoiceDetailDialog({ open, onOpenChange, invoice }: InvoiceDetailDialogProps) {
  const {
    pdfLoading,
    emailDialogOpen,
    setEmailDialogOpen,
    pdfAttachment,
    handleDownloadPDF,
    handlePreviewPDF,
    handleSendEmail,
    closeEmailDialog,
  } = useInvoicePDFActions(invoice);

  if (!invoice) return null;

  const currencySymbol = getCurrencySymbol(invoice.currency);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              {invoice.invoice_no}
              <InvoiceStatusBadge status={invoice.status} />
            </DialogTitle>
          </DialogHeader>

          <InvoiceContent invoice={invoice} currencySymbol={currencySymbol} />

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button variant="outline" onClick={handlePreviewPDF} disabled={pdfLoading} className="gap-2">
              <Eye className="h-4 w-4" />
              Preview PDF
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF} disabled={pdfLoading} className="gap-2">
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <Button variant="outline" onClick={handleSendEmail} disabled={pdfLoading} className="gap-2">
              <Mail className="h-4 w-4" />
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmailComposer open={emailDialogOpen}
        onOpenChange={(isOpen) => {
          setEmailDialogOpen(isOpen);
          if (!isOpen) closeEmailDialog();
        }}
        docType="invoice"
        docId={invoice.id}
        docNo={invoice.invoice_no}
        defaultRecipient=""
        defaultSubject={`Invoice ${invoice.invoice_no}`}
        defaultMessage={`Dear ${invoice.party_name || 'Customer'},\n\nPlease find attached invoice ${invoice.invoice_no} for your review.\n\nBest regards`}
        defaultAttachments={pdfAttachment ? [pdfAttachment] : undefined}
        onSuccess={closeEmailDialog}/>
    </>
  );
}
