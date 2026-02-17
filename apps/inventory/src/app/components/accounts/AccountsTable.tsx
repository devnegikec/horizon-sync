import * as React from 'react';
import { type ColumnDef, type Table } from '@tanstack/react-table';
import { Wallet, Plus, MoreHorizontal, Edit, Power, PowerOff, Info, TrendingUp, TrendingDown, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';

import { TableSkeleton, Badge, Button, Card, CardContent } from '@horizon-sync/ui/components';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@horizon-sync/ui/components/ui/tooltip';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';

import type { AccountListItem } from '../../types/account.types';
import { getCurrencySymbol, SUPPORTED_CURRENCIES } from '../../types/currency.types';
import { formatDate } from '../../utility/formatDate';
import { useAccountBalances } from '../../hooks/useAccountBalances';

export interface AccountsTableProps {
  accounts: AccountListItem[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onEdit: (account: AccountListItem) => void;
  onToggleStatus: (account: AccountListItem) => void;
  onViewDetails?: (account: AccountListItem) => void;
  onCreateAccount: () => void;
  onTableReady?: (table: Table<AccountListItem>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortingChange?: (columnId: string) => void;
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
  onViewDetails,
  onCreateAccount,
  onTableReady,
  serverPagination,
  sortBy,
  sortOrder,
  onSortingChange,
}: AccountsTableProps) {
  const tableReadyRef = React.useRef<((table: Table<AccountListItem>) => void) | undefined>(onTableReady);

  React.useEffect(() => {
    tableReadyRef.current = onTableReady;
  }, [onTableReady]);

  // Fetch balances for all accounts
  const accountIds = React.useMemo(() => accounts.map(a => a.id), [accounts]);
  const { balances, loading: balancesLoading } = useAccountBalances({
    accountIds,
    enabled: accountIds.length > 0,
  });

  const formatCurrency = (amount: number, currencyCode: string): string => {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

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

  // Custom sortable header component for server-side sorting
  const SortableHeader = React.useCallback(
    ({ title, columnId }: { title: string; columnId: string }) => {
      const isSorted = sortBy === columnId;
      const isAsc = isSorted && sortOrder === 'asc';
      const isDesc = isSorted && sortOrder === 'desc';

      return (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-3 h-8 hover:bg-accent"
          onClick={() => onSortingChange?.(columnId)}
        >
          <span className={isSorted ? 'font-semibold' : ''}>{title}</span>
          {isDesc ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : isAsc ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
          )}
        </Button>
      );
    },
    [sortBy, sortOrder, onSortingChange]
  );

  const columns: ColumnDef<AccountListItem, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'account_code',
        header: () => <SortableHeader title="Code" columnId="account_code" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <code className="text-sm bg-muted px-2 py-1 rounded font-medium">{row.original.account_code}</code>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'account_name',
        header: () => <SortableHeader title="Account Name" columnId="account_name" />,
        cell: ({ row }) => <p className="font-medium">{row.original.account_name}</p>,
        enableSorting: false,
      },
      {
        accessorKey: 'account_type',
        header: () => <SortableHeader title="Type" columnId="account_type" />,
        cell: ({ row }) => {
          const type = row.original.account_type;
          const colorClass = ACCOUNT_TYPE_COLORS[type] || 'bg-gray-100 text-gray-800';
          return (
            <Badge variant="secondary" className={colorClass}>
              {type}
            </Badge>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'currency',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Currency" />,
        cell: ({ row }) => {
          const currencyCode = row.original.currency || 'USD';
          const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
          const symbol = getCurrencySymbol(currencyCode);
          
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 cursor-help">
                    <span className="text-sm font-medium">{currencyCode}</span>
                    <span className="text-xs text-muted-foreground">{symbol}</span>
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">{currency?.name || currencyCode}</p>
                    <p className="text-xs text-muted-foreground">
                      Account currency: {currencyCode} ({symbol})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Base currency: USD ($)
                    </p>
                    <p className="text-xs text-muted-foreground italic">
                      Exchange rate info available when balances are loaded
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        },
      },
      {
        accessorKey: 'balance',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Balance" />,
        cell: ({ row }) => {
          const account = row.original;
          const currencyCode = account.currency || 'USD';
          const symbol = getCurrencySymbol(currencyCode);
          const balance = balances.get(account.id);
          
          if (balancesLoading) {
            return (
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            );
          }
          
          if (!balance) {
            return (
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-muted-foreground">N/A</span>
              </div>
            );
          }
          
          const isPositive = balance.balance >= 0;
          const isDebitAccount = account.account_type === 'ASSET' || account.account_type === 'EXPENSE';
          
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col gap-0.5 cursor-help">
                    <div className="flex items-center gap-1">
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(Math.abs(balance.balance), currencyCode)}
                      </span>
                    </div>
                    {currencyCode !== 'USD' && (
                      <span className="text-xs text-muted-foreground">
                        ${Math.abs(balance.base_currency_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-2">
                    <p className="font-semibold">Balance Details</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Debit Total:</span>
                        <span className="font-medium">{formatCurrency(balance.debit_total, currencyCode)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Credit Total:</span>
                        <span className="font-medium">{formatCurrency(balance.credit_total, currencyCode)}</span>
                      </div>
                      <div className="flex justify-between gap-4 pt-1 border-t">
                        <span className="text-muted-foreground">Net Balance:</span>
                        <span className="font-medium">{formatCurrency(balance.balance, currencyCode)}</span>
                      </div>
                      {currencyCode !== 'USD' && (
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Base Currency (USD):</span>
                          <span className="font-medium">${balance.base_currency_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}
                      <div className="flex justify-between gap-4 pt-1 border-t">
                        <span className="text-muted-foreground">As of Date:</span>
                        <span className="font-medium">{balance.as_of_date}</span>
                      </div>
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
        header: () => <SortableHeader title="Status" columnId="is_active" />,
        cell: ({ row }) => {
          const isActive = row.original.is_active;
          return <Badge variant={isActive ? 'success' : 'secondary'}>{isActive ? 'Active' : 'Inactive'}</Badge>;
        },
        enableSorting: false,
      },
      {
        accessorKey: 'created_at',
        header: () => <SortableHeader title="Created" columnId="created_at" />,
        cell: ({ row }) => formatDate(row.original.created_at, 'DD-MMM-YY'),
        enableSorting: false,
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
                  {onViewDetails && (
                    <>
                      <DropdownMenuItem onClick={() => onViewDetails(account)}>
                        <Info className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
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
    [onEdit, onToggleStatus, onViewDetails, balances, balancesLoading, SortableHeader]
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
          <TableSkeleton columns={8} rows={10} showHeader={true} />
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
            enableSorting: false, // Disable client-side sorting, we use server-side
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
