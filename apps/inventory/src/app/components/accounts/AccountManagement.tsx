import { useState, useMemo, useCallback } from 'react';
import { type Table } from '@tanstack/react-table';
import { Wallet, Plus, Download } from 'lucide-react';

import {
  Card,
  CardContent,
  Button,
  DataTableViewOptions,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import { useAccounts } from '../../hooks/useAccounts';
import { useAccountActions } from '../../hooks/useAccountActions';
import type { AccountListItem, AccountFilters } from '../../types/account.types';

import { AccountDialog } from './AccountDialog';
import { AccountsTable } from './AccountsTable';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AccountManagement() {
  const [filters, setFilters] = useState<AccountFilters>({
    search: '',
    account_type: 'all',
    status: 'all',
    currency: '',
  });

  const {
    accounts,
    pagination,
    loading,
    error,
    refetch,
    setPage,
    setPageSize,
    currentPage,
    currentPageSize,
  } = useAccounts(1, 20, filters);

  const { toggleAccountStatus } = useAccountActions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountListItem | null>(null);
  const [tableInstance, setTableInstance] = useState<Table<AccountListItem> | null>(null);

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? 0;
    const active = accounts.filter((a) => a.is_active).length;
    const byType = accounts.reduce((acc, a) => {
      const normalizedType = String(a.account_type || '').toUpperCase();
      acc[normalizedType] = (acc[normalizedType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return { total, active, byType };
  }, [accounts, pagination]);

  const handleCreateAccount = () => {
    setSelectedAccount(null);
    setDialogOpen(true);
  };

  const handleEditAccount = (account: AccountListItem) => {
    setSelectedAccount(account);
    setDialogOpen(true);
  };

  const handleToggleStatus = async (account: AccountListItem) => {
    const action = account.is_active ? 'deactivate' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} account "${account.account_name}"?`)) {
      try {
        await toggleAccountStatus(account.id, account.is_active);
        refetch();
      } catch {
        // Error handled in hook
      }
    }
  };

  const handleTableReady = useCallback((table: Table<AccountListItem>) => {
    setTableInstance(table);
  }, []);

  const serverPaginationConfig = useMemo(
    () => ({
      pageIndex: currentPage - 1,
      pageSize: currentPageSize,
      totalItems: pagination?.total_items ?? 0,
      onPaginationChange: (pageIndex: number, newPageSize: number) => {
        setPage(pageIndex + 1);
        setPageSize(newPageSize);
      },
    }),
    [currentPage, currentPageSize, pagination?.total_items, setPage, setPageSize]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your organization's financial accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={handleCreateAccount}
            className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Create Account
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Accounts"
          value={stats.total}
          icon={Wallet}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
        />
        <StatCard
          title="Active Accounts"
          value={stats.active}
          icon={Wallet}
          iconBg="bg-emerald-100 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Assets"
          value={stats.byType.ASSET || 0}
          icon={Wallet}
          iconBg="bg-blue-100 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          title="Liabilities"
          value={stats.byType.LIABILITY || 0}
          icon={Wallet}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput
            className="sm:w-80"
            placeholder="Search by code or name..."
            onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}
          />
          <div className="flex gap-3">
            <Select
              value={filters.account_type}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, account_type: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ASSET">Asset</SelectItem>
                <SelectItem value="LIABILITY">Liability</SelectItem>
                <SelectItem value="EQUITY">Equity</SelectItem>
                <SelectItem value="REVENUE">Revenue</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center">{tableInstance && <DataTableViewOptions table={tableInstance} />}</div>
      </div>

      {/* Accounts Table */}
      <AccountsTable
        accounts={accounts}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.account_type !== 'all' || filters.status !== 'all'}
        onEdit={handleEditAccount}
        onToggleStatus={handleToggleStatus}
        onCreateAccount={handleCreateAccount}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}
      />

      {/* Dialog */}
      <AccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        account={selectedAccount}
        onCreated={refetch}
        onUpdated={refetch}
      />
    </div>
  );
}
