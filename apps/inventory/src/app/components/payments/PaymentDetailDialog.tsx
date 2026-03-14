import { useState, useCallback, memo, useEffect } from 'react';

import { FileText, Edit, CheckCircle, XCircle, Download } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from '@horizon-sync/ui/components';

import { useInvoiceAllocations } from '../../hooks/useInvoiceAllocations';
import { useOutstandingInvoicesForAllocation } from '../../hooks/useOutstandingInvoicesForAllocation';
import { getCurrencySymbol } from '../../types/currency.types';
import type { PaymentEntry } from '../../types/payment.types';
import { formatCurrency, formatDate, getPaymentModeLabel } from '../../utils/payment.utils';

import { AllocationList } from './AllocationList';
import { InvoiceLinker } from './InvoiceLinker';
import { PaymentAuditTrail } from './PaymentAuditTrail';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { ReceiptViewer } from './ReceiptViewer';


interface PaymentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentEntry;
  onEdit?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onAllocationChange?: () => void;
  loading?: boolean;
}

export const PaymentDetailDialog = memo(function PaymentDetailDialog({
  open,
  onOpenChange,
  payment,
  onEdit,
  onConfirm,
  onCancel,
  onAllocationChange,
  loading = false,
}: PaymentDetailDialogProps) {
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const isDraft = payment.status === 'Draft';
  const isConfirmed = payment.status === 'Confirmed';
  const isCancelled = payment.status === 'Cancelled';
  const currencySymbol = payment ? getCurrencySymbol(payment.currency_code) : '';
  const paymentId = open && payment?.id ? payment.id : null;
  const {
    allocations: allocationList,
    createAllocation,
    removeAllocation,
    actionLoading: allocationActionLoading,
    refetch: refetchAllocations,
  } = useInvoiceAllocations(paymentId);

  const { invoices: outstandingInvoices, loading: invoicesLoading } =
    useOutstandingInvoicesForAllocation(
      isDraft && payment?.party_id ? payment.party_id : null,
      payment?.payment_type === 'Supplier_Payment' ? 'Supplier_Payment' : 'Customer_Payment'
    );

  const handleViewReceipt = useCallback(() => {
    setReceiptViewerOpen(true);
  }, []);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setActiveTab('details'); // Reset to details when closing
    }
    onOpenChange(newOpen);
  }, [onOpenChange]);

  // Reset to details tab when dialog opens
  useEffect(() => {
    if (open) {
      setActiveTab('details');
    }
  }, [open]);

  const handleSaveAllocations = useCallback(
    async (allocs: Array<{ invoice_id: string; allocated_amount: number }>) => {
      if (!payment?.id) return;
      for (const a of allocs) {
        if (a.allocated_amount <= 0) continue;
        await createAllocation({ invoice_id: a.invoice_id, allocated_amount: a.allocated_amount });
      }
      onAllocationChange?.();
    },
    [payment?.id, createAllocation, onAllocationChange]
  );

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment Details
              </DialogTitle>
              <PaymentStatusBadge status={payment.status} />
            </div>
          </DialogHeader>

          <div className="flex flex-col flex-1 min-h-0">
            {/* Navigation Buttons */}
            <div className="flex space-x-1 bg-muted p-1 rounded-lg mb-4 flex-shrink-0">
              <Button variant={activeTab === 'details' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('details')}
                className="flex-1">
                Details
              </Button>
              <Button variant={activeTab === 'allocations' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('allocations')}
                className="flex-1">
                Allocations
              </Button>
              <Button variant={activeTab === 'audit' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('audit')}
                className="flex-1">
                Audit Trail
              </Button>
            </div>

            {/* Content Area with Fixed Height - All content always rendered */}
            <div className="flex-1 relative" style={{ height: 'calc(85vh - 180px)', minHeight: '400px' }}>
              {/* Details Section */}
              <div className="absolute inset-0 overflow-y-auto space-y-4 pr-2"
                style={{ visibility: activeTab === 'details' ? 'visible' : 'hidden' }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Receipt Number</p>
                        <p className="font-medium">{payment.receipt_number || 'Not generated'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Date</p>
                        <p className="font-medium">{formatDate(payment.payment_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Type</p>
                        <p className="font-medium">{payment.payment_type.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Mode</p>
                        <p className="font-medium">{getPaymentModeLabel(payment.payment_mode)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Party</p>
                        <p className="font-medium">
                          {payment.party_name || payment.party_id}
                          {(payment.party_email || payment.party_phone) && (
                            <span className="block text-sm font-normal text-muted-foreground mt-0.5">
                              {[payment.party_email, payment.party_phone].filter(Boolean).join(' · ')}
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Reference Number</p>
                        <p className="font-medium">{payment.reference_no || 'N/A'}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Amount</span>
                        <span className="text-2xl font-bold">
                          {formatCurrency(payment.amount, payment.currency_code)}
                        </span>
                      </div>
                      {payment.unallocated_amount > 0 && (
                        <div className="flex justify-between items-center text-orange-600">
                          <span className="text-sm">Unallocated Amount</span>
                          <span className="font-semibold">
                            {formatCurrency(payment.unallocated_amount, payment.currency_code)}
                          </span>
                        </div>
                      )}
                    </div>

                    {isCancelled && payment.cancellation_reason && (
                      <>
                        <Separator />
                        <div className="bg-destructive/10 p-4 rounded-lg">
                          <p className="text-sm font-medium text-destructive mb-1">Cancellation Reason</p>
                          <p className="text-sm">{payment.cancellation_reason}</p>
                          {payment.cancelled_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Cancelled on {formatDate(payment.cancelled_at)}
                            </p>
                          )}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t bg-background mb-4">
                  {isDraft && onEdit && (
                    <Button variant="outline" onClick={onEdit} disabled={loading} className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-2">
                    <XCircle className="h-4 w-4" />
                    Close
                  </Button>
                  {isDraft && onConfirm && (
                    <Button onClick={onConfirm} disabled={loading} className="gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Confirm Payment
                    </Button>
                  )}
                  {isConfirmed && onCancel && (
                    <Button variant="destructive"
                      onClick={onCancel}
                      disabled={loading}
                      className="gap-2">
                      <XCircle className="h-4 w-4" />
                      Cancel Payment
                    </Button>
                  )}
                  {isConfirmed && payment.receipt_number && (
                    <Button onClick={handleViewReceipt} className="gap-2">
                      <Download className="h-4 w-4" />
                      View Receipt
                    </Button>
                  )}
                </div>
              </div>

              {/* Allocations Section */}
              <div className="absolute inset-0 overflow-y-auto space-y-4 pr-2"
                style={{ visibility: activeTab === 'allocations' ? 'visible' : 'hidden' }}>
                <AllocationList allocations={allocationList}
                  paymentCurrency={payment.currency_code}
                  isDraft={isDraft}
                  onRemove={removeAllocation}
                  loading={loading || allocationActionLoading}/>
                {isDraft && (
                  <>
                    <Separator className="my-4" />
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Add allocation</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Allocate this payment to one or more invoices. At least one allocation is required before confirming.
                      </p>
                      <InvoiceLinker invoices={outstandingInvoices}
                        paymentAmount={payment.amount}
                        paymentCurrency={payment.currency_code}
                        existingAllocations={allocationList}
                        onSave={handleSaveAllocations}
                        loading={allocationActionLoading || invoicesLoading}/>
                    </div>
                  </>
                )}
              </div>

              {/* Audit Trail Section */}
              <div className="absolute inset-0 overflow-y-auto space-y-4 pr-2"
                style={{ visibility: activeTab === 'audit' ? 'visible' : 'hidden' }}>
                <PaymentAuditTrail auditLogs={[]} />
                <div className="text-sm text-muted-foreground text-center mt-8">
                  <p>Audit trail integration coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Viewer */}
      {isConfirmed && payment.receipt_number && (
        <ReceiptViewer open={receiptViewerOpen}
          onOpenChange={setReceiptViewerOpen}
          payment={payment}/>
      )}
    </>
  );
});
