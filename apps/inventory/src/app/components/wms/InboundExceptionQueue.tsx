import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';

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

import { useRefreshOnKey } from '../../hooks/useRefreshOnKey';
import type {
  BulkDispositionAction,
  InboundException,
  PaginatedInboundExceptions,
  WMSPagination,
} from '../../types/wms.types';
import { inboundApi } from '../../utility/api/wms';
import { hasPermission } from '../../utils/permissions';

import {
  createInboundExceptionColumns,
  DispositionDialog,
  DISPOSITION_ACTIONS,
  exceptionRows,
  exceptionSubRows,
  selectedExceptions,
  type DispositionSubmission,
  type DispositionTarget,
  type ExceptionTableRow,
} from './inbound-exceptions';

const PAGE_SIZE = 20;

/** Radix Select forbids an empty item value, so "everything" gets a sentinel. */
const ALL_FILTERS = 'all';

const DESTINATION_OPTIONS = ['HOLD', 'QUARANTINE'] as const;

const STATUS_OPTIONS = [
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'open', label: 'Open' },
  { value: 'approved', label: 'Approved' },
  { value: 'released', label: 'Released' },
  { value: 'closed', label: 'Closed' },
] as const;

interface ExceptionPage {
  exceptions: InboundException[];
  pagination: WMSPagination | null;
  page: number;
}

/** Keeps the response mapping out of the effect so the loader stays readable. */
function readExceptionPage(res: PaginatedInboundExceptions, fallbackPage: number): ExceptionPage {
  return {
    exceptions: res.exceptions ?? [],
    pagination: res.pagination ?? null,
    page: res.pagination?.page ?? fallbackPage,
  };
}

/* ------------------------------------------------------------------ */
/*  Filters, empty state and bulk bar                                */
/* ------------------------------------------------------------------ */

function ExceptionFilters({
  destination,
  status,
  loading,
  onDestinationChange,
  onStatusChange,
}: {
  destination: string;
  status: string;
  loading: boolean;
  onDestinationChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={destination} onValueChange={onDestinationChange} disabled={loading}>
        <SelectTrigger className="w-[190px]">
          <SelectValue placeholder="All destinations" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_FILTERS}>All destinations</SelectItem>
          {DESTINATION_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={onStatusChange} disabled={loading}>
        <SelectTrigger className="w-[190px]">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_FILTERS}>All statuses</SelectItem>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ExceptionQueueEmpty({ filtered, onClearFilters }: { filtered: boolean; onClearFilters: () => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<AlertTriangle className="h-12 w-12" />}
            title="No held or quarantined stock"
            description={
              filtered
                ? 'No exceptions match the selected filters'
                : 'Exceptions raised while receiving appear here for a manager decision'
            }
            action={
              filtered ? (
                <Button variant="outline" onClick={onClearFilters}>
                  Clear filters
                </Button>
              ) : undefined
            }/>
        </div>
      </CardContent>
    </Card>
  );
}

/** Bulk dispositions are keyed per exception, so the bar acts on the units behind the selection. */
function BulkActionBar({
  exceptions,
  busy,
  onAction,
  onClear,
}: {
  exceptions: InboundException[];
  busy: boolean;
  onAction: (action: BulkDispositionAction) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2">
      <span className="text-sm font-medium">{exceptions.length} selected</span>
      {DISPOSITION_ACTIONS.map(({ value, label, destructive }) => (
        <Button key={value}
          size="sm"
          variant={destructive ? 'destructive' : 'outline'}
          disabled={busy}
          onClick={() => onAction(value)}>
          {label}
        </Button>
      ))}
      <Button size="sm" variant="ghost" disabled={busy} onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table                                              */
/* ------------------------------------------------------------------ */

type ServerPagination = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

function ExceptionTable({
  isInitialLoading,
  rows,
  columns,
  canDispose,
  serverPagination,
  pageSize,
  filtered,
  onClearFilters,
  renderFilters,
  renderBulkActions,
  onTableReady,
}: {
  isInitialLoading: boolean;
  rows: ExceptionTableRow[];
  columns: ColumnDef<ExceptionTableRow>[];
  canDispose: boolean;
  serverPagination?: ServerPagination;
  pageSize: number;
  filtered: boolean;
  onClearFilters: () => void;
  renderFilters: () => React.ReactNode;
  renderBulkActions: (rows: ExceptionTableRow[]) => React.ReactNode;
  onTableReady: (table: Table<ExceptionTableRow>) => void;
}) {
  if (isInitialLoading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton columns={9} rows={8} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (rows.length === 0) {
    return <ExceptionQueueEmpty filtered={filtered} onClearFilters={onClearFilters} />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable columns={columns}
          data={rows}
          config={{
            showSerialNumber: true,
            showPagination: true,
            enableRowSelection: canDispose,
            enableColumnVisibility: true,
            enableSorting: false,
            enableFiltering: false,
            initialPageSize: pageSize,
            serverPagination,
          }}
          getSubRows={exceptionSubRows}
          renderFilters={renderFilters}
          renderBulkActions={renderBulkActions}
          onTableReady={onTableReady}
          fixedHeader
          maxHeight="auto"/>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Queue                                                              */
/* ------------------------------------------------------------------ */

/**
 * The hold/quarantine worklist. A shortage creates no exception row — nothing
 * needs disposing of — so `ShortageLedger` is its own panel section instead.
 */
export function InboundExceptionQueue({ warehouseId, refreshKey }: { warehouseId?: string; refreshKey?: number }) {
  const token = useUserStore((state) => state.accessToken);
  const permissions = useUserStore((state) => state.permissions.permissions);
  const canDispose = hasPermission(permissions, 'inbound_exception.dispose');

  const [exceptions, setExceptions] = React.useState<InboundException[]>([]);
  const [pagination, setPagination] = React.useState<WMSPagination | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE);
  const [destination, setDestination] = React.useState(ALL_FILTERS);
  const [status, setStatus] = React.useState(ALL_FILTERS);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [target, setTarget] = React.useState<DispositionTarget | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [table, setTable] = React.useState<Table<ExceptionTableRow> | null>(null);

  const requestSeqRef = React.useRef(0);

  const load = React.useCallback(
    async (targetPage: number) => {
      if (!token) return;
      const seq = requestSeqRef.current + 1;
      requestSeqRef.current = seq;
      setLoading(true);
      setError(null);
      setNotice(null);
      try {
        const res = await inboundApi.listExceptions(token, {
          warehouse_id: warehouseId,
          destination: destination === ALL_FILTERS ? undefined : destination,
          status: status === ALL_FILTERS ? undefined : status,
          page: targetPage,
          page_size: pageSize,
        });
        if (seq !== requestSeqRef.current) return;
        const next = readExceptionPage(res, targetPage);
        setExceptions(next.exceptions);
        setPagination(next.pagination);
        setPage(next.page);
      } catch (err) {
        if (seq !== requestSeqRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load exceptions');
      } finally {
        if (seq === requestSeqRef.current) setLoading(false);
      }
    },
    [token, warehouseId, destination, status, pageSize],
  );

  React.useEffect(() => {
    load(1);
  }, [load]);

  // The panel Refresh button (above the stat cards) re-requests the current page.
  const refresh = React.useCallback(() => {
    void load(page);
  }, [load, page]);

  useRefreshOnKey(refreshKey, refresh);

  // Newest first, so the exception just raised is the first thing a manager sees.
  const rows = React.useMemo(() => exceptionRows(exceptions), [exceptions]);

  const serverPagination = React.useMemo(() => {
    if (!pagination) return undefined;

    return {
      totalItems: pagination.total_items,
      currentPage: pagination.page,
      pageSize: pagination.page_size,
      onPageChange: (nextPage: number, nextPageSize: number) => {
        setPage(nextPage);
        if (nextPageSize !== pagination.page_size) {
          setPageSize(nextPageSize);
          return;
        }
        load(nextPage);
      },
    };
  }, [pagination, load]);

  const handleTableReady = React.useCallback((instance: Table<ExceptionTableRow>) => {
    setTable(instance);
  }, []);

  const openDisposition = React.useCallback((row: ExceptionTableRow, action: BulkDispositionAction) => {
    // A mixed batch can hold already-resolved units; only actionable ones may be sent.
    setTarget({ exceptions: selectedExceptions([row]), action });
  }, []);

  const columns = React.useMemo(
    () => createInboundExceptionColumns({ canDispose, onDispose: openDisposition }),
    [canDispose, openDisposition],
  );

  const submitDisposition = React.useCallback(
    async ({ action, note, itemId }: DispositionSubmission) => {
      if (!token || !target) return;
      setSubmitting(true);
      try {
        const ids = target.exceptions.map((exception) => exception.id);
        if (ids.length === 1) {
          await inboundApi.disposeException(token, ids[0], { action, note, item_id: itemId });
          setNotice('Disposition recorded.');
        } else {
          const res = await inboundApi.bulkDisposeExceptions(token, { exception_ids: ids, action, note });
          setNotice(`Bulk disposition complete — ${res.disposed_count ?? 0} succeeded, ${res.failed_count ?? 0} failed.`);
        }
        table?.resetRowSelection();
        // Back to page 1 so the reloaded, newest-first queue is on top.
        await load(1);
      } finally {
        setSubmitting(false);
      }
    },
    [token, target, table, load],
  );

  const renderBulkActions = React.useCallback(
    (selectedRows: ExceptionTableRow[]) => {
      const actionable = selectedExceptions(selectedRows);
      return (
        <BulkActionBar exceptions={actionable}
          busy={submitting || loading}
          onAction={(action) => setTarget({ exceptions: actionable, action })}
          onClear={() => table?.resetRowSelection()}/>
      );
    },
    [submitting, loading, table],
  );

  const renderFilters = React.useCallback(
    () => (
      <ExceptionFilters destination={destination}
        status={status}
        loading={loading}
        onDestinationChange={setDestination}
        onStatusChange={setStatus}/>
    ),
    [destination, status, loading],
  );

  const clearFilters = React.useCallback(() => {
    setDestination(ALL_FILTERS);
    setStatus(ALL_FILTERS);
  }, []);

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}
      {notice && <p className="text-sm text-emerald-600">{notice}</p>}

      <ExceptionTable isInitialLoading={loading && exceptions.length === 0}
        rows={rows}
        columns={columns}
        canDispose={canDispose}
        serverPagination={serverPagination}
        pageSize={pageSize}
        filtered={destination !== ALL_FILTERS || status !== ALL_FILTERS}
        onClearFilters={clearFilters}
        renderFilters={renderFilters}
        renderBulkActions={renderBulkActions}
        onTableReady={handleTableReady}/>

      <DispositionDialog target={target}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
        onConfirm={submitDisposition}/>
    </div>
  );
}
