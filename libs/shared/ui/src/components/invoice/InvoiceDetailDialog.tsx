import * as React from 'react';

import { FileText, Mail, Download, Eye } from 'lucide-react';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

import { SUPPORTED_CURRENCIES } from '../../types/currency.types';
import type { Invoice } from '../../types/invoice.types';
import type { BankAccount } from './BankAccountDetails';

import { InvoiceContent } from './InvoiceContent';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

export interface InvoiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onDownloadPDF?: () => void;
  onPreviewPDF?: () => void;
  onSendEmail?: () => void;
  pdfLoading?: boolean;
  emailDialog?: React.ReactNode;
  bankAccount?: BankAccount | null;
  bankAccountLoading?: boolean;
}

function getCurrencySymbol(currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find((c: { code: string; symbol: string }) => c.code === currencyCode);
  return currency?.symbol || currencyCode;
}

export function InvoiceDetailDialog({
  open,
  onOpenChange,
  invoice,
  onDownloadPDF,
  onPreviewPDF,
  onSendEmail,
  pdfLoading = false,
  emailDialog,
  bankAccount,
  bankAccountLoading,
}: InvoiceDetailDialogProps) {
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

          <InvoiceContent
            invoice={invoice}
            currencySymbol={currencySymbol}
            bankAccount={bankAccount}
            bankAccountLoading={bankAccountLoading}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {onPreviewPDF && (
              <Button variant="outline" onClick={onPreviewPDF} disabled={pdfLoading} className="gap-2">
                <Eye className="h-4 w-4" />
                Preview PDF
              </Button>
            )}
            {onDownloadPDF && (
              <Button variant="outline" onClick={onDownloadPDF} disabled={pdfLoading} className="gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            )}
            {onSendEmail && (
              <Button variant="outline" onClick={onSendEmail} disabled={pdfLoading} className="gap-2">
                <Mail className="h-4 w-4" />
                Send Email
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {emailDialog}
    </>
  );
}
