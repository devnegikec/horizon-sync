import * as React from 'react';

import { Plus, RefreshCw, RotateCcw } from 'lucide-react';

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
import { useToast } from '@horizon-sync/ui/hooks';

import { useReturnRegistrations } from '../../../hooks/useWMS';
import type { ReturnRegistrationDetail, ReturnRegistrationListItem } from '../../../types/wms.types';
import { hasPermission } from '../../../utils/permissions';

import { CancelReturnRegistrationDialog, type ReturnRegistrationTarget } from './CancelReturnRegistrationDialog';
import { CreateReturnRegistrationDialog } from './CreateReturnRegistrationDialog';
import { createReturnRegistrationColumns } from './ReturnRegistrationColumns';
import { ReturnRegistrationDetailDialog } from './ReturnRegistrationDetailDialog';

const PAGE_SIZE = 20;
const ALL_STATUSES = 'all';

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'ready', label: 'Ready to receive' },
  { value: 'receiving', label: 'Receiving' },
  { value: 'received', label: 'Received' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

type ServerPagination = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

function RegistrationsEmpty({ filtered, onClearFilter, onCreate }: { filtered: boolean; onClearFilter: () => void; onCreate: () => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<RotateCcw className="h-12 w-12" />}
            title="No return registrations"
            description={
              filtered ? 'No registrations match the selected status' : 'Register a return to let the dock receive it back into the warehouse'
            }
            action={
              filtered ? (
                <Button variant="outline" onClick={onClearFilter}>
                  Show all statuses
                </Button>
              ) : (
                <Button onClick={onCreate}>Register a return</Button>
              )
            }/>
        </div>
      </CardContent>
    </Card>
  );
}

function RegistrationsTable({
  isInitialLoading,
  error,
  registrations,
  columns,
  serverPagination,
  pageSize,
  filtered,
  onClearFilter,
  onCreate,
}: {
  isInitialLoading: boolean;
  error: string | null;
  registrations: ReturnRegistrationListItem[];
  columns: ReturnType<typeof createReturnRegistrationColumns>;
  serverPagination?: ServerPagination;
  pageSize: number;
  filtered: boolean;
  onClearFilter: () => void;
  onCreate: () => void;
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

  if (registrations.length === 0) {
    return <RegistrationsEmpty filtered={filtered} onClearFilter={onClearFilter} onCreate={onCreate} />;
  }

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-destructive">{error}</div>}
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns}
            data={registrations}
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

export interface ReturnRegistrationListProps {
  warehouseId?: string;
  /** Increment to trigger a refetch (e.g. from the panel-level Refresh button). */
  refreshKey?: number;
}

/**
 * Return registrations (§5.2): what a dealer is sending back, before the dock has
 * touched it. Creating and cancelling need `return.register`.
 */
export function ReturnRegistrationList({ warehouseId, refreshKey }: ReturnRegistrationListProps) {
  const { toast } = useToast();
  const permissions = useUserStore((state) => state.permissions.permissions);
  const canRegister = hasPermission(permissions, 'return.register');

  const [status, setStatus] = React.useState<string>(ALL_STATUSES);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [viewId, setViewId] = React.useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = React.useState<ReturnRegistrationTarget | null>(null);

  React.useEffect(() => {
    setPage(1);
  }, [status]);

  const { data, loading, error, refetch, createRegistration, cancelRegistration } = useReturnRegistrations({
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

  const registrations = data?.items ?? [];
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

  const handleView = React.useCallback((registration: ReturnRegistrationListItem) => setViewId(registration.id), []);
  const handleCancel = React.useCallback((registration: ReturnRegistrationListItem) => setCancelTarget(registration), []);

  const columns = React.useMemo(
    () => createReturnRegistrationColumns({ onView: handleView, onCancel: handleCancel }),
    [handleView, handleCancel],
  );

  const handleCancelConfirm = React.useCallback(
    async (registrationId: string, reason: string) => {
      await cancelRegistration(registrationId, reason);
      setViewId((current) => (current === registrationId ? null : current));
      toast({ title: 'Registration cancelled' });
    },
    [cancelRegistration, toast],
  );

  const handleCreated = React.useCallback(
    (created: ReturnRegistrationDetail) => {
      toast({ title: 'Return registered', description: `${created.registration_no} is ready for the dock.` });
      setViewId(created.id);
    },
    [toast],
  );

  const filtered = status !== ALL_STATUSES;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Return Registrations</h2>
          <p className="text-sm text-muted-foreground">
            Returns the dealer is sending back. Register it here, then the dock receives and classifies the units.
          </p>
        </div>
        <div className="flex shrink-0 gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          {canRegister && (
            <Button size="sm" className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              Register a return
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All statuses" />
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

      <RegistrationsTable isInitialLoading={loading && !data}
        error={error}
        registrations={registrations}
        columns={columns}
        serverPagination={serverPagination}
        pageSize={pageSize}
        filtered={filtered}
        onClearFilter={() => setStatus(ALL_STATUSES)}
        onCreate={() => setCreateOpen(true)}/>

      <CreateReturnRegistrationDialog open={createOpen}
        onOpenChange={setCreateOpen}
        warehouseId={warehouseId}
        onCreate={createRegistration}
        onCreated={handleCreated}/>

      <ReturnRegistrationDetailDialog registrationId={viewId}
        open={Boolean(viewId)}
        onOpenChange={(open) => {
          if (!open) setViewId(null);
        }}
        onCancel={(registration) => setCancelTarget(registration)}/>

      <CancelReturnRegistrationDialog registration={cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        onConfirm={handleCancelConfirm}/>
    </div>
  );
}
