import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { PackageOpen } from 'lucide-react';

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

import { usePutAwayLists } from '../../hooks/useWMS';
import type { PutAwayList, PutAwayStatusCounts } from '../../types/wms.types';

import { createPutAwayColumns } from './PutAwayColumns';
import { PutAwayDetailDialog } from './PutAwayDetailDialog';

// ─── Sub components ───────────────────────────────────────────────────────────

type ServerPagination = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

const STATUS_FILTERS: { value: string; label: string; countKey: keyof PutAwayStatusCounts }[] = [
  { value: 'all', label: 'All Statuses', countKey: 'total' },
  { value: 'pending', label: 'Pending', countKey: 'pending' },
  { value: 'in_progress', label: 'In Progress', countKey: 'in_progress' },
  { value: 'completed', label: 'Completed', countKey: 'completed' },
  { value: 'cancelled', label: 'Cancelled', countKey: 'cancelled' },
];

function PutAwayFilters({
  statusFilter,
  statusCounts,
  onStatusFilterChange,
}: {
  statusFilter: string;
  statusCounts: PutAwayStatusCounts | null;
  onStatusFilterChange: (status: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_FILTERS.map((filter) => (
            <SelectItem key={filter.value} value={filter.value}>
              {filter.label} ({statusCounts?.[filter.countKey] ?? 0})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PutAwayEmpty({ filtered, onClearFilter }: { filtered: boolean; onClearFilter: () => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<PackageOpen className="h-12 w-12" />}
            title="No put-away lists found"
            description={
              filtered
                ? 'No put-away lists match the selected status'
                : 'Put-away lists are generated automatically when a receiving slip is approved'
            }
            action={
              filtered ? (
                <Button variant="outline" onClick={onClearFilter}>
                  Clear filter
                </Button>
              ) : undefined
            }/>
        </div>
      </CardContent>
    </Card>
  );
}

function PutAwayTable({
  isInitialLoading,
  error,
  lists,
  columns,
  serverPagination,
  pageSize,
  filtered,
  onClearFilter,
}: {
  isInitialLoading: boolean;
  error: string | null;
  lists: PutAwayList[];
  columns: ColumnDef<PutAwayList>[];
  serverPagination?: ServerPagination;
  pageSize: number;
  filtered: boolean;
  onClearFilter: () => void;
}) {
  const renderBody = () => {
    if (isInitialLoading) {
      return (
        <Card>
          <CardContent className="p-0">
            <TableSkeleton columns={8} rows={8} showHeader={true} />
          </CardContent>
        </Card>
      );
    }

    if (lists.length === 0) {
      return <PutAwayEmpty filtered={filtered} onClearFilter={onClearFilter} />;
    }

    return (
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns}
            data={lists}
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
    );
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-destructive">{error}</div>}
      {renderBody()}
    </div>
  );
}

// ─── Main PutAwayView ─────────────────────────────────────────────────────────

interface PutAwayViewProps {
  warehouseId?: string;
  /** Controlled status filter (e.g. driven by the inbound stat cards). */
  statusFilter?: string;
  /** Increment to trigger a refetch (e.g. from the panel-level Refresh button). */
  refreshKey?: number;
  onStatusFilterChange?: (status: string) => void;
}

export function PutAwayView({ warehouseId, statusFilter: statusFilterProp, refreshKey, onStatusFilterChange }: PutAwayViewProps) {
  const [internalStatusFilter, setInternalStatusFilter] = React.useState('all');
  const statusFilter = statusFilterProp ?? internalStatusFilter;
  const setStatusFilter = onStatusFilterChange ?? setInternalStatusFilter;
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [viewListId, setViewListId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Reset to the first page whenever the status filter changes.
  React.useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const { data, statusCounts, loading, error, refetch } = usePutAwayLists({
    warehouse_id: warehouseId,
    status: statusFilter === 'all' ? undefined : statusFilter,
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

  const lists: PutAwayList[] = data?.put_away_lists ?? [];
  const pagination = data?.pagination;

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

  const handleView = React.useCallback((list: PutAwayList) => {
    setViewListId(list.id);
    setDialogOpen(true);
  }, []);

  const columns = React.useMemo(() => createPutAwayColumns({ onView: handleView }), [handleView]);

  const isInitialLoading = loading && !data;

  return (
    <div className="space-y-4">
      <PutAwayFilters statusFilter={statusFilter} statusCounts={statusCounts} onStatusFilterChange={setStatusFilter} />

      <PutAwayTable isInitialLoading={isInitialLoading}
        error={error}
        lists={lists}
        columns={columns}
        serverPagination={serverPagination}
        pageSize={pageSize}
        filtered={statusFilter !== 'all'}
        onClearFilter={() => setStatusFilter('all')}/>

      <PutAwayDetailDialog listId={viewListId} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
