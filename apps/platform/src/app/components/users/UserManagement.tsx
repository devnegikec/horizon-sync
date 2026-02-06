import { useMemo, useState, useEffect } from 'react';

import { type Table } from '@tanstack/react-table';
import { Users, UserCheck, UserLockIcon, Shield, Download, UserPlus } from 'lucide-react';

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

import { InviteUserModal } from '../InviteUserModal';
import { useAuth } from '../../hooks';
import { useUsers } from '../../hooks/useUsers';
import type { User, UserFilters } from '../../types/user.types';

import { UsersTable } from './UsersTable';

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

export function UserManagement() {
  const { accessToken } = useAuth();
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    userType: 'all',
  });

  const {
    users,
    pagination,
    statusCounts,
    loading,
    error,
    refetch,
    setPage,
    setPageSize,
    currentPage,
    currentPageSize,
  } = useUsers(1, 20, filters, accessToken);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [tableInstance, setTableInstance] = useState<Table<User> | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? 0;
    const active = statusCounts?.active ?? 0;
    const pending = statusCounts?.pending ?? 0;
    const mfaEnabled = statusCounts?.mfa_enabled ?? 0;
    return { total, active, pending, mfaEnabled };
  }, [pagination, statusCounts]);

  const handleInviteUser = () => {
    setInviteModalOpen(true);
  };

  const handleInviteSuccess = () => {
    refetch();
  };

  const handleTableReady = (table: Table<User>) => {
    setTableInstance(table);
  };

  const serverPaginationConfig = useMemo(
    () => ({
      pageIndex: currentPage - 1, // DataTable uses 0-based indexing
      pageSize: currentPageSize,
      totalItems: pagination?.total_items ?? 0,
      onPaginationChange: (pageIndex: number, newPageSize: number) => {
        setPage(pageIndex + 1); // Convert back to 1-based for API
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
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage team members, roles, and access permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button onClick={handleInviteUser}
            className="gap-2 bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25">
            <UserPlus className="h-4 w-4" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users"
          value={stats.total}
          icon={Users}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"/>
        <StatCard title="Active Users"
          value={stats.active}
          icon={UserCheck}
          iconBg="bg-emerald-100 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"/>
        <StatCard title="Pending Invites"
          value={stats.pending}
          icon={UserLockIcon}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"/>
        <StatCard title="MFA Enabled"
          value={stats.mfaEnabled}
          icon={Shield}
          iconBg="bg-[#3058EE]/10"
          iconColor="text-[#3058EE]"/>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput className="sm:w-80"
            placeholder="Search by name or email..."
            onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}/>
          <div className="flex gap-3">
            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.userType} onValueChange={(value) => setFilters((prev) => ({ ...prev, userType: value }))}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="system_admin">System Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center">{tableInstance && <DataTableViewOptions table={tableInstance} />}</div>
      </div>

      {/* Users Table */}
      <UsersTable users={users}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.status !== 'all' || filters.userType !== 'all'}
        onInviteUser={handleInviteUser}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}/>

      {/* Invite User Modal */}
      <InviteUserModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} onSuccess={handleInviteSuccess} />
    </div>
  );
}
