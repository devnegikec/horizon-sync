import { useState, useMemo, useCallback } from 'react';

import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';

import { Checkbox, Label, Button, Badge } from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import type { GroupedPermissions, Permission } from '../../types/role.types';

import { PermissionSearch } from './PermissionSearch';
import { isWildcardPermission, suggestWildcardCompression } from './utils/wildcard';

interface PermissionMatrixProps {
  permissions: GroupedPermissions;
  selectedPermissions: Set<string>;
  onPermissionToggle: (permissionCode: string) => void;
  onBulkSelect: (permissionCodes: string[], selected: boolean) => void;
  allPermissions: Permission[];
}

// Define consistent module ordering
const MODULE_ORDER = [
  'Users & Access',
  'Inventory',
  'Selling',
  'Buying',
  'Accounting',
  'Reports',
  'Analytics',
  'Settings',
];

export function PermissionMatrix({
  permissions,
  selectedPermissions,
  onPermissionToggle,
  onBulkSelect,
  allPermissions,
}: PermissionMatrixProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());

  // Get sorted module names
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

  // Filter permissions based on search and module filter
  const filteredPermissions = useMemo(() => {
    const filtered: GroupedPermissions = {};

    sortedModules.forEach((module) => {
      // Skip if module filter is active and doesn't match
      if (moduleFilter && module !== moduleFilter) return;

      const modulePerms = permissions[module] || [];
      const matchingPerms = modulePerms.filter((perm) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          perm.name.toLowerCase().includes(query) ||
          perm.code.toLowerCase().includes(query) ||
          perm.resource.toLowerCase().includes(query) ||
          perm.action.toLowerCase().includes(query)
        );
      });

      if (matchingPerms.length > 0) {
        filtered[module] = matchingPerms;
      }
    });

    return filtered;
  }, [permissions, sortedModules, searchQuery, moduleFilter]);

  // Count total filtered permissions
  const totalFilteredCount = useMemo(() => {
    return Object.values(filteredPermissions).reduce((sum, perms) => sum + perms.length, 0);
  }, [filteredPermissions]);

  // Check if all permissions in a module are selected
  const getModuleSelectionState = useCallback(
    (modulePerms: Permission[]) => {
      const selectedCount = modulePerms.filter((p) => selectedPermissions.has(p.code)).length;
      if (selectedCount === 0) return 'none';
      if (selectedCount === modulePerms.length) return 'all';
      return 'some';
    },
    [selectedPermissions]
  );

  // Handle module select all
  const handleModuleSelectAll = useCallback(
    (module: string, perms: Permission[]) => {
      const state = getModuleSelectionState(perms);
      const permCodes = perms.map((p) => p.code);
      onBulkSelect(permCodes, state !== 'all');
    },
    [getModuleSelectionState, onBulkSelect]
  );

  // Check if wildcard compression is suggested
  const wildcardSuggestion = useMemo(() => {
    if (selectedPermissions.size === 0) return null;
    const compressed = suggestWildcardCompression(selectedPermissions, allPermissions);
    const hasWildcards = compressed.some((p) => isWildcardPermission(p));
    if (hasWildcards && compressed.length < selectedPermissions.size) {
      return compressed;
    }
    return null;
  }, [selectedPermissions, allPermissions]);

  const toggleModuleCollapse = useCallback((module: string) => {
    setCollapsedModules((prev) => {
      const next = new Set(prev);
      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <PermissionSearch onSearchChange={setSearchQuery} onModuleFilter={setModuleFilter} modules={sortedModules} resultCount={totalFilteredCount} />

      {/* Wildcard Suggestion */}
      {wildcardSuggestion && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Wildcard Suggestion
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You&apos;ve selected all permissions in one or more modules. Consider using wildcard permissions:
              </p>
              <div className="flex flex-wrap gap-2">
                {wildcardSuggestion.filter(isWildcardPermission).map((perm) => (
                  <code key={perm} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 rounded text-sm font-mono border border-blue-300 dark:border-blue-700">
                    {perm}
                  </code>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Permission Groups */}
      {totalFilteredCount === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No permissions match your search criteria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(filteredPermissions).map(([module, modulePerms]) => {
            const selectionState = getModuleSelectionState(modulePerms);
            const isCollapsed = collapsedModules.has(module);
            const shouldBeCollapsible = modulePerms.length > 10;

            return (
              <div key={module} className="border rounded-lg overflow-hidden">
                {/* Module Header */}
                <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    {shouldBeCollapsible && (
                      <Button variant="ghost" size="sm" onClick={() => toggleModuleCollapse(module)} className="h-6 w-6 p-0">
                        {isCollapsed ? (
                          <ChevronRight className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Checkbox id={`module-${module}`} checked={selectionState === 'all'} onCheckedChange={() => handleModuleSelectAll(module, modulePerms)} className={cn(selectionState === 'some' && 'data-[state=checked]:bg-primary/50')} aria-label={`Select all permissions in ${module}`} />
                    <Label htmlFor={`module-${module}`} className="font-semibold cursor-pointer flex-1">
                      {module}
                    </Label>
                    <Badge variant="secondary" className="text-xs">
                      {modulePerms.filter((p) => selectedPermissions.has(p.code)).length} / {modulePerms.length}
                    </Badge>
                  </div>
                </div>

                {/* Module Permissions */}
                {!isCollapsed && (
                  <div className="p-4 space-y-3">
                    {modulePerms.map((permission) => (
                      <div key={permission.id} className="flex items-start gap-3 group">
                        <Checkbox id={`permission-${permission.id}`} checked={selectedPermissions.has(permission.code)} onCheckedChange={() => onPermissionToggle(permission.code)} className="mt-0.5" aria-label={`${permission.name} - ${permission.code}`} />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={`permission-${permission.id}`} className="font-medium cursor-pointer block">
                            {permission.name}
                          </Label>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
                              {permission.code}
                            </code>
                            {isWildcardPermission(permission.code) && (
                              <Badge variant="outline" className="text-xs">
                                Wildcard
                              </Badge>
                            )}
                          </div>
                          {permission.description && (
                            <p className="text-sm text-muted-foreground mt-1">{permission.description}</p>
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
