import * as React from 'react';

import { type ColumnDef, type Table } from '@tanstack/react-table';
import { Users, MoreHorizontal, Eye, Edit, Key, Mail, Shield, Clock, UserPlus } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@horizon-sync/ui/components/ui/avatar';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { EmptyState } from '@horizon-sync/ui/components/ui/empty-state';
import { TableSkeleton } from '@horizon-sync/ui/components/ui/table-skeleton';
import { DataTable, DataTableColumnHeader } from '@horizon-sync/ui/components/data-table';

import type { User } from '../../types/user.types';
import { formatDate, getStatusBadgeProps, getUserInitials, getUserTypeBadge } from '../../utility/user-utils';

export interface UsersTableProps {
  users: User[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView?: (user: User) => void;
  onEdit?: (user: User) => void;
  onResetPassword?: (user: User) => void;
  onManagePermissions?: (user: User) => void;
  onResendInvitation?: (user: User) => void;
  onInviteUser: () => void;
  onTableReady?: (table: Table<User>) => void;
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function UsersTable({
  users,
  loading,
  error,
  hasActiveFilters,
  onView,
  onEdit,
  onResetPassword,
  onManagePermissions,
  onResendInvitation,
  onInviteUser,
  onTableReady,
  serverPagination,
}: UsersTableProps) {
  const [tableInstance, setTableInstance] = React.useState<Table<User> | null>(null);

  // Call onTableReady when table instance changes
  React.useEffect(() => {
    if (tableInstance && onTableReady) {
      onTableReady(tableInstance);
    }
  }, [tableInstance, onTableReady]);

  // Create server pagination config for DataTable
  const serverPaginationConfig = React.useMemo(() => {
    if (!serverPagination) return undefined;

    return {
      totalItems: serverPagination.totalItems,
      currentPage: serverPagination.pageIndex + 1, // Convert 0-based to 1-based
      pageSize: serverPagination.pageSize,
      onPageChange: (page: number, pageSize: number) => {
        serverPagination.onPaginationChange(page - 1, pageSize); // Convert 1-based to 0-based
      },
    };
  }, [serverPagination]);

  const columns: ColumnDef<User, unknown>[] = React.useMemo(
    () => [
      {
        accessorKey: 'display_name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="User" />,
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
                <span className="font-medium">
                  {user.first_name} {user.last_name}
                </span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'user_type',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
        cell: ({ row }) => {
          const typeBadge = getUserTypeBadge(row.original.user_type);
          return <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>;
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const statusBadge = getStatusBadgeProps(row.original.status);
          return <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>;
        },
      },
      {
        accessorKey: 'email_verified',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Verified" />,
        cell: ({ row }) => {
          const verified = row.original.email_verified;
          return (
            <Badge variant={verified ? 'success' : 'secondary'}>
              {verified ? 'Verified' : 'Unverified'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'last_login_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Last Login" />,
        cell: ({ row }) => {
          return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              {formatDate(row.original.last_login_at)}
            </div>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
        cell: ({ row }) => {
          const date = new Date(row.original.created_at);
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(user)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit User
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onResetPassword && (
                    <DropdownMenuItem onClick={() => onResetPassword(user)}>
                      <Key className="mr-2 h-4 w-4" />
                      Reset Password
                    </DropdownMenuItem>
                  )}
                  {onManagePermissions && (
                    <DropdownMenuItem onClick={() => onManagePermissions(user)}>
                      <Shield className="mr-2 h-4 w-4" />
                      Manage Permissions
                    </DropdownMenuItem>
                  )}
                  {onResendInvitation && user.status === 'pending' && (
                    <DropdownMenuItem onClick={() => onResendInvitation(user)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Invitation
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
      },
    ],
    [onView, onEdit, onResetPassword, onManagePermissions, onResendInvitation]
  );

  const renderViewOptions = (table: Table<User>) => {
    // Set table instance in state, which will trigger useEffect
    if (table !== tableInstance) {
      setTableInstance(table);
    }
    return null; // Don't render anything in the table
  };

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

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="p-6">
            <EmptyState icon={<Users className="h-12 w-12" />}
              title="No users found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filters'
                  : 'Get started by inviting your first team member'
              }
              action={
                !hasActiveFilters ? (
                  <Button onClick={onInviteUser} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite User
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
          maxHeight="auto"/>
      </CardContent>
    </Card>
  );
}
