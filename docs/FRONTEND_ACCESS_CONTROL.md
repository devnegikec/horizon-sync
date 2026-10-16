# Frontend Access Control (Rule-Based Access & Visibility)

A generic, front-end module that answers two questions for any screen:

1. **Visibility** — *should this user see this resource at all?*
2. **Permission** — *is this user allowed to perform this action (create / update / delete / manage)?*

It is **declarative** (rules live in config, not scattered `if` statements), **generic**
(one engine, many modules), and **additive** to the existing permission-code checks
(`usePermissions`, `PermissionGuard`) — it does **not** replace them. The backend remains
the source of truth for authorization; this module only drives what the UI *shows* and
what it *lets the user attempt*.

- Library: `@horizon-sync/access` (`libs/shared/access`)
- First module wired: **WMS**, with two rules — **WMS Admin** and **WMS Manager**.

---

## 1. Why a new layer?

Today the front-end checks permissions ad-hoc:

```tsx
const userType = useUserStore((s) => s.user?.user_type);
const isAdmin = userType === 'system_admin' || userType === 'organization_admin';
const canManage = isAdmin || hasPermission(userPermissions, 'warehouse.manage');
// ...then canManage is threaded manually through 5+ components
```

Problems:
- The *decision* (`canManage`) is duplicated per component and drifts.
- "Visibility" (show the tab) and "permission" (allow the edit) are the same boolean.
- Role concepts (`WMS Admin`, `WMS Manager`) are implicit — spread across
  `wms-permissions.ts`, `RoleDialog.tsx`, `InviteUserModal.tsx`, `dashboard-home.tsx`.
- Adding a 3rd role means touching every screen.

The access module centralises this into a single declarative config per module.

---

## 2. Core concepts

| Concept | Meaning | Example |
| --- | --- | --- |
| **Module** | A product area | `wms` |
| **Resource** | A thing a user interacts with inside the module | `asn`, `receiving`, `putaway`, `exceptions`, `shortages`, `outbound`, `picking`, `packing`, `gate`, `dispatch`, `returns`, `stock`, `manage`, `workers`, `devices`, `layout`, `location_qr` |
| **Action** | A verb on a resource | `view`, `create`, `update`, `delete`, `manage` — plus domain verbs (`approve`, `reject`, `dispose`, `execute`, `verify`, `arrive`, …) |
| **Rule** | A named role/access profile that grants actions on resources | `org_owner`, `wms_manager`, `wms_supervisor`, `wms_operator` |
| **Grant** | `resource → actions` (or `'*'`) declared by a rule | `asn → ['view','create','update','delete','arrive']` |

A **rule** *matches* a user when any of its matchers fire:

- `roles` — the user's org role names (from `permissions.roles`), e.g. `"WMS Manager"`
- `userTypes` — `user.user_type`, e.g. `"organization_admin"`
- `permissions` — any backend permission code, e.g. `"warehouse.manage"` (wildcards supported)

When several rules match, **the highest `priority` wins** and becomes the *active rule*.
That active rule's grants decide `can(...)` / `visible(...)`.

If **no** rule matches, the engine falls back to **permission-code driven** checks
(`resource.actionPermissions`), so custom/legacy roles keep working without a named rule.

`*.*` (super-admin) always grants everything.

---

## 3. API

### 3.1 Config (per module)

```ts
// libs/shared/access/src/modules/wms.ts
export const wmsAccessConfig: ModuleAccessConfig = {
  module: 'wms',
  label: 'Warehouse Management',
  resources: [
    { key: 'asn',    label: 'Advance Stock Notice', actions: ['view','create','update','delete'],
      actionPermissions: { view: ['asn_order.read'] } },
    // ...
  ],
  rules: [
    {
      id: 'org_owner', label: 'Organization Owner', priority: 100,
      roles: ['Organization Owner', 'Organization Admin', 'WMS Admin'],
      userTypes: ['system_admin', 'organization_admin'],
      defaultGrant: '*',                       // every action on every resource
    },
    {
      id: 'wms_manager', label: 'WMS Manager', priority: 80,
      roles: ['WMS Manager'],
      grants: { asn: ['view','create','update','delete','arrive'], /* ... */ },
    },
    { id: 'wms_supervisor', label: 'WMS Supervisor', priority: 60, roles: ['WMS Supervisor'], grants: { /* ... */ } },
    { id: 'wms_operator',   label: 'WMS Operator',   priority: 40, roles: ['WMS Operator'],   grants: { /* ... */ } },
  ],
};
```

> **Matcher precedence gotcha.** `hasPermission` treats a `resource.*` wildcard as granting
> every action on that resource, and **every** seeded WMS role holds `warehouse.*`. So a
> permission-code matcher cannot separate the tiers from one another — each rule therefore
> matches on its **role name** (the owner additionally matches by user type). Priority breaks
> ties: a user holding both `WMS Manager` and `WMS Supervisor` resolves to `wms_manager`.
> The full four-role spec is `docs/WMS_ROLES_AND_PERMISSIONS.md`.

### 3.2 Hook

```tsx
import { useAccess } from '@horizon-sync/access';

const access = useAccess('wms');

access.visible('manage');            // show the Manage tab?
access.can('asn', 'create');         // can create an ASN?
access.canAny('outbound', ['create', 'update']);
access.actions('asn');               // Set<Action>
access.rule;                         // the active rule (or null)
access.is('wms_manager');            // active rule is exactly wms_manager
access.hasRule('wms_supervisor');    // any (incl. lower-priority) matching rule
access.isSuperAdmin;
```

`useCan(module, resource, action)` and `useVisible(module, resource)` are thin helpers.

### 3.3 Components

```tsx
<Can module="wms" resource="asn" action="create">
  <Button>Register ASN</Button>
</Can>

<Show module="wms" resource="manage">
  <ManageTab />
</Show>

<AccessGuard module="wms" resource="manage" action="view" fallback={null}>
  <ManageManagement />
</AccessGuard>
```

`Can` / `Show` render `children` or the `fallback` (default `null`).
`AccessGuard` defaults to an inline "Access Denied" panel (or redirect via `fallback`).

---

## 4. WMS roles

The four WMS rules — **Org Owner**, **WMS Manager**, **WMS Supervisor**, **WMS Operator**
(ids `org_owner` / `wms_manager` / `wms_supervisor` / `wms_operator`) — and the full
capability matrix across every resource/action are specified in
**[`docs/WMS_ROLES_AND_PERMISSIONS.md`](./WMS_ROLES_AND_PERMISSIONS.md)**.

Summary of the tiering:

| Rule | Priority | Scope | Can | Cannot |
| --- | --- | --- | --- | --- |
| `org_owner` | 100 | All warehouses | Everything, incl. warehouses, config, identity | — |
| `wms_manager` | 80 | Assigned | Full ops + config + write-offs/adjustments | Create/delete warehouses |
| `wms_supervisor` | 60 | Assigned | Execute everything + reversible approvals | Config, dispose/write-off, reconcile |
| `wms_operator` | 40 | Assigned | Floor execution (dock, put-away, pick, pack, gate) | Planning, approvals, config |

---

## 5. Files

```
libs/shared/access/
  src/
    types.ts                     — Action, AccessResource, AccessRule, ModuleAccessConfig
    engine.ts                    — resolveModuleAccess(config, ctx)  (pure, unit-testable)
    hooks/useAccess.ts           — useAccess / useCan / useVisible
    components/Can.tsx           — <Can>
    components/Show.tsx          — <Show>
    components/AccessGuard.tsx   — <AccessGuard>
    modules/wms.ts               — WMS resources + four rules (owner / manager / supervisor / operator)
    modules/registry.ts          — module registry (getModuleAccessConfig)
    index.ts                     — public barrel
    __tests__/…                  — engine + WMS rule tests (jest: `nx test access`)
```

Consumers: `@horizon-sync/access`. The library is **non-buildable** (consumed from source via
tsconfig paths), which also lets it import `@horizon-sync/store` without tripping the
Nx *buildable-imports-non-buildable* boundary rule.

---

## 6. Integration points (WMS)

- `WMSManagement` — derives `canManage = access.can('manage', 'view')` (Manage tab is
  Org Owner + WMS Manager only).
- `WMSNavigation` — the Manage tab comes from `<Show module="wms" resource="manage">`.
- `WMSContent` / `ManageManagement` — gated by `access.can('manage','view')` /
  `access.can('layout','manage')`.
- `WorkersManagementPanel` / `PickExceptionQueue` — replace raw `warehouse.manage` checks
  with `access.can('workers', 'manage')` / `access.can('pick_exceptions', 'manage')` over time.

The module is generic: adding a `qseal` or `revenue` config + one registry line is all
that's needed to bring another module under the same rules engine.

---

## 7. Non-goals / security

- **Not** a security boundary. It only gates UI. Every API call must still be authorized
  server-side.
- Does **not** replace `PermissionGuard` for route-level auth — it complements it and is
  intentionally more granular (per-resource, per-action).
- Deny-by-default: an unknown resource/action returns `false`.
