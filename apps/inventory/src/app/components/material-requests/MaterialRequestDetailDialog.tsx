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
import { materialRequestApi } from '../../utility/api';
import type { MaterialRequest, MaterialRequestStatus } from '../../types/material-request.types';

interface MaterialRequestDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  materialRequest: MaterialRequest | null;
}

const STATUS_COLORS: Record<MaterialRequestStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  partially_quoted: 'bg-yellow-100 text-yellow-800',
  fully_quoted: 'bg-green-100 text-green-800',
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

function formatRequiredDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function MaterialRequestDetailDialog({
  open,
  onOpenChange,
  materialRequest,
}: MaterialRequestDetailDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [fullDetails, setFullDetails] = useState<MaterialRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && materialRequest && accessToken) {
      // Fetch full details including line items
      const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
          const details = await materialRequestApi.getById(accessToken, materialRequest.id);
          setFullDetails(details);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load details');
          console.error('Error fetching material request details:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setFullDetails(null);
    }
  }, [open, materialRequest, accessToken]);

  if (!materialRequest) return null;

  const displayData = fullDetails || materialRequest;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Material Request Details</DialogTitle>
          <DialogDescription>View complete information about this material request.</DialogDescription>
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
                <p className="text-sm font-medium text-muted-foreground">ID</p>
                <p className="text-sm font-mono">{displayData.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge className={STATUS_COLORS[displayData.status]} variant="secondary">
                  {displayData.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created Date</p>
                <p className="text-sm">{formatDate(displayData.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p className="text-sm">{formatDate(displayData.updated_at)}</p>
              </div>
              {displayData.notes && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{displayData.notes}</p>
                </div>
              )}
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
                        <TableHead>Required Date</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayData.line_items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-sm">{item.item_id.slice(0, 8)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>{formatRequiredDate(item.required_date)}</TableCell>
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
        )}
      </DialogContent>
    </Dialog>
  );
}
