import { Download, Printer, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Card,
  CardContent,
  Separator,
} from '@horizon-sync/ui/components';
import { formatCurrency, formatDate } from '../../utils/payment.utils';
import { usePaymentActions } from '../../hooks/usePaymentActions';
import type { PaymentEntry } from '../../types/payment.types';

interface ReceiptViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentEntry;
  organizationName?: string;
  organizationAddress?: string;
}

export function ReceiptViewer({
  open,
  onOpenChange,
  payment,
  organizationName = 'Your Organization',
  organizationAddress = '',
}: ReceiptViewerProps) {
  const { downloadReceipt, loading } = usePaymentActions();

  const handleDownload = async () => {
    await downloadReceipt(payment.id);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalAllocated = payment.payment_references?.reduce(
    (sum, ref) => sum + ref.allocated_amount,
    0
  ) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment Receipt</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 print:space-y-4">
          {/* Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">{organizationName}</h2>
            {organizationAddress && <p className="text-sm text-muted-foreground">{organizationAddress}</p>}
            <p className="text-lg font-semibold">Payment Receipt</p>
          </div>

          <Separator />

          {/* Receipt Details */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Receipt Number</p>
                  <p className="font-medium">{payment.receipt_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Date</p>
                  <p className="font-medium">{formatDate(payment.payment_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Mode</p>
                  <p className="font-medium">{payment.payment_mode.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reference Number</p>
                  <p className="font-medium">{payment.reference_no || 'N/A'}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Party</p>
                  <p className="font-medium">{payment.party_name || payment.party_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Type</p>
                  <p className="font-medium">{payment.payment_type.replace('_', ' ')}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Amount Paid</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(payment.amount, payment.currency_code)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Allocated Invoices */}
          {payment.payment_references && payment.payment_references.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">Allocated to Invoices</h3>
                <div className="space-y-2">
                  {payment.payment_references.map((ref) => (
                    <div key={ref.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span className="text-sm">{ref.invoice_no || ref.invoice_id}</span>
                      <span className="font-medium">
                        {formatCurrency(ref.allocated_amount, payment.currency_code)}
                      </span>
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="flex justify-between items-center font-semibold">
                  <span>Total Allocated</span>
                  <span>{formatCurrency(totalAllocated, payment.currency_code)}</span>
                </div>
                {payment.unallocated_amount > 0 && (
                  <div className="flex justify-between items-center text-orange-600">
                    <span>Unallocated Amount</span>
                    <span>{formatCurrency(payment.unallocated_amount, payment.currency_code)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* QR Code Placeholder */}
          <div className="flex justify-center">
            <div className="p-4 border rounded-lg bg-muted/30">
              <QrCode className="h-32 w-32 text-muted-foreground" />
              <p className="text-xs text-center text-muted-foreground mt-2">
                Scan to verify: {payment.receipt_number}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Thank you for your payment</p>
            <p className="text-xs mt-1">
              Generated on {formatDate(new Date().toISOString())}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 print:hidden">
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button onClick={handleDownload} disabled={loading} className="gap-2">
              <Download className="h-4 w-4" />
              {loading ? 'Downloading...' : 'Download PDF'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
