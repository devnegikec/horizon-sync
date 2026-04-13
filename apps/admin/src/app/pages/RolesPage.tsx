import { useState, useEffect, useCallback, useMemo } from 'react';

import { Shield, Plus, Edit, Copy, Trash2, Lock, ChevronDown, ChevronRight, Search, X } from 'lucide-react';

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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';
import { toast } from '@horizon-sync/ui';

import { AdminRoleService } from '../services/admin-role.service';
import type {
  Role,
  RolePermission,
  RoleFormData,
  GroupedPermissions,
} from '../services/admin-role.service';

/* ------------------------------------------------------------------ */
/*  Permission Search Bar (matches platform PermissionSearch)         */
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
            <SelectValue placeholder="All Modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
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
/*  Permission Matrix (matches platform PermissionMatrix exactly)     */
/*  Uses permission.code for selection — same as platform             */
/* ------------------------------------------------------------------ */

const MODULE_ORDER = ['System Admin', 'Sales & Orders', 'Procurement', 'Inventory', 'Accounting', 'identity', 'core'];

interface PermissionMatrixProps {
  permissions: GroupedPermissions;
  selectedPermissions: Set<string>;
  onPermissionToggle: (permissionCode: string) => void;
  onBulkSelect: (permissionCodes: string[], selected: boolean) => void;
  allPermissions: RolePermission[];
}

function PermissionMatrix({
  permissions,
  selectedPermissions,
  onPermissionToggle,
  onBulkSelect,
  allPermissions,
}: PermissionMatrixProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());

  const sortedModules = useMemo(() => {
    const moduleNames = Object.keys(permissions);
    return moduleNames.sort((a, b) => {
      const aIndex = MODULE_ORDER.indexOf(a);
      const bIndex = MODULE_ORDER.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
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
      const selectedCount = modulePerms.filter((p) => selectedPermissions.has(p.code)).length;
      if (selectedCount === 0) return 'none';
      if (selectedCount === modulePerms.length) return 'all';
      return 'some';
    },
    [selectedPermissions],
  );

  const handleModuleSelectAll = useCallback(
    (module: string, perms: RolePermission[]) => {
      const state = getModuleSelectionState(perms);
      const permCodes = perms.map((p) => p.code);
      onBulkSelect(permCodes, state !== 'all');
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

  const isWildcard = (code: string) => code.includes('*');

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
                {/* Module Header */}
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
                      onCheckedChange={() => handleModuleSelectAll(mod, modPerms)}
                      className={cn(selectionState === 'some' && 'data-[state=checked]:bg-primary/50')}
                      aria-label={`Select all permissions in ${mod}`}
                    />
                    <Label htmlFor={`module-${mod}`} className="font-semibold cursor-pointer flex-1">
                      {mod}
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {modPerms.filter((p) => selectedPermissions.has(p.code)).length} / {modPerms.length}
                    </Badge>
                  </div>
                </div>

                {/* Module Permissions */}
                {!isCollapsed && (
                  <div className="p-4 space-y-3">
                    {modPerms.map((perm) => (
                      <div key={perm.id} className="flex items-start gap-3 group">
                        <Checkbox
                          id={`permission-${perm.id}`}
                          checked={selectedPermissions.has(perm.code)}
                          onCheckedChange={() => onPermissionToggle(perm.code)}
                          className="mt-0.5"
                          aria-label={`${perm.name} - ${perm.code}`}
                        />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={`permission-${perm.id}`} className="font-medium cursor-pointer block">
                            {perm.name}
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                              {perm.code}
                            </code>
                            {isWildcard(perm.code) && (
                              <Badge variant="outline" className="text-xs">
                                Wildcard
                              </Badge>
                            )}
                          </div>
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
/*  Role Form Dialog (matches platform RoleDialog)                    */
/*  Uses permission codes for selection, converts to IDs on submit    */
/* ------------------------------------------------------------------ */

interface RoleFormDialogProps {
  mode: 'create' | 'edit' | 'clone' | null;
  role?: Role | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  groupedPermissions: GroupedPermissions;
  permissionsLoading: boolean;
}

function RoleFormDialog({
  mode,
  role,
  isOpen,
  onClose,
  onSuccess,
  groupedPermissions,
  permissionsLoading,
}: RoleFormDialogProps) {
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
  });
  const [submitting, setSubmitting] = useState(false);

  // Flatten all permissions for the matrix
  const allPermissions = useMemo(() => {
    const perms: RolePermission[] = [];
    Object.values(groupedPermissions).forEach((catPerms) => perms.push(...catPerms));
    return perms;
  }, [groupedPermissions]);

  // Convert form permissions array to Set for easier lookup
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
      permissions: role.permissions?.map((p) => p.code) || [],
    });
  }, [mode, role]);

  const handlePermissionToggle = useCallback((permissionCode: string) => {
    setFormData((prev) => {
      const perms = new Set(prev.permissions);
      if (perms.has(permissionCode)) perms.delete(permissionCode);
      else perms.add(permissionCode);
      return { ...prev, permissions: Array.from(perms) };
    });
  }, []);

  const handleBulkSelect = useCallback((permissionCodes: string[], selected: boolean) => {
    setFormData((prev) => {
      const perms = new Set(prev.permissions);
      permissionCodes.forEach((code) => {
        if (selected) perms.add(code);
        else perms.delete(code);
      });
      return { ...prev, permissions: Array.from(perms) };
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: 'Validation', description: 'Role name is required.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'edit' && role) {
        await AdminRoleService.updateRole(role.id, formData);
        toast({ title: 'Role updated', description: `"${formData.name}" has been updated.` });
      } else {
        await AdminRoleService.createRole(formData);
        toast({ title: 'Role created', description: `"${formData.name}" has been created.` });
      }
      onSuccess();
    } catch {
      toast({ title: 'Error', description: 'Failed to save role.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
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
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="role-name">
              Role Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="role-name"
              placeholder="Enter role name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={submitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="role-description">Description</Label>
            <Textarea
              id="role-description"
              placeholder="Enter role description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              disabled={submitting}
            />
          </div>

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
            ) : allPermissions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No permissions available.</p>
            ) : (
              <PermissionMatrix
                permissions={groupedPermissions}
                selectedPermissions={selectedPermissionsSet}
                onPermissionToggle={handlePermissionToggle}
                onBulkSelect={handleBulkSelect}
                allPermissions={allPermissions}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : mode === 'edit' ? 'Update Role' : 'Create Role'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat Card (matches platform StatCard)                             */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', iconBg)}>
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Roles Page (matches platform RoleManagement layout)               */
/* ------------------------------------------------------------------ */

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<GroupedPermissions>({});
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'clone' | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Delete state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [searchFilter, setSearchFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const stats = useMemo(() => {
    const total = roles.length;
    const systemRoles = roles.filter((r) => r.is_system).length;
    const customRoles = roles.filter((r) => !r.is_system).length;
    const activeRoles = roles.filter((r) => r.is_active).length;
    return { total, systemRoles, customRoles, activeRoles };
  }, [roles]);

  const filteredRoles = useMemo(() => {
    return roles.filter((role) => {
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        if (!role.name.toLowerCase().includes(q) && !(role.description || '').toLowerCase().includes(q)) {
          return false;
        }
      }
      if (typeFilter === 'system' && !role.is_system) return false;
      if (typeFilter === 'custom' && role.is_system) return false;
      return true;
    });
  }, [roles, searchFilter, typeFilter]);

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
    setSelectedRole(null);
    setDialogMode('create');
    setDialogOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleClone = (role: Role) => {
    setSelectedRole(role);
    setDialogMode('clone');
    setDialogOpen(true);
  };

  const handleDeleteClick = (role: Role) => {
    setRoleToDelete(role);
    setDeleteConfirmOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogMode(null);
    setSelectedRole(null);
  };

  const handleDialogSuccess = () => {
    loadData();
    handleDialogClose();
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
            Manage roles and permissions across all organizations
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

      {/* Stats Cards (matches platform layout) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Roles" value={stats.total}
          icon={Shield} iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-600 dark:text-slate-400" />
        <StatCard title="System Roles" value={stats.systemRoles}
          icon={Shield} iconBg="bg-[#3058EE]/10" iconColor="text-[#3058EE]" />
        <StatCard title="Custom Roles" value={stats.customRoles}
          icon={Shield} iconBg="bg-emerald-100 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Active Roles" value={stats.activeRoles}
          icon={Shield} iconBg="bg-amber-100 dark:bg-amber-900/20" iconColor="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Filters (matches platform) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search roles..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="system">System Roles</SelectItem>
            <SelectItem value="custom">Custom Roles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Roles Table */}
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3058EE] mx-auto mb-2" />
                        <p>Loading roles…</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {searchFilter || typeFilter !== 'all' ? 'No roles match your filters' : 'No roles found. Create one to get started.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
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
                                <p>System role</p>
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
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleClone(role)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(role)}
                          disabled={role.is_system}
                          className="text-destructive hover:text-destructive"
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

      {/* Create / Edit / Clone Dialog */}
      {dialogOpen && dialogMode && (
        <RoleFormDialog
          mode={dialogMode}
          role={selectedRole}
          isOpen={dialogOpen}
          onClose={handleDialogClose}
          onSuccess={handleDialogSuccess}
          groupedPermissions={groupedPermissions}
          permissionsLoading={permissionsLoading}
        />
      )}

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
