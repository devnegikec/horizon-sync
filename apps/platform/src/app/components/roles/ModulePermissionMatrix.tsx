import { useState, useMemo, useCallback } from 'react';

import {
  Box,
  Calculator,
  ChevronDown,
  ChevronRight,
  Shield,
  ShoppingCart,
  Truck,
} from 'lucide-react';

import { Badge, Button, Checkbox, Label } from '@horizon-sync/ui/components';
import { cn } from '@horizon-sync/ui/lib';

import type { ModuleGroup, Permission } from '../../types/role.types';

// ── Icon mapping ──────────────────────────────────────────────────────────────
const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  'shopping-cart': ShoppingCart,
  truck: Truck,
  box: Box,
  calculator: Calculator,
};

function ModuleIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = MODULE_ICONS[icon] ?? Shield;
  return <Icon className={className} />;
}

// ── Action badge colours ──────────────────────────────────────────────────────
function actionBadgeVariant(action: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (action) {
    case 'read':   return 'secondary';
    case 'create': return 'default';
    case 'delete': return 'destructive';
    default:       return 'outline';
  }
}

// ── Selection helpers ─────────────────────────────────────────────────────────
type SelectionState = 'none' | 'some' | 'all';

function getSelectionState(codes: string[], selected: Set<string>): SelectionState {
  const count = codes.filter(c => selected.has(c)).length;
  if (count === 0) return 'none';
  if (count === codes.length) return 'all';
  return 'some';
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface ModulePermissionMatrixProps {
  modules: ModuleGroup[];
  selectedPermissions: Set<string>;
  onPermissionToggle: (code: string) => void;
  onBulkSelect: (codes: string[], selected: boolean) => void;
  /** When true, checkboxes are disabled (read-only preview mode) */
  readOnly?: boolean;
}

/**
 * ModulePermissionMatrix — industry-standard module-level permission picker.
 *
 * Layout:
 *   ▸ [Module toggle]  Inventory                    3 / 12
 *       ▸ [Resource toggle]  Items                  2 / 4
 *             ☑ read   ☑ create   ☐ update   ☐ delete
 *       ▸ [Resource toggle]  Warehouses             1 / 3
 *             ☑ read   ☐ create   ☐ update
 */
export function ModulePermissionMatrix({
  modules,
  selectedPermissions,
  onPermissionToggle,
  onBulkSelect,
  readOnly = false,
}: ModulePermissionMatrixProps) {
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());
  const [collapsedResources, setCollapsedResources] = useState<Set<string>>(new Set());

  // Pre-compute all codes per module and per resource for selection state
  const moduleCodeMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    modules.forEach(mod => {
      map[mod.key] = mod.resources.flatMap(r => r.permissions.map(p => p.code));
    });
    return map;
  }, [modules]);

  const toggleModule = useCallback((key: string) => {
    setCollapsedModules(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const toggleResource = useCallback((key: string) => {
    setCollapsedResources(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const handleModuleToggle = useCallback((modKey: string) => {
    if (readOnly) return;
    const codes = moduleCodeMap[modKey] ?? [];
    const state = getSelectionState(codes, selectedPermissions);
    onBulkSelect(codes, state !== 'all');
  }, [moduleCodeMap, selectedPermissions, onBulkSelect, readOnly]);

  const handleResourceToggle = useCallback((perms: Permission[]) => {
    if (readOnly) return;
    const codes = perms.map(p => p.code);
    const state = getSelectionState(codes, selectedPermissions);
    onBulkSelect(codes, state !== 'all');
  }, [selectedPermissions, onBulkSelect, readOnly]);

  const allModuleKeys = modules.map(m => m.key);
  const allCollapsed = allModuleKeys.length > 0 && allModuleKeys.every(k => collapsedModules.has(k));

  const handleToggleAllModules = useCallback(() => {
    setCollapsedModules(allCollapsed ? new Set() : new Set(allModuleKeys));
  }, [allCollapsed, allModuleKeys]);

  if (modules.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No permissions available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Expand / Collapse All */}
      {modules.length > 2 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleToggleAllModules} className="text-xs text-muted-foreground">
            {allCollapsed ? 'Expand All' : 'Collapse All'}
          </Button>
        </div>
      )}

      {modules.map(mod => {
        const modCodes = moduleCodeMap[mod.key] ?? [];
        const modState = getSelectionState(modCodes, selectedPermissions);
        const modSelected = modCodes.filter(c => selectedPermissions.has(c)).length;
        const isModCollapsed = collapsedModules.has(mod.key);

        return (
          <div key={mod.key} className="border rounded-xl overflow-hidden shadow-sm">
            {/* ── Module header ── */}
            <button
              type="button"
              onClick={() => toggleModule(mod.key)}
              className="w-full bg-muted/40 px-4 py-3.5 flex items-center gap-3 hover:bg-muted/60 transition-colors text-left"
            >
              {isModCollapsed
                ? <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              }

              {/* Module checkbox */}
              <span
                onClick={e => e.stopPropagation()}
                onKeyDown={e => { if (e.key === ' ') e.stopPropagation(); }}
                role="presentation"
              >
                <Checkbox
                  checked={modState === 'all'}
                  disabled={readOnly}
                  onCheckedChange={() => handleModuleToggle(mod.key)}
                  className={cn(modState === 'some' && 'data-[state=checked]:bg-primary/50')}
                  aria-label={`Select all ${mod.label} permissions`}
                />
              </span>

              <ModuleIcon icon={mod.icon} className="h-5 w-5 text-muted-foreground shrink-0" />

              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm">{mod.label}</span>
                {mod.description && (
                  <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                )}
              </div>

              <Badge variant="secondary" className="text-xs shrink-0">
                {modSelected} / {modCodes.length}
              </Badge>
            </button>

            {/* ── Resources ── */}
            {!isModCollapsed && (
              <div className="divide-y border-t">
                {mod.resources.map(resource => {
                  const resCodes = resource.permissions.map(p => p.code);
                  const resState = getSelectionState(resCodes, selectedPermissions);
                  const resSelected = resCodes.filter(c => selectedPermissions.has(c)).length;
                  const resKey = `${mod.key}:${resource.key}`;
                  const isResCollapsed = collapsedResources.has(resKey);

                  return (
                    <div key={resource.key}>
                      {/* Resource header */}
                      <button
                        type="button"
                        onClick={() => toggleResource(resKey)}
                        className="w-full px-6 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left"
                      >
                        {isResCollapsed
                          ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          : <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        }

                        <span
                          onClick={e => e.stopPropagation()}
                          onKeyDown={e => { if (e.key === ' ') e.stopPropagation(); }}
                          role="presentation"
                        >
                          <Checkbox
                            checked={resState === 'all'}
                            disabled={readOnly}
                            onCheckedChange={() => handleResourceToggle(resource.permissions)}
                            className={cn('h-3.5 w-3.5', resState === 'some' && 'data-[state=checked]:bg-primary/50')}
                            aria-label={`Select all ${resource.label} permissions`}
                          />
                        </span>

                        <span className="text-sm font-medium flex-1">{resource.label}</span>

                        <Badge variant="outline" className="text-xs shrink-0">
                          {resSelected} / {resCodes.length}
                        </Badge>
                      </button>

                      {/* Permission checkboxes */}
                      {!isResCollapsed && (
                        <div className="px-10 pb-3 pt-1 flex flex-wrap gap-x-6 gap-y-2">
                          {resource.permissions.map(perm => (
                            <div key={perm.id} className="flex items-center gap-2">
                              <Checkbox
                                id={`perm-${perm.id}`}
                                checked={selectedPermissions.has(perm.code)}
                                disabled={readOnly}
                                onCheckedChange={() => onPermissionToggle(perm.code)}
                                aria-label={perm.name}
                              />
                              <Label
                                htmlFor={`perm-${perm.id}`}
                                className={cn(
                                  'flex items-center gap-1.5 text-sm',
                                  readOnly ? 'cursor-default' : 'cursor-pointer',
                                )}
                              >
                                <Badge variant={actionBadgeVariant(perm.action)} className="text-xs capitalize">
                                  {perm.action}
                                </Badge>
                              </Label>
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
      })}
    </div>
  );
}
