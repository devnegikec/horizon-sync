import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { QrCode, Plus, MoreHorizontal, Eye, Edit, Power, PowerOff } from 'lucide-react';

import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { QSealProduct, QSealProductStatus, QSealQRType } from '../../types/qseal.types';
import { formatDate } from '../../utility/formatDate';

const STATUS_COLORS: Record<QSealProductStatus, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
};

const QR_TYPE_LABELS: Record<QSealQRType, string> = {
  dynamic: 'Dynamic',
  secure_qr_runtime: 'Secure QR',
  static_qr: 'Static QR',
};

const QR_TYPE_COLORS: Record<QSealQRType, string> = {
  dynamic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  secure_qr_runtime: 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400',
  static_qr: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
};

export interface QSealTableProps {
  products: QSealProduct[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (product: QSealProduct) => void;
  onEdit: (product: QSealProduct) => void;
  onToggleStatus: (product: QSealProduct) => void;
  onCreateProduct: () => void;
  onTableReady?: (table: Table<QSealProduct>) => void;
  serverPagination?: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
}

export function QSealTable({
  products,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onToggleStatus,
  onCreateProduct,
  onTableReady,
  serverPagination,
}: QSealTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<QSealProduct> | null>(null);

  React.useEffect(() => {
    if (tableInstance && onTableReady) onTableReady(tableInstance);
  }, [tableInstance, onTableReady]);

  const serverPaginationConfig = React.useMemo(() => {
    if (!serverPagination) return undefined;
    return {
      totalItems: serverPagination.totalItems,
      currentPage: serverPagination.currentPage,
      pageSize: serverPagination.pageSize,
      onPageChange: (page: number, pageSize: number) => {
        serverPagination.onPageChange(page);
      },
    };
  }, [serverPagination]);

  const columns: ColumnDef<QSealProduct, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'product_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{p.product_name}</p>
                <p className="text-xs text-muted-foreground font-mono">{p.product_code}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'category',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
        cell: ({ row }) =>
          row.original.category ? (
            <span className="text-sm">{row.original.category}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: 'qr_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="QR Type" />,
        cell: ({ row }) => {
          const t = row.original.qr_type;
          return (
            <Badge variant="secondary" className={QR_TYPE_COLORS[t]}>
              {QR_TYPE_LABELS[t]}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'total_qr_codes',
        header: ({ column }) => <DataTableColumnHeader column={column} title="QR Codes" />,
        cell: ({ row }) => (
          <span className="text-sm font-medium tabular-nums">
            {row.original.total_qr_codes.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'activated_count',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Activated" />,
        cell: ({ row }) => {
          const p = row.original;
          const pct =
            p.total_qr_codes > 0
              ? Math.round((p.activated_count / p.total_qr_codes) * 100)
              : 0;
          return (
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium tabular-nums">
                {p.activated_count.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">{pct}%</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'scan_count',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Scans" />,
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {row.original.scan_count.toLocaleString()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const s = row.original.status;
          return (
            <Badge variant="secondary" className={STATUS_COLORS[s]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.created_at, 'DD-MMM-YY')}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          const isActive = p.status === 'active';
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(p)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(p)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Product
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onToggleStatus(p)}>
                    {isActive ? (
                      <>
                        <PowerOff className="mr-2 h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="mr-2 h-4 w-4" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onView, onEdit, onToggleStatus],
  );

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 text-destructive text-sm">{error}</CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-0">
          <TableSkeleton columns={8} rows={10} showHeader />
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={<QrCode className="h-12 w-12" />}
            title="No QSeal products found"
            description={
              hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first QSeal product'
            }
            action={
              !hasActiveFilters ? (
                <Button onClick={onCreateProduct} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Product
                </Button>
              ) : undefined
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable
          columns={columns}
          data={products}
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
          renderViewOptions={(table) => {
            if (table !== tableInstance) setTableInstance(table);
            return null;
          }}
          fixedHeader
          maxHeight="auto"
        />
      </CardContent>
    </Card>
  );
}
