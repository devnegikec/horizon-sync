import * as React from 'react';
import { Edit, Receipt, DollarSign, ExternalLink } from 'lucide-react';

import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, Separator } from '@horizon-sync/ui/components';

import type { Payment } from '../../types/payment';
import { StatusBadge } from '../quotations/StatusBadge';

interface PaymentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  onEdit: (payment: Payment) => void;
  onViewInvoice?: (invoiceId: string) => void;
}

export function PaymentDetailDialog({
  open,
  onOpenChange,
  payment,
  onEdit,
  onViewInvoice,
}: PaymentDetailDialogProps) {
  if (!payment) return null;

  const canEdit = payment.status === 'Draft';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `${payment.currency} ${Number(amount).toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <DollarSign className="h-5 w-5" />
              Payment Details
            </DialogTitle>
            <StatusBadge status={payment.status.toLowerCase().replace(' ', '_')} />
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Payment Number</p>
              <p className="text-lg font-semibold">{payment.payment_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{payment.party_type}</p>
              <p className="text-lg font-semibold">{payment.party_name}</p>
            </div>
          </div>

          {/* Payment Details */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Payment Date</p>
              <p className="font-medium">{formatDate(payment.payment_date)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Mode</p>
              <p className="font-medium">{payment.payment_mode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Currency</p>
              <p className="font-medium">{payment.currency}</p>
            </div>
          </div>

          {/* Reference Number */}
          {payment.reference_number && (
            <div>
              <p className="text-sm text-muted-foreground">Reference Number</p>
              <p className="font-medium">{payment.reference_number}</p>
            </div>
          )}

          {/* Amounts Summary */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium">Total Amount</span>
              <span className="text-2xl font-bold">{formatCurrency(payment.total_amount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Allocated Amount</span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(payment.allocated_amount)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-base font-medium">Unallocated Amount</span>
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(payment.unallocated_amount)}
              </span>
            </div>
          </div>

          {/* Invoice Allocations */}
          {payment.allocations && payment.allocations.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Invoice Allocations</h3>
                <div className="rounded-lg border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium">Invoice Number</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Invoice Date</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Invoice Amount</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Outstanding Before</th>
                          <th className="px-4 py-3 text-right text-sm font-medium">Allocated Amount</th>
                          <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {payment.allocations.map((allocation, index) => (
                          <tr key={allocation.id || index}>
                            <td className="px-4 py-3 text-sm font-medium">{allocation.invoice_number}</td>
                            <td className="px-4 py-3 text-sm">{formatDate(allocation.invoice_date)}</td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatCurrency(allocation.invoice_amount)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right">
                              {formatCurrency(allocation.outstanding_before)}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {formatCurrency(allocation.allocated_amount)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {onViewInvoice && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onViewInvoice(allocation.invoice_id)}
                                  className="h-7 gap-1"
                                >
                                  View
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              )}
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
          {payment.remarks && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Remarks</p>
              <p className="text-sm">{payment.remarks}</p>
            </div>
          )}

          {/* Timestamps */}
          <Separator />
          <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div>
              <p>Created: {formatDate(payment.created_at)}</p>
            </div>
            {payment.updated_at && (
              <div>
                <p>Updated: {formatDate(payment.updated_at)}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canEdit && (
            <Button variant="default" onClick={() => onEdit(payment)} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
