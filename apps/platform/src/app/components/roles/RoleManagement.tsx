import { useState, useEffect, useMemo } from 'react';

import { Shield, Plus } from 'lucide-react';

import {
  Card,
  CardContent,
  Button,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import { useAuth } from '../../hooks';
import type { RoleFilters, DialogMode, Role } from '../../types/role.types';

import { useRoles } from './hooks';
import { RoleDialog } from './RoleDialog';
import { RoleList } from './RoleList';

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

export function RoleManagement() {
  const { accessToken } = useAuth();
  const [filters, setFilters] = useState<Omit<RoleFilters, 'page' | 'pageSize'>>({
    search: '',
    isSystem: null,
    isActive: null,
  });

  const {
    roles,
    pagination,
    loading,
    error,
    refetch,
    setPage,
    setPageSize,
    currentPage,
    currentPageSize,
  } = useRoles(1, 20, filters, accessToken);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  const stats = useMemo(() => {
    const total = pagination?.total_count ?? 0;
    const systemRoles = roles.filter((r) => r.is_system).length;
    const customRoles = roles.filter((r) => !r.is_system).length;
    const activeRoles = roles.filter((r) => r.is_active).length;
    return { total, systemRoles, customRoles, activeRoles };
  }, [roles, pagination]);

  const handleCreateRole = () => {
    setSelectedRole(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleCloneRole = (role: Role) => {
    setSelectedRole(role);
    setDialogMode('clone');
    setDialogOpen(true);
  };

  const handleDeleteRole = async (roleId: string) => {
    // Delete logic will be handled in RoleList component
    await refetch();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogMode(null);
    setSelectedRole(null);
  };

  const handleDialogSuccess = () => {
    refetch();
    handleDialogClose();
  };

  const serverPaginationConfig = useMemo(
    () => ({
      pageIndex: currentPage - 1,
      pageSize: currentPageSize,
      totalItems: pagination?.total_count ?? 0,
      onPaginationChange: (pageIndex: number, newPageSize: number) => {
        setPage(pageIndex + 1);
        setPageSize(newPageSize);
      },
    }),
    [currentPage, currentPageSize, pagination?.total_count, setPage, setPageSize]
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage roles and permissions for your organization
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreateRole}
            className="gap-2 bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25"
          >
            <Plus className="h-4 w-4" />
            Create Role
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Roles"
          value={stats.total}
          icon={Shield}
          iconBg="bg-slate-100 dark:bg-slate-800"
          iconColor="text-slate-600 dark:text-slate-400"
        />
        <StatCard
          title="System Roles"
          value={stats.systemRoles}
          icon={Shield}
          iconBg="bg-[#3058EE]/10"
          iconColor="text-[#3058EE]"
        />
        <StatCard
          title="Custom Roles"
          value={stats.customRoles}
          icon={Shield}
          iconBg="bg-emerald-100 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          title="Active Roles"
          value={stats.activeRoles}
          icon={Shield}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput
            className="sm:w-80"
            placeholder="Search roles..."
            onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}
          />
          <div className="flex gap-3">
            <Select
              value={filters.isSystem === null ? 'all' : filters.isSystem ? 'system' : 'custom'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  isSystem: value === 'all' ? null : value === 'system',
                }))
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="system">System Roles</SelectItem>
                <SelectItem value="custom">Custom Roles</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.isActive === null ? 'all' : filters.isActive ? 'active' : 'inactive'}
              onValueChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  isActive: value === 'all' ? null : value === 'active',
                }))
              }
            >
              <SelectTrigger className="w-[160px]">
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
      </div>

      {/* Roles Table */}
      <RoleList
        roles={roles}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.isSystem !== null || filters.isActive !== null}
        onEdit={handleEditRole}
        onClone={handleCloneRole}
        onDelete={handleDeleteRole}
        serverPagination={serverPaginationConfig}
      />

      {/* Role Dialog */}
      {dialogOpen && dialogMode && (
        <RoleDialog
          mode={dialogMode}
          role={selectedRole}
          isOpen={dialogOpen}
          onClose={handleDialogClose}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  );
}
