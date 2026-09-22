import * as React from 'react';

import { PackageOpen, RefreshCw } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableSkeleton,
} from '@horizon-sync/ui/components';
import { DataTable } from '@horizon-sync/ui/components/data-table';

import { useReturnReceiptNotes } from '../../../hooks/useWMS';
import type { ReturnReceiptNoteSummary } from '../../../types/wms.types';
import { hasPermission } from '../../../utils/permissions';

import { createReturnReceiptNoteColumns } from './ReturnReceiptNoteColumns';
import { ReturnReceiptNoteDetailDialog } from './ReturnReceiptNoteDetailDialog';

const PAGE_SIZE = 20;
const ALL_STATUSES = 'all';

const STATUS_FILTERS = [
  { value: 'pending_approval', label: 'Pending approval' },
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All statuses' },
] as const;

type ServerPagination = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

function ReturnsEmpty({ filtered, onClearFilter }: { filtered: boolean; onClearFilter: () => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<PackageOpen className="h-12 w-12" />}
            title="No return receipt notes"
            description={
              filtered
                ? 'No notes match the selected status'
                : 'Notes appear once the dock ends a return receiving session'
            }
            action={
              filtered ? (
                <Button variant="outline" onClick={onClearFilter}>
                  Show all statuses
                </Button>
              ) : undefined
            }/>
        </div>
      </CardContent>
    </Card>
  );
}

function ReturnsTable({
  isInitialLoading,
  error,
  notes,
  columns,
  serverPagination,
  pageSize,
  filtered,
  onClearFilter,
}: {
  isInitialLoading: boolean;
  error: string | null;
  notes: ReturnReceiptNoteSummary[];
  columns: ReturnType<typeof createReturnReceiptNoteColumns>;
  serverPagination?: ServerPagination;
  pageSize: number;
  filtered: boolean;
  onClearFilter: () => void;
}) {
  if (isInitialLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton columns={8} rows={8} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (notes.length === 0) {
    return <ReturnsEmpty filtered={filtered} onClearFilter={onClearFilter} />;
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns}
            data={notes}
            config={{
              showSerialNumber: true,
              showPagination: true,
              enableRowSelection: false,
              enableColumnVisibility: true,
              enableSorting: false,
              enableFiltering: false,
              initialPageSize: pageSize,
              serverPagination,
            }}
            fixedHeader
            maxHeight="auto"/>
        </CardContent>
      </Card>
    </div>
  );
}
export interface ReturnReceiptNoteQueueProps {
  warehouseId?: string;
  /** Increment to trigger a refetch (e.g. from the panel-level Refresh button). */
  refreshKey?: number;
}

/**
 * Supervisor queue of return receipt notes (§6.1). The dock captures and
 * classifies the units; this screen is where a supervisor reviews the draft and
 * decides. Hidden unless the caller holds `return.read`.
 */
export function ReturnReceiptNoteQueue({ warehouseId, refreshKey }: ReturnReceiptNoteQueueProps) {
  const permissions = useUserStore((state) => state.permissions.permissions);
  const canView = hasPermission(permissions, 'return.read');

  const [status, setStatus] = React.useState<string>('pending_approval');
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE);
  const [noteId, setNoteId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  React.useEffect(() => {
    setPage(1);
  }, [status]);

  const { data, loading, error, refetch } = useReturnReceiptNotes({
    warehouse_id: warehouseId,
    status: status === ALL_STATUSES ? undefined : status,
    page,
    page_size: pageSize,
  });

  // Refetch when the panel-level Refresh button is pressed (skip the initial mount).
  const lastRefreshKeyRef = React.useRef(refreshKey);
  React.useEffect(() => {
    if (lastRefreshKeyRef.current === refreshKey) return;
    lastRefreshKeyRef.current = refreshKey;
    refetch();
  }, [refreshKey, refetch]);

  const notes = data?.items ?? [];
  const pagination = data;

  const serverPagination = React.useMemo(() => {
    if (!pagination) return undefined;

    return {
      totalItems: pagination.total_items,
      currentPage: pagination.page,
      pageSize: pagination.page_size,
      onPageChange: (nextPage: number, nextPageSize: number) => {
        if (nextPageSize !== pagination.page_size) {
          setPageSize(nextPageSize);
          setPage(1);
          return;
        }
        setPage(nextPage);
      },
    };
  }, [pagination]);

  const handleView = React.useCallback((note: ReturnReceiptNoteSummary) => {
    setNoteId(note.id);
    setDialogOpen(true);
  }, []);

  const columns = React.useMemo(() => createReturnReceiptNoteColumns({ onView: handleView }), [handleView]);

  if (!canView) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-sm text-muted-foreground">You do not have access to returns.</p>
        </CardContent>
      </Card>
    );
  }

  const filtered = status !== ALL_STATUSES;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Return Receipt Notes</h2>
          <p className="text-sm text-muted-foreground">
            What the dock received against what the dealer returned. Review the conditions, route each line, then approve
            or reject — approving moves stock.
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-2 self-start sm:self-auto" onClick={() => refetch()} disabled={loading}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Pending approval" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ReturnsTable isInitialLoading={loading && !data}
        error={error}
        notes={notes}
        columns={columns}
        serverPagination={serverPagination}
        pageSize={pageSize}
        filtered={filtered}
        onClearFilter={() => setStatus(ALL_STATUSES)}/>

      <ReturnReceiptNoteDetailDialog noteId={noteId} open={dialogOpen} onOpenChange={setDialogOpen}/>
    </div>
  );
}
