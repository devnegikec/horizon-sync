import * as React from 'react';

import { FileText } from 'lucide-react';

import { useEmailWithPdfAttachment } from '../../hooks/useEmailWithPdfAttachment';
import { useQuotationPDFActions } from '../../hooks/useQuotationPDFActions';
import { getCurrencySymbol } from '../../types/currency.types';
import type { Quotation, QuotationDetailDialogProps } from '../../types/quotation.types';
import { DetailDialogContainer, EmailComposer } from '../common';

import { QuotationDetailContent } from './QuotationDetailContent';
import { QuotationDetailFooter } from './QuotationDetailFooter';

function QuotationEmailComposer({ quotation, emailDialogOpen, pdfAttachment, onOpenChange, onSuccess }: {
  quotation: Quotation;
  emailDialogOpen: boolean;
  pdfAttachment: { filename: string; content: string; content_type: string } | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  return (
    <EmailComposer open={emailDialogOpen}
      onOpenChange={onOpenChange}
      docType="quotation"
      docId={quotation.id}
      docNo={quotation.quotation_no}
      defaultRecipient={quotation.customer?.email || ''}
      defaultSubject={`Quotation ${quotation.quotation_no}`}
      defaultMessage={`Dear ${quotation.customer_name || quotation.customer?.name || 'Customer'},\n\nPlease find attached quotation ${quotation.quotation_no} for your review.\n\nBest regards`}
      defaultAttachments={pdfAttachment ? [pdfAttachment] : undefined}
      onSuccess={onSuccess} />
  );
}

export function QuotationDetailDialog({ open, onOpenChange, quotation, onEdit, onConvert }: QuotationDetailDialogProps) {
  const { loading: pdfLoading, handleDownload, handlePreview, handleGenerateBase64 } = useQuotationPDFActions();
  const { emailDialogOpen, pdfAttachment, openEmailWithPdf, handleEmailClose, handleEmailSuccess } = useEmailWithPdfAttachment();

  const currencySymbol = quotation ? getCurrencySymbol(quotation.currency) : '';

  const handleSendEmail = () => {
    if (!quotation) return;
    openEmailWithPdf(() => handleGenerateBase64(quotation), `${quotation.quotation_no}.pdf`);
  };

  return (
    <>
      <DetailDialogContainer open={open} onOpenChange={onOpenChange} icon={FileText} title={quotation?.quotation_no ?? ''} status={quotation?.status ?? ''}>
        {quotation && (
          <>
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
      </DetailDialogContainer>

      {quotation && (
        <QuotationEmailComposer quotation={quotation}
          emailDialogOpen={emailDialogOpen}
          pdfAttachment={pdfAttachment}
          onOpenChange={handleEmailClose}
          onSuccess={handleEmailSuccess} />
      )}
    </>
  );
}
