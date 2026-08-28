import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Layers, RefreshCw } from 'lucide-react';

import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';

import { qrBlockService } from '../../features/qr-management/services/qrBlockService';
import type { QSealAggregationItem } from '../../features/qr-management/types/qrBlock.types';
import { getApiErrorMessage } from '../../features/qr-management/utils/apiError';
import { formatDate } from '../../utility/formatDate';

const PAGE_SIZE = 20;

/**
 * Aggregation log — one row per generated unit with its parent (master pack)
 * link and activation state. Lets operators spot wrong links or missing
 * aggregations at batch level.
 */
export function AggregationManagement() {
  const [items, setItems] = React.useState<QSealAggregationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);

  const fetch = React.useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await qrBlockService.getAggregation({ page: p, page_size: PAGE_SIZE });
      setItems(res.items);
      setTotalItems(res.pagination.total_items);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Failed to load aggregation log'));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetch(page);
  }, [fetch, page]);

  const columns: ColumnDef<QSealAggregationItem, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'batch',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Batch" />,
        cell: ({ row }) => <span className="font-medium">{row.original.batch ?? '—'}</span>,
      },
      {
        accessorKey: 'parent_serial',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Parent Serial" />,
        cell: ({ row }) =>
          row.original.parent_serial ? (
            <span className="font-mono text-sm">{row.original.parent_serial}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'parent_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Parent" />,
        cell: ({ row }) => row.original.parent_name ?? '—',
      },
      {
        accessorKey: 'child_serial',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Child Serial" />,
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.child_serial ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'linked',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Link" />,
        cell: ({ row }) =>
          row.original.linked ? (
            <Badge variant="success">Linked</Badge>
          ) : (
            <Badge variant="destructive">Unlinked</Badge>
          ),
      },
      {
        accessorKey: 'activated',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Activation" />,
        cell: ({ row }) => {
          if (row.original.activated == null) return '—';
          return row.original.activated ? (
            <Badge variant="success">Activated</Badge>
          ) : (
            <Badge variant="secondary">Not activated</Badge>
          );
        },
      },
      {
        id: 'pack',
        header: () => <span>Pack Fill</span>,
        cell: ({ row }) => {
          const { parent_linked_count: count, parent_capacity: capacity } = row.original;
          if (capacity == null) return '—';
          const filled = count ?? 0;
          return (
            <span className={filled === capacity ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
              {filled}/{capacity}
            </span>
          );
        },
      },
      {
        accessorKey: 'scan_count',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Scans" />,
        cell: ({ row }) => <span className="font-medium">{row.original.scan_count}</span>,
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) =>
          row.original.created_at
            ? formatDate(row.original.created_at, 'DD-MMM-YY', { includeTime: true })
            : '—',
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Aggregation</h2>
          <p className="text-muted-foreground">
            Master pack cascading log — spot wrong or missing links across batches
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void fetch(page)} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton columns={9} rows={10} showHeader />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Layers className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No aggregation entries</p>
              <p className="text-muted-foreground">
                Generate QR blocks and enable master pack cascading to see links here.
              </p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={items}
              config={{
                showSerialNumber: true,
                showPagination: true,
                enableRowSelection: false,
                enableColumnVisibility: true,
                enableSorting: false,
                enableFiltering: false,
                initialPageSize: PAGE_SIZE,
                serverPagination: {
                  totalItems,
                  currentPage: page,
                  pageSize: PAGE_SIZE,
                  onPageChange: (p: number) => setPage(p),
                },
              }}
              fixedHeader
              maxHeight="auto"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
