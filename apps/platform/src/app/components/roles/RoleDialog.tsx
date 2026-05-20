import { useState, useEffect, useMemo } from 'react';

import { ChevronDown } from 'lucide-react';

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
  Button, Input, Label, Textarea,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import { useAuth } from '../../hooks';
import type { Role, DialogMode, RoleFormData, Permission } from '../../types/role.types';

import { DangerousPermissionAlert } from './DangerousPermissionAlert';
import { useRoleActions, usePermissions } from './hooks';
import { ModulePermissionMatrix } from './ModulePermissionMatrix';
import { PermissionMatrix } from './PermissionMatrix';
import { roleSchema } from './utils/validation';

interface RoleDialogProps {
  mode: DialogMode;
  role?: Role | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/** Preloaded role templates shown in the "Start from template" dropdown */
const ROLE_TEMPLATES = [
  {
    code: 'administrator',
    name: 'Administrator',
    description: 'Full identity management + read-only on all business modules',
    permissionPatterns: ['user.', 'role.', 'org.', 'invitation.', 'customer.read', 'sales_order.read', 'invoice.read', 'supplier.read', 'purchase_order.read', 'item.read', 'warehouse.read', 'stock_entry.read', 'chart_of_account.read', 'payment.read'],
  },
  {
    code: 'sales_agent',
    name: 'Sales Agent',
    description: 'Full Sales & Orders + read-only Inventory',
    permissionPatterns: ['customer.', 'sales_order.', 'invoice.', 'item.read', 'warehouse.read'],
  },
  {
    code: 'procurement_officer',
    name: 'Procurement Officer',
    description: 'Full Procurement + read-only Inventory',
    permissionPatterns: ['supplier.', 'purchase_order.', 'item.read', 'warehouse.read'],
  },
  {
    code: 'accountant',
    name: 'Accountant',
    description: 'Full Accounting + read-only Sales invoices',
    permissionPatterns: ['chart_of_account.', 'payment.', 'invoice.read'],
  },
  {
    code: 'warehouse_staff',
    name: 'Warehouse Staff',
    description: 'Full Inventory module only',
    permissionPatterns: ['item.', 'warehouse.', 'stock_entry.', 'batch.', 'serial.'],
  },
  {
    code: 'viewer',
    name: 'Viewer',
    description: 'Read-only across all modules',
    permissionPatterns: ['.read'],
  },
];

export function RoleDialog({ mode, role, isOpen, onClose, onSuccess }: RoleDialogProps) {
  const { accessToken, user } = useAuth();
  const { toast } = useToast();
  const { createRole, updateRole, loading } = useRoleActions(accessToken, user?.organization_id, onSuccess);
  const { permissions, modules, loading: permissionsLoading } = usePermissions(accessToken);

  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fullAccessConfirmed, setFullAccessConfirmed] = useState(false);

  // Convert permissions object to flat array for PermissionMatrix fallback
  const allPermissions = useMemo(() => {
    const perms: Permission[] = [];
    Object.values(permissions).forEach(modulePerms => perms.push(...modulePerms));
    return perms;
  }, [permissions]);

  // All permission codes available (for template matching)
  const allPermissionCodes = useMemo(() => allPermissions.map(p => p.code), [allPermissions]);

  const selectedPermissionsSet = useMemo(() => new Set(formData.permissions), [formData.permissions]);

  // Initialize form data based on mode
  useEffect(() => {
    if (mode === 'create') {
      setFormData({ name: '', description: '', permissions: [] });
      return;
    }
    if (!role) return;
    setFormData({
      name: mode === 'clone' ? `Copy of ${role.name}` : role.name,
      description: role.description || '',
      permissions: role.permissions?.map(p => p.code) || [],
    });
  }, [mode, role]);

  /** Apply a preloaded template — always replaces name, description, and permissions */
  const applyTemplate = (template: typeof ROLE_TEMPLATES[0]) => {
    const matched = allPermissionCodes.filter(code =>
      template.permissionPatterns.some(pattern => code.includes(pattern))
    );
    setFormData({
      name: template.name,
      description: template.description,
      permissions: matched,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (formData.permissions.includes('*.*') && !fullAccessConfirmed) {
      setErrors({ permissions: 'Please confirm you understand the implications of granting full access' });
      return;
    }

    const result = roleSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      if (mode === 'create' || mode === 'clone') {
        await createRole(formData);
        toast({ title: 'Success', description: 'Role created successfully', variant: 'default' });
      } else if (mode === 'edit' && role) {
        await updateRole(role.id, formData);
        toast({ title: 'Success', description: 'Role updated successfully', variant: 'default' });
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
    setFormData(prev => {
      const perms = new Set(prev.permissions);
      perms.has(permissionCode) ? perms.delete(permissionCode) : perms.add(permissionCode);
      return { ...prev, permissions: Array.from(perms) };
    });
  };

  const handleBulkSelect = (permissionCodes: string[], selected: boolean) => {
    setFormData(prev => {
      const perms = new Set(prev.permissions);
      permissionCodes.forEach(code => selected ? perms.add(code) : perms.delete(code));
      return { ...prev, permissions: Array.from(perms) };
    });
  };

  const getDialogTitle = () => {
    if (mode === 'create') return 'Create Role';
    if (mode === 'edit') return 'Edit Role';
    if (mode === 'clone') return 'Clone Role';
    return 'Role';
  };

  // Use module-grouped matrix when modules are available, fall back to resource-grouped
  const hasModules = modules.length > 0;

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
            <Input
              id="name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter role name"
              disabled={loading}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter role description"
              rows={2}
              disabled={loading}
            />
          </div>

          {/* Start from template (create/clone mode only) */}
          {(mode === 'create' || mode === 'clone') && !permissionsLoading && allPermissionCodes.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Start from template:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" type="button" className="gap-1">
                    Choose template <ChevronDown className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-72">
                  {ROLE_TEMPLATES.map(template => (
                    <DropdownMenuItem
                      key={template.code}
                      onClick={() => applyTemplate(template)}
                      className="flex flex-col items-start gap-0.5 py-2"
                    >
                      <span className="font-medium text-sm">{template.name}</span>
                      <span className="text-xs text-muted-foreground">{template.description}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Dangerous Permission Alert */}
          {selectedPermissionsSet.size > 0 && (
            <DangerousPermissionAlert
              selectedPermissions={selectedPermissionsSet}
              onConfirm={setFullAccessConfirmed}
            />
          )}

          {/* Permissions Section */}
          <div className="space-y-2">
            <Label>
              Permissions{' '}
              <span className="text-xs text-muted-foreground">
                ({formData.permissions.length} selected)
              </span>
            </Label>

            {permissionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3058EE] mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading permissions...</p>
                </div>
              </div>
            ) : hasModules ? (
              <ModulePermissionMatrix
                modules={modules}
                selectedPermissions={selectedPermissionsSet}
                onPermissionToggle={handlePermissionToggle}
                onBulkSelect={handleBulkSelect}
              />
            ) : (
              /* Fallback to legacy resource-grouped matrix */
              <PermissionMatrix
                permissions={permissions}
                selectedPermissions={selectedPermissionsSet}
                onPermissionToggle={handlePermissionToggle}
                onBulkSelect={handleBulkSelect}
                allPermissions={allPermissions}
              />
            )}

            {errors.permissions && (
              <p className="text-sm text-destructive">{errors.permissions}</p>
            )}
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
