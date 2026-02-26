import { Eye, Edit, Send, XCircle, Trash2, FileText } from 'lucide-react';
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
import type { RFQListItem, RFQFilters, RFQStatus } from '../../types/rfq.types';
import { MoreHorizontal } from 'lucide-react';

interface RFQTableProps {
  rfqs: RFQListItem[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  filters: Partial<RFQFilters>;
  setFilters: (filters: Partial<RFQFilters>) => void;
  onView: (rfq: RFQListItem) => void;
  onEdit: (rfq: RFQListItem) => void;
  onSend: (rfq: RFQListItem) => void;
  onClose: (rfq: RFQListItem) => void;
  onDelete: (rfq: RFQListItem) => void;
}

const STATUS_COLORS: Record<RFQStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  partially_responded: 'bg-yellow-100 text-yellow-800',
  fully_responded: 'bg-green-100 text-green-800',
  closed: 'bg-red-100 text-red-800',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function RFQTable({
  rfqs = [],
  loading,
  error,
  totalCount,
  filters,
  setFilters,
  onView,
  onEdit,
  onSend,
  onClose,
  onDelete,
}: RFQTableProps) {
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

  if (!Array.isArray(rfqs) || rfqs.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="No RFQs found"
            description="Create your first RFQ to request quotes from suppliers."
          />
        </CardContent>
      </Card>
    );
  }

  const canEdit = (rfq: RFQListItem) => rfq.status === 'draft';
  const canSend = (rfq: RFQListItem) => rfq.status === 'draft';
  const canClose = (rfq: RFQListItem) => rfq.status === 'sent' || rfq.status === 'partially_responded' || rfq.status === 'fully_responded';
  const canDelete = (rfq: RFQListItem) => rfq.status === 'draft';

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RFQ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Suppliers</TableHead>
                  <TableHead>Line Items</TableHead>
                  <TableHead>Closing Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfqs.map((rfq) => (
                  <TableRow key={rfq.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">RFQ-{rfq.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(rfq.created_at)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[rfq.status as RFQStatus]} variant="secondary">
                        {rfq.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{rfq.suppliers_count || 0} suppliers</TableCell>
                    <TableCell>{rfq.line_items_count || 0}</TableCell>
                    <TableCell>{formatDate(rfq.closing_date)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onView(rfq)}>
                          <Eye className="h-4 w-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit(rfq) && (
                              <DropdownMenuItem onClick={() => onEdit(rfq)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canSend(rfq) && (
                              <>
                                {canEdit(rfq) && <DropdownMenuSeparator />}
                                <DropdownMenuItem onClick={() => onSend(rfq)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send to Suppliers
                                </DropdownMenuItem>
                              </>
                            )}
                            {canClose(rfq) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onClose(rfq)}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Close
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDelete(rfq) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDelete(rfq)} className="text-destructive">
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
          Showing {rfqs.length} of {totalCount} RFQs
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
            disabled={rfqs.length < (filters.page_size || 10)}
            onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
