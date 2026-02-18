import { Eye, FileText, Package } from 'lucide-react';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@horizon-sync/ui/components/ui/table';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import { TableSkeleton } from '@horizon-sync/ui/components/ui/table-skeleton';
import type { PurchaseReceiptListItem, PurchaseReceiptFilters } from '../../types/purchase-receipt.types';

interface PurchaseReceiptTableProps {
  purchaseReceipts: PurchaseReceiptListItem[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  filters: Partial<PurchaseReceiptFilters>;
  setFilters: (filters: Partial<PurchaseReceiptFilters>) => void;
  onView: (receipt: PurchaseReceiptListItem) => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function PurchaseReceiptTable({
  purchaseReceipts = [],
  loading,
  error,
  totalCount,
  filters,
  setFilters,
  onView,
}: PurchaseReceiptTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton columns={5} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!Array.isArray(purchaseReceipts) || purchaseReceipts.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={<Package className="h-12 w-12" />}
            title="No purchase receipts found"
            description="Record your first goods receipt to track inventory."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt Number</TableHead>
                  <TableHead>Purchase Order</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Line Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">RN-{receipt.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(receipt.created_at)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">PO-{receipt.reference_id.slice(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(receipt.received_date)}</TableCell>
                    <TableCell>{receipt.line_items_count ?? 0}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800" variant="secondary">
                        {receipt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => onView(receipt)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {purchaseReceipts.length} of {totalCount} purchase receipts
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={filters.page === 1}
            onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={purchaseReceipts.length < (filters.page_size || 10)}
            onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
