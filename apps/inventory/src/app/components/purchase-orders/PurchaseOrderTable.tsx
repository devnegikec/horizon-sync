import { Eye, Edit, Send, XCircle, Trash2, FileText, Lock } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import { TableSkeleton } from '@horizon-sync/ui/components/ui/table-skeleton';
import type { PurchaseOrderListItem, PurchaseOrderFilters, PurchaseOrderStatus } from '../../types/purchase-order.types';
import { MoreHorizontal } from 'lucide-react';

interface PurchaseOrderTableProps {
  purchaseOrders: PurchaseOrderListItem[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  filters: Partial<PurchaseOrderFilters>;
  setFilters: (filters: Partial<PurchaseOrderFilters>) => void;
  onView: (po: PurchaseOrderListItem) => void;
  onEdit: (po: PurchaseOrderListItem) => void;
  onSubmit: (po: PurchaseOrderListItem) => void;
  onCancel: (po: PurchaseOrderListItem) => void;
  onClose: (po: PurchaseOrderListItem) => void;
  onDelete: (po: PurchaseOrderListItem) => void;
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
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function PurchaseOrderTable({
  purchaseOrders = [],
  loading,
  error,
  totalCount,
  filters,
  setFilters,
  onView,
  onEdit,
  onSubmit,
  onCancel,
  onClose,
  onDelete,
}: PurchaseOrderTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton columns={6} />
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

  if (!Array.isArray(purchaseOrders) || purchaseOrders.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="No purchase orders found"
            description="Create your first purchase order to start ordering from suppliers."
          />
        </CardContent>
      </Card>
    );
  }

  const canEdit = (po: PurchaseOrderListItem) => po.status === 'draft';
  const canSubmit = (po: PurchaseOrderListItem) => po.status === 'draft';
  const canCancel = (po: PurchaseOrderListItem) => po.status === 'draft' || po.status === 'submitted';
  const canClose = (po: PurchaseOrderListItem) => po.status === 'fully_received';
  const canDelete = (po: PurchaseOrderListItem) => po.status === 'draft';

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grand Total</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">PO-{po.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {po.line_items_count ?? 0} items
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{po.supplier_name}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[po.status as PurchaseOrderStatus]} variant="secondary">
                        {po.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{formatCurrency(po.grand_total)}</p>
                    </TableCell>
                    <TableCell>{formatDate(po.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onView(po)}>
                          <Eye className="h-4 w-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit(po) && (
                              <DropdownMenuItem onClick={() => onEdit(po)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canSubmit(po) && (
                              <>
                                {canEdit(po) && <DropdownMenuSeparator />}
                                <DropdownMenuItem onClick={() => onSubmit(po)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Submit
                                </DropdownMenuItem>
                              </>
                            )}
                            {canClose(po) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onClose(po)}>
                                  <Lock className="h-4 w-4 mr-2" />
                                  Close
                                </DropdownMenuItem>
                              </>
                            )}
                            {canCancel(po) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onCancel(po)}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDelete(po) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDelete(po)} className="text-destructive">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
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
          Showing {purchaseOrders.length} of {totalCount} purchase orders
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
            disabled={purchaseOrders.length < (filters.page_size || 10)}
            onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
