import * as React from 'react';

import { Shield, Loader2 } from 'lucide-react';

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import { RoleService } from '../../services/role.service';
import { UserService } from '../../services/user.service';
import type { User } from '../../types/user.types';
import type { Role } from '../../types/role.types';

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
  const [selectedRoleIds, setSelectedRoleIds] = React.useState<Set<string>>(new Set());
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Reset state when dialog opens
  React.useEffect(() => {
    if (isOpen && user) {
      setSelectedRoleIds(new Set(user.roles ?? []));
    }
  }, [isOpen, user]);

  // Fetch available roles when dialog opens
  React.useEffect(() => {
    if (!isOpen || !accessToken) return;

    setLoading(true);
    RoleService.getRoles(
      { search: '', isSystem: null, isActive: true, page: 1, pageSize: 100 },
      accessToken
    )
      .then((res) => {
        setRoles((res.data ?? []).filter((r) => r.is_active));
      })
      .catch(() => {
        toast({
          variant: 'destructive',
          title: 'Failed to load roles',
          description: 'Could not fetch available roles.',
        });
      })
      .finally(() => setLoading(false));
  }, [isOpen, accessToken, toast]);

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!accessToken || !user || !organizationId) return;

    setSaving(true);
    try {
      // Map selected role names to role IDs
      const selectedIds = roles
        .filter((r) => selectedRoleIds.has(r.name))
        .map((r) => r.id);

      await UserService.updateUserRoles(user.id, organizationId, selectedIds, accessToken);
      toast({ title: 'Roles updated', description: `Roles for ${user.first_name} ${user.last_name} updated successfully.` });
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Roles
          </DialogTitle>
          <DialogDescription>
            Update roles assigned to <strong>{fullName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading roles...</span>
            </div>
          ) : roles.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No roles available</p>
          ) : (
            roles.map((role) => (
              <div key={role.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={selectedRoleIds.has(role.name)}
                  onCheckedChange={() => toggleRole(role.name)}
                />
                <Label htmlFor={`role-${role.id}`} className="flex-1 cursor-pointer text-sm font-normal">
                  <span className="font-medium">{role.name}</span>
                  {role.is_system && (
                    <span className="ml-2 text-xs text-muted-foreground">(System)</span>
                  )}
                </Label>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
