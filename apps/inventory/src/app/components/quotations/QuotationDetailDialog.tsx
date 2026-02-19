import * as React from 'react';

import { Edit, FileText, Mail } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';

import type { Quotation } from '../../types/quotation.types';
import { EmailComposer } from '../common/EmailComposer';

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
  
  if (!quotation) return null;

  const isTerminalStatus = quotation.status === 'accepted' || quotation.status === 'rejected' || quotation.status === 'expired';
  const canConvert = quotation.status === 'accepted';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
                      amount: 0
                    }))
                  });
                }
                const summary = taxSummary.get(templateKey);
                if (summary) {
                  summary.amount += Number(item.tax_amount || 0);
                  
                  // Calculate individual tax component amounts
                  item.tax_info.breakup.forEach((tax, idx) => {
                    const taxComponentAmount = (Number(item.amount) * tax.rate) / 100;
                    summary.breakup[idx].amount += taxComponentAmount;
                  });
                }
              }
            });

            return taxSummary.size > 0 ? (
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Tax Summary</h3>
                <div className="rounded-lg border p-4 space-y-2">
                  {Array.from(taxSummary.entries()).map(([key, summary]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{summary.name}</span>
                        <span className="text-sm font-semibold">{quotation.currency} {summary.amount.toFixed(2)}</span>
                      </div>
                      <div className="pl-4 space-y-1">
                        {summary.breakup.map((tax, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{tax.rule_name} ({tax.rate}%)</span>
                            <span>{quotation.currency} {tax.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-sm">Total Tax</span>
                    <span className="text-sm">{quotation.currency} {Array.from(taxSummary.values()).reduce((sum, s) => sum + s.amount, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ) : null;
          })()}

          {/* Grand Total */}
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Grand Total</span>
              <span className="text-2xl font-bold">{quotation.currency} {Number(quotation.grand_total).toFixed(2)}</span>
            </div>
          </div>

          {/* Line Items */}
          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-4">Line Items</h3>
            {(() => {
              const lineItems = quotation.items || quotation.line_items || [];
              return lineItems.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Qty</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">UOM</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Rate</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Tax</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {lineItems.map((item, index) => (
                          <tr key={index} className="hover:bg-muted/30">
                            <td className="px-4 py-3 text-sm">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium">{item.item_name}</p>
                                <p className="text-xs text-muted-foreground">{item.item_code}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-right">{Number(item.qty).toFixed(3)}</td>
                            <td className="px-4 py-3 text-sm">{item.uom}</td>
                            <td className="px-4 py-3 text-sm text-right">{quotation.currency} {Number(item.rate).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-right">{quotation.currency} {Number(item.amount).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right">
                              {item.tax_info ? (
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">{quotation.currency} {Number(item.tax_amount || 0).toFixed(2)}</p>
                                  <div className="flex flex-wrap gap-1 justify-end">
                                    {item.tax_info.breakup.map((tax, taxIdx) => (
                                      <span key={taxIdx} className="text-xs text-muted-foreground">
                                        {tax.rule_name} {tax.rate}%
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-semibold">{quotation.currency} {Number(item.total_amount || item.amount).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/30 border-t-2">
                        <tr>
                          <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium">Subtotal:</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold">
                            {quotation.currency} {lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold">
                            {quotation.currency} {lineItems.reduce((sum, item) => sum + Number(item.tax_amount || 0), 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold">
                            {quotation.currency} {lineItems.reduce((sum, item) => sum + Number(item.total_amount || item.amount), 0).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No line items</p>
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
          <Button variant="outline" onClick={() => setEmailDialogOpen(true)} className="gap-2">
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
      onOpenChange={setEmailDialogOpen}
      docType="quotation"
      docId={quotation.id}
      docNo={quotation.quotation_no}
      defaultRecipient={quotation.customer?.email || ''}
      defaultSubject={`Quotation ${quotation.quotation_no}`}
      defaultMessage={`Dear ${quotation.customer_name || quotation.customer?.customer_name || 'Customer'},\n\nPlease find attached quotation ${quotation.quotation_no} for your review.\n\nBest regards`}
      onSuccess={() => {
        setEmailDialogOpen(false);
      }}/>
  </>
  );
}
