import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { QrCode, Plus, MoreHorizontal, Eye, Edit, Power, PowerOff } from 'lucide-react';

import { Badge, Button, Card, CardContent } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { QSealProductListItem } from '../../types/qseal.types';
import { formatDate } from '../../utility/formatDate';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export interface QSealTableProps {
  products: QSealProductListItem[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (product: QSealProductListItem) => void;
  onOpenBlocks?: (product: QSealProductListItem) => void;
  onOpenAnalytics?: (product: QSealProductListItem) => void;
  onEdit: (product: QSealProductListItem) => void;
  onToggleStatus: (product: QSealProductListItem) => void;
  onCreateProduct: () => void;
  onTableReady?: (table: Table<QSealProductListItem>) => void;
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
  onOpenBlocks,
  onOpenAnalytics,
  onEdit,
  onToggleStatus,
  onCreateProduct,
  onTableReady,
  serverPagination,
}: QSealTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<QSealProductListItem> | null>(null);

  React.useEffect(() => {
    if (tableInstance && onTableReady) onTableReady(tableInstance);
  }, [tableInstance, onTableReady]);

  const serverPaginationConfig = React.useMemo(() => {
    if (!serverPagination) return undefined;
    return {
      totalItems: serverPagination.totalItems,
      currentPage: serverPagination.currentPage,
      pageSize: serverPagination.pageSize,
      onPageChange: (page: number) => {
        serverPagination.onPageChange(page);
      },
    };
  }, [serverPagination]);

  const columns: ColumnDef<QSealProductListItem, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Product" />,
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <QrCode className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{p.name}</p>
                {p.gtin && <p className="text-xs text-muted-foreground font-mono">{p.gtin}</p>}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'industry',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Industry" />,
        cell: ({ row }) =>
          row.original.industry ? <span className="text-sm">{row.original.industry}</span> : <span className="text-muted-foreground">—</span>,
      },
      {
        accessorKey: 'is_active',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const isActive = row.original.is_active;
          const label = isActive ? 'Active' : 'Inactive';
          const color = isActive ? STATUS_COLORS.active : STATUS_COLORS.inactive;
          return (
            <Badge variant="secondary" className={color}>
              {label}
            </Badge>
          );
        },
      },
      {
        id: 'qr_blocks',
        header: () => <span>QR Blocks</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const product = row.original;
          const blockCount = product.block_count ?? 0;
          const qrCodeCount = product.qr_code_count ?? 0;
          const content = (
            <div className="text-left">
              <p className="font-medium">{blockCount.toLocaleString()} {blockCount === 1 ? 'block' : 'blocks'}</p>
              <p className="text-xs text-muted-foreground">{qrCodeCount.toLocaleString()} QR codes</p>
            </div>
          );
          return onOpenBlocks && blockCount > 0 ? (
            <button type="button" className="rounded-md text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring" onClick={(event) => { event.stopPropagation(); onOpenBlocks(product); }} aria-label={`View QR blocks for ${product.name}`}>
              {content}
            </button>
          ) : content;
        },
      },
      {
        id: 'last_scan',
        header: () => <span>Last Scan</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const product = row.original;
          const scanCount = product.scan_count ?? 0;
          const content = (
            <div className="text-left">
              <p className="font-medium">{product.last_scan_at ? formatDate(product.last_scan_at, 'DD-MMM-YY', { includeTime: true }) : 'Never scanned'}</p>
              <p className="text-xs text-muted-foreground">{scanCount.toLocaleString()} {scanCount === 1 ? 'scan' : 'scans'}</p>
            </div>
          );
          return onOpenAnalytics && scanCount > 0 ? (
            <button type="button" className="rounded-md text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring" onClick={(event) => { event.stopPropagation(); onOpenAnalytics(product); }} aria-label={`View analytics for ${product.name}`}>
              {content}
            </button>
          ) : content;
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDate(row.original.created_at, 'DD-MMM-YY')}</span>,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const p = row.original;
          const isActive = p.is_active;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()} aria-label={`Actions for ${p.name}`}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onView(p); }}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onEdit(p); }}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Product
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(event) => { event.stopPropagation(); onToggleStatus(p); }}>
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
    [onView, onOpenBlocks, onOpenAnalytics, onEdit, onToggleStatus],
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
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3058EE] mx-auto mb-4" />
              <p className="text-muted-foreground">Loading QSeal products...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState icon={<QrCode className="h-12 w-12" />}
            title="No products found"
            description={hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by adding your first QSeal product'}
            action={
              !hasActiveFilters ? (
                <Button onClick={onCreateProduct} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Product
                </Button>
              ) : undefined
            }/>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable columns={columns}
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
          onRowClick={onView}
          onTableReady={onTableReady}
          fixedHeader
          maxHeight="auto"/>
      </CardContent>
    </Card>
  );
}
