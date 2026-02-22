import * as React from 'react';

import { FileText, User, Calendar, DollarSign } from 'lucide-react';

import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@horizon-sync/ui/components';

import type { Invoice } from '../../types/invoice.types';
import { formatDate } from '../../utility/formatDate';

import { InvoiceStatusBadge } from './InvoiceStatusBadge';

interface InvoiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
}

export function InvoiceDetailDialog({ open, onOpenChange, invoice }: InvoiceDetailDialogProps) {
  if (!invoice) return null;

  return (
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

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Invoice Number</p>
              <p className="text-lg font-semibold font-mono">{invoice.invoice_no}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Type</p>
              <p className="text-lg font-semibold capitalize">{invoice.invoice_type}</p>
            </div>
          </div>

          {/* Party Information */}
          <div>
            <p className="text-sm text-muted-foreground">Party</p>
            <div className="flex items-center gap-2 mt-1">
              <User className="h-4 w-4 text-muted-foreground" />
              <p className="text-lg font-semibold">{invoice.party_name || invoice.party_id}</p>
            </div>
          </div>

          {/* Dates */}
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

          {/* Amounts */}
          <Separator />
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Grand Total</span>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  {invoice.currency} {Number(invoice.grand_total).toFixed(2)}
                </span>
              </div>
            </div>
            {invoice.outstanding_amount > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Outstanding Amount</span>
                <span className="text-lg font-semibold text-destructive">
                  {invoice.currency} {Number(invoice.outstanding_amount).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Line Items */}
          {invoice.line_items && invoice.line_items.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Line Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">#</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Unit Price</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invoice.line_items.map((item, index) => (
                        <tr key={item.id} className="hover:bg-muted/30">
                          <td className="px-4 py-3 text-sm">{index + 1}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium">{item.item_name || item.item_id}</p>
                            {item.item_code && <p className="text-xs text-muted-foreground">{item.item_code}</p>}
                          </td>
                          <td className="px-4 py-3 text-right text-sm">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-sm">
                            {invoice.currency} {Number(item.unit_price).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium">
                            {invoice.currency} {Number(item.total_amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
              <p>Created: {formatDate(invoice.created_at, 'DD-MMM-YY', { includeTime: true })}</p>
            </div>
            {invoice.updated_at && (
              <div>
                <p>Updated: {formatDate(invoice.updated_at, 'DD-MMM-YY', { includeTime: true })}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
