import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components/ui/table';
import { useUserStore } from '@horizon-sync/store';
import { purchaseOrderApi } from '../../utility/api';
import type { PurchaseOrder, PurchaseOrderStatus } from '../../types/purchase-order.types';

interface PurchaseOrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseOrder: PurchaseOrder | null;
}

const STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  partially_received: 'bg-yellow-100 text-yellow-800',
  fully_received: 'bg-green-100 text-green-800',
  closed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function PurchaseOrderDetailDialog({
  open,
  onOpenChange,
  purchaseOrder,
}: PurchaseOrderDetailDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [fullDetails, setFullDetails] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && purchaseOrder && accessToken) {
      const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const details = await purchaseOrderApi.getById(accessToken, purchaseOrder.id);
          setFullDetails(details);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load details');
          console.error('Error fetching purchase order details:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setFullDetails(null);
    }
  }, [open, purchaseOrder, accessToken]);

  if (!purchaseOrder) return null;

  const displayData = fullDetails || purchaseOrder;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase Order Details</DialogTitle>
          <DialogDescription>View complete information about this purchase order.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Header Information */}
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium text-muted-foreground">PO Number</p>
                <p className="text-sm font-mono">PO-{displayData.id.slice(0, 8)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={STATUS_COLORS[displayData.status]} variant="secondary">
                  {displayData.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                <p className="text-sm">{displayData.party_id}</p>
              </div>
              {displayData.rfq_id && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">RFQ Reference</p>
                  <p className="text-sm font-mono">{displayData.rfq_id.slice(0, 8)}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                <p className="text-sm">{formatDate(displayData.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDate(displayData.updated_at)}</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Line Items</h3>
              {displayData.line_items && displayData.line_items.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item ID</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Line Total</TableHead>
                        <TableHead>Received Qty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayData.line_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.item_id.slice(0, 8)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(item.quantity * item.unit_price)}
                          </TableCell>
                          <TableCell>
                            <span className={item.received_quantity === item.quantity ? 'text-green-600' : 'text-yellow-600'}>
                              {item.received_quantity || 0} / {item.quantity}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No line items found</p>
              )}
            </div>

            {/* Totals */}
            <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatCurrency(displayData.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({displayData.tax_rate}%):</span>
                <span className="font-medium">{formatCurrency(displayData.tax_amount)}</span>
              </div>
              {displayData.discount_amount && displayData.discount_amount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount:</span>
                  <span className="font-medium">-{formatCurrency(displayData.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Grand Total:</span>
                <span>{formatCurrency(displayData.grand_total)}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
