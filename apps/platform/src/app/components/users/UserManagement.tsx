import { useMemo, useState, useCallback, useEffect } from 'react';

import { type Table } from '@tanstack/react-table';
import { Check, ChevronsUpDown, Users, UserCheck, UserLockIcon, Shield, Download, Loader2, UserPlus, X } from 'lucide-react';

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import { environment } from '../../../environments/environment';
import { useAuth, useUsers } from '../../hooks';
import { usePermissions } from '../../hooks/usePermissions';
import { RoleService } from '../../services/role.service';
import type { User, UserFilters } from '../../types/user.types';

import { InviteUserModal } from '../InviteUserModal';

import { UsersTable } from '@horizon-sync/ui/components';
import { UserViewDialog } from './UserViewDialog';

// ── Searchable role filter list rendered inside the Popover ──────────────────
function RoleFilterList({
  roles,
  selected,
  onSelect,
}: {
  roles: string[];
  selected: string;
  onSelect: (role: string) => void;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => roles.filter(r => r.toLowerCase().includes(query.toLowerCase())),
    [roles, query]
  );

  return (
    <div className="flex flex-col gap-1">
      {/* Search input */}
      <div className="relative">
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search roles..."
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Options list */}
      <div className="max-h-[220px] overflow-y-auto mt-1 space-y-0.5">
        {/* All Roles */}
        <button
          type="button"
          onClick={() => onSelect('')}
          className={cn(
            'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
            !selected && 'bg-accent/50 font-medium'
          )}
        >
          <Check className={cn('h-3.5 w-3.5 shrink-0', !selected ? 'opacity-100' : 'opacity-0')} />
          All Roles
        </button>

        {filtered.length === 0 && (
          <p className="px-2 py-3 text-center text-xs text-muted-foreground">No roles found</p>
        )}

        {filtered.map(role => (
          <button
            key={role}
            type="button"
            onClick={() => onSelect(role)}
            className={cn(
              'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground text-left',
              selected === role && 'bg-accent/50 font-medium'
            )}
          >
            <Check className={cn('h-3.5 w-3.5 shrink-0', selected === role ? 'opacity-100' : 'opacity-0')} />
            <span className="truncate">{role}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
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
  const { accessToken, user } = useAuth();
  const { hasPermission } = usePermissions();
  const canInvite = hasPermission('user.invite') || hasPermission('user.create') || hasPermission('user.*') || hasPermission('*.*');
  const canExport = hasPermission('user.read') || hasPermission('user.*') || hasPermission('*.*');
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    status: 'all',
    roleName: '',
  });

  // Fetch org roles for the role filter dropdown
  const [orgRoles, setOrgRoles] = useState<string[]>([]);
  const [rolePopoverOpen, setRolePopoverOpen] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    RoleService.getRoles(
      { search: '', isSystem: null, isActive: true, page: 1, pageSize: 100 },
      accessToken
    )
      .then(res => {
        const names = (res.data ?? []).map(r => r.name).sort();
        setOrgRoles(names);
      })
      .catch(() => { /* silently ignore — filter just won't populate */ });
  }, [accessToken]);

  const {
    users,
    pagination,
    statusCounts,
    pendingInvitationCount,
    loading,
    error,
    refetch,
    setPage,
    setPageSize,
    currentPage,
    currentPageSize,
  } = useUsers(1, 20, filters, accessToken, user?.organization_id);

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tableInstance, setTableInstance] = useState<Table<User> | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!accessToken) return;
    setIsExporting(true);
    try {
      const USERS_URL = `${environment.apiBaseUrl}/api/v1/identity/users`;
      let all: User[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        const params = new URLSearchParams({ page: String(page), page_size: '100' });
        const res = await fetch(`${USERS_URL}?${params}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) break;
        const data = await res.json() as { users: User[]; pagination: { total_pages: number } };
        all = all.concat(data.users ?? []);
        totalPages = data.pagination?.total_pages ?? 1;
        page++;
      } while (page <= totalPages);

      const headers = ['Email', 'First Name', 'Last Name', 'Display Name', 'User Type', 'Status', 'Email Verified', 'Created At'];
      const rows = all.map((u) => [
        u.email ?? '',
        u.first_name ?? '',
        u.last_name ?? '',
        u.display_name ?? '',
        u.user_type ?? '',
        u.status ?? '',
        u.email_verified ? 'Yes' : 'No',
        u.created_at ?? '',
      ]);

      const csv = [headers.join(','), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'users.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, [accessToken]);


  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  const visibleUsers = useMemo(() => {
    let result = users.filter(item => item.id !== user?.id);
    // Client-side role name filter
    if (filters.roleName) {
      result = result.filter(u =>
        u.roles && u.roles.some(r => r === filters.roleName)
      );
    }
    return result;
  }, [users, user?.id, filters.roleName]);

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? 0;
    // statusCounts includes the current user (who is hidden from the table).
    // Subtract 1 from active if the current user is active so the stat matches
    // what's actually shown in the table.
    const rawActive = statusCounts?.active ?? 0;
    const currentUserIsActive = user?.status === 'active' || user?.is_active === true;
    const active = Math.max(0, rawActive - (currentUserIsActive ? 1 : 0));
    const pending = pendingInvitationCount;
    const mfaEnabled = statusCounts?.mfa_enabled ?? 0;
    return { total: Math.max(0, total - 1), active, pending, mfaEnabled };
  }, [pagination, pendingInvitationCount, statusCounts, user]);

  const handleInviteUser = () => {
    setInviteModalOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewDialogOpen(true);
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
          {canExport && (
            <Button variant="outline" className="gap-2" onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Exporting...</>
              ) : (
                <><Download className="h-4 w-4" />Export</>
              )}
            </Button>
          )}
          {canInvite && (
            <Button onClick={handleInviteUser}
              className="gap-2 bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25">
              <UserPlus className="h-4 w-4" />
              Invite User
            </Button>
          )}
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
          <div className="flex gap-3 flex-wrap">
            {/* Status filter */}
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

            {/* Role filter — searchable popover */}
            <Popover open={rolePopoverOpen} onOpenChange={setRolePopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={rolePopoverOpen}
                  className={cn(
                    'w-[180px] justify-between font-normal',
                    filters.roleName && 'border-primary text-primary'
                  )}
                >
                  <span className="truncate text-sm">
                    {filters.roleName || 'All Roles'}
                  </span>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    {filters.roleName && (
                      <span
                        role="button"
                        tabIndex={0}
                        className="rounded-full hover:bg-muted p-0.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFilters(prev => ({ ...prev, roleName: '' }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            setFilters(prev => ({ ...prev, roleName: '' }));
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-2" align="start">
                <RoleFilterList
                  roles={orgRoles}
                  selected={filters.roleName}
                  onSelect={(role) => {
                    setFilters(prev => ({ ...prev, roleName: role }));
                    setRolePopoverOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex items-center">{tableInstance && <DataTableViewOptions table={tableInstance} />}</div>
      </div>

      {/* Users Table */}
      <UsersTable users={visibleUsers}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.status !== 'all' || !!filters.roleName}
        onInviteUser={handleInviteUser}
        onView={handleViewUser}
        onTableReady={handleTableReady}
        showVerified
        showLastLogin
        serverPagination={serverPaginationConfig}/>

      {/* Invite User Modal */}
      <InviteUserModal open={inviteModalOpen} onOpenChange={setInviteModalOpen} onSuccess={handleInviteSuccess} />

      {/* User View Dialog */}
      <UserViewDialog
        user={selectedUser}
        isOpen={viewDialogOpen}
        onClose={() => { setViewDialogOpen(false); setSelectedUser(null); }}
      />
    </div>
  );
}
