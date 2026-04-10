import { useState, useEffect, useCallback, useMemo } from 'react';

import { Shield, Plus, Edit, Trash2, Key, ChevronDown, ChevronRight, Search, X } from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Label,
  Textarea,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  ConfirmationDialog,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import { toast } from '@horizon-sync/ui';

import { AdminRoleService } from '../services/admin-role.service';
import type {
  SystemAdminRole,
  RolePermission,
  CreateRolePayload,
  UpdateRolePayload,
  GroupedPermissions,
} from '../services/admin-role.service';

/* ------------------------------------------------------------------ */
/*  Permission Search Bar                                             */
/* ------------------------------------------------------------------ */

interface PermissionSearchProps {
  onSearchChange: (query: string) => void;
  onModuleFilter: (module: string | null) => void;
  modules: string[];
  resultCount?: number;
}

function PermissionSearch({ onSearchChange, onModuleFilter, modules, resultCount }: PermissionSearchProps) {
  const [searchValue, setSearchValue] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue, onSearchChange]);

  const handleClear = useCallback(() => {
    setSearchValue('');
    setSelectedModule('all');
    onSearchChange('');
    onModuleFilter(null);
  }, [onSearchChange, onModuleFilter]);

  const handleModuleChange = useCallback(
    (value: string) => {
      setSelectedModule(value);
      onModuleFilter(value === 'all' ? null : value);
    },
    [onModuleFilter],
  );

  const hasActiveFilters = searchValue !== '' || selectedModule !== 'all';

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search permissions by name or code..."
            className="pl-9 pr-9"
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchValue('')}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Select value={selectedModule} onValueChange={handleModuleChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {modules.map((mod) => (
              <SelectItem key={mod} value={mod}>
                {mod}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleClear} className="gap-2">
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
      {resultCount !== undefined && (
        <p className="text-sm text-muted-foreground">
          {resultCount === 0 ? 'No permissions found' : `${resultCount} permission${resultCount === 1 ? '' : 's'} found`}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Permission Matrix (grouped checkboxes with category select-all)   */
/* ------------------------------------------------------------------ */

interface PermissionMatrixProps {
  permissions: GroupedPermissions;
  selectedPermissionIds: Set<string>;
  onPermissionToggle: (id: string) => void;
  onBulkSelect: (ids: string[], selected: boolean) => void;
}

function PermissionMatrix({
  permissions,
  selectedPermissionIds,
  onPermissionToggle,
  onBulkSelect,
}: PermissionMatrixProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());

  const sortedModules = useMemo(() => {
    return Object.keys(permissions).sort((a, b) => {
      // Put "System Admin" first, then alphabetical
      if (a.toLowerCase().includes('system admin')) return -1;
      if (b.toLowerCase().includes('system admin')) return 1;
      return a.localeCompare(b);
    });
  }, [permissions]);

  const filteredPermissions = useMemo(() => {
    const filtered: GroupedPermissions = {};
    sortedModules.forEach((mod) => {
      if (moduleFilter && mod !== moduleFilter) return;
      const modPerms = permissions[mod] || [];
      const matching = modPerms.filter((perm) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          perm.name.toLowerCase().includes(q) ||
          perm.code.toLowerCase().includes(q) ||
          (perm.description || '').toLowerCase().includes(q)
        );
      });
      if (matching.length > 0) filtered[mod] = matching;
    });
    return filtered;
  }, [permissions, sortedModules, searchQuery, moduleFilter]);

  const totalFilteredCount = useMemo(
    () => Object.values(filteredPermissions).reduce((sum, perms) => sum + perms.length, 0),
    [filteredPermissions],
  );

  const getModuleSelectionState = useCallback(
    (modulePerms: RolePermission[]) => {
      const selectedCount = modulePerms.filter((p) => selectedPermissionIds.has(p.id)).length;
      if (selectedCount === 0) return 'none';
      if (selectedCount === modulePerms.length) return 'all';
      return 'some';
    },
    [selectedPermissionIds],
  );

  const handleModuleSelectAll = useCallback(
    (modulePerms: RolePermission[]) => {
      const state = getModuleSelectionState(modulePerms);
      const ids = modulePerms.map((p) => p.id);
      onBulkSelect(ids, state !== 'all');
    },
    [getModuleSelectionState, onBulkSelect],
  );

  const toggleModuleCollapse = useCallback((mod: string) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev);
      if (next.has(mod)) next.delete(mod);
      else next.add(mod);
      return next;
    });
  }, []);

  return (
    <div className="space-y-4">
      <PermissionSearch
        onSearchChange={setSearchQuery}
        onModuleFilter={setModuleFilter}
        modules={sortedModules}
        resultCount={totalFilteredCount}
      />

      {totalFilteredCount === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No permissions match your search criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(filteredPermissions).map(([mod, modPerms]) => {
            const selectionState = getModuleSelectionState(modPerms);
            const isCollapsed = collapsedModules.has(mod);
            const shouldBeCollapsible = modPerms.length > 10;

            return (
              <div key={mod} className="border rounded-lg overflow-hidden">
                {/* Category Header */}
                <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {shouldBeCollapsible && (
                      <Button variant="ghost" size="sm" onClick={() => toggleModuleCollapse(mod)} className="h-6 w-6 p-0">
                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    )}
                    <Checkbox
                      id={`module-${mod}`}
                      checked={selectionState === 'all'}
                      onCheckedChange={() => handleModuleSelectAll(modPerms)}
                      className={cn(selectionState === 'some' && 'data-[state=checked]:bg-primary/50')}
                      aria-label={`Select all permissions in ${mod}`}
                    />
                    <Label htmlFor={`module-${mod}`} className="font-semibold cursor-pointer flex-1">
                      {mod}
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {modPerms.filter((p) => selectedPermissionIds.has(p.id)).length} / {modPerms.length}
                    </Badge>
                  </div>
                </div>

                {/* Category Permissions */}
                {!isCollapsed && (
                  <div className="p-4 space-y-3">
                    {modPerms.map((perm) => (
                      <div key={perm.id} className="flex items-start gap-3 group">
                        <Checkbox
                          id={`permission-${perm.id}`}
                          checked={selectedPermissionIds.has(perm.id)}
                          onCheckedChange={() => onPermissionToggle(perm.id)}
                          className="mt-0.5"
                          aria-label={`${perm.name} - ${perm.code}`}
                        />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={`permission-${perm.id}`} className="font-medium cursor-pointer block">
                            {perm.name}
                          </Label>
                          <code className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded mt-1 inline-block">
                            {perm.code}
                          </code>
                          {perm.description && (
                            <p className="text-sm text-muted-foreground mt-1">{perm.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Role Form Modal (grouped permissions, matching platform pattern)  */
/* ------------------------------------------------------------------ */

interface RoleFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupedPermissions: GroupedPermissions;
  permissionsLoading: boolean;
  role?: SystemAdminRole | null;
  onSubmit: (data: CreateRolePayload | UpdateRolePayload) => Promise<void>;
}

function RoleFormModal({
  open,
  onOpenChange,
  groupedPermissions,
  permissionsLoading,
  role,
  onSubmit,
}: RoleFormModalProps) {
  const isEdit = !!role;
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Flatten all permissions for counting
  const allPermissions = useMemo(() => {
    const perms: RolePermission[] = [];
    Object.values(groupedPermissions).forEach((catPerms) => perms.push(...catPerms));
    return perms;
  }, [groupedPermissions]);

  useEffect(() => {
    if (open) {
      if (role) {
        setName(role.name);
        setCode(role.code);
        setDescription(role.description || '');
        setSelectedPermissionIds(new Set(role.permissions.map((p) => p.id)));
      } else {
        setName('');
        setCode('');
        setDescription('');
        setSelectedPermissionIds(new Set());
      }
    }
  }, [open, role]);

  const handlePermissionToggle = useCallback((id: string) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkSelect = useCallback((ids: string[], selected: boolean) => {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (selected) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  }, []);

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim()) {
      toast({ title: 'Validation', description: 'Name and code are required.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || undefined,
        permission_ids: Array.from(selectedPermissionIds),
      };
      await onSubmit(payload);
      onOpenChange(false);
    } catch {
      // error handled by caller
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modify the role name, code, description, and permissions.'
              : 'Define a new system admin role with specific permissions.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="role-name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="role-name"
              placeholder="e.g. System Billing Manager"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="role-code">
              Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="role-code"
              placeholder="e.g. system_billing_manager"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              placeholder="Optional description of this role"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Grouped Permissions Panel */}
          <div className="space-y-2">
            <Label>
              Permissions{' '}
              <span className="text-xs text-muted-foreground">
                ({selectedPermissionIds.size} selected)
              </span>
            </Label>
            {permissionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3058EE] mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading permissions...</p>
                </div>
              </div>
            ) : allPermissions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No permissions available.</p>
            ) : (
              <PermissionMatrix
                permissions={groupedPermissions}
                selectedPermissionIds={selectedPermissionIds}
                onPermissionToggle={handlePermissionToggle}
                onBulkSelect={handleBulkSelect}
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Roles Page                                                        */
/* ------------------------------------------------------------------ */

export function RolesPage() {
  const [roles, setRoles] = useState<SystemAdminRole[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<SystemAdminRole | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<SystemAdminRole | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPermissions = useMemo(
    () => Object.values(groupedPermissions).reduce((sum, perms) => sum + perms.length, 0),
    [groupedPermissions],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setPermissionsLoading(true);
    try {
      const [rolesData, grouped] = await Promise.all([
        AdminRoleService.listRoles(),
        AdminRoleService.listGroupedPermissions(),
      ]);
      setRoles(rolesData);
      setGroupedPermissions(grouped);
    } catch {
      toast({ title: 'Error', description: 'Failed to load roles data.', variant: 'destructive' });
    } finally {
      setLoading(false);
      setPermissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreate = () => {
    setEditingRole(null);
    setFormOpen(true);
  };

  const handleEdit = (role: SystemAdminRole) => {
    setEditingRole(role);
    setFormOpen(true);
  };

  const handleDeleteClick = (role: SystemAdminRole) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = async (data: CreateRolePayload | UpdateRolePayload) => {
    try {
      if (editingRole) {
        await AdminRoleService.updateRole(editingRole.id, data as UpdateRolePayload);
        toast({ title: 'Role updated', description: `"${(data as UpdateRolePayload).name || editingRole.name}" has been updated.` });
      } else {
        await AdminRoleService.createRole(data as CreateRolePayload);
        toast({ title: 'Role created', description: `"${(data as CreateRolePayload).name}" has been created.` });
      }
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save role.', variant: 'destructive' });
      throw error;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!roleToDelete) return;
    setDeleting(true);
    try {
      await AdminRoleService.deleteRole(roleToDelete.id);
      toast({ title: 'Role deleted', description: `"${roleToDelete.name}" has been deleted.` });
      setDeleteConfirmOpen(false);
      setRoleToDelete(null);
      loadData();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete role.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage system admin roles and their permissions
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="gap-2 bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25"
        >
          <Plus className="h-4 w-4" />
          Create Role
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Roles</p>
                <p className="text-3xl font-bold tracking-tight">{roles.length}</p>
              </div>
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/20')}>
                <Shield className="h-6 w-6 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Available Permissions</p>
                <p className="text-3xl font-bold tracking-tight">{totalPermissions}</p>
              </div>
              <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/20')}>
                <Key className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Roles Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>System Admin Roles</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading roles…
                  </TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No roles found. Create one to get started.
                  </TableCell>
                </TableRow>
              ) : (
                roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{role.code}</code>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {role.description || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((perm) => (
                          <Badge key={perm.id} variant="secondary" className="text-xs">
                            {perm.code.replace('system_admin.', '')}
                          </Badge>
                        ))}
                        {role.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(role)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <RoleFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingRole(null);
        }}
        groupedPermissions={groupedPermissions}
        permissionsLoading={permissionsLoading}
        role={editingRole}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => {
          setDeleteConfirmOpen(open);
          if (!open) setRoleToDelete(null);
        }}
        title="Delete Role"
        description={`Are you sure you want to delete "${roleToDelete?.name}"? This will remove the role and all its permission links. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
