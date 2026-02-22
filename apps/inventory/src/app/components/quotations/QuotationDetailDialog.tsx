import * as React from 'react';

import { Edit, FileText, Mail, Download, Eye } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { SUPPORTED_CURRENCIES } from '../../types/currency.types';
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

export function QuotationDetailDialog({ open, onOpenChange, quotation, onEdit, onConvert }: QuotationDetailDialogProps) {
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [pdfAttachment, setPdfAttachment] = React.useState<{ filename: string; content: string; content_type: string } | null>(null);
  const { toast } = useToast();
  const { loading: pdfLoading, download, preview, generateBase64 } = usePDFGeneration();

  if (!quotation) return null;

  const isTerminalStatus = quotation.status === 'accepted' || quotation.status === 'rejected' || quotation.status === 'expired';
  const canConvert = quotation.status === 'accepted';

  // Get currency symbol from SUPPORTED_CURRENCIES
  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = SUPPORTED_CURRENCIES.find((c: { code: string; symbol: string }) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  const currencySymbol = getCurrencySymbol(quotation.currency);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDownloadPDF = async () => {
    try {
      const pdfData = convertQuotationToPDFData(quotation);
      await download(pdfData, `${quotation.quotation_no}.pdf`);
      toast({
        title: 'PDF Downloaded',
        description: `${quotation.quotation_no}.pdf has been downloaded`,
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: error instanceof Error ? error.message : 'Failed to download PDF',
        variant: 'destructive',
      });
    }
  };

  const handlePreviewPDF = async () => {
    try {
      const pdfData = convertQuotationToPDFData(quotation);
      await preview(pdfData);
    } catch (error) {
      toast({
        title: 'Preview Failed',
        description: error instanceof Error ? error.message : 'Failed to preview PDF',
        variant: 'destructive',
      });
    }
  };

  const handleSendEmail = async () => {
    try {
      // Generate PDF and convert to base64 for email attachment
      const pdfData = convertQuotationToPDFData(quotation);
      const base64Content = await generateBase64(pdfData);

      if (base64Content) {
        setPdfAttachment({
          filename: `${quotation.quotation_no}.pdf`,
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
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Quotation Number</p>
              <p className="text-lg font-semibold">{quotation.quotation_no}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="text-lg font-semibold">{quotation.customer_name || quotation.customer?.customer_name || 'N/A'}</p>
            </div>
          </div>

          {/* Dates and Currency */}
          <div className="grid gap-4 md:grid-cols-3">
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
          </div>

          {/* Tax Summary */}
          {(() => {
            const lineItems = quotation.items || quotation.line_items || [];
            const taxSummary = new Map<string, { name: string; amount: number; breakup: Array<{ rule_name: string; rate: number; amount: number }> }>();

            lineItems.forEach(item => {
              if (item.tax_info) {
                const templateKey = item.tax_info.template_code;
                if (!taxSummary.has(templateKey)) {
                  taxSummary.set(templateKey, {
                    name: item.tax_info.template_name,
                    amount: 0,
                    breakup: item.tax_info.breakup.map(tax => ({
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

          {/* Grand Total */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Grand Total</span>
              <span className="text-2xl font-bold">{currencySymbol} {Number(quotation.grand_total).toFixed(2)}</span>
            </div>
          </div>

          {/* Line Items */}
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Line Items</h3>
            {(() => {
              const lineItems = quotation.items || quotation.line_items || [];
              return (
                <LineItemsDetailTable items={lineItems}
                  currencySymbol={currencySymbol}
                  hasTaxInfo
                  getItemSKU={(item: any) => item.item_code}
                  getItemTotalAmount={(item: any) => Number(item.total_amount || item.amount || 0)}
                  renderFooter={(items) => (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium">Subtotal:</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">
                        {currencySymbol} {items.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">
                        {currencySymbol} {items.reduce((sum, item) => sum + Number(item.tax_amount || 0), 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold">
                        {currencySymbol} {items.reduce((sum, item) => sum + Number(item.total_amount || item.amount), 0).toFixed(2)}
                      </td>
                    </tr>
                  )}/>
              );
            })()}
          </div>

          {/* Remarks */}
          {quotation.remarks && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Remarks</p>
              <p className="text-sm">{quotation.remarks}</p>
            </div>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div>
              <p>Created: {formatDate(quotation.created_at)}</p>
            </div>
            {quotation.updated_at && (
              <div>
                <p>Updated: {formatDate(quotation.updated_at)}</p>
              </div>
            )}
          </div>
        </div>

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
          {canConvert && (
            <Button variant="default" onClick={() => onConvert(quotation)} className="gap-2">
              <FileText className="h-4 w-4" />
              Convert to Sales Order
            </Button>
          )}
          {!isTerminalStatus && (
            <Button variant="default" onClick={() => onEdit(quotation)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
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
      docType="quotation"
      docId={quotation.id}
      docNo={quotation.quotation_no}
      defaultRecipient={quotation.customer?.email || ''}
      defaultSubject={`Quotation ${quotation.quotation_no}`}
      defaultMessage={`Dear ${quotation.customer_name || quotation.customer?.customer_name || 'Customer'},\n\nPlease find attached quotation ${quotation.quotation_no} for your review.\n\nBest regards`}
      defaultAttachments={pdfAttachment ? [pdfAttachment] : undefined}
      onSuccess={() => {
        setEmailDialogOpen(false);
        setPdfAttachment(null);
      }}/>
  </>
  );
}
