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

/** Turn "stock_entry" into "Stock Entry", "chart_of_account" into "Chart Of Account", etc. */
function formatResourceLabel(resource: string): string {
  return resource
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/** Consistent action ordering inside each resource group. */
const ACTION_ORDER = ['read', 'create', 'update', 'delete', 'manage', 'execute'];

function actionSortKey(action: string): number {
  const idx = ACTION_ORDER.indexOf(action);
  return idx === -1 ? ACTION_ORDER.length : idx;
}

/** Badge color per action for quick visual scanning. */
function actionBadgeVariant(action: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (action) {
    case 'read':
      return 'secondary';
    case 'create':
      return 'default';
    case 'delete':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function PermissionMatrix({
  permissions,
  selectedPermissions,
  onPermissionToggle,
  onBulkSelect,
  allPermissions,
}: PermissionMatrixProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [collapsedResources, setCollapsedResources] = useState<Set<string>>(new Set());

  // Get unique module names for the filter dropdown (derived from permission.module field)
  const moduleNames = useMemo(() => {
    const modules = new Set<string>();
    allPermissions.forEach((p) => {
      if (p.module) modules.add(p.module);
    });
    return Array.from(modules).sort();
  }, [allPermissions]);

  // Sort resource keys alphabetically
  const sortedResources = useMemo(() => {
    return Object.keys(permissions).sort((a, b) => a.localeCompare(b));
  }, [permissions]);

  // Filter permissions based on search query and module filter
  const filteredPermissions = useMemo(() => {
    const filtered: GroupedPermissions = {};

    sortedResources.forEach((resource) => {
      const resourcePerms = permissions[resource] || [];

      const matchingPerms = resourcePerms.filter((perm) => {
        // Module filter
        if (moduleFilter && perm.module !== moduleFilter) return false;

        // Search filter
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
          perm.name.toLowerCase().includes(q) ||
          perm.code.toLowerCase().includes(q) ||
          perm.resource.toLowerCase().includes(q) ||
          perm.action.toLowerCase().includes(q)
        );
      });

      if (matchingPerms.length > 0) {
        filtered[resource] = matchingPerms.sort((a, b) => actionSortKey(a.action) - actionSortKey(b.action));
      }
    });
    return filtered;
  }, [permissions, sortedResources, searchQuery, moduleFilter]);

  // Total count for the search result indicator
  const totalFilteredCount = useMemo(() => {
    return Object.values(filteredPermissions).reduce((sum, perms) => sum + perms.length, 0);
  }, [filteredPermissions]);

  // Selection state for a resource group: 'none' | 'some' | 'all'
  const getGroupSelectionState = useCallback(
    (resourcePerms: Permission[]) => {
      const selectedCount = resourcePerms.filter((p) => selectedPermissions.has(p.code)).length;
      if (selectedCount === 0) return 'none';
      if (selectedCount === resourcePerms.length) return 'all';
      return 'some';
    },
    [selectedPermissions],
  );

  // Toggle all permissions in a resource group
  const handleGroupToggle = useCallback(
    (resource: string, perms: Permission[]) => {
      const state = getGroupSelectionState(perms);
      const codes = perms.map((p) => p.code);
      onBulkSelect(codes, state !== 'all');
    },
    [getGroupSelectionState, onBulkSelect],
  );

  // Collapse / expand a resource group
  const toggleCollapse = useCallback((resource: string) => {
    setCollapsedResources((prev) => {
      const next = new Set(prev);
      if (next.has(resource)) {
        next.delete(resource);
      } else {
        next.add(resource);
      }
      return next;
    });
  }, []);

  // Expand all / collapse all
  const allResources = Object.keys(filteredPermissions);
  const allCollapsed = allResources.length > 0 && allResources.every((r) => collapsedResources.has(r));

  const handleToggleAll = useCallback(() => {
    if (allCollapsed) {
      setCollapsedResources(new Set());
    } else {
      setCollapsedResources(new Set(allResources));
    }
  }, [allCollapsed, allResources]);

  // Wildcard compression suggestion
  const wildcardSuggestion = useMemo(() => {
    if (selectedPermissions.size === 0) return null;
    const compressed = suggestWildcardCompression(selectedPermissions, allPermissions);
    const hasWildcards = compressed.some((p) => isWildcardPermission(p));
    if (hasWildcards && compressed.length < selectedPermissions.size) return compressed;
    return null;
  }, [selectedPermissions, allPermissions]);

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <PermissionSearch
        onSearchChange={setSearchQuery}
        onModuleFilter={setModuleFilter}
        modules={moduleNames}
        resultCount={totalFilteredCount}
      />

      {/* Wildcard Suggestion */}
      {wildcardSuggestion && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Wildcard Suggestion</p>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                You&apos;ve selected all permissions for one or more resources. Consider using wildcard permissions:
              </p>
              <div className="flex flex-wrap gap-2">
                {wildcardSuggestion.filter(isWildcardPermission).map((perm) => (
                  <code
                    key={perm}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 rounded text-sm font-mono border border-blue-300 dark:border-blue-700"
                  >
                    {perm}
                  </code>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expand / Collapse All toggle */}
      {allResources.length > 3 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleToggleAll} className="text-xs text-muted-foreground">
            {allCollapsed ? 'Expand All' : 'Collapse All'}
          </Button>
        </div>
      )}

      {/* Resource Groups */}
      {totalFilteredCount === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No permissions match your search criteria</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(filteredPermissions).map(([resource, resourcePerms]) => {
            const selectionState = getGroupSelectionState(resourcePerms);
            const isCollapsed = collapsedResources.has(resource);
            const selectedCount = resourcePerms.filter((p) => selectedPermissions.has(p.code)).length;

            return (
              <div key={resource} className="border rounded-lg overflow-hidden">
                {/* Resource Header — always visible, acts as the collapsible trigger */}
                <button
                  type="button"
                  onClick={() => toggleCollapse(resource)}
                  className="w-full bg-muted/50 px-4 py-3 flex items-center gap-3 hover:bg-muted/70 transition-colors text-left"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}

                  {/* Group checkbox — stop propagation so clicking it doesn't toggle collapse */}
                  <span
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => { if (e.key === ' ') e.stopPropagation(); }}
                    role="presentation"
                  >
                    <Checkbox
                      id={`resource-${resource}`}
                      checked={selectionState === 'all'}
                      onCheckedChange={() => handleGroupToggle(resource, resourcePerms)}
                      className={cn(selectionState === 'some' && 'data-[state=checked]:bg-primary/50')}
                      aria-label={`Select all ${formatResourceLabel(resource)} permissions`}
                    />
                  </span>

                  <span className="font-semibold flex-1">{formatResourceLabel(resource)}</span>

                  <Badge variant="secondary" className="text-xs shrink-0">
                    {selectedCount} / {resourcePerms.length}
                  </Badge>
                </button>

                {/* Expanded permission list */}
                {!isCollapsed && (
                  <div className="px-4 py-3 space-y-2 border-t">
                    {resourcePerms.map((permission) => (
                      <div key={permission.id} className="flex items-center gap-3 group py-1">
                        <Checkbox
                          id={`permission-${permission.id}`}
                          checked={selectedPermissions.has(permission.code)}
                          onCheckedChange={() => onPermissionToggle(permission.code)}
                          aria-label={`${permission.name} — ${permission.code}`}
                        />
                        <Label
                          htmlFor={`permission-${permission.id}`}
                          className="cursor-pointer flex items-center gap-2 flex-1 min-w-0"
                        >
                          <Badge variant={actionBadgeVariant(permission.action)} className="text-xs capitalize shrink-0">
                            {permission.action}
                          </Badge>
                          <span className="text-sm truncate">{permission.name}</span>
                          {isWildcardPermission(permission.code) && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              Wildcard
                            </Badge>
                          )}
                        </Label>
                        <code className="text-xs text-muted-foreground font-mono hidden sm:block shrink-0">
                          {permission.code}
                        </code>
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
