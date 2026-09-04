import * as React from 'react';

import { Shield, Loader2, ChevronDown, ChevronRight } from 'lucide-react';

import { Button, Checkbox, DetailDialog, Label } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import { RoleService } from '../../services/role.service';
import { UserService } from '../../services/user.service';
import type { User } from '../../types/user.types';
import type { ModuleGroup, Permission, Role } from '../../types/role.types';
import { ModulePermissionMatrix } from '../roles/ModulePermissionMatrix';

interface ManageRolesDialogProps {
  user: User | null;
  organizationId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string | null;
}

export function ManageRolesDialog({
  user,
  organizationId,
  isOpen,
  onClose,
  onSuccess,
  accessToken,
}: ManageRolesDialogProps) {
  const { toast } = useToast();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [modules, setModules] = React.useState<ModuleGroup[]>([]);
  const [permissionMap, setPermissionMap] = React.useState<Map<string, Permission>>(new Map());
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<Set<string>>(new Set());
  const [selectedPermissionCodes, setSelectedPermissionCodes] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [showPermissions, setShowPermissions] = React.useState(false);

  // Load roles, the permission matrix, and the user's current assignments.
  React.useEffect(() => {
    if (!isOpen || !user || !accessToken || !organizationId) return;

    setLoading(true);
    setShowPermissions(false);
    setSelectedPermissionCodes(new Set());

    Promise.all([
      RoleService.getRoles(
        { search: '', isSystem: null, isActive: true, page: 1, pageSize: 100 },
        accessToken
      ),
      RoleService.getGroupedPermissions(accessToken),
      UserService.getUserPermissions(user.id, organizationId, accessToken),
    ])
      .then(([rolesRes, groupedRes, userPerms]) => {
        const activeRoles = (rolesRes.data ?? []).filter((r) => r.is_active);
        setRoles(activeRoles);

        const mods = groupedRes.modules ?? [];
        setModules(mods);
        const map = new Map<string, Permission>();
        mods.forEach((m) =>
          m.resources.forEach((r) => r.permissions.forEach((p) => map.set(p.code, p)))
        );
        setPermissionMap(map);

        // Pre-select roles by name (backend returns role names).
        const roleNameSet = new Set(userPerms.roles ?? []);
        setSelectedRoleIds(
          new Set(activeRoles.filter((r) => roleNameSet.has(r.name)).map((r) => r.id))
        );

        // Pre-select custom (fine-grained) permissions by code.
        setSelectedPermissionCodes(new Set(userPerms.custom_permissions ?? []));
      })
      .catch(() => {
        toast({
          variant: 'destructive',
          title: 'Failed to load',
          description: 'Could not load roles and permissions.',
        });
      })
      .finally(() => setLoading(false));
  }, [isOpen, user, accessToken, organizationId, toast]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const handlePermissionToggle = (code: string) => {
    setSelectedPermissionCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleBulkSelect = (codes: string[], selected: boolean) => {
    setSelectedPermissionCodes((prev) => {
      const next = new Set(prev);
      codes.forEach((c) => (selected ? next.add(c) : next.delete(c)));
      return next;
    });
  };

  const handleSave = async () => {
    if (!accessToken || !user || !organizationId) return;

    setSaving(true);
    try {
      const customPermissionIds = Array.from(selectedPermissionCodes)
        .map((code) => permissionMap.get(code)?.id)
        .filter((id): id is string => Boolean(id));

      await UserService.updateUserRoles(
        user.id,
        organizationId,
        Array.from(selectedRoleIds),
        customPermissionIds,
        accessToken
      );
      toast({
        title: 'Access updated',
        description: `Roles and permissions for ${user.first_name} ${user.last_name} updated successfully.`,
      });
      onSuccess();
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update roles.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.email;

  return (
    <DetailDialog
      open={isOpen}
      onOpenChange={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          <span>Manage Roles</span>
        </div>
      }
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">
          Update roles and fine-grained permissions assigned to <strong>{fullName}</strong>.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : (
          <>
            {/* Roles */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Roles
              </p>
              {roles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">No roles available</p>
              ) : (
                <div className="space-y-1">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors"
                    >
                      <Checkbox
                        id={`role-${role.id}`}
                        checked={selectedRoleIds.has(role.id)}
                        onCheckedChange={() => toggleRole(role.id)}
                      />
                      <Label
                        htmlFor={`role-${role.id}`}
                        className="flex-1 cursor-pointer text-sm font-normal"
                      >
                        <span className="font-medium">{role.name}</span>
                        {role.is_system && (
                          <span className="ml-2 text-xs text-muted-foreground">(System)</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom permissions */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowPermissions((s) => !s)}
                className="flex items-center gap-2 text-sm font-medium w-full text-left"
              >
                {showPermissions ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Custom permissions
                <span className="text-xs text-muted-foreground font-normal">
                  ({selectedPermissionCodes.size} selected)
                </span>
              </button>
              {showPermissions && (
                <div className="mt-3 max-h-[320px] overflow-y-auto rounded-lg border p-2">
                  {modules.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No permissions available
                    </p>
                  ) : (
                    <ModulePermissionMatrix
                      modules={modules}
                      selectedPermissions={selectedPermissionCodes}
                      onPermissionToggle={handlePermissionToggle}
                      onBulkSelect={handleBulkSelect}
                    />
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Grant individual permissions in addition to the selected roles (e.g. a
                read-only ASN Coordinator).
              </p>
            </div>
          </>
        )}
      </div>
    </DetailDialog>
  );
}
