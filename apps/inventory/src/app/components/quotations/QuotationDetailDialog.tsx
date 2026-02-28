import * as React from 'react';

import { Edit, FileText, Mail, Download, Eye } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useQuotationPDFActions } from '../../hooks/useQuotationPDFActions';
import { getCurrencySymbol } from '../../types/currency.types';
import type { Quotation, QuotationDetailDialogProps } from '../../types/quotation.types';
import { CustomerAddressBlock, EmailComposer, LineItemsDetailTable, TaxSummaryCollapsible } from '../common';

import { buildTaxSummaryMap, formatDate } from './quotation.helpers';
import { StatusBadge } from './StatusBadge';

// ── Sub-components ────────────────────────────────────────────────────────────

// Footer rows aligned with table columns: #, Item, Qty, UOM, Rate, Amount, Discount, Tax, Total (9 when showDiscount)
function LineItemsFooterRows({
  items,
  quotation,
  currencySymbol,
}: {
  items: Quotation['items'];
  quotation: Quotation;
  currencySymbol: string;
}) {
  const safeItems = items ?? [];
  const subtotalAmount = safeItems.reduce((s, i) => s + Number(i.amount || 0), 0);
  const subtotalTax = safeItems.reduce((s, i) => s + Number(i.tax_amount || 0), 0);
  const subtotalTotal = safeItems.reduce((s, i) => s + Number(i.total_amount || i.amount || 0), 0);
  const discountAmount = Number(quotation.discount_amount ?? 0);
  const grandTotal = Number(quotation.grand_total ?? 0);
  const sym = currencySymbol;

  return (
    <>
      {/* Subtotal: label under Rate; amounts under Amount, Discount(col), Tax, Total */}
      <tr>
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-right text-sm font-medium">Subtotal:</td>
        <td className="px-4 py-3 text-right text-sm font-medium">{sym}{subtotalAmount.toFixed(2)}</td>
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-right text-sm font-medium">{sym}{subtotalTax.toFixed(2)}</td>
        <td className="px-4 py-3 text-right text-sm font-medium">{sym}{subtotalTotal.toFixed(2)}</td>
      </tr>
      {/* Discount: label under Rate; document discount under Total column */}
      <tr>
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-right text-sm font-medium">Discount:</td>
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-right text-sm text-muted-foreground">
          {discountAmount > 0 ? `−${sym}${discountAmount.toFixed(2)}` : '—'}
        </td>
      </tr>
      {/* Grand Total: label under Rate; value under Total */}
      <tr className="border-t-2 font-semibold">
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-right text-sm font-bold">Grand Total:</td>
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3" />
        <td className="px-4 py-3 text-right text-sm font-semibold">{sym}{grandTotal.toFixed(2)}</td>
      </tr>
    </>
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
        getItemDiscountAmount={(item) => Number(item.discount_amount ?? 0)}
        renderFooter={(items) => (
          <LineItemsFooterRows items={items} quotation={quotation} currencySymbol={currencySymbol} />
        )}/>
    </div>
  );
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

// ── Detail content (inside DialogContent) ─────────────────────────────────────

function QuotationDetailContent({ quotation, currencySymbol }: { quotation: Quotation; currencySymbol: string }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Quotation Number</p>
          <p className="text-lg font-semibold">{quotation.quotation_no}</p>
        </div>
        <CustomerAddressBlock customerName={quotation.customer_name || quotation.customer?.name} customer={quotation.customer} />
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
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

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
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    Quotation Details
                  </DialogTitle>
                  <StatusBadge status={quotation.status} />
                </div>
              </DialogHeader>

              <QuotationDetailContent quotation={quotation} currencySymbol={currencySymbol} />

              <DialogFooterButtons quotation={quotation}
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
