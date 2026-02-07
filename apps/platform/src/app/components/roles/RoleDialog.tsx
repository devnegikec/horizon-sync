import { useState, useEffect, useMemo } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Button, Input, Label, Textarea } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import { useAuth } from '../../hooks';
import type { Role, DialogMode, RoleFormData, Permission } from '../../types/role.types';

import { DangerousPermissionAlert } from './DangerousPermissionAlert';
import { useRoleActions, usePermissions } from './hooks';
import { PermissionMatrix } from './PermissionMatrix';
import { roleSchema } from './utils/validation';

interface RoleDialogProps {
  mode: DialogMode;
  role?: Role | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RoleDialog({ mode, role, isOpen, onClose, onSuccess }: RoleDialogProps) {
  const { accessToken } = useAuth();
  const { toast } = useToast();
  const { createRole, updateRole, loading } = useRoleActions(accessToken, onSuccess);
  const { permissions, loading: permissionsLoading } = usePermissions(accessToken);

  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fullAccessConfirmed, setFullAccessConfirmed] = useState(false);

  // Convert permissions object to flat array
  const allPermissions = useMemo(() => {
    const perms: Permission[] = [];
    Object.values(permissions).forEach((modulePerms) => {
      perms.push(...modulePerms);
    });
    return perms;
  }, [permissions]);

  // Convert form permissions array to Set for easier lookup
  const selectedPermissionsSet = useMemo(() => {
    return new Set(formData.permissions);
  }, [formData.permissions]);

  // Initialize form data based on mode
  useEffect(() => {
    if (mode === 'create') {
      setFormData({ name: '', description: '', permissions: [] });
      return;
    }
    
    if (!role) return;
    
    const baseData = {
      name: mode === 'clone' ? `Copy of ${role.name}` : role.name,
      description: role.description || '',
      permissions: role.permissions?.map((p) => p.code) || [],
    };
    
    setFormData(baseData);
  }, [mode, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Check for full access confirmation
    if (formData.permissions.includes('*.*') && !fullAccessConfirmed) {
      setErrors({ permissions: 'Please confirm you understand the implications of granting full access' });
      return;
    }

    // Validate form
    const result = roleSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      if (mode === 'create' || mode === 'clone') {
        await createRole(formData);
        toast({
          title: 'Success',
          description: 'Role created successfully',
          variant: 'default',
        });
      } else if (mode === 'edit' && role) {
        await updateRole(role.id, formData);
        toast({
          title: 'Success',
          description: 'Role updated successfully',
          variant: 'default',
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handlePermissionToggle = (permissionCode: string) => {
    setFormData((prev) => {
      const perms = new Set(prev.permissions);
      if (perms.has(permissionCode)) {
        perms.delete(permissionCode);
      } else {
        perms.add(permissionCode);
      }
      return { ...prev, permissions: Array.from(perms) };
    });
  };

  const handleBulkSelect = (permissionCodes: string[], selected: boolean) => {
    setFormData((prev) => {
      const perms = new Set(prev.permissions);
      permissionCodes.forEach((code) => {
        if (selected) {
          perms.add(code);
        } else {
          perms.delete(code);
        }
      });
      return { ...prev, permissions: Array.from(perms) };
    });
  };

  const getDialogTitle = () => {
    if (mode === 'create') return 'Create Role';
    if (mode === 'edit') return 'Edit Role';
    if (mode === 'clone') return 'Clone Role';
    return 'Role';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {mode === 'create' && 'Create a new role with specific permissions'}
            {mode === 'edit' && 'Update role details and permissions'}
            {mode === 'clone' && 'Create a new role based on an existing one'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Role Name <span className="text-destructive">*</span>
            </Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter role name" disabled={loading} />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Enter role description" rows={3} disabled={loading} />
            {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          </div>

          {/* Dangerous Permission Alert */}
          {selectedPermissionsSet.size > 0 && (
            <DangerousPermissionAlert selectedPermissions={selectedPermissionsSet} onConfirm={setFullAccessConfirmed} />
          )}

          {/* Permissions Section */}
          <div className="space-y-2">
            <Label>
              Permissions <span className="text-xs text-muted-foreground">({formData.permissions.length} selected)</span>
            </Label>
            {permissionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3058EE] mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground">Loading permissions...</p>
                </div>
              </div>
            ) : (
              <PermissionMatrix permissions={permissions} selectedPermissions={selectedPermissionsSet} onPermissionToggle={handlePermissionToggle} onBulkSelect={handleBulkSelect} allPermissions={allPermissions} />
            )}
            {errors.permissions && <p className="text-sm text-destructive">{errors.permissions}</p>}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : mode === 'edit' ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
