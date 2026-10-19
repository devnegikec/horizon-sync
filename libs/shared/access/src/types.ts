/**
 * Generic, declarative access-control types for the front-end.
 *
 * A module declares its `resources` and a set of `rules` (named access
 * profiles such as "WMS Admin" / "WMS Manager"). The engine in `engine.ts`
 * resolves, for a given user context, which resources are visible and which
 * actions the user may perform.
 */

/** A verb performed on a resource. Open-ended so modules can add custom actions. */
export type Action = 'view' | 'create' | 'update' | 'delete' | 'manage' | (string & {});

/** A rule grant: `'*'` means "every action the resource supports". */
export type AccessGrant = '*' | readonly Action[];

export interface AccessResource {
  /** Stable key used by callers, e.g. `asn`, `workers`. */
  key: string;
  /** Human-readable label for tooltips / debugging. */
  label: string;
  description?: string;
  /** Actions this resource supports. Defaults to `['view']`. */
  actions?: readonly Action[];
  /**
   * Permission-code fallback, used only when **no** named rule matches the user.
   * Maps an action to the backend permission codes that grant it (any-match).
   */
  actionPermissions?: Partial<Record<Action, readonly string[]>>;
}

export interface AccessRule {
  /** Stable id, e.g. `wms_manager`. */
  id: string;
  /** Display name, e.g. "WMS Admin". */
  label: string;
  description?: string;
  /** Higher priority wins when several rules match the same user. */
  priority: number;
  /** Org role names (from `permissions.roles`) that activate this rule. */
  roles?: readonly string[];
  /** `user.user_type` values that activate this rule. */
  userTypes?: readonly string[];
  /** Backend permission codes (any-match, wildcards supported) that activate this rule. */
  permissions?: readonly string[];
  /** Explicit `resource key -> actions` grants. */
  grants?: Partial<Record<string, AccessGrant>>;
  /** Grant applied to resource keys absent from `grants`. Defaults to none. */
  defaultGrant?: AccessGrant;
}

export interface ModuleAccessConfig {
  /** Module id, e.g. `wms`. */
  module: string;
  /** Display name. */
  label: string;
  resources: readonly AccessResource[];
  rules: readonly AccessRule[];
}

/** Snapshot of the current user used to resolve access (framework-agnostic). */
export interface AccessUserContext {
  permissions: readonly string[];
  roles: readonly string[];
  userTypes: readonly string[];
}

export interface ResourceAccess {
  key: string;
  label: string;
  /** True when the user can perform at least one action on the resource. */
  visible: boolean;
  /** Effective allowed actions. */
  actions: ReadonlySet<Action>;
  can: (action: Action) => boolean;
}

export interface ModuleAccess {
  module: string;
  /** The active (highest-priority matching) rule, or `null` when none matched. */
  rule: AccessRule | null;
  isSuperAdmin: boolean;
  resources: Readonly<Record<string, ResourceAccess>>;
  /** Should the user see this resource? */
  visible: (resourceKey: string) => boolean;
  /** May the user perform `action` on `resourceKey`? */
  can: (resourceKey: string, action: Action) => boolean;
  /** May the user perform any of `actions` on `resourceKey`? */
  canAny: (resourceKey: string, actions: readonly Action[]) => boolean;
  /** Effective actions for `resourceKey` (empty set when unknown). */
  actions: (resourceKey: string) => ReadonlySet<Action>;
  /** True when the *active* rule is exactly `ruleId`. */
  is: (ruleId: string) => boolean;
  /** True when *any* matching rule (incl. lower priority) has `ruleId`. */
  hasRule: (ruleId: string) => boolean;
}
