import { useState } from 'react';

import { Shield, Edit, Copy, Trash2, Lock, Eye } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import { useAuth } from '../../hooks';
import { RoleService } from '../../services/role.service';
import type { ModuleGroup, Role } from '../../types/role.types';

import { DeleteRoleDialog } from './DeleteRoleDialog';
import { RoleViewDialog } from './RoleViewDialog';
import { UserListDialog } from './UserListDialog';

interface RoleListProps {
  roles: Role[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onEdit?: (role: Role) => void;
  onClone?: (role: Role) => void;
  onDelete?: (roleId: string) => void;
  /** Module-grouped permissions for the view dialog */
  modules?: ModuleGroup[];
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
  modules = [],
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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [roleToView, setRoleToView] = useState<Role | null>(null);

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const handleViewClick = (role: Role) => {
    setRoleToView(role);
    setViewDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete || !accessToken) return;
    try {
      await RoleService.deleteRole(roleToDelete.id, accessToken);
      toast({ title: 'Success', description: 'Role deleted successfully', variant: 'default' });
      onDelete?.(roleToDelete.id);
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
      <Card className="border-border">
        <CardContent className="p-0">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3058EE] mx-auto mb-4" />
              <p className="text-muted-foreground">Loading roles...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-border">
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
      <Card className="border-border">
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
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {role.name}
                      {role.is_system && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>System role - cannot be modified</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[250px] truncate">
                    {role.description || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.is_system ? 'secondary' : 'outline'} className="text-xs">
                      {role.is_system ? 'System' : 'Custom'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.is_active ? 'default' : 'outline'} className="text-xs">
                      {role.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(role.permissions || []).slice(0, 3).map((perm) => (
                        <Badge key={perm.id} variant="secondary" className="text-xs">
                          {perm.code}
                        </Badge>
                      ))}
                      {(role.permissions || []).length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3}
                        </Badge>
                      )}
                      {role.user_count !== undefined && role.user_count > 0 && (
                        <Badge
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-accent"
                          onClick={() => handleUserCountClick(role)}
                        >
                          {role.user_count} users
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleViewClick(role)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>View permissions</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {onEdit && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => onEdit(role)} disabled={role.is_system}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Edit</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {onClone && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => onClone(role)}>
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Clone</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {onDelete && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(role)}
                                disabled={role.is_system}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
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

      {/* Role View Dialog */}
      <RoleViewDialog
        role={roleToView}
        modules={modules}
        isOpen={viewDialogOpen}
        onClose={() => { setViewDialogOpen(false); setRoleToView(null); }}
      />
    </>
  );
}
