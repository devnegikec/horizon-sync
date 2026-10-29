import * as React from 'react';

import { useUserStore } from '@horizon-sync/store';

import { emptyModuleAccess, resolveModuleAccess } from '../engine';
import { getModuleAccessConfig } from '../modules/registry';
import type { Action, ModuleAccess } from '../types';

/**
 * Resolve the effective access for a module from the current user context.
 *
 * Reads permissions/roles/user_type from the shared (federated) store, so the
 * same hook works in the host platform and in remote apps like inventory.
 * Unknown modules resolve to a deny-by-default access object.
 */
export function useAccess(moduleKey: string): ModuleAccess {
  const permissions = useUserStore((s) => s.permissions.permissions);
  const roles = useUserStore((s) => s.permissions.roles);
  const userType = useUserStore((s) => s.user?.user_type);

  return React.useMemo(() => {
    const config = getModuleAccessConfig(moduleKey);
    if (!config) {
      return emptyModuleAccess(moduleKey);
    }
    return resolveModuleAccess(config, {
      permissions: permissions ?? [],
      roles: roles ?? [],
      userTypes: userType ? [userType] : [],
    });
  }, [moduleKey, permissions, roles, userType]);
}

/** Convenience: may the current user perform `action` on `resource` in `module`? */
export function useCan(moduleKey: string, resourceKey: string, action: Action = 'view'): boolean {
  const access = useAccess(moduleKey);
  return access.can(resourceKey, action);
}

/** Convenience: should the current user see `resource` in `module`? */
export function useVisible(moduleKey: string, resourceKey: string): boolean {
  const access = useAccess(moduleKey);
  return access.visible(resourceKey);
}
