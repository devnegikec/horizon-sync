import * as React from 'react';

import { FileText } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useQuotationPDFActions } from '../../hooks/useQuotationPDFActions';
import { getCurrencySymbol } from '../../types/currency.types';
import type { QuotationDetailDialogProps } from '../../types/quotation.types';
import { EmailComposer } from '../common';

import { QuotationDetailContent } from './QuotationDetailContent';
import { QuotationDetailFooter } from './QuotationDetailFooter';
import { StatusBadge } from './StatusBadge';

export function QuotationDetailDialog({ open, onOpenChange, quotation, onEdit, onConvert }: QuotationDetailDialogProps) {
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [pdfAttachment, setPdfAttachment] = React.useState<{ filename: string; content: string; content_type: string } | null>(null);
  const { toast } = useToast();
  const { loading: pdfLoading, handleDownload, handlePreview, handleGenerateBase64 } = useQuotationPDFActions();

  const currencySymbol = quotation ? getCurrencySymbol(quotation.currency) : '';

  const handleSendEmail = async () => {
    if (!quotation) return;
    const base64Content = await handleGenerateBase64(quotation);
    if (base64Content) {
      setPdfAttachment({ filename: `${quotation.quotation_no}.pdf`, content: base64Content, content_type: 'application/pdf' });
      setEmailDialogOpen(true);
    } else {
      toast({ title: 'PDF Generation Failed', description: 'Could not generate PDF attachment', variant: 'destructive' });
    }
  };

  const handleEmailClose = (isOpen: boolean) => {
    setEmailDialogOpen(isOpen);
    if (!isOpen) setPdfAttachment(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] overflow-y-auto">
          {quotation && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  {quotation.quotation_no}
                  <StatusBadge status={quotation.status} />
                </DialogTitle>
              </DialogHeader>

              <QuotationDetailContent quotation={quotation} currencySymbol={currencySymbol} />

              <QuotationDetailFooter quotation={quotation}
                pdfLoading={pdfLoading}
                onClose={() => onOpenChange(false)}
                onPreview={() => handlePreview(quotation)}
                onDownload={() => handleDownload(quotation)}
                onSendEmail={handleSendEmail}
                onEdit={onEdit}
                onConvert={onConvert} />
            </>
          )}
        </DialogContent>
      </Dialog>

      {quotation && (
        <EmailComposer open={emailDialogOpen}
          onOpenChange={handleEmailClose}
          docType="quotation"
          docId={quotation.id}
          docNo={quotation.quotation_no}
          defaultRecipient={quotation.customer?.email || ''}
          defaultSubject={`Quotation ${quotation.quotation_no}`}
          defaultMessage={`Dear ${quotation.customer_name || quotation.customer?.name || 'Customer'},\n\nPlease find attached quotation ${quotation.quotation_no} for your review.\n\nBest regards`}
          defaultAttachments={pdfAttachment ? [pdfAttachment] : undefined}
          onSuccess={() => {
            setEmailDialogOpen(false);
            setPdfAttachment(null);
          }} />
      )}
    </>
  );
}
