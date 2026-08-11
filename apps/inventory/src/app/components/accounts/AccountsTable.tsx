import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { Wallet, Plus, MoreHorizontal, Edit, Power, PowerOff, Info, Loader2, Trash2 } from 'lucide-react';

import { TableSkeleton, Badge, Button, Card, CardContent } from '@horizon-sync/ui/components';
import { DataTable } from '@horizon-sync/ui/components/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@horizon-sync/ui/components/ui/tooltip';

import { useAccountBalances } from '../../hooks/useAccountBalances';
import type { AccountListItem } from '../../types/account.types';
import { formatDate } from '../../utility/formatDate';
import { ACCOUNT_TYPE_COLORS } from '../../utils/accountColors';
import { useCurrencyStore } from '@horizon-sync/store';
import { getCurrencySymbol } from '@horizon-sync/ui';

export interface AccountsTableProps {
  accounts: AccountListItem[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onEdit: (account: AccountListItem) => void;
  onToggleStatus: (account: AccountListItem) => void;
  onViewDetails?: (account: AccountListItem) => void;
  onDelete?: (account: AccountListItem) => void;
  onCreateAccount: () => void;
  onTableReady?: (table: Table<AccountListItem>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
  actionLoading?: string | null;
  isDefaultAccount?: (accountId: string) => boolean;
  isSystemAdmin?: boolean;
}

export function AccountsTable({
  accounts,
  loading,
  error,
  hasActiveFilters,
  onEdit,
  onToggleStatus,
  onViewDetails,
  onDelete,
  onCreateAccount,
  onTableReady,
  serverPagination,
  actionLoading,
  isDefaultAccount = () => false,
  isSystemAdmin = false,
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

  const columns: ColumnDef<AccountListItem, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'account_code',
        header: 'Account',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{row.original.account_name}</p>
              <code className="text-xs text-muted-foreground">{row.original.account_code}</code>
            </div>
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'account_type',
        header: 'Type',
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
        accessorKey: 'balance',
        header: 'Balance',
        cell: ({ row }) => {
          const account = row.original;
          const currencyCode = account.currency || 'USD';
          const balance = balances.get(account.id);

          // Loading state - skeleton shimmer
          if (balancesLoading) {
            return (
              <div className="h-5 w-20 bg-muted animate-pulse rounded" />
            );
          }

          // No data available
          if (!balance) {
            return <span className="text-muted-foreground">—</span>;
          }

          const isDebitAccount = account.account_type === 'ASSET' || account.account_type === 'EXPENSE';
          const isZeroBalance = balance.balance === 0;
          const isPositive = balance.balance > 0;
          const isNegative = balance.balance < 0;

          // Zero balance - muted, no activity yet
          if (isZeroBalance) {
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-muted-foreground cursor-help">
                      {formatCurrency(0, currencyCode)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">No transactions yet</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          // Determine colors based on account type and balance direction
          // Debit accounts (ASSET, EXPENSE): positive = green (normal), negative = red (abnormal)
          // Credit accounts (LIABILITY, EQUITY, REVENUE): positive = blue (normal), negative = red (abnormal)
          let pillBgClass = '';
          let textColorClass = '';
          
          if (isNegative) {
            pillBgClass = 'bg-red-50 dark:bg-red-900/20';
            textColorClass = 'text-red-600 dark:text-red-400';
          } else if (isDebitAccount) {
            pillBgClass = 'bg-emerald-50 dark:bg-emerald-900/20';
            textColorClass = 'text-emerald-600 dark:text-emerald-400';
          } else {
            pillBgClass = 'bg-blue-50 dark:bg-blue-900/20';
            textColorClass = 'text-blue-600 dark:text-blue-400';
          }
          const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
          const currencySymbol = getCurrencySymbol(baseCurrency || 'USD');
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col gap-0.5 cursor-help">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-sm font-medium ${pillBgClass} ${textColorClass}`}>
                      {isNegative && '−'}
                      {formatCurrency(Math.abs(balance.balance), currencyCode)}
                    </span>
                    {currencyCode !== 'USD' && (
                      <span className="text-xs text-muted-foreground pl-2">
                        ≈ {currencySymbol}{Math.abs(balance.base_currency_balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                          <span className="font-medium">{currencySymbol}{balance.base_currency_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
        header: 'Level',
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.level}</span>,
      },
      {
        accessorKey: 'is_group',
        header: 'Group',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.is_group ? 'Yes' : 'No'}</span>
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => {
          const isActive = row.original.is_active;
          const isLoading = actionLoading === row.original.id;

          return (
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              <Badge variant={isActive ? 'success' : 'secondary'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'updated_at',
        header: 'Last Updated',
        cell: ({ row }) => formatDate(row.original.updated_at || row.original.created_at, 'DD-MMM-YY'),
        enableSorting: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const account = row.original;
          const isActive = account.is_active;
          const isLoading = actionLoading === account.id;

          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isLoading}>
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreHorizontal className="h-4 w-4" />
                    )}
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
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(account)}
                        className={
                          isDefaultAccount(account.id) && !isSystemAdmin 
                            ? "text-muted-foreground focus:text-muted-foreground cursor-help" 
                            : "text-destructive focus:text-destructive"
                        }>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDefaultAccount(account.id) ? (
                          isSystemAdmin ? 'Delete Default Account' : 'Protected Account'
                        ) : (
                          'Delete Account'
                        )}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [onEdit, onToggleStatus, onViewDetails, onDelete, balances, balancesLoading, actionLoading, isDefaultAccount, isSystemAdmin]
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
            <EmptyState icon={<Wallet className="h-12 w-12" />}
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
              }/>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <DataTable columns={columns}
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
          fixedHeader
          maxHeight="600px"/>
      </CardContent>
    </Card>
  );
}
