import { type ColumnDef } from '@tanstack/react-table';
import { PackageOpen } from 'lucide-react';

import { Button, Card, CardContent, EmptyState, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable } from '@horizon-sync/ui/components/data-table';

import type { OutboundOrderListItem } from '../../../types/wms.types';

export type ServerPagination = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

function OutboundOrdersEmpty({ filtered, onClearFilter }: { filtered: boolean; onClearFilter: () => void }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<PackageOpen className="h-12 w-12" />}
            title="No orders found"
            description={filtered ? 'No orders match the selected filters' : 'Import an incoming order file or create an order manually.'}
            action={
              filtered ? (
                <Button variant="outline" onClick={onClearFilter}>
                  Clear filters
                </Button>
              ) : undefined
            }/>
        </div>
      </CardContent>
    </Card>
  );
}

export interface OutboundOrdersTableProps {
  isInitialLoading: boolean;
  error: string | null;
  orders: OutboundOrderListItem[];
  columns: ColumnDef<OutboundOrderListItem>[];
  serverPagination?: ServerPagination;
  pageSize: number;
  /** True when a status/type filter is applied, for the empty-state copy. */
  filtered: boolean;
  onClearFilter: () => void;
}

export function OutboundOrdersTable({
  isInitialLoading,
  error,
  orders,
  columns,
  serverPagination,
  pageSize,
  filtered,
  onClearFilter,
}: OutboundOrdersTableProps) {
  const renderBody = () => {
    if (isInitialLoading) {
      return (
        <Card>
          <CardContent className="p-0">
            <TableSkeleton columns={9} rows={8} showHeader={true} />
          </CardContent>
        </Card>
      );
    }

    if (orders.length === 0) {
      return <OutboundOrdersEmpty filtered={filtered} onClearFilter={onClearFilter} />;
    }

    return (
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns}
            data={orders}
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
