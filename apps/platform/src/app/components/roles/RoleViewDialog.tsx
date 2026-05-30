import { useMemo } from 'react';

import { Shield } from 'lucide-react';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components';

import type { ModuleGroup, Role } from '../../types/role.types';
import { ModulePermissionMatrix } from './ModulePermissionMatrix';

interface RoleViewDialogProps {
  role: Role | null;
  modules: ModuleGroup[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Read-only dialog that shows a role's name, description, type, and
 * all permissions it grants — displayed using the module-grouped matrix.
 */
export function RoleViewDialog({ role, modules, isOpen, onClose }: RoleViewDialogProps) {
  if (!role) return null;

  // Build the set of permission codes this role has
  const rolePermissionCodes = useMemo(
    () => new Set(role.permissions?.map(p => p.code) ?? []),
    [role.permissions]
  );

  // Filter modules to only show resources/permissions this role actually grants
  const filteredModules = useMemo((): ModuleGroup[] => {
    return modules
      .map(mod => ({
        ...mod,
        resources: mod.resources
          .map(res => ({
            ...res,
            permissions: res.permissions.filter(p => rolePermissionCodes.has(p.code)),
          }))
          .filter(res => res.permissions.length > 0),
      }))
      .filter(mod => mod.resources.length > 0);
  }, [modules, rolePermissionCodes]);

  // Permissions not covered by the module registry (wildcards, identity perms, etc.)
  const uncoveredPermissions = useMemo(() => {
    const coveredCodes = new Set(
      filteredModules.flatMap(m => m.resources.flatMap(r => r.permissions.map(p => p.code)))
    );
    return (role.permissions ?? []).filter(p => !coveredCodes.has(p.code));
  }, [filteredModules, role.permissions]);

  const totalPermissions = role.permissions?.length ?? 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl flex flex-col max-h-[90vh] p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 shrink-0">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="text-xl">{role.name}</DialogTitle>
                <Badge variant={role.is_system ? 'secondary' : 'outline'} className="text-xs">
                  {role.is_system ? 'System' : 'Custom'}
                </Badge>
                <Badge variant={role.is_active ? 'default' : 'outline'} className="text-xs">
                  {role.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {role.description && (
                <DialogDescription className="mt-1">{role.description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Permissions granted{' '}
              <span className="text-muted-foreground font-normal">
                ({totalPermissions} total)
              </span>
            </p>
          </div>

          {totalPermissions === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">This role has no permissions assigned.</p>
            </div>
          ) : filteredModules.length > 0 ? (
            <ModulePermissionMatrix
              modules={filteredModules}
              selectedPermissions={rolePermissionCodes}
              onPermissionToggle={() => { /* read-only */ }}
              onBulkSelect={() => { /* read-only */ }}
              readOnly
            />
          ) : null}

          {/* Show any permissions not covered by the module registry */}
          {uncoveredPermissions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Other permissions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {uncoveredPermissions.map(perm => (
                  <Badge key={perm.id} variant="secondary" className="text-xs font-mono">
                    {perm.code}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 flex justify-end">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
