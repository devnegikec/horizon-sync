import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, Send, Package, CreditCard, Users2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import { useAuth } from '../hooks';
import { RoleService } from '../services/role.service';
import { UserService, InviteUserPayload } from '../services/user.service';
import type { Role, Permission } from '../types/role.types';

const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  role_id: z.string().optional(),
  message: z.string().optional(),
});

type InviteUserFormData = z.infer<typeof inviteUserSchema>;

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface PermissionGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  permissions: Array<{
    id: string;
    code: string;
    name: string;
    checked: boolean;
  }>;
}

// Icon mapping for permission groups
const getIconForModule = (moduleName: string): React.ComponentType<{ className?: string }> => {
  const lowerModule = moduleName.toLowerCase();
  if (lowerModule.includes('crm') || lowerModule.includes('sales') || lowerModule.includes('customer')) {
    return Users2;
  }
  if (lowerModule.includes('inventory') || lowerModule.includes('stock') || lowerModule.includes('warehouse')) {
    return Package;
  }
  if (lowerModule.includes('billing') || lowerModule.includes('subscription') || lowerModule.includes('payment')) {
    return CreditCard;
  }
  return Package; // Default icon
};

// eslint-disable-next-line complexity
export function InviteUserModal({ open, onOpenChange, onSuccess }: InviteUserModalProps) {
  const { accessToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = React.useState(false);
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>('');
  const [permissionsLoading, setPermissionsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
  });

  const [permissionGroups, setPermissionGroups] = React.useState<PermissionGroup[]>([]);

  const fetchRoles = React.useCallback(async () => {
    if (!accessToken) return;

    setRolesLoading(true);
    try {
      const response = await RoleService.getRoles(
        {
          search: '',
          isSystem: null,
          isActive: true,
          page: 1,
          pageSize: 100,
        },
        accessToken
      );
      setRoles(response.data || []);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      setErrorMessage('Failed to load roles. Please try again.');
    } finally {
      setRolesLoading(false);
    }
  }, [accessToken]);

  const transformPermissionsToGroups = React.useCallback((groupedData: Record<string, Permission[]>, rolePermissionIds: Set<string>): PermissionGroup[] => {
    return Object.entries(groupedData).map(([moduleName, permissions]) => ({
      title: moduleName,
      icon: getIconForModule(moduleName),
      permissions: (permissions as Permission[]).map((perm) => ({
        id: perm.id,
        code: perm.code,
        name: perm.name,
        checked: rolePermissionIds.has(perm.id),
      })),
    }));
  }, []);

  const fetchPermissionsForRole = React.useCallback(async (roleId: string) => {
    if (!accessToken) return;

    setPermissionsLoading(true);
    try {
      // Fetch the selected role with permissions
      const selectedRole = await RoleService.getRole(roleId, accessToken);
      const rolePermissionIds = new Set(selectedRole.permissions?.map((p) => p.id) || []);

      // Fetch all grouped permissions
      const groupedResponse = await RoleService.getGroupedPermissions(accessToken);
      const groupedData = groupedResponse.data || {};

      // Transform API response to UI format
      const groups = transformPermissionsToGroups(groupedData, rolePermissionIds);
      setPermissionGroups(groups);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setErrorMessage('Failed to load permissions. Please try again.');
    } finally {
      setPermissionsLoading(false);
    }
  }, [accessToken, transformPermissionsToGroups]);

  // Fetch roles when modal opens
  React.useEffect(() => {
    if (open && accessToken) {
      fetchRoles();
    }
  }, [open, accessToken, fetchRoles]);

  // Fetch permissions when role is selected
  React.useEffect(() => {
    if (selectedRoleId && accessToken) {
      fetchPermissionsForRole(selectedRoleId);
    } else {
      // Reset permissions when no role is selected
      setPermissionGroups([]);
    }
  }, [selectedRoleId, accessToken, fetchPermissionsForRole]);

  const togglePermission = (groupIndex: number, permissionIndex: number) => {
    setPermissionGroups((prev) => {
      const newGroups = [...prev];
      newGroups[groupIndex].permissions[permissionIndex].checked = !newGroups[groupIndex].permissions[permissionIndex].checked;
      return newGroups;
    });
  };

  const handleFormSubmit = React.useCallback(async (data: InviteUserFormData) => {
    if (!accessToken) {
      setErrorMessage('You must be logged in to invite users');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload: InviteUserPayload = {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        role_id: data.role_id,
        message: data.message,
      };

      await UserService.inviteUser(payload, accessToken);

      // Reset form and close modal
      reset();
      setPermissionGroups((prev) =>
        prev.map((group) => ({
          ...group,
          permissions: group.permissions.map((p) => ({ ...p, checked: false })),
        })),
      );
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [accessToken, reset, onOpenChange, onSuccess]);

  const handleClose = () => {
    reset();
    setErrorMessage('');
    setSelectedRoleId('');
    setPermissionGroups([]);
    onOpenChange(false);
  };

  const handleRoleChange = (roleId: string) => {
    setValue('role_id', roleId);
    setSelectedRoleId(roleId);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#3058EE] to-[#7D97F6]">
              <UserPlus className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Invite New User</DialogTitle>
              <DialogDescription>Send invitation with role and permissions</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}/>
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            <p className="text-xs text-muted-foreground">Invitation will be sent to this email</p>
          </div>

          {/* First Name and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input id="first_name" placeholder="John" {...register('first_name')} className={errors.first_name ? 'border-destructive' : ''} />
              {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input id="last_name" placeholder="Doe" {...register('last_name')} className={errors.last_name ? 'border-destructive' : ''} />
              {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>

          {/* Assign Role */}
          <div className="space-y-2">
            <Label htmlFor="role_id">Assign Role</Label>
            <Select onValueChange={handleRoleChange} value={selectedRoleId} disabled={rolesLoading}>
              <SelectTrigger>
                <SelectValue placeholder={rolesLoading ? 'Loading roles...' : 'Choose a role'} />
              </SelectTrigger>
              <SelectContent>
                {roles.length === 0 && !rolesLoading && (
                  <SelectItem value="" disabled>No roles available</SelectItem>
                )}
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                    {role.description && <span className="text-muted-foreground ml-2">({role.description})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Select primary role for this user</p>
          </div>

          {/* Role Permissions */}
          {selectedRoleId && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm">Role Permissions</h3>
                <p className="text-xs text-muted-foreground">
                  {permissionsLoading ? 'Loading permissions...' : 'Permissions assigned to the selected role'}
                </p>
              </div>

              {permissionsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <p className="text-sm text-muted-foreground">Loading permissions...</p>
                </div>
              ) : permissionGroups.length === 0 ? (
                <div className="flex items-center justify-center p-8">
                  <p className="text-sm text-muted-foreground">No permissions available</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {permissionGroups.map((group, groupIndex) => (
                    <div key={group.title} className="rounded-lg border border-border p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <group.icon className="h-5 w-5 text-muted-foreground" />
                        <h4 className="font-semibold text-sm">{group.title}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {group.permissions.map((permission, permissionIndex) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox id={permission.id}
                              checked={permission.checked}
                              disabled={true}
                              onCheckedChange={() => togglePermission(groupIndex, permissionIndex)}/>
                            <label htmlFor={permission.id}
                              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                              {permission.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white">
              {isSubmitting ? (
                <>Sending...</>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
