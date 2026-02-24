import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { Layers, Plus, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';

import { Badge, Button, Card, CardContent, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { ItemGroupListItem } from '../../types/item-group.types';
import { formatDate } from '../../utility/formatDate';

export interface ItemGroupsTableProps {
  itemGroups: ItemGroupListItem[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onEdit: (group: ItemGroupListItem) => void;
  onDelete: (group: ItemGroupListItem) => void;
  onCreateGroup: () => void;
  onTableReady?: (table: Table<ItemGroupListItem>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function ItemGroupsTable({ itemGroups, loading, error, hasActiveFilters, onEdit, onDelete, onCreateGroup, onTableReady, serverPagination }: ItemGroupsTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<ItemGroupListItem> | null>(null);

  React.useEffect(() => {
    if (tableInstance && onTableReady) onTableReady(tableInstance);
  }, [tableInstance, onTableReady]);

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

  const columns: ColumnDef<ItemGroupListItem, unknown>[] = React.useMemo(() => [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium">{row.original.name}</p>
            <code className="text-xs text-muted-foreground">{row.original.code}</code>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'description',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.description || '—'}</span>
      ),
    },
    {
      accessorKey: 'default_valuation_method',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Valuation" />,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.default_valuation_method?.toUpperCase() || '—'}</span>
      ),
    },
    {
      accessorKey: 'default_uom',
      header: ({ column }) => <DataTableColumnHeader column={column} title="UOM" />,
      cell: ({ row }) => (
        <span className="text-sm">{row.original.default_uom || '—'}</span>
      ),
    },
    {
      accessorKey: 'is_active',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? 'success' : 'secondary'}>
          {row.original.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      cell: ({ row }) => formatDate(row.original.created_at, 'DD-MMM-YY'),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const group = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(group)}>
                  <Edit className="mr-2 h-4 w-4" />Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(group)} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ], [onEdit, onDelete]);

  const renderViewOptions = (table: Table<ItemGroupListItem>) => {
    if (table !== tableInstance) setTableInstance(table);
    return null;
  };

  if (error) {
    return (
      <Card><CardContent className="p-0">
        <div className="p-4 text-destructive text-sm border-b">{error}</div>
      </CardContent></Card>
    );
  }

  if (loading) {
    return (
      <Card><CardContent className="p-0">
        <TableSkeleton columns={6} rows={10} showHeader />
      </CardContent></Card>
    );
  }

  if (itemGroups.length === 0) {
    return (
      <Card><CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<Layers className="h-12 w-12" />}
            title="No item groups found"
            description={hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by creating your first item group'}
            action={!hasActiveFilters ? <Button onClick={onCreateGroup} className="gap-2"><Plus className="h-4 w-4" />Create Group</Button> : undefined} />
        </div>
      </CardContent></Card>
    );
  }

  return (
    <Card><CardContent className="p-0">
      <DataTable columns={columns}
        data={itemGroups}
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
        renderViewOptions={renderViewOptions}
        fixedHeader
        maxHeight="auto" />
    </CardContent></Card>
  );
}
