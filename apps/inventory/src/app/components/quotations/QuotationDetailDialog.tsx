import * as React from 'react';

import { Edit, FileText, Mail, Download, Eye } from 'lucide-react';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { useUserStore } from '@horizon-sync/store';
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { getCurrencySymbol } from '../../types/currency.types';
import type { Quotation } from '../../types/quotation.types';
import { convertQuotationToPDFData } from '../../utils/pdf/quotationToPDF';
import { EmailComposer, LineItemsDetailTable, TaxSummaryCollapsible } from '../common';

import { StatusBadge } from './StatusBadge';

interface QuotationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null;
  onEdit: (quotation: Quotation) => void;
  onConvert: (quotation: Quotation) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function buildTaxSummaryMap(quotation: Quotation) {
  const lineItems = quotation.items || quotation.line_items || [];
  const map = new Map<string, { name: string; amount: number; breakup: Array<{ rule_name: string; rate: number; amount: number }> }>();
  lineItems.forEach((item) => {
    if (!item.tax_info) return;
    const key = item.tax_info.template_code;
    if (!map.has(key)) {
      map.set(key, {
        name: item.tax_info.template_name,
        amount: 0,
        breakup: item.tax_info.breakup.map((t) => ({ rule_name: t.rule_name, rate: t.rate, amount: 0 })),
      });
    }
    const entry = map.get(key);
    if (entry) {
      entry.amount += Number(item.tax_amount || 0);
      item.tax_info.breakup.forEach((t, idx) => {
        entry.breakup[idx].amount += (Number(item.amount) * t.rate) / 100;
      });
    }
  });
  return map;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CustomerAddressLines({ quotation }: { quotation: Quotation }) {
  const { customer } = quotation;
  if (!customer) return null;
  const cityLine = [customer.city, customer.state, customer.postal_code].filter(Boolean).join(', ');
  return (
    <div className="text-sm text-muted-foreground mt-1 space-y-0.5">
      {customer.address_line1 && <p>{customer.address_line1}</p>}
      {customer.address_line2 && <p>{customer.address_line2}</p>}
      {cityLine && <p>{cityLine}</p>}
      {customer.country && <p>{customer.country}</p>}
      {customer.phone && <p>{customer.phone}</p>}
      {customer.email && <p>{customer.email}</p>}
      {customer.tax_number && <p className="text-xs">Tax No: {customer.tax_number}</p>}
    </div>
  );
}

function CustomerAddressBlock({ quotation }: { quotation: Quotation }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">Customer</p>
      <p className="text-lg font-semibold">{quotation.customer_name || quotation.customer?.name || 'N/A'}</p>
      <CustomerAddressLines quotation={quotation} />
    </div>
  );
}

function LineItemsFooterRow({ items, currencySymbol }: { items: Quotation['items']; currencySymbol: string }) {
  const safeItems = items ?? [];
  return (
    <tr>
      <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium">Subtotal:</td>
      <td className="px-4 py-3 text-right text-sm font-semibold">
        {currencySymbol} {safeItems.reduce((s, i) => s + Number(i.amount || 0), 0).toFixed(2)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-semibold">
        {currencySymbol} {safeItems.reduce((s, i) => s + Number(i.tax_amount || 0), 0).toFixed(2)}
      </td>
      <td className="px-4 py-3 text-right text-sm font-bold">
        {currencySymbol} {safeItems.reduce((s, i) => s + Number(i.total_amount || i.amount), 0).toFixed(2)}
      </td>
    </tr>
  );
}

function QuotationLineItemsSection({ quotation, currencySymbol }: { quotation: Quotation; currencySymbol: string }) {
  const lineItems = quotation.items || quotation.line_items || [];
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Line Items</h3>
      <LineItemsDetailTable items={lineItems}
        currencySymbol={currencySymbol}
        hasTaxInfo
        getItemSKU={(item) => item.item_code}
        getItemTotalAmount={(item) => Number(item.total_amount || item.amount || 0)}
        renderFooter={(items) => <LineItemsFooterRow items={items} currencySymbol={currencySymbol} />} />
    </div>
  );
}

// ── PDF actions hook ──────────────────────────────────────────────────────────

function useQuotationPDFActions(quotation: Quotation) {
  const { toast } = useToast();
  const { loading, download, preview, generateBase64 } = usePDFGeneration();
  const organization = useUserStore((s) => s.organization);

  const getPDFData = () => convertQuotationToPDFData(quotation, { organization });

  const handleDownload = async () => {
    try {
      await download(getPDFData(), `${quotation.quotation_no}.pdf`);
      toast({ title: 'PDF Downloaded', description: `${quotation.quotation_no}.pdf has been downloaded` });
    } catch (error) {
      toast({ title: 'Download Failed', description: error instanceof Error ? error.message : 'Failed to download PDF', variant: 'destructive' });
    }
  };

  const handlePreview = async () => {
    try {
      await preview(getPDFData());
    } catch (error) {
      toast({ title: 'Preview Failed', description: error instanceof Error ? error.message : 'Failed to preview PDF', variant: 'destructive' });
    }
  };

  const handleGenerateBase64 = async () => {
    try {
      return await generateBase64(getPDFData());
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to prepare email', variant: 'destructive' });
      return null;
    }
  };

  return { loading, handleDownload, handlePreview, handleGenerateBase64 };
}

// ── Dialog footer buttons ─────────────────────────────────────────────────────

interface DialogFooterButtonsProps {
  quotation: Quotation;
  pdfLoading: boolean;
  onClose: () => void;
  onPreview: () => void;
  onDownload: () => void;
  onSendEmail: () => void;
  onEdit: (q: Quotation) => void;
  onConvert: (q: Quotation) => void;
}

function DialogFooterButtons({ quotation, pdfLoading, onClose, onPreview, onDownload, onSendEmail, onEdit, onConvert }: DialogFooterButtonsProps) {
  const isTerminalStatus = quotation.status === 'accepted' || quotation.status === 'rejected' || quotation.status === 'expired';
  const canConvert = quotation.status === 'accepted';
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

// ── Dialog body (rendered only when quotation is non-null) ────────────────────

interface QuotationDialogBodyProps {
  quotation: Quotation;
  onOpenChange: (open: boolean) => void;
  onEdit: (quotation: Quotation) => void;
  onConvert: (quotation: Quotation) => void;
}

function QuotationDialogBody({ quotation, onOpenChange, onEdit, onConvert }: QuotationDialogBodyProps) {
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [pdfAttachment, setPdfAttachment] = React.useState<{ filename: string; content: string; content_type: string } | null>(null);
  const { toast } = useToast();
  const { loading: pdfLoading, handleDownload, handlePreview, handleGenerateBase64 } = useQuotationPDFActions(quotation);

  const currencySymbol = getCurrencySymbol(quotation.currency);

  const handleSendEmail = async () => {
    const base64Content = await handleGenerateBase64();
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              Quotation Details
            </DialogTitle>
            <StatusBadge status={quotation.status} />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Quotation Number</p>
              <p className="text-lg font-semibold">{quotation.quotation_no}</p>
            </div>
            <CustomerAddressBlock quotation={quotation} />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Quotation Date</p>
              <p className="font-medium">{formatDate(quotation.quotation_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valid Until</p>
              <p className="font-medium">{formatDate(quotation.valid_until)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="font-medium">{quotation.currency}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grand Total</p>
              <p className="font-medium">{currencySymbol} {Number(quotation.grand_total).toFixed(2)}</p>
            </div>
          </div>

          <Separator />
          <QuotationLineItemsSection quotation={quotation} currencySymbol={currencySymbol} />
          <TaxSummaryCollapsible taxSummary={buildTaxSummaryMap(quotation)} currencySymbol={currencySymbol} />

          {quotation.remarks && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Remarks</p>
              <p className="text-sm">{quotation.remarks}</p>
            </div>
          )}

          <Separator />
          <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div><p>Created: {formatDate(quotation.created_at)}</p></div>
            {quotation.updated_at && <div><p>Updated: {formatDate(quotation.updated_at)}</p></div>}
          </div>
        </div>

        <DialogFooterButtons quotation={quotation}
          pdfLoading={pdfLoading}
          onClose={() => onOpenChange(false)}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onSendEmail={handleSendEmail}
          onEdit={onEdit}
          onConvert={onConvert} />
      </DialogContent>

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
    </>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

export function QuotationDetailDialog({ open, onOpenChange, quotation, onEdit, onConvert }: QuotationDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {quotation && (
        <QuotationDialogBody quotation={quotation}
          onOpenChange={onOpenChange}
          onEdit={onEdit}
          onConvert={onConvert} />
      )}
    </Dialog>
  );
}
