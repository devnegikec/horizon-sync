# WMS Roles & Permissions (Access Matrix)

Specification for the four WMS user types, plus recommended additions, that drive the
WMS rule set in `@horizon-sync/access` (see `docs/FRONTEND_ACCESS_CONTROL.md`).

Status: **decisions locked and implemented** (§6) in
`libs/shared/access/src/modules/wms.ts`, covered by
`libs/shared/access/src/__tests__/wms.test.ts`.

Legend: **✅** allowed · **🔶** limited (only own/assigned warehouse, or needs a step up) · **❌** not allowed.

---

## 1. The access "axes"

Every role is defined along four axes. Two roles only differ if at least one axis differs.

| Axis | Question it answers | Possible values |
| --- | --- | --- |
| **Scope** | *Which* warehouses? | `All` (org-wide) · `Assigned` (only warehouses the user is bound to) |
| **Authority** | *How far* up the chain? | `Execute` (do the work) → `Approve` (sign off) → `Configure` (master data/setup) → `Administer` (org/identity) |
| **Domain** | *What* areas? | Inbound · Outbound · Returns · Stock · Master data · Reports |
| **Reversibility** | Can it move stock / change ledger or master data? | `Reversible` (operational docs) · `Irreversible` (write-off, adjustment, layout apply, delete) |

Rule of thumb used below:

- **Administer + All** = Org Owner
- **Configure + Configure-adjacent + Approve (irreversible) + Assigned** = Warehouse Manager
- **Approve (reversible) + Execute (everything) + Assigned** = Warehouse Supervisor
- **Execute (floor only) + Assigned** = Warehouse Operator

---

## 2. Role definitions

### 2.1 Core roles (requested)

| # | Role | Id | Scope | Authority | Purpose / axis summary |
| --- | --- | --- | --- | --- | --- |
| 1 | **Org Owner** | `org_owner` | All warehouses | Administer | Accountable owner. Full WMS + identity + billing/settings. The only role that can create/delete warehouses and change org-level policy. |
| 2 | **Warehouse Manager** | `wms_manager` | Assigned | Configure | Runs one or more warehouses end-to-end. Owns configuration **for their warehouses** (layout, devices, workers) and all *irreversible* stock decisions (write-offs, adjustments, ASN cancel). |
| 3 | **Warehouse Supervisor** | `wms_supervisor` | Assigned | Approve | Shift/shoulder lead. Executes everything and performs *reversible* operational approvals (receiving slip, return receipt note, exception triage, dispatch). No configuration, no ledger-changing write-offs. |
| 4 | **Warehouse Operator** | `wms_operator` | Assigned | Execute | Floor worker (dock, put-away, picker, packer, gate). Executes assigned tasks and *raises* exceptions/shortages, but cannot approve, plan, or configure. |

### 2.2 Recommended additions (future / present gaps)

| # | Role | Id | Scope | Authority | Why it's practical |
| --- | --- | --- | --- | --- | --- |
| 5 | **ASN Coordinator** | `asn_coordinator` | All (central planning) | Execute + plan | Plans inter-warehouse transfers / advance stock notices. Already present as a template — formalize it. Not tied to one warehouse. |
| 6 | **Returns / Disposition Officer** | `returns_officer` | Assigned | Approve | Owns the returns desk: register, approve note, decide disposition. Separates returns governance from daily inbound. |
| 7 | **Inventory Controller** | `inventory_controller` | Assigned (oversight) | Approve (stock) | Cycle counts, reconciliations, bin audits. Read everywhere, adjust stock, no outbound/inbound execution. |
| 8 | **Gate / Dock Officer** | `gate_officer` | Assigned (gate only) | Execute | Security-flavoured: gate verification + dispatch hand-off only; read-only everywhere else. |
| 9 | **WMS Viewer / Auditor** | `wms_viewer` | All or Assigned | None (read) | Read-only across WMS + reports for audit/compliance. |
| 10 | **Device Admin** | `device_admin` | Assigned | Configure (technical) | Provisions devices + worker QR codes only (step towards separating "IT setup" from "warehouse ops"). |

> **Cross-cutting:** the platform `System Admin` (`*.*`) is orthogonal — it bypasses all checks and is **not** a WMS role.

---

## 3. Capability matrix

Each row is an **action**; each column a role. Domain grouping is by WMS area.

### 3.1 Master data & configuration

| Capability | Permission code (target) | Org Owner | W. Manager | W. Supervisor | W. Operator |
| --- | --- | :-: | :-: | :-: | :-: |
| View warehouses / switch warehouse | `warehouse.read` | ✅ | ✅ | ✅ | ✅ |
| Create / edit / delete warehouse | `warehouse.create/update/delete` | ✅ | ❌ | ❌ | ❌ |
| Manage warehouse settings (policy, thresholds) | `warehouse.manage` | ✅ | 🔶 | ❌ | ❌ |
| Layout designer — create / preview / apply / delete | `warehouse.layout.manage` | ✅ | 🔶 | ❌ | ❌ |
| Location tree / 3D view ¹ | `warehouse.read` | ✅ | ✅ | ❌ | ❌ |
| Location QR — generate & print ¹ | `warehouse.location_qr.manage` | ✅ | ✅ | ❌ | ❌ |
| Device registry — add / edit / delete ¹ | `device.manage` | ✅ | ✅ | ❌ | ❌ |
| Workers — add / disable / regenerate QR ¹ | `warehouse.manage` | ✅ | ✅ | ❌ | ❌ |

> ¹ These live inside the single **Manage** tab. Its visibility follows one capability
> (`manage.view`), so it is shown to **Org Owner** and **Warehouse Manager** only.
> See §6.1.

### 3.2 ASN (Advance Stock Notice)

| Capability | Permission code (target) | Org Owner | W. Manager | W. Supervisor | W. Operator |
| --- | --- | :-: | :-: | :-: | :-: |
| View ASN | `asn_order.read` | ✅ | ✅ | ✅ | ✅ |
| **Create / edit ASN** | `asn_order.create/update` | ✅ | ✅ | ✅ | ❌ |
| Confirm (send) ASN | `asn_order.update` | ✅ | ✅ | ✅ | ❌ |
| Close ASN | `asn_order.update` | ✅ | ✅ | ✅ | ❌ |
| Cancel / delete ASN | `asn_order.delete` | ✅ | ✅ | ❌ | ❌ |
| Register vehicle arrival (dock) | `asn_order.update` | ✅ | ✅ | ✅ | ✅ |
| Internal transfer / serial match | `asn_order.update` | ✅ | ✅ | ✅ | ❌ |

### 3.3 Inbound

| Capability | Permission code (target) | Org Owner | W. Manager | W. Supervisor | W. Operator |
| --- | --- | :-: | :-: | :-: | :-: |
| View receiving slips | `stock_entry.read` | ✅ | ✅ | ✅ | ✅ |
| Create receiving slip (dock scan) | `stock_entry.create` | ✅ | ✅ | ✅ | ✅ |
| Write lines / edit slip detail | `warehouse.update` \| `wms.scan` | ✅ | ✅ | ✅ | ✅ |
| **Approve receiving slip** | `stock_entry.approve` | ✅ | ✅ | ✅ | ❌ |
| Reject slip / reject item | `stock_entry.approve` | ✅ | ✅ | ✅ | ❌ |
| Generate put-away list (auto/manual) | `stock_entry.create` | ✅ | ✅ | ✅ | ❌ |
| Execute put-away (scan to bin) | `stock_entry.update` | ✅ | ✅ | ✅ | ✅ |
| Raise put-away exception | `inbound_exception.create` | ✅ | ✅ | ✅ | ✅ |
| View inbound exception queue | `inbound_exception.read` | ✅ | ✅ | ✅ | ✅ |
| **Dispose exception** (write-off / return) · short-close | `inbound_exception.dispose` | ✅ | ✅ | 🔶 (short-close) | ❌ |
| Shortage ledger — view | `inbound_exception.read` | ✅ | ✅ | ✅ | ✅ |
| Shortage ledger — close | `inbound_exception.dispose` | ✅ | ✅ | ✅ | ❌ |

### 3.4 Outbound

| Capability | Permission code (target) | Org Owner | W. Manager | W. Supervisor | W. Operator |
| --- | --- | :-: | :-: | :-: | :-: |
| View outbound orders | `pick_list.read` | ✅ | ✅ | ✅ | ✅ |
| Create / import outbound orders | `pick_list.create` | ✅ | ✅ | ✅ | ❌ |
| Generate pick lists | `pick_list.create` | ✅ | ✅ | ✅ | ❌ |
| Execute pick (assign / scan / complete) | `pick_list.update` | ✅ | ✅ | ✅ | ✅ |
| Pack → packing slip | `pick_list.update` | ✅ | ✅ | ✅ | ✅ |
| Gate verification | `pick_list.verify` | ✅ | ✅ | ✅ | ✅ |
| **Create dispatch record** | `pick_list.update` | ✅ | ✅ | ✅ | 🔶 (on verify) |
| View / resolve pick exceptions | `pick_list.manage` | ✅ | ✅ | ✅ | ❌ (view ✅) |

### 3.5 Returns

| Capability | Permission code (target) | Org Owner | W. Manager | W. Supervisor | W. Operator |
| --- | --- | :-: | :-: | :-: | :-: |
| View returns / receipt notes | `return.read` | ✅ | ✅ | ✅ | ✅ |
| Register return | `return.register` | ✅ | ✅ | ✅ | ✅ |
| **Approve return receipt note** | `return.approve` | ✅ | ✅ | ✅ | ❌ |
| Reject return note | `return.approve` | ✅ | ✅ | ✅ | ❌ |
| **Dispose return** (restock / write-off / RTV) | `return.dispose` | ✅ | ✅ | ❌ | ❌ |
| Generate return put-away | `return.putaway` | ✅ | ✅ | ✅ | ❌ |

### 3.6 Stock & reports

| Capability | Permission code (target) | Org Owner | W. Manager | W. Supervisor | W. Operator |
| --- | --- | :-: | :-: | :-: | :-: |
| View stock levels / movements / bin stock | `stock_entry.read` | ✅ | ✅ | ✅ | ✅ |
| Create stock entry | `stock_entry.create` | ✅ | ✅ | ✅ | 🔶 |
| **Reconciliation / stock adjustment** | `stock_entry.manage` | ✅ | ✅ | ❌ | ❌ |
| View WMS reports | `report.read` | ✅ | ✅ | 🔶 (own WH) | ❌ |
| Export reports | `report.export` | ✅ | ✅ | ❌ | ❌ |
| Manage users / roles (identity) | `user.*` / `role.*` | ✅ | ❌ | ❌ | ❌ |

---

## 4. Permission-code mapping

### 4.1 Codes that already exist (reuse as-is)

```
warehouse.read | warehouse.create | warehouse.update | warehouse.delete | warehouse.manage
stock_entry.read | stock_entry.create | stock_entry.update | stock_entry.delete | stock_entry.manage
pick_list.read | pick_list.create | pick_list.update | pick_list.delete | pick_list.manage
asn_order.read | asn_order.create | asn_order.update | asn_order.delete | asn_order.manage
inbound_exception.create | inbound_exception.dispose
return.read | return.register | return.approve | return.dispose
wms.scan
item.read | batch.read | serial.read
report.read
```

### 4.2 Proposed new codes (needed by the matrix — flag for backend seed)

```
warehouse.layout.manage        # layout designer create/apply/delete
warehouse.location_qr.manage   # generate/print location QR
device.manage                  # device registry CRUD
stock_entry.approve            # approve / reject a receiving slip (NOT plain edits)
pick_list.verify               # gate verification step
return.putaway                 # generate return put-away
report.export                  # export/download reports
```

### 4.3 Role → permission pattern (for the Role creation dialog / backend seed)

| Role | Display name (seed) | Permission patterns |
| --- | --- | --- |
| `org_owner` | Organization Owner | `*.*` (or explicit full set) |
| `wms_manager` | WMS Manager | `warehouse.read`, `warehouse.update`, `warehouse.manage`, `warehouse.layout.manage`, `warehouse.location_qr.manage`, `pick_list.*`, `asn_order.*`, `stock_entry.*`, `inbound_exception.*`, `return.*`, `device.*`, `report.*`, `item.read`, `batch.read`, `serial.read` |
| `wms_supervisor` | WMS Supervisor | `warehouse.read`, `asn_order.read/create/update`, `stock_entry.read/create/update/approve`, `inbound_exception.read/create`, `pick_list.read/create/update/verify`, `return.read/register/approve/putaway`, `item.read`, `batch.read`, `serial.read` |
| `wms_operator` | WMS Operator | `warehouse.read`, `asn_order.read`, `stock_entry.read/create/update` ¹, `inbound_exception.read/create`, `pick_list.read/update/verify`, `return.read/register`, `wms.scan`, `item.read`, `batch.read`, `serial.read` |
| `asn_coordinator` | ASN Coordinator | `asn_order.*`, `warehouse.read`, `stock_entry.read`, `pick_list.read`, `item.read` |
| `returns_officer` | Returns Officer | `return.*`, `stock_entry.read/update`, `warehouse.read`, `item.read` |
| `inventory_controller` | Inventory Controller | `stock_entry.read/create/update/manage`, `warehouse.read`, `item.read`, `batch.read`, `serial.read` |
| `gate_officer` | Gate Officer | `pick_list.read/verify/update`, `warehouse.read` |
| `wms_viewer` | WMS Viewer | *(all)*`.read` |
| `device_admin` | Device Admin | `device.manage`, `warehouse.read`, `warehouse.manage` |

> ¹ Operator `stock_entry.update` covers **put-away execution only**. Receiving
> approval/rejection uses `stock_entry.approve`, which operators do not get —
> the backend must gate approve/reject on that code (not on `stock_entry.update`)
> for the matrix in §3.3 to hold.

---

## 5. Mapping to `@horizon-sync/access` (implemented)

Four rules live in `libs/shared/access/src/modules/wms.ts`. Each matches on its
**role name** — permission-code matchers cannot separate the tiers, because every
seeded WMS role holds the `warehouse.*` wildcard. The owner additionally matches by
user type.

| Rule id | priority | Matchers | Grants |
| --- | --- | --- | --- |
| `org_owner` | 100 | `userTypes: ['system_admin','organization_admin']`, `roles: ['Organization Owner','Organization Admin','WMS Admin']` | `defaultGrant: '*'` — every action on every resource |
| `wms_manager` | 80 | `roles: ['WMS Manager']` | full operations + configuration + irreversible stock decisions |
| `wms_supervisor` | 60 | `roles: ['WMS Supervisor']` | execute + reversible approvals; **no** config, **no** `dispose`/`manage` |
| `wms_operator` | 40 | `roles: ['WMS Operator']` | execute-only; create/raise but never approve |

Resource actions distinguish **approval/finality** from plain edits:
`receiving.approve`, `receiving.reject`, `exceptions.dispose`, `shortages.close`,
`returns.approve`, `returns.dispose`, `returns.putaway`, `stock.manage`,
`gate.verify`, `dispatch.create`, `asn.arrive`, `putaway.execute`,
`picking.execute`, `packing.execute`, `reports.export`.

Verified by `libs/shared/access/src/__tests__/wms.test.ts` (`npx nx test access`).

---

## 6. Decisions (locked 2026-10-16)

1. **Supervisor write-off / dispose → NO.** Only the **Warehouse Manager** (and Org Owner)
   may dispose an inbound exception (write-off / return) or perform a stock adjustment.
   The Supervisor can still raise/triage exceptions and close the **shortage ledger**
   (non-destructive bookkeeping).
2. **Operator ASN creation → excluded.** Operators cannot create/confirm/close/cancel ASNs;
   they may only view an ASN and register a **vehicle arrival** against it.
3. **Operator stock entry → allowed.** Operators may create stock entries;
   reconciliation / adjustment stays Manager+.
4. **Gate verification → Operator can execute.** `gate.verify` is an execute-level action
   for Supervisors **and** Operators; the dispatch record is created as part of verification.
5. **Existing role names kept.** `WMS Manager`, `WMS Supervisor`, `WMS Operator`,
   `Organization Owner` (+ legacy `WMS Admin`) are reused as the matching role names —
   no renames of seeded roles.
6. **Warehouse scoping is backend-enforced.** The front-end rule controls *capability*
   only; *which* warehouses a user may act on is enforced by the API. `All` vs `Assigned`
   in this document is a backend policy, not a front-end check.

### 6.1 Consequence: the Manage tab is Manager/Owner-only

The Manage tab (workers, devices, layout designer, location tree, 3D view, location QR)
is a single UI surface, so its visibility follows one capability (`manage.view`) and is
shown to **Org Owner** and **Warehouse Manager** only. Section 3.1 was updated accordingly
(supervisors/operators can no longer reach tree/3D). If floor staff need the read-only 3D
map later, promote it to its own **"Warehouse Map"** view — a separate UI change, not part
of this rule set.

### 6.2 Implementation

The four rules are implemented in `libs/shared/access/src/modules/wms.ts`
(ids `org_owner` / `wms_manager` / `wms_supervisor` / `wms_operator`) and covered by
`libs/shared/access/src/__tests__/wms.test.ts`. Resource-level `actions` now distinguish
approval/finality from plain edits — e.g. `receiving.approve`, `exceptions.dispose`,
`returns.dispose`, `stock.manage`, `gate.verify`, `dispatch.create`, `asn.arrive`.

---

## 7. Security note

As with the access engine generally, this matrix is a **UI/UX contract**, not the
security boundary. Every action must still be authorized server-side; the front-end
uses these rules only to decide what to render and enable.
