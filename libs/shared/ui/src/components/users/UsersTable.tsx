import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { Users, MoreHorizontal, Eye, Edit, Key, Mail, Shield, Clock, UserPlus, Trash2 } from 'lucide-react';

import { DataTable, DataTableColumnHeader } from '../data-table';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { EmptyState } from '../ui/empty-state';
import { getStatusBadgeProps, getUserInitials, getUserTypeBadge, formatUserDate, formatShortDate } from '../../utils/user-utils';

/** Minimal user shape the table needs. Both platform User and admin AdminUserListItem satisfy this. */
export interface UsersTableUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  user_type: string;
  created_at: string;
  /** Platform uses string status; admin uses is_active boolean */
  status?: string;
  is_active?: boolean;
  avatar_url?: string | null;
  email_verified?: boolean;
  last_login_at?: string | null;
  organization_name?: string | null;
  roles?: string[];
}

export interface UsersTableProps<T extends UsersTableUser = UsersTableUser> {
  users: T[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView?: (user: T) => void;
  onEdit?: (user: T) => void;
  onDelete?: (user: T) => void;
  onResetPassword?: (user: T) => void;
  onManagePermissions?: (user: T) => void;
  onResendInvitation?: (user: T) => void;
  onInviteUser?: () => void;
  onCreateUser?: () => void;
  onTableReady?: (table: Table<T>) => void;
  /** Show the Organization column (useful for system_admin view) */
  showOrganization?: boolean;
  /** Show the Verified column */
  showVerified?: boolean;
  /** Show the Last Login column */
  showLastLogin?: boolean;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}


function getUserStatus(user: UsersTableUser): string | boolean {
  if (user.status != null) return user.status;
  if (user.is_active != null) return user.is_active;
  return 'unknown';
}

export function UsersTable<T extends UsersTableUser = UsersTableUser>({
  users,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onDelete,
  onResetPassword,
  onManagePermissions,
  onResendInvitation,
  onInviteUser,
  onCreateUser,
  onTableReady,
  showOrganization = false,
  showVerified = false,
  showLastLogin = false,
  serverPagination,
}: UsersTableProps<T>) {
  const [tableInstance, setTableInstance] = React.useState<Table<T> | null>(null);

  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
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

  const columns: ColumnDef<T, unknown>[] = React.useMemo(() => {
    const cols: ColumnDef<T, unknown>[] = [
      {
        accessorKey: 'display_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="User" className="ml-3" />,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar_url || ''} />
                <AvatarFallback className="bg-gradient-to-br from-[#3058EE] to-[#7D97F6] text-white font-medium">
                  {getUserInitials(user.first_name, user.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium">{user.first_name} {user.last_name}</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'user_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Role" className="ml-3" />,
        cell: ({ row }) => {
          const user = row.original as UsersTableUser;
          // Show org-level role names when available, fall back to user_type badge
          if (user.roles && user.roles.length > 0) {
            return (
              <div className="flex flex-wrap gap-1">
                {user.roles.map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))}
              </div>
            );
          }
          const typeBadge = getUserTypeBadge(row.original.user_type);
          return <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>;
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" className="ml-3" />,
        cell: ({ row }) => {
          const statusBadge = getStatusBadgeProps(getUserStatus(row.original));
          return <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>;
        },
      },
    ];

    if (showOrganization) {
      cols.push({
        accessorKey: 'organization_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Organization" className="ml-3" />,
        cell: ({ row }) => (
          <span className="text-sm">{(row.original as UsersTableUser).organization_name ?? '—'}</span>
        ),
      });
    }

    if (showVerified) {
      cols.push({
        accessorKey: 'email_verified',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Verified" className="ml-3" />,
        cell: ({ row }) => {
          const verified = (row.original as UsersTableUser).email_verified;
          return (
            <Badge variant={verified ? 'success' : 'secondary'}>
              {verified ? 'Verified' : 'Unverified'}
            </Badge>
          );
        },
      });
    }

    if (showLastLogin) {
      cols.push({
        accessorKey: 'last_login_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last Login" className="ml-3" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatUserDate((row.original as UsersTableUser).last_login_at)}
          </div>
        ),
      });
    }

    cols.push(
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" className="ml-3" />,
        cell: ({ row }) => <span className="text-sm">{formatShortDate(row.original.created_at)}</span>,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const user = row.original;
          const hasActions = onView || onEdit || onDelete || onResetPassword || onManagePermissions || onResendInvitation;
          if (!hasActions) return null;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(user)}>
                      <Eye className="mr-2 h-4 w-4" />View Details
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit className="mr-2 h-4 w-4" />Edit User
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem onClick={() => onDelete(user)} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />Deactivate User
                    </DropdownMenuItem>
                  )}
                  {(onView || onEdit || onDelete) && (onResetPassword || onManagePermissions || onResendInvitation) && <DropdownMenuSeparator />}
                  {onResetPassword && (
                    <DropdownMenuItem onClick={() => onResetPassword(user)}>
                      <Key className="mr-2 h-4 w-4" />Reset Password
                    </DropdownMenuItem>
                  )}
                  {onManagePermissions && (
                    <DropdownMenuItem onClick={() => onManagePermissions(user)}>
                      <Shield className="mr-2 h-4 w-4" />Manage Permissions
                    </DropdownMenuItem>
                  )}
                  {onResendInvitation && (user as UsersTableUser).status === 'pending' && (
                    <DropdownMenuItem onClick={() => onResendInvitation(user)}>
                      <Mail className="mr-2 h-4 w-4" />Resend Invitation
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      }
    );

    return cols;
  }, [onView, onEdit, onDelete, onResetPassword, onManagePermissions, onResendInvitation, showOrganization, showVerified, showLastLogin]);

  const renderViewOptions = (table: Table<T>) => {
    if (table !== tableInstance) setTableInstance(table);
    return null;
  };

  if (error) {
    return (
      <Card><CardContent className="p-0">
        <div className="p-4 text-destructive text-sm border-b">
          Error loading users: {error}
        </div>
      </CardContent></Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3058EE] mx-auto mb-4" />
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    const emptyAction = onInviteUser || onCreateUser;
    return (
      <Card><CardContent className="p-0"><div className="p-6">
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="No users found"
          description={hasActiveFilters ? 'Try adjusting your search or filters' : 'Get started by adding your first user'}
          action={!hasActiveFilters && emptyAction ? (
            <Button onClick={emptyAction} className="gap-2">
              <UserPlus className="h-4 w-4" />{onInviteUser ? 'Invite User' : 'Create User'}
            </Button>
          ) : undefined}
        />
      </div></CardContent></Card>
    );
  }

  return (
    <Card><CardContent className="p-0">
      <DataTable
        columns={columns}
        data={users}
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
        filterPlaceholder="Search by name or email..."
        renderViewOptions={renderViewOptions}
        fixedHeader
        maxHeight="auto"
      />
    </CardContent></Card>
  );
}
