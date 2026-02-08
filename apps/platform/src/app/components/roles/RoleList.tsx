import { useState } from 'react';

import { Shield, Edit, Copy, Trash2, Lock } from 'lucide-react';

import {
  Card,
  CardContent,
  Badge,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import { useAuth } from '../../hooks';
import { RoleService } from '../../services/role.service';
import type { Role } from '../../types/role.types';

import { DeleteRoleDialog } from './DeleteRoleDialog';
import { UserListDialog } from './UserListDialog';

interface RoleListProps {
  roles: Role[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onEdit: (role: Role) => void;
  onClone: (role: Role) => void;
  onDelete: (roleId: string) => void;
  serverPagination: {
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (pageIndex: number, pageSize: number) => void;
  };
}

export function RoleList({
  roles,
  loading,
  error,
  hasActiveFilters,
  onEdit,
  onClone,
  onDelete,
  serverPagination,
}: RoleListProps) {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [userListDialogOpen, setUserListDialogOpen] = useState(false);
  const [selectedRoleForUsers, setSelectedRoleForUsers] = useState<Role | null>(null);
  const [roleUsers, setRoleUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete || !accessToken) return;

    try {
      await RoleService.deleteRole(roleToDelete.id, accessToken);
      toast({
        title: 'Success',
        description: 'Role deleted successfully',
        variant: 'default',
      });
      onDelete(roleToDelete.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete role',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
  };

  const handleUserCountClick = async (role: Role) => {
    if (!role.user_count || role.user_count === 0 || !accessToken) return;

    setSelectedRoleForUsers(role);
    setUserListDialogOpen(true);
    setLoadingUsers(true);

    try {
      const users = await RoleService.getRoleUsers(role.id, accessToken);
      setRoleUsers(users);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load users',
        variant: 'destructive',
      });
      setUserListDialogOpen(false);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserListDialogClose = () => {
    setUserListDialogOpen(false);
    setSelectedRoleForUsers(null);
    setRoleUsers([]);
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3058EE] mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading roles...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-destructive mb-2">Error loading roles</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (roles.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {hasActiveFilters ? 'No roles match your filters' : 'No roles found'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role) => (
          <Card key={role.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{role.name}</h3>
                      {role.is_system && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Lock className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>System role - cannot be modified</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {role.description || 'No description'}
                    </p>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {role.is_system && (
                    <Badge variant="secondary" className="text-xs">
                      System
                    </Badge>
                  )}
                  <Badge variant={role.is_active ? 'default' : 'outline'} className="text-xs">
                    {role.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {role.permissions?.length || 0} permissions
                  </Badge>
                  {role.user_count !== undefined && (
                    <Badge variant="outline" className={role.user_count > 0 ? 'text-xs cursor-pointer hover:bg-accent' : 'text-xs'} onClick={() => handleUserCountClick(role)}>
                      {role.user_count} users
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button variant="ghost" size="sm" onClick={() => onEdit(role)} disabled={role.is_system} className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onClone(role)} className="flex-1">
                    <Copy className="h-4 w-4 mr-1" />
                    Clone
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(role)} disabled={role.is_system} className="flex-1 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination - Show only when total items > 20 */}
      {serverPagination.totalItems > 20 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {serverPagination.pageIndex * serverPagination.pageSize + 1} to{' '}
            {Math.min((serverPagination.pageIndex + 1) * serverPagination.pageSize, serverPagination.totalItems)} of{' '}
            {serverPagination.totalItems} roles
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => serverPagination.onPaginationChange(serverPagination.pageIndex - 1, serverPagination.pageSize)} disabled={serverPagination.pageIndex === 0}>
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {serverPagination.pageIndex + 1} of {Math.ceil(serverPagination.totalItems / serverPagination.pageSize)}
            </div>
            <Button variant="outline" size="sm" onClick={() => serverPagination.onPaginationChange(serverPagination.pageIndex + 1, serverPagination.pageSize)} disabled={(serverPagination.pageIndex + 1) * serverPagination.pageSize >= serverPagination.totalItems}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteRoleDialog role={roleToDelete} isOpen={deleteDialogOpen} onClose={handleDeleteDialogClose} onConfirm={handleDeleteConfirm} />

      {/* User List Dialog */}
      {selectedRoleForUsers && (
        <UserListDialog roleName={selectedRoleForUsers.name} users={loadingUsers ? [] : roleUsers} isOpen={userListDialogOpen} onClose={handleUserListDialogClose} />
      )}
    </>
  );
}
