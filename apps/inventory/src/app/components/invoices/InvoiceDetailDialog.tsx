import * as React from 'react';

import { FileText, User, Calendar, DollarSign, Mail, Download, Eye, MapPin, Phone } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { SUPPORTED_CURRENCIES } from '../../types/currency.types';
import type { Invoice, InvoiceLineItem, PartyDetails } from '../../types/invoice.types';
import { formatDate } from '../../utility/formatDate';
import { convertInvoiceToPDFData } from '../../utils/pdf/invoiceToPDF';
import { EmailComposer, LineItemsDetailTable, TaxSummaryCollapsible } from '../common';

import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface InvoiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

// Helper to get party name
function getPartyName(party: PartyDetails | undefined, fallbackName?: string): string {
  return party?.customer_name || party?.supplier_name || fallbackName || 'N/A';
}

// Sub-component for party header
function PartyHeader({ party, partyName }: { party: PartyDetails | undefined; partyName: string }) {
  return (
    <div className="flex items-start gap-2">
      <User className="h-5 w-5 text-muted-foreground mt-0.5" />
      <div className="flex-1">
        <p className="text-lg font-semibold">{partyName}</p>
        {party?.customer_code && <p className="text-sm text-muted-foreground">Code: {party.customer_code}</p>}
        {party?.tax_number && <p className="text-sm text-muted-foreground">Tax Number: {party.tax_number}</p>}
      </div>
    </div>
  );
}

// Sub-component for invoice header
function InvoiceHeader({ invoice }: { invoice: Invoice }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div>
        <p className="text-sm text-muted-foreground">Invoice Number</p>
        <p className="text-lg font-semibold font-mono">{invoice.invoice_no}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Type</p>
        <p className="text-lg font-semibold capitalize">{invoice.invoice_type}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Currency</p>
        <p className="text-lg font-semibold">{invoice.currency}</p>
      </div>
    </div>
  );
}

// Sub-component for contact details
function ContactDetails({ party }: { party: PartyDetails | undefined }) {
  if (!party?.email && !party?.phone) return null;

  return (
    <div className="space-y-2 pt-2 border-t">
      {party?.email && (
        <div className="flex items-center gap-2 text-sm">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <a href={`mailto:${party.email}`} className="text-primary hover:underline">
            {party.email}
          </a>
        </div>
      )}
      {party?.phone && (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <a href={`tel:${party.phone}`} className="text-primary hover:underline">
            {party.phone}
          </a>
        </div>
      )}
    </div>
  );
}

// Sub-component for address details
function AddressDetails({ party }: { party: PartyDetails | undefined }) {
  const hasAddress = party?.address || party?.address_line1 || party?.city || party?.country;
  if (!hasAddress) return null;

  const cityStatePostal = [party?.city, party?.state, party?.postal_code].filter(Boolean).join(', ');

  return (
    <div className="space-y-1 pt-2 border-t">
      <div className="flex items-start gap-2 text-sm">
        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
        <div className="text-muted-foreground">
          {party?.address && <p>{party.address}</p>}
          {party?.address_line1 && <p>{party.address_line1}</p>}
          {party?.address_line2 && <p>{party.address_line2}</p>}
          {cityStatePostal && <p>{cityStatePostal}</p>}
          {party?.country && <p>{party.country}</p>}
        </div>
      </div>
    </div>
  );
}

// Sub-component for party information with contact details
function PartyInfo({ invoice }: { invoice: Invoice }) {
  const party = invoice.invoice_type === 'sales' ? invoice.customer : invoice.supplier;
  const partyLabel = invoice.invoice_type === 'sales' ? 'Customer' : 'Supplier';
  const partyName = getPartyName(party, invoice.party_name);

  return (
    <div className="rounded-lg border p-4 bg-muted/30 space-y-3">
      <p className="text-sm text-muted-foreground">{partyLabel} Information</p>
      <PartyHeader party={party} partyName={partyName} />
      <ContactDetails party={party} />
      <AddressDetails party={party} />
    </div>
  );
}

// Sub-component for dates
function InvoiceDates({ invoice }: { invoice: Invoice }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="text-sm text-muted-foreground">Posting Date</p>
        <div className="flex items-center gap-2 mt-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium">{formatDate(invoice.posting_date, 'DD-MMM-YY')}</p>
        </div>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Due Date</p>
        <div className="flex items-center gap-2 mt-1">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium">{formatDate(invoice.due_date, 'DD-MMM-YY')}</p>
        </div>
      </div>
    </div>
  );
}

// Sub-component for amounts summary
function AmountsSummary({ invoice, currencySymbol }: { invoice: Invoice; currencySymbol: string }) {
  return (
    <div className="rounded-lg bg-muted/50 p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Grand Total</span>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="text-lg font-semibold">
            {currencySymbol} {Number(invoice.grand_total).toFixed(2)}
          </span>
        </div>
      </div>
      {invoice.outstanding_amount > 0 && (
        <div className="flex justify-between items-center pt-2 border-t">
          <span className="text-sm font-medium">Outstanding Amount</span>
          <span className="text-xl font-bold text-destructive">
            {currencySymbol} {Number(invoice.outstanding_amount).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

// Sub-component for invoice content body
function InvoiceContent({ invoice, currencySymbol }: { invoice: Invoice; currencySymbol: string }) {
  const lineItems = invoice.items || invoice.line_items || [];

  return (
    <div className="space-y-6">
      <InvoiceHeader invoice={invoice} />
      <PartyInfo invoice={invoice} />
      <InvoiceDates invoice={invoice} />

      {/* Tax Summary */}
      {(() => {
        const taxSummary = new Map<
          string,
          { name: string; amount: number; breakup: Array<{ rule_name: string; rate: number; amount: number }> }
        >();

        lineItems.forEach((item) => {
          if (item.tax_info) {
            const templateKey = item.tax_info.template_code;
            if (!taxSummary.has(templateKey)) {
              taxSummary.set(templateKey, {
                name: item.tax_info.template_name,
                amount: 0,
                breakup: item.tax_info.breakup.map((tax) => ({
                  rule_name: tax.rule_name,
                  rate: tax.rate,
                  amount: 0,
                })),
              });
            }
            const summary = taxSummary.get(templateKey);
            if (summary) {
              summary.amount += Number(item.tax_amount || 0);

              item.tax_info.breakup.forEach((tax, idx) => {
                const taxComponentAmount = (Number(item.amount) * tax.rate) / 100;
                summary.breakup[idx].amount += taxComponentAmount;
              });
            }
          }
        });

        return <TaxSummaryCollapsible taxSummary={taxSummary} currencySymbol={currencySymbol} />;
      })()}

      {lineItems.length > 0 && (
        <>
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Line Items</h3>
            <LineItemsDetailTable items={lineItems}
              currencySymbol={currencySymbol}
              hasTaxInfo
              getItemSKU={(item: InvoiceLineItem) => item.item_code}
              getItemTotalAmount={(item: InvoiceLineItem) => Number(item.total_amount || item.amount || 0)}
              getItemDiscountAmount={(item: InvoiceLineItem) => Number(item.discount_amount ?? 0)}
              renderFooter={(items) => {
                const safeItems = items ?? [];
                const subtotalAmount = safeItems.reduce((s, item) => s + Number(item.amount || 0), 0);
                const subtotalTax = safeItems.reduce((s, item) => s + Number(item.tax_amount || 0), 0);
                const subtotalTotal = safeItems.reduce((s, item) => s + Number(item.total_amount || item.amount || 0), 0);
                const discountAmount = Number(invoice.discount_amount ?? 0);
                const grandTotal = Number(invoice.grand_total ?? 0);
                const sym = currencySymbol;
                return (
                  <>
                    <tr>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-sm font-medium">Subtotal:</td>
                      <td className="px-4 py-3 text-right text-sm font-medium">{sym}{subtotalAmount.toFixed(2)}</td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-right text-sm font-medium">{sym}{subtotalTax.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium">{sym}{subtotalTotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-sm font-medium">Discount:</td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {discountAmount > 0 ? `−${sym}${discountAmount.toFixed(2)}` : '—'}
                      </td>
                    </tr>
                    <tr className="border-t-2 font-semibold">
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-sm font-semibold">Grand Total:</td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 text-right text-sm font-semibold">{sym}{grandTotal.toFixed(2)}</td>
                    </tr>
                  </>
                );
              }}/>
          </div>
        </>
      )}

      <Separator />
      <AmountsSummary invoice={invoice} currencySymbol={currencySymbol} />

      {(invoice.reference_type || invoice.reference_id) && (
        <div className="rounded-lg border p-4 bg-muted/20">
          <p className="text-sm text-muted-foreground mb-1">Reference</p>
          <p className="text-sm font-medium">
            {invoice.reference_type && <span className="capitalize">{invoice.reference_type}: </span>}
            {invoice.reference_id}
          </p>
        </div>
      )}

      {invoice.remarks && (
        <div>
          <p className="text-sm text-muted-foreground mb-1">Remarks</p>
          <p className="text-sm">{invoice.remarks}</p>
        </div>
      )}

      <Separator />
      <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
        <div>
          <p>Created: {formatDate(invoice.created_at, 'DD-MMM-YY', { includeTime: true })}</p>
        </div>
        {invoice.updated_at && (
          <div>
            <p>Updated: {formatDate(invoice.updated_at, 'DD-MMM-YY', { includeTime: true })}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function InvoiceDetailDialog({ open, onOpenChange, invoice }: InvoiceDetailDialogProps) {
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [pdfAttachment, setPdfAttachment] = React.useState<{
    filename: string;
    content: string;
    content_type: string;
  } | null>(null);
  const { toast } = useToast();
  const { loading: pdfLoading, download, preview, generateBase64 } = usePDFGeneration();

  const getCurrencySymbol = React.useCallback((currencyCode: string): string => {
    const currency = SUPPORTED_CURRENCIES.find((c: { code: string; symbol: string }) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  }, []);

  const handleDownloadPDF = React.useCallback(async () => {
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

  const handlePreviewPDF = React.useCallback(async () => {
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

  const handleSendEmail = React.useCallback(async () => {
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

  if (!invoice) return null;

  const currencySymbol = getCurrencySymbol(invoice.currency);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                <FileText className="h-5 w-5" />
                Invoice Details
              </DialogTitle>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
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
        onOpenChange={(open) => {
          setEmailDialogOpen(open);
          if (!open) {
            setPdfAttachment(null);
          }
        }}
        docType="invoice"
        docId={invoice.id}
        docNo={invoice.invoice_no}
        defaultRecipient=""
        defaultSubject={`Invoice ${invoice.invoice_no}`}
        defaultMessage={`Dear ${invoice.party_name || 'Customer'},\n\nPlease find attached invoice ${invoice.invoice_no} for your review.\n\nBest regards`}
        defaultAttachments={pdfAttachment ? [pdfAttachment] : undefined}
        onSuccess={() => {
          setEmailDialogOpen(false);
          setPdfAttachment(null);
        }}/>
    </>
  );
}
