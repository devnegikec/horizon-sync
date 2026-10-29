# Subscription Admin UI — Implementation Notes

Admin console screens for the Ciphercode **Subscription, Billing & Credit** model.
Consumes the Phase-1 APIs described in `docs/SUBSCRIPTION_PLAN_API_IMPLEMENTATION.md`
and implements the screens in `docs/SUBSCRIPTION_ADMIN_UI_INTEGRATION.md`.

## Routes (`apps/admin`)

| Route                                | Screen                               | File                                          |
| ------------------------------------ | ------------------------------------ | --------------------------------------------- |
| `/subscriptions`                     | Redirect → plan list                 | `AppRoutes.tsx`                               |
| `/subscriptions/plans`               | Plan catalog                         | `pages/SubscriptionPlansPage.tsx`             |
| `/subscriptions/plans/:planId`       | Plan detail + version timeline/editor | `pages/SubscriptionPlanDetailPage.tsx`        |
| `/subscriptions/customers`           | Organization list + subscription status, **New subscription** | `pages/SubscriptionCustomersPage.tsx` |
| `/subscriptions/customers/:orgId`    | Customer subscription, credits, ledger | `pages/OrganizationSubscriptionPage.tsx`     |
| `/subscriptions/exposure`            | Cross-tenant credit exposure          | `pages/SubscriptionExposurePage.tsx`          |
| `/subscriptions/reconciliation`      | Invoice/payment/batch findings        | `pages/SubscriptionReconciliationPage.tsx`    |

A shared tab bar (`components/subscription/SubscriptionNav.tsx`) links Plans / Customers /
Credit exposure / Reconciliation on every top-level subscription screen.

Sidebar entries (`components/Sidebar.tsx`): **Subscriptions**, **Credit Exposure**,
**Reconciliation** — all gated by `requiredDomain: 'billing'`.

## Permissions

| Capability                    | Permission                              |
| ----------------------------- | --------------------------------------- |
| Read every screen             | `system_admin.billing_read`             |
| Create plan / version         | `system_admin.billing_create`           |
| Approve / publish / retire; assign, activate, suspend, change version; credit adjustments | `system_admin.billing_update` |

Write actions are **hidden** (not disabled) when the permission is absent.

## Core files

```
apps/admin/src/app/
  services/subscription.service.ts   # typed API client, Idempotency-Key, error codes
  hooks/useIdempotencyKey.ts         # key per payload fingerprint (retry-safe)
  types/subscription.types.ts
  components/subscription/
    SubscriptionUI.tsx               # Money / CreditQuantity / badges / dates / CSV
    SubscriptionNav.tsx              # Plans / Customers / Exposure / Reconciliation tabs
    CreatePlanDialog.tsx
    PlanVersionDialog.tsx            # highly configurable version editor
    PublishVersionDialog.tsx         # publish + retire
    AssignPlanDialog.tsx             # create subscription from a published version
    ActivateSubscriptionDialog.tsx   # verified-payment activation only
    ChangeVersionDialog.tsx          # effective-dated version change with diff
    SubscriptionActionDialog.tsx     # suspend / reinstate / close (reason required)
    CreditAdjustmentDialog.tsx
```

## How to provision a new subscription

A subscription cannot exist without a **published plan version**, so the flow is:

1. **Plans → New plan** — create the plan container (code, name, currency, scope).
2. **Plan detail → New version** — set cadence, fee, tax, included credits and ID weight; save the draft.
3. **Approve** the draft, then **Publish** it (type the plan code to confirm).
4. **Customers → New subscription** — pick an organization (searchable) and the published
   version, set the billing anchor day/timezone and activation fee.
5. On the customer screen, **Mark activation paid** with the verified provider reference to
   move the subscription from `pending_activation_payment` to `active`.

Entry points: the **New subscription** button on the Plans header, the **New subscription**
button on the Customers screen (organization picker inside the dialog), and the inline
**Create** action on any customer row that has no subscription yet. `AssignPlanDialog`
accepts an optional `organizationId` — when omitted it renders the organization picker.

## Behavioural guarantees

- **Decimals stay strings.** `Money` and `CreditQuantity` render the raw API string
  (digit grouping + truncation only); no `parseFloat` math is used to display values.
- **Idempotency.** Every mutation sends `Idempotency-Key`; the key is derived from the
  payload fingerprint so retrying the same payload reuses the key while edits get a new one.
- **No free-text "paid" toggle.** Activation requires a provider reference, amount and an
  explicit "I verified this payment" confirmation.
- **Version lifecycle.** Draft → Approve → Publish → Retire. Publish requires typing the
  plan code; effective dates are immutable after publish.
- **Version changes are effective-dated** and show a before/after diff of price, credits
  and ID weight; prior usage keeps its original weight.
- **Adjustments are ledger entries**, never balance updates; positive adjustments require
  an expiry, negative adjustments are blocked client-side when they would go below zero
  (server still returns `422 INSUFFICIENT_BALANCE`).
- **Domain errors** (`402`, `409`, `422`) surface via `SubscriptionApiError.message`, which
  maps known codes (`VERSION_NOT_DRAFT`, `EFFECTIVE_RANGE_OVERLAP`, `ID_WEIGHT_INVALID`,
  `INSUFFICIENT_BALANCE`, …) to actionable text.

## API endpoints consumed

```
GET  /api/v1/admin/subscription-plans
POST /api/v1/admin/subscription-plans
GET  /api/v1/admin/subscription-plans/{plan_id}
POST /api/v1/admin/subscription-plans/{plan_id}/versions
PATCH/api/v1/admin/subscription-plans/{plan_id}/versions/{version_id}
POST /api/v1/admin/subscription-plans/{plan_id}/versions/{version_id}/approve|publish|retire
GET|POST|PATCH /api/v1/admin/organizations/{org_id}/subscription
POST /api/v1/admin/organizations/{org_id}/subscription/activate|suspend|reinstate|close
GET  /api/v1/admin/subscriptions/exposure
GET  /api/v1/admin/subscriptions/reconciliation
POST /api/v1/admin/credits/adjustments
GET  /api/v1/admin/organizations/{org_id}/credits/batches
GET  /api/v1/qr-credits/organizations/{org_id}[/ledger]
```

## Environment

The app reads `NX_API_CORE_URL` (see `apps/admin/src/environments/environment.ts`).
Dev default in `.env.local`:

```
NX_API_BASE_URL=https://dev-identity-api.ciphercode.ai
NX_API_CORE_URL=https://dev-core-api.ciphercode.ai
```

Run locally with `npx nx serve admin` (port 4300).

## Known follow-ups

- Plan **scope** filtering (`Global` / `Organization`) is applied client-side because the
  list endpoint only accepts `organization_id`; move it server-side when the API exposes a
  `scope` filter.
- `GET /admin/organizations/{org_id}/credits/batches` degrades gracefully (empty list) if
  the endpoint is not yet deployed to an environment.
- Reconciliation row actions ("rebuild projection", "release reservation") are surfaced as
  suggested actions only; they await dedicated endpoints.
