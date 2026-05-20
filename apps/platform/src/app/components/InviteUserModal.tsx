import * as React from 'react';

import { zodResolver } from '@hookform/resolvers/zod';
import { Send, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';

import { useAuth } from '../hooks';
import { RoleService } from '../services/role.service';
import { UserService, InviteUserPayload } from '../services/user.service';
import type { Role, ModuleGroup } from '../types/role.types';
import { ModulePermissionMatrix } from './roles/ModulePermissionMatrix';

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

// eslint-disable-next-line complexity
export function InviteUserModal({ open, onOpenChange, onSuccess }: InviteUserModalProps) {
  const { accessToken, user } = useAuth();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = React.useState(false);
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>('');
  const [permissionsLoading, setPermissionsLoading] = React.useState(false);
  const [roleModules, setRoleModules] = React.useState<ModuleGroup[]>([]);
  const [rolePermissionCodes, setRolePermissionCodes] = React.useState<Set<string>>(new Set());

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
  });

  const fetchRoles = React.useCallback(async () => {
    if (!accessToken) return;
    setRolesLoading(true);
    try {
      const response = await RoleService.getRoles(
        { search: '', isSystem: null, isActive: true, page: 1, pageSize: 100 },
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

  const fetchPermissionsForRole = React.useCallback(async (roleId: string) => {
    if (!accessToken) return;
    setPermissionsLoading(true);
    try {
      const selectedRole = await RoleService.getRole(roleId, accessToken);
      const roleCodes = new Set(selectedRole.permissions?.map((p) => p.code) || []);
      setRolePermissionCodes(roleCodes);

      const groupedResponse = await RoleService.getGroupedPermissions(accessToken);

      // Build module view showing only permissions this role has
      const filteredModules: ModuleGroup[] = (groupedResponse.modules ?? [])
        .map((mod) => ({
          ...mod,
          resources: mod.resources
            .map((res) => ({
              ...res,
              permissions: res.permissions.filter((p) => roleCodes.has(p.code)),
            }))
            .filter((res) => res.permissions.length > 0),
        }))
        .filter((mod) => mod.resources.length > 0);

      setRoleModules(filteredModules);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      setErrorMessage('Failed to load permissions. Please try again.');
    } finally {
      setPermissionsLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    if (open && accessToken) fetchRoles();
  }, [open, accessToken, fetchRoles]);

  React.useEffect(() => {
    if (selectedRoleId && accessToken) {
      fetchPermissionsForRole(selectedRoleId);
    } else {
      setRoleModules([]);
      setRolePermissionCodes(new Set());
    }
  }, [selectedRoleId, accessToken, fetchPermissionsForRole]);

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
        organization_id: user?.organization_id ?? undefined,
      };
      await UserService.inviteUser(payload, accessToken);
      reset();
      setSelectedRoleId('');
      setRoleModules([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [accessToken, reset, onOpenChange, onSuccess, user?.organization_id]);

  const handleClose = () => {
    reset();
    setErrorMessage('');
    setSelectedRoleId('');
    setRoleModules([]);
    onOpenChange(false);
  };

  const handleRoleChange = (roleId: string) => {
    setValue('role_id', roleId);
    setSelectedRoleId(roleId);
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl flex flex-col max-h-[90vh] p-0 gap-0">
        {/* Fixed header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
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

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            <p className="text-xs text-muted-foreground">Invitation will be sent to this email</p>
          </div>

          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="first_name"
                placeholder="John"
                {...register('first_name')}
                className={errors.first_name ? 'border-destructive' : ''}
              />
              {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="last_name"
                placeholder="Doe"
                {...register('last_name')}
                className={errors.last_name ? 'border-destructive' : ''}
              />
              {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>

          {/* Role selector */}
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
                    <div className="flex flex-col">
                      <span>{role.name}</span>
                      {role.description && (
                        <span className="text-xs text-muted-foreground">{role.description}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Select the primary role for this user</p>
          </div>

          {/* Role permissions preview — read-only module view */}
          {selectedRoleId && (
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold text-sm">
                  Permissions granted by{' '}
                  <span className="text-[#3058EE]">{selectedRole?.name ?? 'this role'}</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  {permissionsLoading
                    ? 'Loading permissions...'
                    : roleModules.length === 0
                    ? 'This role has no specific module permissions'
                    : 'The user will have access to the following features'}
                </p>
              </div>

              {permissionsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <p className="text-sm text-muted-foreground">Loading permissions...</p>
                </div>
              ) : roleModules.length > 0 ? (
                <div className="max-h-[320px] overflow-y-auto rounded-lg border p-1">
                  <ModulePermissionMatrix
                    modules={roleModules}
                    selectedPermissions={rolePermissionCodes}
                    onPermissionToggle={() => { /* read-only */ }}
                    onBulkSelect={() => { /* read-only */ }}
                    readOnly
                  />
                </div>
              ) : null}
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              <p className="text-sm">{errorMessage}</p>
            </div>
          )}

        </div>{/* end scrollable body */}

        {/* Fixed footer */}
        <div className="px-6 py-4 border-t shrink-0 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white"
            >
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
