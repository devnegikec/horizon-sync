import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Package, Plus, MoreHorizontal, Eye, Edit, Power, PowerOff } from 'lucide-react';

import {
  DataTable,
  DataTableColumnHeader,
} from '@horizon-sync/ui/components/data-table';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { ApiItem } from '../../types/items-api.types';
import { formatDate } from '../../utility/formatDate';

export interface ItemsTableProps {
  items: ApiItem[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (item: ApiItem) => void;
  onEdit: (item: ApiItem) => void;
  onToggleStatus: (item: ApiItem) => void;
  onCreateItem: () => void;
}

export function ItemsTable({
  items,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onToggleStatus,
  onCreateItem,
}: ItemsTableProps) {
  const columns: ColumnDef<ApiItem, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'item_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Item" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <p className="font-medium">{row.original.item_name ?? ''}</p>
          </div>
        ),
      },
      {
        accessorKey: 'item_code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
        cell: ({ row }) => (
          <code className="text-sm bg-muted px-2 py-1 rounded">
            {row.original.item_code ?? ''}
          </code>
        ),
      },
      {
        accessorKey: 'item_group_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Group" />,
        cell: ({ row }) => row.original.item_group_name ?? '',
      },
      {
        accessorKey: 'uom',
        header: ({ column }) => <DataTableColumnHeader column={column} title="UOM" />,
        cell: ({ row }) => row.original.uom ?? '',
      },
      {
        accessorKey: 'standard_rate',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Standard Rate" />
        ),
        cell: ({ row }) => row.original.standard_rate ?? '',
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const status = row.original.status ?? '';
          const isActive = status === 'active';
          return (
            <Badge variant={isActive ? 'success' : 'secondary'}>{status}</Badge>
          );
        },
      },
      {
        accessorKey: 'maintain_stock',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Maintain Stock" />
        ),
        cell: ({ row }) => {
          const v = row.original.maintain_stock;
          return v == null ? '' : v ? 'Yes' : 'No';
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Created At" />
        ),
        cell: ({ row }) =>
          formatDate(row.original.created_at ?? '', 'DD-MMM-YY'),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const item = row.original;
          const isActive = item.status === 'active';
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(item)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Item
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onToggleStatus(item)}>
                    {isActive ? (
                      <><PowerOff className="mr-2 h-4 w-4" />Deactivate</>
                    ) : (
                      <><Power className="mr-2 h-4 w-4" />Activate</>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [onView, onEdit, onToggleStatus]
  );

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
          <div className="py-12 text-center text-muted-foreground">
            Loading…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState
              icon={<Package className="h-12 w-12" />}
              title="No items found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first item'
              }
              action={
                !hasActiveFilters ? (
                  <Button onClick={onCreateItem} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                ) : undefined
              }
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable<ApiItem, unknown>
          columns={columns}
          data={items}
          config={{
            showSerialNumber: true,
            showPagination: true,
            enableRowSelection: false,
            enableColumnVisibility: true,
            enableSorting: true,
            enableFiltering: true,
            initialPageSize: 20,
          }}
          filterPlaceholder="Search by code, name, or group..."
          fixedHeader
          maxHeight="600px"
        />
      </CardContent>
    </Card>
  );
}
