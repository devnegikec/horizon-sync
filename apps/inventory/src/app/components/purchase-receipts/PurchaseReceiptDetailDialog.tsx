import { useState, useEffect } from 'react';
import { Loader2, Package, FileText } from 'lucide-react';
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
import { purchaseReceiptApi } from '../../utility/api';
import type { PurchaseReceipt } from '../../types/purchase-receipt.types';

interface PurchaseReceiptDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseReceipt: PurchaseReceipt | null;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatReceivedDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function PurchaseReceiptDetailDialog({
  open,
  onOpenChange,
  purchaseReceipt,
}: PurchaseReceiptDetailDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [fullDetails, setFullDetails] = useState<PurchaseReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && purchaseReceipt && accessToken) {
      const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const details = await purchaseReceiptApi.getById(accessToken, purchaseReceipt.id);
          setFullDetails(details);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load details');
          console.error('Error fetching purchase receipt details:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setFullDetails(null);
    }
  }, [open, purchaseReceipt, accessToken]);

  if (!purchaseReceipt) return null;

  const displayData = fullDetails || purchaseReceipt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Purchase Receipt Details</DialogTitle>
          <DialogDescription>View complete information about this goods receipt.</DialogDescription>
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
                <p className="text-sm font-medium text-muted-foreground">Receipt Number</p>
                <div className="flex items-center gap-2 mt-1">
                  <Package className="h-4 w-4 text-primary" />
                  <p className="text-sm font-mono">RN-{displayData.id.slice(0, 8)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className="bg-green-100 text-green-800 mt-1" variant="secondary">
                  {displayData.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Purchase Order</p>
                <div className="flex items-center gap-2 mt-1">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-mono">PO-{displayData.reference_id.slice(0, 8)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Received Date</p>
                <p className="text-sm mt-1">{formatReceivedDate(displayData.received_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                <p className="text-sm mt-1">{formatDate(displayData.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm mt-1">{formatDate(displayData.updated_at)}</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Received Items</h3>
              {displayData.line_items && displayData.line_items.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item ID</TableHead>
                        <TableHead>Purchase Order Line</TableHead>
                        <TableHead className="text-right">Quantity Received</TableHead>
                        <TableHead>Received Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayData.line_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.item_id.slice(0, 8)}</TableCell>
                          <TableCell className="font-mono text-sm">{item.purchase_order_line_id.slice(0, 8)}</TableCell>
                          <TableCell className="text-right font-medium">{item.quantity}</TableCell>
                          <TableCell>{formatDate(item.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No line items found</p>
              )}
            </div>

            {/* Stock Impact Summary */}
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Stock Impact</h3>
              <p className="text-sm text-blue-800">
                Stock levels were automatically incremented for all received items.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
