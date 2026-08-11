import { useState, useEffect, useMemo } from 'react';

import { type Table } from '@tanstack/react-table';
import { Users, UserCheck, UserX, Shield, Download, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useUserStore } from '@horizon-sync/store';
import { toast } from '@horizon-sync/ui';
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
  UsersTable,
  CreateUserModal,
  UserDetailModal,
} from '@horizon-sync/ui/components';
import type { UsersTableUser, CreateUserModalFormData, UserDetailEditData } from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import { useCreateUser } from '../hooks/useCreateUser';
import { usePermissions } from '../hooks/usePermissions';
import { useUser, useUpdateUser } from '../hooks/useUser';
import { useUsers } from '../hooks/useUsers';
import { AdminOrganizationService } from '../services/admin-organization.service';
import { AdminRoleService } from '../services/admin-role.service';
import type { SystemAdminRole } from '../services/admin-role.service';
import type { AdminUserFilters, AdminUserListItem, AdminOrgListItem } from '../types';
import { SYSTEM_ADMIN_PERMISSIONS } from '../types/permissions';


const PAGE_SIZE = 20;

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

export function UsersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const organization = useUserStore((s) => s.organization);
  const canCreate = hasPermission(SYSTEM_ADMIN_PERMISSIONS.USERS_CREATE) || hasPermission('warehouse.manage');
  const canUpdate = hasPermission(SYSTEM_ADMIN_PERMISSIONS.USERS_UPDATE) || hasPermission('warehouse.manage');
  const canDelete = hasPermission(SYSTEM_ADMIN_PERMISSIONS.USERS_DELETE) || hasPermission('warehouse.manage');
  const isSuperAdmin = hasPermission(SYSTEM_ADMIN_PERMISSIONS.MASTER);
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [tableInstance, setTableInstance] = useState<Table<AdminUserListItem> | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [modalEditMode, setModalEditMode] = useState(false);
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null);
  const [orgOptions, setOrgOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [masterOrgId, setMasterOrgId] = useState<string>('');
  const [systemAdminRoles, setSystemAdminRoles] = useState<SystemAdminRole[]>([]);
  const [systemAdminRolesLoading, setSystemAdminRolesLoading] = useState(false);
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  // Fetch user detail when selected
  const { data: selectedUserData, isLoading: selectedUserLoading } = useUser(selectedUserId ?? '');

  // Fetch organizations when modal opens
  useEffect(() => {
    if (!createModalOpen) return;
    setOrgsLoading(true);
    AdminOrganizationService.list({ page: 1, page_size: 100 })
      .then((res) => {
        setOrgOptions(res.organizations.map((o: AdminOrgListItem) => ({ id: o.id, name: o.name })));
        // Find master org from the list
        const master = res.organizations.find((o: AdminOrgListItem) => (o as any).organization_type === 'master');
        if (master) setMasterOrgId(master.id);
      })
      .catch(() => setOrgOptions([]))
      .finally(() => setOrgsLoading(false));
  }, [createModalOpen]);

  // Fetch system admin roles when modal opens (Super Admin only)
  useEffect(() => {
    if ((!createModalOpen && !detailModalOpen) || !isSuperAdmin) return;
    setSystemAdminRolesLoading(true);
    AdminRoleService.listRoles()
      .then((roles) => setSystemAdminRoles(roles))
      .catch(() => setSystemAdminRoles([]))
      .finally(() => setSystemAdminRolesLoading(false));
    // Also fetch master org ID if not already set
    if (!masterOrgId) {
      AdminOrganizationService.list({ page: 1, page_size: 100 })
        .then((res) => {
          const master = res.organizations.find((o: AdminOrgListItem) => (o as any).organization_type === 'master');
          if (master) setMasterOrgId(master.id);
        })
        .catch(() => {});
    }
  }, [createModalOpen, detailModalOpen, isSuperAdmin, masterOrgId]);

  const handleOrgSearch = (query: string) => {
    setOrgsLoading(true);
    AdminOrganizationService.list({ search: query, page: 1, page_size: 50 })
      .then((res) => setOrgOptions(res.organizations.map((o: AdminOrgListItem) => ({ id: o.id, name: o.name }))))
      .catch(() => {})
      .finally(() => setOrgsLoading(false));
  };

  const filters: AdminUserFilters = useMemo(() => ({
    ...(search ? { search } : {}),
    ...(activeStatus === 'active' ? { is_active: true } : activeStatus === 'inactive' ? { is_active: false } : {}),
    page,
    page_size: pageSize,
  }), [search, activeStatus, page, pageSize]);

  const { data, isLoading } = useUsers(filters);

  // Reset to first page when filters change
  useEffect(() => { setPage(1); }, [search, activeStatus]);

  const users = data?.users ?? [];
  const pagination = data?.pagination;

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? users.length;
    const active = users.filter(u => u.is_active).length;
    const inactive = users.filter(u => !u.is_active).length;
    return { total, active, inactive };
  }, [users, pagination]);

  const serverPaginationConfig = useMemo(() => ({
    pageIndex: page - 1,
    pageSize,
    totalItems: pagination?.total_items ?? 0,
    onPaginationChange: (pageIndex: number, newPageSize: number) => {
      setPage(pageIndex + 1);
      setPageSize(newPageSize);
    },
  }), [page, pageSize, pagination?.total_items]);

  const handleView = (user: AdminUserListItem) => {
    setSelectedUserId(user.id);
    setModalEditMode(false);
    setDetailModalOpen(true);
  };
  const handleEdit = (user: AdminUserListItem) => {
    setSelectedUserId(user.id);
    setModalEditMode(true);
    setDetailModalOpen(true);
  };

  const handleUpdateUser = async (userId: string, data: UserDetailEditData) => {
    return new Promise<void>((resolve, reject) => {
      updateMutation.mutate(
        { id: userId, data: { first_name: data.first_name, last_name: data.last_name, phone: data.phone || null, user_type: data.user_type as any, roles: data.roles as any, is_active: data.is_active } },
        {
          onSuccess: () => { toast({ title: 'User updated', description: 'Changes saved successfully.' }); resolve(); },
          onError: (error: any) => { reject(error.data?.detail ? new Error(typeof error.data.detail === 'string' ? error.data.detail : 'Failed to update') : error); },
        }
      );
    });
  };

  const handleCreateUser = async (data: CreateUserModalFormData) => {
    setFieldError(null);
    return new Promise<void>((resolve, reject) => {
      createMutation.mutate(
        {
          email: data.email,
          password: data.password || '',
          first_name: data.first_name,
          last_name: data.last_name,
          organization_id: data.organization_id || '',
          roles: data.roles as any,
          phone: data.phone || null,
          user_type: data.user_type as any,
          ...(data.system_admin_role_ids && data.system_admin_role_ids.length > 0
            ? { system_admin_role_ids: data.system_admin_role_ids }
            : {}),
        },
        {
          onSuccess: (created) => {
            toast({ title: 'User created', description: `${created.first_name} ${created.last_name} has been created.` });
            resolve();
          },
          onError: (error: any) => {
            if (error.status === 409) {
              setFieldError({ field: 'email', message: 'User with this email already exists' });
            }
            reject(error.data?.detail ? new Error(typeof error.data.detail === 'string' ? error.data.detail : 'Failed to create user') : error);
          },
        }
      );
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage all users across organizations</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          {canCreate && (
            <Button onClick={() => setCreateModalOpen(true)}
              className="gap-2 bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25">
              <Plus className="h-4 w-4" />
              Create User
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Users"
value={stats.total}
          icon={Users}
iconBg="bg-slate-100 dark:bg-slate-800"
iconColor="text-slate-600 dark:text-slate-400" />
        <StatCard title="Active Users"
value={stats.active}
          icon={UserCheck}
iconBg="bg-emerald-100 dark:bg-emerald-900/20"
iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Inactive Users"
value={stats.inactive}
          icon={UserX}
iconBg="bg-red-100 dark:bg-red-900/20"
iconColor="text-red-600 dark:text-red-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput className="sm:w-80"
            placeholder="Search by email, phone, or name..."
            onSearch={(value) => setSearch(value)} />
          <div className="flex gap-3">
            <Select value={activeStatus} onValueChange={setActiveStatus}>
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
        <div className="flex items-center">
          {tableInstance && <DataTableViewOptions table={tableInstance} />}
        </div>
      </div>

      {/* Users Table */}
      <UsersTable users={users as (AdminUserListItem & UsersTableUser)[]}
        loading={isLoading}
        error={null}
        hasActiveFilters={!!search || activeStatus !== 'all'}
        onView={handleView}
        onEdit={canUpdate ? handleEdit : undefined}
        onCreateUser={canCreate ? () => setCreateModalOpen(true) : undefined}
        onTableReady={(table) => setTableInstance(table as Table<AdminUserListItem>)}
        showOrganization
        serverPagination={serverPaginationConfig}/>

      {/* Create User Modal */}
      <CreateUserModal open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateUser}
        fieldError={fieldError}
        isSuperAdmin={isSuperAdmin}
        config={{
          showPassword: true,
          showOrganization: true,
          organizationOptions: orgOptions,
          organizationsLoading: orgsLoading,
          onOrganizationSearch: handleOrgSearch,
          showUserType: true,
          showRoles: true,
          showPhone: true,
          systemAdminRoles: systemAdminRoles,
          systemAdminRolesLoading: systemAdminRolesLoading,
          masterOrganizationId: masterOrgId,
          masterOrganizationName: orgOptions.find(o => o.id === masterOrgId)?.name ?? 'Master Organization',
          title: 'Create New User',
          description: 'Create a user with organization assignment and role configuration',
          submitLabel: 'Create User',
          submitIcon: 'plus',
        }}/>

      {/* User Detail / Edit Modal */}
      <UserDetailModal open={detailModalOpen}
        onOpenChange={(open) => { setDetailModalOpen(open); if (!open) { setSelectedUserId(null); setModalEditMode(false); } }}
        user={selectedUserData ?? null}
        loading={selectedUserLoading}
        onUpdate={canUpdate ? handleUpdateUser : undefined}
        isSuperAdmin={isSuperAdmin}
        config={{
          showUserType: true,
          showRoles: true,
          showPhone: true,
          showOrganization: true,
          allowEdit: canUpdate,
          allowDeactivate: canUpdate,
          initialEditMode: modalEditMode && canUpdate,
          systemAdminRoles: systemAdminRoles,
          systemAdminRolesLoading: systemAdminRolesLoading,
          masterOrganizationId: masterOrgId,
        }}/>
    </div>
  );
}
