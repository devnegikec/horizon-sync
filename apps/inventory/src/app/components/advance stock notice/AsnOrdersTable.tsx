import * as React from 'react';

import { type Table } from '@tanstack/react-table';
import { FileText, Loader2 } from 'lucide-react';

import { Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable } from '@horizon-sync/ui/components/data-table';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { AsnOrder } from '../../types/asn-order.types';

import { createAsnOrderColumns } from './AsnOrderColumns';

export interface AsnOrdersTableProps {
  asnOrders: AsnOrder[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView?: (order: AsnOrder) => void;
  onEdit?: (order: AsnOrder) => void;
  onDelete?: (order: AsnOrder) => void;
  onCreateOrder?: () => void;
  onTableReady?: (table: Table<AsnOrder>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
  /** ID of the most recently created ASN order to highlight */
  recentlyCreatedId?: string | null;
}

function AsnOrdersEmptyState({ hasActiveFilters, onCreateOrder }: { hasActiveFilters: boolean; onCreateOrder?: () => void }) {
  const canCreate = !hasActiveFilters && !!onCreateOrder;

  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<FileText className="h-12 w-12" />}
            title="No ASN orders found"
            description={
              hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Advance Stock Notice orders will appear here once you create them'
            }
            action={
              canCreate ? (
                <Button onClick={onCreateOrder} className="gap-2">
                  Create ASN Order
                </Button>
              ) : undefined
            } />
        </div>
      </CardContent>
    </Card>
  );
}

export function AsnOrdersTable({
  asnOrders,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onCreateOrder,
  onTableReady,
  serverPagination,
  recentlyCreatedId,
}: AsnOrdersTableProps) {
  const serverPaginationConfig = React.useMemo(() => {
    if (!serverPagination) return undefined;

    return {
      totalItems: serverPagination.totalItems,
      currentPage: serverPagination.pageIndex + 1,
      pageSize: serverPagination.pageSize,
      onPageChange: (page: number, pageSize: number) => {
        serverPagination.onPaginationChange(page - 1, pageSize);
      },
    };
  }, [serverPagination]);

  const columns = React.useMemo(
    () => createAsnOrderColumns({ onView, onEdit, onDelete, recentlyCreatedId }),
    [onView, onEdit, onDelete, recentlyCreatedId]
  );

  const getRowClassName = React.useCallback((row: AsnOrder) => {
    if (recentlyCreatedId && row.id === recentlyCreatedId) {
      return 'animate-flash-green';
    }
    return undefined;
  }, [recentlyCreatedId]);

  if (error) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-4 text-destructive text-sm border-b">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-3" />
            <p className="text-sm font-medium">Loading ASN Orders...</p>
          </div>
          <TableSkeleton columns={6} rows={8} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (asnOrders.length === 0) {
    return <AsnOrdersEmptyState hasActiveFilters={hasActiveFilters} onCreateOrder={onCreateOrder} />;
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable columns={columns}
          data={asnOrders}
          config={{
            showSerialNumber: true,
            showPagination: true,
            enableRowSelection: false,
            enableColumnVisibility: true,
            enableSorting: true,
            enableFiltering: false,
            initialPageSize: serverPagination?.pageSize ?? 20,
            serverPagination: serverPaginationConfig,
          }}
          filterPlaceholder="Search by ASN order number..."
          onTableReady={onTableReady}
          getRowClassName={getRowClassName}
          fixedHeader
          maxHeight="auto" />
      </CardContent>
    </Card>
  );
}
