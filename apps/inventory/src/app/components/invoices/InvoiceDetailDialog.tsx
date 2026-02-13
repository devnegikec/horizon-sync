import * as React from 'react';
import { Edit, Receipt, FileText, Mail, DollarSign, ExternalLink } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';

import type { Invoice } from '../../types/invoice.ts';
import { StatusBadge } from '../quotations/StatusBadge';

interface InvoiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onEdit: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onGeneratePDF: (invoiceId: string) => void;
  onSendEmail: (invoice: Invoice) => void;
  onViewSalesOrder?: (salesOrderId: string) => void;
}

export function InvoiceDetailDialog({
  open,
  onOpenChange,
  invoice,
  onEdit,
  onRecordPayment,
  onGeneratePDF,
  onSendEmail,
  onViewSalesOrder,
}: InvoiceDetailDialogProps) {
  if (!invoice) return null;

  const canEdit = invoice.status === 'Draft';
  const canRecordPayment = invoice.status === 'Submitted' && invoice.outstanding_amount > 0;
  const hasSalesOrderReference = invoice.reference_type === 'Sales Order' && invoice.reference_id;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `${invoice.currency} ${Number(amount).toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Receipt className="h-5 w-5" />
              Invoice Details
            </DialogTitle>
            <StatusBadge status={invoice.status.toLowerCase().replace(' ', '_')} />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="text-lg font-semibold">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="text-lg font-semibold">{invoice.party_name}</p>
            </div>
          </div>

          {/* Dates and Currency */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Posting Date</p>
              <p className="font-medium">{formatDate(invoice.posting_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Due Date</p>
              <p className="font-medium">{formatDate(invoice.due_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="font-medium">{invoice.currency}</p>
            </div>
          </div>

          {/* Reference to Sales Order */}
          {hasSalesOrderReference && (
            <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-blue-900 dark:text-blue-100">
                    Created from Sales Order (Ref: {invoice.reference_id?.slice(0, 8)}...)
                  </span>
                </div>
                {onViewSalesOrder && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewSalesOrder(invoice.reference_id!)}
                    className="h-7 gap-1 text-blue-600 dark:text-blue-400"
                  >
                    View Order
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Totals Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Tax</span>
              <span className="font-medium">{formatCurrency(invoice.total_tax)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Grand Total</span>
              <span className="text-2xl font-bold">{formatCurrency(invoice.grand_total)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Paid Amount</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(invoice.paid_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-medium">Outstanding Amount</span>
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(invoice.outstanding_amount)}
              </span>
            </div>
          </div>

          {/* Line Items */}
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Line Items</h3>
            {invoice.line_items && invoice.line_items.length > 0 ? (
              <div className="rounded-lg border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Description</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Qty</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">UOM</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Rate</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Tax</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoice.line_items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td className="px-4 py-3 text-sm">{index + 1}</td>
                          <td className="px-4 py-3 text-sm">{item.item_name || item.item_id}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm">{item.uom}</td>
                          <td className="px-4 py-3 text-sm text-right">{Number(item.rate).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right">{Number(item.tax_amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium">
                            {Number(item.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No line items</p>
            )}
          </div>

          {/* Payment History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Payment History</h3>
                <div className="rounded-lg border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Payment Number</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {invoice.payments.map((payment, index) => (
                          <tr key={payment.id || index}>
                            <td className="px-4 py-3 text-sm">{payment.invoice_number}</td>
                            <td className="px-4 py-3 text-sm">{formatDate(payment.invoice_date)}</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {formatCurrency(payment.allocated_amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Remarks */}
          {invoice.remarks && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Remarks</p>
              <p className="text-sm">{invoice.remarks}</p>
            </div>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div>
              <p>Created: {formatDate(invoice.created_at)}</p>
            </div>
            {invoice.updated_at && (
              <div>
                <p>Updated: {formatDate(invoice.updated_at)}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button
            variant="outline"
            onClick={() => onGeneratePDF(invoice.id)}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Generate PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => onSendEmail(invoice)}
            className="gap-2"
          >
            <Mail className="h-4 w-4" />
            Send Email
          </Button>
          {canRecordPayment && (
            <Button
              variant="default"
              onClick={() => onRecordPayment(invoice)}
              className="gap-2"
            >
              <DollarSign className="h-4 w-4" />
              Record Payment
            </Button>
          )}
          {canEdit && (
            <Button variant="default" onClick={() => onEdit(invoice)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
