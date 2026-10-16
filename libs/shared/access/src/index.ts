/**
 * `@horizon-sync/access` — rule-based front-end access & visibility.
 *
 * Answers, for any module: *what can this user see* and *what can this user do*.
 * Declarative, generic and additive to the existing permission-code checks.
 */
export type {
  Action,
  AccessGrant,
  AccessResource,
  AccessRule,
  AccessUserContext,
  ModuleAccess,
  ModuleAccessConfig,
  ResourceAccess,
} from './types';

export {
  emptyModuleAccess,
  resolveAccessForUser,
  resolveModuleAccess,
} from './engine';

export {
  hasAnyPermission,
  hasPermission,
  SUPER_ADMIN_PERMISSION,
} from './permission-codes';

export {
  getModuleAccessConfig,
  listRegisteredAccessModules,
  registerModuleAccess,
  WMS_RULE_IDS,
  wmsAccessConfig,
} from './modules';

export { useAccess, useCan, useVisible } from './hooks';

export { AccessGuard, Can, Show } from './components';
export type { AccessGuardProps, CanProps, ShowProps } from './components';
