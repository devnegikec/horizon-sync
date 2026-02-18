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
import type { MaterialRequestListItem, MaterialRequest, MaterialRequestFilters, MaterialRequestStatus } from '../../types/material-request.types';
import { MoreHorizontal } from 'lucide-react';

interface MaterialRequestTableProps {
  materialRequests: MaterialRequestListItem[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  filters: Partial<MaterialRequestFilters>;
  setFilters: (filters: Partial<MaterialRequestFilters>) => void;
  onView: (mr: MaterialRequestListItem) => void;
  onEdit: (mr: MaterialRequestListItem) => void;
  onSubmit: (mr: MaterialRequestListItem) => void;
  onCancel: (mr: MaterialRequestListItem) => void;
  onDelete: (mr: MaterialRequestListItem) => void;
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
    month: 'short',
    day: 'numeric',
  });
}

export function MaterialRequestTable({
  materialRequests = [],
  loading,
  error,
  totalCount,
  filters,
  setFilters,
  onView,
  onEdit,
  onSubmit,
  onCancel,
  onDelete,
}: MaterialRequestTableProps) {
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

  if (!Array.isArray(materialRequests) || materialRequests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="No material requests found"
            description="Create your first material request to get started with procurement."
          />
        </CardContent>
      </Card>
    );
  }

  const canEdit = (mr: MaterialRequestListItem) => mr.status === 'draft';
  const canSubmit = (mr: MaterialRequestListItem) => mr.status === 'draft';
  const canCancel = (mr: MaterialRequestListItem) => mr.status === 'draft' || mr.status === 'submitted';
  const canDelete = (mr: MaterialRequestListItem) => mr.status === 'draft';

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material Request</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Line Items</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialRequests.map((mr) => (
                  <TableRow key={mr.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">MR-{mr.id.slice(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {mr.line_items_count ?? 0} items
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[mr.status as MaterialRequestStatus]} variant="secondary">
                        {mr.status.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>{mr.line_items_count ?? 0}</TableCell>
                    <TableCell>{formatDate(mr.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onView(mr)}>
                          <Eye className="h-4 w-4" />
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit(mr) && (
                              <DropdownMenuItem onClick={() => onEdit(mr)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canSubmit(mr) && (
                              <>
                                {canEdit(mr) && <DropdownMenuSeparator />}
                                <DropdownMenuItem onClick={() => onSubmit(mr)}>
                                  <Send className="h-4 w-4 mr-2" />
                                  Submit
                                </DropdownMenuItem>
                              </>
                            )}
                            {canCancel(mr) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onCancel(mr)}>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </>
                            )}
                            {canDelete(mr) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDelete(mr)} className="text-destructive">
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
          Showing {materialRequests.length} of {totalCount} material requests
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
            disabled={materialRequests.length < (filters.page_size || 10)}
            onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
