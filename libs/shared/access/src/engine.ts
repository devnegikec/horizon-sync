/**
 * Pure access-resolution engine.
 *
 * Given a module config and a user context it computes the effective access.
 * Contains no React and no store imports, so it is trivially unit-testable.
 */
import { hasAnyPermission, hasPermission, SUPER_ADMIN_PERMISSION } from './permission-codes';
import type {
  AccessGrant,
  AccessResource,
  AccessRule,
  AccessUserContext,
  Action,
  ModuleAccess,
  ModuleAccessConfig,
  ResourceAccess,
} from './types';

const DEFAULT_ACTIONS: readonly Action[] = ['view'];

function ruleMatches(rule: AccessRule, ctx: AccessUserContext): boolean {
  const byRole = Boolean(rule.roles?.some((role) => ctx.roles.includes(role)));
  const byType = Boolean(rule.userTypes?.some((type) => ctx.userTypes.includes(type)));
  const byPermission = Boolean(
    rule.permissions?.some((permission) => hasPermission(ctx.permissions, permission)),
  );
  return byRole || byType || byPermission;
}

function pickActiveRule(rules: readonly AccessRule[], ctx: AccessUserContext): AccessRule | null {
  return rules.reduce<AccessRule | null>((best, rule) => {
    if (!ruleMatches(rule, ctx)) return best;
    if (!best || rule.priority > best.priority) return rule;
    return best;
  }, null);
}

/** Resolve a rule grant into a concrete action set (empty when no grant applies). */
function resolveGrant(grant: AccessGrant | undefined, resource: AccessResource): Set<Action> {
  const supported = resource.actions ?? DEFAULT_ACTIONS;
  if (!grant) return new Set<Action>();
  if (grant === '*') return new Set<Action>(supported);
  return new Set<Action>(grant);
}

/** Permission-code fallback used when no named rule matched the user. */
function resolveFromPermissions(resource: AccessResource, ctx: AccessUserContext): Set<Action> {
  const supported = resource.actions ?? DEFAULT_ACTIONS;
  const allowed = new Set<Action>();
  for (const action of supported) {
    const codes = resource.actionPermissions?.[action];
    if (codes && hasAnyPermission(ctx.permissions, codes)) {
      allowed.add(action);
    }
  }
  return allowed;
}

function buildResourceAccess(resource: AccessResource, allowed: Set<Action>): ResourceAccess {
  return {
    key: resource.key,
    label: resource.label,
    visible: allowed.size > 0,
    actions: allowed,
    can: (action: Action) => allowed.has(action),
  };
}

function emptyActions(): ReadonlySet<Action> {
  return new Set<Action>();
}

/** A deny-by-default access object, used for unknown modules/resource keys. */
export function emptyModuleAccess(moduleKey: string): ModuleAccess {
  return {
    module: moduleKey,
    rule: null,
    isSuperAdmin: false,
    resources: {},
    visible: () => false,
    can: () => false,
    canAny: () => false,
    actions: () => emptyActions(),
    is: () => false,
    hasRule: () => false,
  };
}

export function resolveModuleAccess(config: ModuleAccessConfig, ctx: AccessUserContext): ModuleAccess {
  const isSuperAdmin = hasPermission(ctx.permissions, SUPER_ADMIN_PERMISSION);
  const matchingRules = config.rules.filter((rule) => ruleMatches(rule, ctx));
  const rule = pickActiveRule(config.rules, ctx);

  const resources: Record<string, ResourceAccess> = {};
  for (const resource of config.resources) {
    let allowed: Set<Action>;
    if (isSuperAdmin) {
      allowed = new Set<Action>(resource.actions ?? DEFAULT_ACTIONS);
    } else if (rule) {
      allowed = resolveGrant(rule.grants?.[resource.key] ?? rule.defaultGrant, resource);
    } else {
      allowed = resolveFromPermissions(resource, ctx);
    }
    resources[resource.key] = buildResourceAccess(resource, allowed);
  }

  const matchingIds = new Set(matchingRules.map((r) => r.id));

  return {
    module: config.module,
    rule,
    isSuperAdmin,
    resources,
    visible: (resourceKey) => resources[resourceKey]?.visible ?? false,
    can: (resourceKey, action) => resources[resourceKey]?.can(action) ?? false,
    canAny: (resourceKey, actions) => actions.some((action) => resources[resourceKey]?.can(action) ?? false),
    actions: (resourceKey) => resources[resourceKey]?.actions ?? emptyActions(),
    is: (ruleId) => rule?.id === ruleId,
    hasRule: (ruleId) => matchingIds.has(ruleId),
  };
}

/** Convenience: resolve access for a user context against an optional config. */
export function resolveAccessForUser(
  config: ModuleAccessConfig | undefined,
  ctx: AccessUserContext,
): ModuleAccess {
  if (!config) return emptyModuleAccess('');
  return resolveModuleAccess(config, ctx);
}
