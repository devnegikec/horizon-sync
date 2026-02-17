import * as React from 'react';
import { type ColumnDef, type Table } from '@tanstack/react-table';
import { Wallet, Plus, MoreHorizontal, Edit, Power, PowerOff } from 'lucide-react';

import { TableSkeleton, Badge, Button, Card, CardContent } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { AccountListItem } from '../../types/account.types';
import { formatDate } from '../../utility/formatDate';

export interface AccountsTableProps {
  accounts: AccountListItem[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onEdit: (account: AccountListItem) => void;
  onToggleStatus: (account: AccountListItem) => void;
  onCreateAccount: () => void;
  onTableReady?: (table: Table<AccountListItem>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

const ACCOUNT_TYPE_COLORS: Record<string, string> = {
  ASSET: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  LIABILITY: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  EQUITY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  REVENUE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400',
  EXPENSE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

export function AccountsTable({
  accounts,
  loading,
  error,
  hasActiveFilters,
  onEdit,
  onToggleStatus,
  onCreateAccount,
  onTableReady,
  serverPagination,
}: AccountsTableProps) {
  const tableReadyRef = React.useRef<((table: Table<AccountListItem>) => void) | undefined>(onTableReady);

  React.useEffect(() => {
    tableReadyRef.current = onTableReady;
  }, [onTableReady]);

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

  const columns: ColumnDef<AccountListItem, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'account_code',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Code" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <code className="text-sm bg-muted px-2 py-1 rounded font-medium">{row.original.account_code}</code>
          </div>
        ),
      },
      {
        accessorKey: 'account_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Account Name" />,
        cell: ({ row }) => <p className="font-medium">{row.original.account_name}</p>,
      },
      {
        accessorKey: 'account_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => {
          const type = row.original.account_type;
          const colorClass = ACCOUNT_TYPE_COLORS[type] || 'bg-gray-100 text-gray-800';
          return (
            <Badge variant="secondary" className={colorClass}>
              {type}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'level',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Level" />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.level}</span>,
      },
      {
        accessorKey: 'is_group',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Group" />,
        cell: ({ row }) => (
          <span className="text-sm">{row.original.is_group ? 'Yes' : 'No'}</span>
        ),
      },
      {
        accessorKey: 'is_active',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const isActive = row.original.is_active;
          return <Badge variant={isActive ? 'success' : 'secondary'}>{isActive ? 'Active' : 'Inactive'}</Badge>;
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => formatDate(row.original.created_at, 'DD-MMM-YY'),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const account = row.original;
          const isActive = account.is_active;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(account)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Account
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onToggleStatus(account)}>
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
        enableSorting: false,
      },
    ],
    [onEdit, onToggleStatus]
  );

  const renderViewOptions = React.useCallback(
    (table: Table<AccountListItem>) => {
      if (tableReadyRef.current) {
        tableReadyRef.current(table);
      }
      return null;
    },
    []
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
          <TableSkeleton columns={7} rows={10} showHeader={true} />
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState
              icon={<Wallet className="h-12 w-12" />}
              title="No accounts found"
              description={
                hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by creating your first account'
              }
              action={
                !hasActiveFilters ? (
                  <Button onClick={onCreateAccount} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Account
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
        <DataTable
          columns={columns}
          data={accounts}
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
          maxHeight="600px"
        />
      </CardContent>
    </Card>
  );
}
