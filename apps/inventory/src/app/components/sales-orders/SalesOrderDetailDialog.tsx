import * as React from 'react';

import { Console } from 'console';

import { Edit, FileText, ShoppingCart, Receipt, ExternalLink, Mail, Download, Eye, Truck } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import { SUPPORTED_CURRENCIES } from '../../types/currency.types';
import type { SalesOrder } from '../../types/sales-order.types';
import { convertSalesOrderToPDFData } from '../../utils/pdf/salesOrderToPDF';
import { EmailComposer, LineItemsDetailTable, TaxSummaryCollapsible } from '../common';
import { StatusBadge } from '../quotations/StatusBadge';

interface SalesOrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null;
  onEdit: (salesOrder: SalesOrder) => void;
  onCreateInvoice: (salesOrder: SalesOrder) => void;
  onCreateDeliveryNote: (salesOrder: SalesOrder) => void;
  onViewInvoice?: (invoiceId: string) => void;
}

export function SalesOrderDetailDialog({ open, onOpenChange, salesOrder, onEdit, onCreateInvoice, onCreateDeliveryNote, onViewInvoice }: SalesOrderDetailDialogProps) {
  const [emailDialogOpen, setEmailDialogOpen] = React.useState(false);
  const [pdfAttachment, setPdfAttachment] = React.useState<{ filename: string; content: string; content_type: string } | null>(null);
  const { toast } = useToast();
  const { loading: pdfLoading, download, preview, generateBase64 } = usePDFGeneration();

  if (!salesOrder) return null;

  const isClosedOrCancelled = salesOrder.status === 'closed' || salesOrder.status === 'cancelled';
  const canCreateInvoice = salesOrder.status === 'confirmed' || salesOrder.status === 'partially_delivered' || salesOrder.status === 'delivered';
  const canCreateDeliveryNote = (salesOrder.status === 'confirmed' || salesOrder.status === 'partially_delivered');
  // && salesOrder.items?.some(item => Number(item.qty) - Number(item.delivered_qty) > 0);

  const getCurrencySymbol = (currencyCode: string): string => {
    const currency = SUPPORTED_CURRENCIES.find((c: { code: string; symbol: string }) => c.code === currencyCode);
    return currency?.symbol || currencyCode;
  };

  const currencySymbol = getCurrencySymbol(salesOrder.currency);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDownloadPDF = async () => {
    try {
      const pdfData = convertSalesOrderToPDFData(salesOrder);
      await download(pdfData, `${salesOrder.sales_order_no}.pdf`);
      toast({ title: 'PDF Downloaded', description: `${salesOrder.sales_order_no}.pdf has been downloaded` });
    } catch (error) {
      toast({ title: 'Download Failed', description: error instanceof Error ? error.message : 'Failed to download PDF', variant: 'destructive' });
    }
  };

  const handlePreviewPDF = async () => {
    try {
      const pdfData = convertSalesOrderToPDFData(salesOrder);
      console.log('pdfData', pdfData);
      await preview(pdfData);
    } catch (error) {
      toast({ title: 'Preview Failed', description: error instanceof Error ? error.message : 'Failed to preview PDF', variant: 'destructive' });
    }
  };

  const handleSendEmail = async () => {
    try {
      const pdfData = convertSalesOrderToPDFData(salesOrder);
      const base64Content = await generateBase64(pdfData);
      if (base64Content) {
        setPdfAttachment({ filename: `${salesOrder.sales_order_no}.pdf`, content: base64Content, content_type: 'application/pdf' });
        setEmailDialogOpen(true);
      } else {
        toast({ title: 'PDF Generation Failed', description: 'Could not generate PDF attachment', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to prepare email', variant: 'destructive' });
    }
  };

  // Extract tax info from line items (future-proof: items may have tax_info via extra_data)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getItemTaxInfo = (item: any) => {
    return (item.tax_info || item.extra_data?.tax_info) as {
      template_name: string;
      template_code: string;
      breakup: Array<{ rule_name: string; tax_type: string; rate: number; is_compound: boolean }>;
    } | null | undefined;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getItemTaxAmount = (item: any): number => {
    return Number(item.tax_amount || item.extra_data?.tax_amount || 0);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getItemTotalAmount = (item: any): number => {
    return Number(item.total_amount || item.extra_data?.total_amount || item.amount || 0);
  };

  // Build tax summary
  const lineItems = salesOrder.items || [];
  const taxSummary = new Map<string, { name: string; amount: number; breakup: Array<{ rule_name: string; rate: number; amount: number }> }>();
  const hasTaxInfo = lineItems.some(item => getItemTaxInfo(item));

  lineItems.forEach(item => {
    const taxInfo = getItemTaxInfo(item);
    if (taxInfo) {
      const templateKey = taxInfo.template_code;
      if (!taxSummary.has(templateKey)) {
        taxSummary.set(templateKey, {
          name: taxInfo.template_name,
          amount: 0,
          breakup: taxInfo.breakup.map(tax => ({ rule_name: tax.rule_name, rate: tax.rate, amount: 0 })),
        });
      }
      const summary = taxSummary.get(templateKey);
      if (summary) {
        summary.amount += getItemTaxAmount(item);
        taxInfo.breakup.forEach((tax, idx) => {
          const taxComponentAmount = (Number(item.amount) * tax.rate) / 100;
          summary.breakup[idx].amount += taxComponentAmount;
        });
      }
    }
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[90vw] max-w-[90vw] h-[90vh] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-3">
                <ShoppingCart className="h-5 w-5" />
                Sales Order Details
              </DialogTitle>
              <StatusBadge status={salesOrder.status} />
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Sales Order Number</p>
                <p className="text-lg font-semibold">{salesOrder.sales_order_no}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="text-lg font-semibold">{salesOrder.customer_name || salesOrder.customer_id}</p>
              </div>
            </div>

            {/* Dates and Currency */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium">{formatDate(salesOrder.order_date)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Delivery Date</p>
                <p className="font-medium">{salesOrder.delivery_date ? formatDate(salesOrder.delivery_date) : 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currency</p>
                <p className="font-medium">{salesOrder.currency}</p>
              </div>
            </div>

            {/* Reference */}
            {salesOrder.reference_type === 'Quotation' && salesOrder.reference_id && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-900 dark:text-blue-100">
                    Created from Quotation (Ref: {salesOrder.reference_id.slice(0, 8)}...)
                  </span>
                </div>
              </div>
            )}

            {/* Tax Summary */}
            <TaxSummaryCollapsible taxSummary={taxSummary} currencySymbol={currencySymbol} defaultCollapsed />

            {/* Grand Total */}
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Grand Total</span>
                <span className="text-2xl font-bold">{currencySymbol} {Number(salesOrder.grand_total).toFixed(2)}</span>
              </div>
            </div>

            {/* Line Items */}
            <Separator />
            <div>
              <h3 className="text-lg font-medium mb-4">Line Items</h3>
              <LineItemsDetailTable items={lineItems}
                currencySymbol={currencySymbol}
                hasTaxInfo={hasTaxInfo}
                showBilledDelivered
                getItemTaxInfo={getItemTaxInfo}
                getItemTaxAmount={getItemTaxAmount}
                getItemTotalAmount={getItemTotalAmount}
                getItemDiscountAmount={(item) => Number(item.discount_amount ?? 0)}
                renderFooter={(items) => {
                  const safeItems = items ?? [];
                  const subtotalAmount = safeItems.reduce((s, item) => s + Number(item.amount || 0), 0);
                  const subtotalTax = safeItems.reduce((s, item) => s + getItemTaxAmount(item), 0);
                  const subtotalTotal = safeItems.reduce((s, item) => s + getItemTotalAmount(item), 0);
                  const discountAmount = Number(salesOrder.discount_amount ?? 0);
                  const grandTotal = Number(salesOrder.grand_total ?? 0);
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
                        {hasTaxInfo && <td className="px-4 py-3 text-right text-sm font-medium">{sym}{subtotalTax.toFixed(2)}</td>}
                        {hasTaxInfo && <td className="px-4 py-3 text-right text-sm font-medium">{sym}{subtotalTotal.toFixed(2)}</td>}
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3" />
                      </tr>
                      <tr>
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3 text-sm font-medium">Discount:</td>
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3" />
                        {!hasTaxInfo ? (
                          <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                            {discountAmount > 0 ? `−${sym}${discountAmount.toFixed(2)}` : '—'}
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-3" />
                            <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                              {discountAmount > 0 ? `−${sym}${discountAmount.toFixed(2)}` : '—'}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3" />
                      </tr>
                      <tr className="border-t-2 font-semibold">
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3 text-sm font-semibold">Grand Total:</td>
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3" />
                        {!hasTaxInfo ? (
                          <td className="px-4 py-3 text-right text-sm font-semibold">{sym}{grandTotal.toFixed(2)}</td>
                        ) : (
                          <>
                            <td className="px-4 py-3" />
                            <td className="px-4 py-3 text-right text-sm font-semibold">{sym}{grandTotal.toFixed(2)}</td>
                          </>
                        )}
                        <td className="px-4 py-3" />
                        <td className="px-4 py-3" />
                      </tr>
                    </>
                  );
                }} />
            </div>

            {/* Related Invoices */}
            {salesOrder.items && salesOrder.items.some(item => Number(item.billed_qty) > 0) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-medium mb-4">Related Invoices</h3>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-blue-900 dark:text-blue-100">This sales order has been invoiced</span>
                      </div>
                      {onViewInvoice && (
                        <Button variant="ghost"
                          size="sm"
                          onClick={() => console.log('View invoices for sales order:', salesOrder.id)}
                          className="h-7 gap-1 text-blue-600 dark:text-blue-400">
                          View Invoices
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Remarks */}
            {salesOrder.remarks && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Remarks</p>
                <p className="text-sm">{salesOrder.remarks}</p>
              </div>
            )}

            {/* Timestamps */}
            <Separator />
            <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
              <div>
                <p>Created: {formatDate(salesOrder.created_at)}</p>
              </div>
              {salesOrder.updated_at && (
                <div>
                  <p>Updated: {formatDate(salesOrder.updated_at)}</p>
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
            {canCreateInvoice && (
              <Button variant="default" onClick={() => onCreateInvoice(salesOrder)} className="gap-2">
                <Receipt className="h-4 w-4" />
                Create Invoice
              </Button>
            )}
            {canCreateDeliveryNote && (
              <Button variant="default" onClick={() => onCreateDeliveryNote(salesOrder)} className="gap-2">
                <Truck className="h-4 w-4" />
                Create Delivery Note
              </Button>
            )}
            {!isClosedOrCancelled && (
              <Button variant="default" onClick={() => onEdit(salesOrder)} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EmailComposer open={emailDialogOpen}
        onOpenChange={(isOpen) => {
          setEmailDialogOpen(isOpen);
          if (!isOpen) setPdfAttachment(null);
        }}
        docType="sales_order"
        docId={salesOrder.id}
        docNo={salesOrder.sales_order_no}
        defaultRecipient=""
        defaultSubject={`Sales Order ${salesOrder.sales_order_no}`}
        defaultMessage={`Dear ${salesOrder.customer_name || 'Customer'},\n\nPlease find attached sales order ${salesOrder.sales_order_no} for your reference.\n\nBest regards`}
        defaultAttachments={pdfAttachment ? [pdfAttachment] : undefined}
        onSuccess={() => {
          setEmailDialogOpen(false);
          setPdfAttachment(null);
        }} />
    </>
  );
}
