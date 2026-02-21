import { useState, useCallback, memo } from 'react';
import { FileText, Edit, CheckCircle, XCircle, Download, ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from '@horizon-sync/ui/components';
import { formatCurrency, formatDate, getPaymentModeLabel } from '../../utils/payment.utils';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { AllocationList } from './AllocationList';
import { PaymentAuditTrail } from './PaymentAuditTrail';
import { ReceiptViewer } from './ReceiptViewer';
import type { PaymentEntry } from '../../types/payment.types';

interface PaymentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentEntry;
  onEdit?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onRemoveAllocation?: (allocationId: string) => void;
  loading?: boolean;
}

export const PaymentDetailDialog = memo(function PaymentDetailDialog({
  open,
  onOpenChange,
  payment,
  onEdit,
  onConfirm,
  onCancel,
  onRemoveAllocation,
  loading = false,
}: PaymentDetailDialogProps) {
  const [receiptViewerOpen, setReceiptViewerOpen] = useState(false);

  const isDraft = payment.status === 'Draft';
  const isConfirmed = payment.status === 'Confirmed';
  const isCancelled = payment.status === 'Cancelled';

  const handleViewReceipt = useCallback(() => {
    setReceiptViewerOpen(true);
  }, []);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment Details
              </DialogTitle>
              <PaymentStatusBadge status={payment.status} />
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="allocations">Allocations</TabsTrigger>
              <TabsTrigger value="audit">Audit Trail</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-4">
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
                      <p className="font-medium">{payment.party_name || payment.party_id}</p>
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

                  {/* Journal entry integration coming soon */}

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
              <div className="flex justify-end gap-3">
                {isDraft && onEdit && (
                  <Button variant="outline" onClick={onEdit} disabled={loading} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                {isDraft && onConfirm && (
                  <Button onClick={onConfirm} disabled={loading} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Confirm Payment
                  </Button>
                )}
                {isConfirmed && onCancel && (
                  <Button
                    variant="destructive"
                    onClick={onCancel}
                    disabled={loading}
                    className="gap-2"
                  >
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
            </TabsContent>

            {/* Allocations Tab */}
            <TabsContent value="allocations" className="space-y-4">
              <AllocationList
                allocations={payment.payment_references || []}
                paymentCurrency={payment.currency_code}
                isDraft={isDraft}
                onRemove={onRemoveAllocation || (() => {})}
                loading={loading}
              />
            </TabsContent>

            {/* Audit Trail Tab */}
            <TabsContent value="audit" className="space-y-4">
              <PaymentAuditTrail auditLogs={[]} />
              <p className="text-sm text-muted-foreground text-center">
                Audit trail integration coming soon
              </p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Receipt Viewer */}
      {isConfirmed && payment.receipt_number && (
        <ReceiptViewer
          open={receiptViewerOpen}
          onOpenChange={setReceiptViewerOpen}
          payment={payment}
        />
      )}
    </>
  );
});
