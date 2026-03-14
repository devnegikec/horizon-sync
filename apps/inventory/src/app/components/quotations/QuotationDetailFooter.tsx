import * as React from 'react';

import { Edit, FileText, Mail, Download, Eye } from 'lucide-react';

import { Button, DialogFooter } from '@horizon-sync/ui/components';

import type { QuotationDetailFooterProps } from '../../types/quotation.types';

export function QuotationDetailFooter({ quotation, pdfLoading, onClose, onPreview, onDownload, onSendEmail, onEdit, onConvert }: QuotationDetailFooterProps) {
  const isTerminalStatus = quotation.status === 'accepted' || quotation.status === 'rejected' || quotation.status === 'expired';
  const canConvert = quotation.status === 'accepted' && !quotation.converted_to_sales_order;
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
      {canConvert && (
        <Button variant="default" onClick={() => onConvert(quotation)} className="gap-2">
          <FileText className="h-4 w-4" />Convert to Sales Order
        </Button>
      )}
      {!isTerminalStatus && (
        <Button variant="default" onClick={() => onEdit(quotation)} className="gap-2">
          <Edit className="h-4 w-4" />Edit
        </Button>
      )}
    </DialogFooter>
  );
}
