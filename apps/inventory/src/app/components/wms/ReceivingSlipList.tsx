import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { PackageOpen } from 'lucide-react';

import {
  Button,
  Card,
  CardContent,
  ConfirmationDialog,
  EmptyState,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TableSkeleton,
} from '@horizon-sync/ui/components';
import { DataTable } from '@horizon-sync/ui/components/data-table';
import { useToast } from '@horizon-sync/ui/hooks';

import { useReceivingSlip, useReceivingSlips } from '../../hooks/useWMS';
import type { ReceivingSlip, ReceivingSlipStatus, ReceivingSlipStatusCounts } from '../../types/wms.types';

import { GeneratePutAwayDialog } from './GeneratePutAwayDialog';
import { createReceivingSlipColumns, RejectSlipDialog, SlipDetailDialog } from './receiving-slips';

interface ReceivingSlipListProps {
  warehouseId?: string;
  statusFilter: string;
  /** Increment to trigger a refetch (e.g. from the panel-level Refresh button). */
  refreshKey?: number;
  onStatusFilterChange: (status: string) => void;
  /**
   * Publishes the list's status counts so sibling stat cards can reuse them
   * instead of issuing a second request to the same endpoint.
   */
  onStatusCountsChange?: (counts: ReceivingSlipStatusCounts | null) => void;
}

type ServerPagination = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

// ─── Sub components ───────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: string; label: string; countKey: keyof ReceivingSlipStatusCounts }[] = [
  { value: 'all', label: 'All Statuses', countKey: 'total' },
  { value: 'pending_review', label: 'Pending Review', countKey: 'pending_review' },
  { value: 'pending_putaway', label: 'Pending Put-Away', countKey: 'pending_putaway' },
  { value: 'putaway_in_progress', label: 'Put-Away In Progress', countKey: 'putaway_in_progress' },
  { value: 'putaway_complete', label: 'Put-Away Complete', countKey: 'putaway_complete' },
  { value: 'rejected', label: 'Rejected', countKey: 'rejected' },
];

const REJECT_ITEM_STATUSES: ReceivingSlipStatus[] = ['pending_review', 'pending_putaway'];

function getApproveDescription(slip: ReceivingSlip | null): string {
  return `Are you sure you want to approve ${slip?.slip_number}? This will move it to put-away.`;
}

function ReceivingSlipFilters({
  statusFilter,
  statusCounts,
  onStatusFilterChange,
}: {
  statusFilter: string;
  statusCounts: ReceivingSlipStatusCounts | null;
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

function ReceivingSlipsEmpty({ filtered, onClearFilter }: { filtered: boolean; onClearFilter: () => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<PackageOpen className="h-12 w-12" />}
            title="No receiving slips found"
            description={
              filtered ? 'No receiving slips match the selected status' : 'Receiving slips will appear here once an inbound scan session is ended'
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

function ReceivingSlipsTable({
  isInitialLoading,
  error,
  slips,
  columns,
  serverPagination,
  pageSize,
  filtered,
  onClearFilter,
}: {
  isInitialLoading: boolean;
  error: string | null;
  slips: ReceivingSlip[];
  columns: ColumnDef<ReceivingSlip>[];
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
            <TableSkeleton columns={7} rows={8} showHeader={true} />
          </CardContent>
        </Card>
      );
    }

    if (slips.length === 0) {
      return <ReceivingSlipsEmpty filtered={filtered} onClearFilter={onClearFilter} />;
    }

    return (
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns}
            data={slips}
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

// ─── Main component ───────────────────────────────────────────────────────────

export function ReceivingSlipList({ warehouseId, statusFilter, refreshKey, onStatusFilterChange, onStatusCountsChange }: ReceivingSlipListProps) {
  const { toast } = useToast();
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(20);
  const [viewSlipId, setViewSlipId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [confirmApproveSlip, setConfirmApproveSlip] = React.useState<ReceivingSlip | null>(null);
  const [confirmPutAwaySlip, setConfirmPutAwaySlip] = React.useState<ReceivingSlip | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<ReceivingSlip | null>(null);
  const [actionLoading, setActionLoading] = React.useState(false);

  const {
    data,
    statusCounts,
    loading,
    error,
    refetch,
    approveSlip,
    rejectSlip: submitReject,
    rejectItem,
    generatePutAway,
  } = useReceivingSlips({
    warehouse_id: warehouseId,
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    page_size: pageSize,
  });

  // Cached detail for the open dialog. Mutations invalidate the receiving-slips
  // prefix, so approving/rejecting/flagging refreshes this automatically.
  const { slip: viewSlip, loading: viewLoading, error: viewError, refetch: refetchViewSlip } = useReceivingSlip(viewSlipId);

  const slips = data?.receiving_slips ?? [];
  const pagination = data?.pagination;

  React.useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Refetch when the panel-level Refresh button is pressed (skip the initial mount).
  const lastRefreshKeyRef = React.useRef(refreshKey);
  React.useEffect(() => {
    if (lastRefreshKeyRef.current === refreshKey) return;
    lastRefreshKeyRef.current = refreshKey;
    refetch();
  }, [refreshKey, refetch]);

  // Share the counts returned with the list so the stat cards above don't need
  // their own request to the same endpoint.
  React.useEffect(() => {
    onStatusCountsChange?.(statusCounts);
  }, [statusCounts, onStatusCountsChange]);

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

  const handleView = React.useCallback((slip: ReceivingSlip) => {
    setViewSlipId(slip.id);
    setDialogOpen(true);
  }, []);

  /**
   * Show a toast in both trees: the in-app Toaster (standalone inventory) and
   * the platform host's Toaster via `app:toast`, because when this remote is
   * mounted by the host the two React trees do not share the toast store.
   */
  const notify = React.useCallback(
    (payload: { title: string; description: string; variant?: 'default' | 'destructive'; className?: string }) => {
      toast({ ...payload, duration: 4000 });
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { ...payload, duration: 4000 } }));
    },
    [toast],
  );

  const handleConfirmApprove = React.useCallback(async () => {
    if (!confirmApproveSlip) return;
    setActionLoading(true);
    try {
      const result = await approveSlip(confirmApproveSlip.id);
      // The API owns the message/copy: green when success, red otherwise.
      notify({
        title: result.success ? 'Slip approved' : 'Approval failed',
        description: result.message || `${confirmApproveSlip.slip_number} approval could not be completed.`,
        variant: result.success ? undefined : 'destructive',
        className: result.success ? 'border-emerald-600 bg-emerald-600 text-white' : undefined,
      });
      if (result.success) setConfirmApproveSlip(null);
    } catch (err) {
      notify({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to approve',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  }, [approveSlip, confirmApproveSlip, notify]);

  const handleConfirmReject = React.useCallback(
    async (reason: string) => {
      if (!rejectTarget) return;
      setActionLoading(true);
      try {
        await submitReject(rejectTarget.id, reason);
        toast({ title: 'Slip rejected', description: rejectTarget.slip_number });
        setRejectTarget(null);
      } catch (err) {
        toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to reject', variant: 'destructive' });
      } finally {
        setActionLoading(false);
      }
    },
    [rejectTarget, submitReject, toast],
  );

  // Errors propagate to the caller (SlipDetailDialog owns the success/error toast).
  const handleRejectItem = React.useCallback(
    async (slipId: string, itemId: string, reason: string) => {
      // `rejectItem` invalidates the receiving-slips prefix, which refreshes this
      // slip's cached detail alongside the list.
      await rejectItem(slipId, itemId, reason);
    },
    [rejectItem],
  );

  const columns = React.useMemo(
    () =>
      createReceivingSlipColumns({
        onView: handleView,
        onApprove: setConfirmApproveSlip,
        onReject: setRejectTarget,
        onPutAway: setConfirmPutAwaySlip,
      }),
    [handleView],
  );

  const isInitialLoading = loading && !data;
  const canRejectItems = !!viewSlip && REJECT_ITEM_STATUSES.includes(viewSlip.status);

  return (
    <div className="space-y-4">
      <ReceivingSlipFilters statusFilter={statusFilter} statusCounts={statusCounts} onStatusFilterChange={onStatusFilterChange} />

      <ReceivingSlipsTable isInitialLoading={isInitialLoading}
        error={error}
        slips={slips}
        columns={columns}
        serverPagination={serverPagination}
        pageSize={pageSize}
        filtered={statusFilter !== 'all'}
        onClearFilter={() => onStatusFilterChange('all')}/>

      <SlipDetailDialog slip={viewSlip}
        loading={viewLoading}
        error={viewError}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onRejectItem={canRejectItems ? handleRejectItem : undefined}
        onExceptionCreated={async () => {
          // The exception blocks an item, so both the detail and the list change.
          await Promise.all([refetchViewSlip(), refetch()]);
          toast({ title: 'Inbound exception created', description: 'Item is blocked from normal put-away.' });
        }}/>

      <ConfirmationDialog open={!!confirmApproveSlip}
        onOpenChange={(open) => {
          if (!open) setConfirmApproveSlip(null);
        }}
        title="Approve Receiving Slip"
        description={getApproveDescription(confirmApproveSlip)}
        confirmLabel="Approve"
        loading={actionLoading}
        onConfirm={handleConfirmApprove}/>

      <RejectSlipDialog slip={rejectTarget}
        loading={actionLoading}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        onConfirm={handleConfirmReject}/>

      <GeneratePutAwayDialog slip={confirmPutAwaySlip}
        open={!!confirmPutAwaySlip}
        onOpenChange={(open) => {
          if (!open) setConfirmPutAwaySlip(null);
        }}
        onGenerate={generatePutAway}/>
    </div>
  );
}
