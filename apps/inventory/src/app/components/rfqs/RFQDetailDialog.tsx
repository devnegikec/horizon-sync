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
import { rfqApi } from '../../utility/api';
import type { RFQ, RFQStatus } from '../../types/rfq.types';

interface RFQDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfqId: string | null;
}

const STATUS_COLORS: Record<RFQStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  PARTIALLY_RESPONDED: 'bg-yellow-100 text-yellow-800',
  FULLY_RESPONDED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-red-100 text-red-800',
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

function formatRequiredDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function RFQDetailDialog({
  open,
  onOpenChange,
  rfqId,
}: RFQDetailDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [rfqDetails, setRFQDetails] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && rfqId && accessToken) {
      const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const details = await rfqApi.getById(accessToken, rfqId);
          setRFQDetails(details);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load details');
          console.error('Error fetching RFQ details:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setRFQDetails(null);
    }
  }, [open, rfqId, accessToken]);

  if (!rfqId) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>RFQ Details</DialogTitle>
          <DialogDescription>View complete information about this RFQ.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : rfqDetails ? (
          <div className="space-y-6 py-4">
            {/* Header Information */}
            <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID</p>
                <p className="text-sm font-mono">{rfqDetails.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={STATUS_COLORS[rfqDetails.status]} variant="secondary">
                  {rfqDetails.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Material Request ID</p>
                <p className="text-sm font-mono">{rfqDetails.material_request_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Closing Date</p>
                <p className="text-sm">{formatRequiredDate(rfqDetails.closing_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                <p className="text-sm">{formatDate(rfqDetails.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDate(rfqDetails.updated_at)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Suppliers</p>
                <p className="text-sm">{rfqDetails.suppliers?.length || 0} suppliers selected</p>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Line Items</h3>
              {rfqDetails.line_items && rfqDetails.line_items.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item ID</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Required Date</TableHead>
                        <TableHead>Quotes</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rfqDetails.line_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.item_id.slice(0, 8)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatRequiredDate(item.required_date)}</TableCell>
                          <TableCell>{item.quotes?.length || 0} quotes</TableCell>
                          <TableCell>{item.description || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No line items found</p>
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
