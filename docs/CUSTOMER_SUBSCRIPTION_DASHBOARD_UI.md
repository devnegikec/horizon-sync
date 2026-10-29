# Customer Subscription Dashboard — Implementation Notes

Customer-facing subscription/billing UI, built in **`apps/platform`** (the
organization dashboard) against the deployed Core `/api/v1/account/*` endpoints.
Implements `docs/SUBSCRIPTION_CUSTOMER_DASHBOARD_INTEGRATION.md`.

## Entry points

| Where | Route | Notes |
| --- | --- | --- |
| Sidebar → **Subscriptions** | `/subscriptions` | Now renders the real dashboard (`pages/subscription.tsx`); the legacy demo page is no longer routed. |
| **Settings → Subscription & Credits** | `/settings?tab=subscription` | Same dashboard embedded as a settings tab for organization admins. |

Both are inside the platform `PermissionGuard` (`subscription.read` / `org.read`
/ `*.*`).

## Screens

`features/subscription/components/SubscriptionSettings.tsx` is the container:

- **Header** — plan name, version, status pill, *Buy credits* and *Change plan* actions.
- **Status banners** — `pending_activation_payment`, `overdue` (with grace date), `suspended`, `closed`.
- **Overview tab** — plan facts (cadence, next invoice, renewal, credits per
  period, ID weight, billing anchor/timezone, payment status, contract
  effective date) + credits widget (available, ≈ IDs available, reserved, used
  this period, expiry summary).
- **Credits tab** — balance cards, expiry timeline + 30/60/90-day buckets,
  paginated batch history, paginated ledger with a type filter.
- **Invoices tab** — paginated invoice history with status filter; download
  icon only when the API returns `download_url`.

Amounts render from API decimal strings (digit grouping + truncation, no float
math). `CreditQuantity` shows 2dp with the exact 6dp value in a tooltip.

## Buying credits (top-up)

`components/BuyCreditsDialog.tsx` implements the documented three-step flow:

1. **Amount** — quick amounts (1k / 5k / 10k / 25k) or a custom value (up to 6dp).
   `POST /account/topups/quotes { credits }` returns server-side price, tax,
   total, quote expiry and credit expiry.
2. **Quote review** — shows subtotal, tax, total, credit validity and quote
   expiry before any payment.
3. **Order** — `POST /account/topups/orders` with an `Idempotency-Key` derived per
   quote (retry-safe). If `checkout_url` is present it opens in a new tab, then
   the dialog polls `GET /account/topups/orders/{order_id}` every 2s for 60s and
   only reports success on `status === "paid"`. The redirect alone never grants
   credits.

Purchase is available only when the user holds `billing.topup`,
`billing.manage` or `qr_product.manage` **and** the subscription reports
`can_top_up = true` (hidden when suspended).

## When the organization has no subscription

`GET /account/subscription` returns **404** until an `organization_subscriptions`
row exists. The UI treats that as a normal empty state (no error toast) and shows
**No subscription yet** with two paths:

- **Ops user signed in** (`system_admin.billing_create|billing_manage|*.*`):
  *Set up subscription* opens a form that lists published plan versions and
  creates the subscription with anchor day, billing timezone, activation fee and
  the activation-required flag (via the existing admin endpoint).
- **Organization admin** (no `system_admin.*` permissions): *Request activation*
  opens a prefilled email to `billing@ciphercode.ai` containing the organization
  ID, so operations can assign a plan and issue the activation invoice.

**Backend gap:** the deployed Core API has no customer self-serve subscribe
endpoint — `POST /admin/organizations/{org_id}/subscription` requires
`system_admin.billing_create`, and `/account/*` only exposes reads plus top-ups.
To make self-serve possible, Core should add:

```http
POST /api/v1/account/subscription
Authorization: Bearer <org JWT>
Idempotency-Key: <uuid>

{ "plan_version_id": "…", "billing_anchor_day": 1,
  "billing_timezone": "Africa/Lagos", "activation_fee": "2500.00",
  "activation_fee_required": true }
```

Scope the organization from the JWT (never the body), require `billing.manage`,
reuse the same service used by the admin route, and return the created
subscription. A public `GET /account/plans` (published versions only) is also
needed so customers can choose a plan.

## Activation payment (temporary — test mode)

A subscription in `pending_activation_payment` shows an **Activate subscription**
button in the overview banner. It opens `ActivateSubscriptionDialog`, which:

- shows the plan and the activation fee from the API;
- offers a simulated mock method (test card / bank transfer);
- calls `DummyPaymentService.processActivationPayment()` — a 1.2s simulated
  settlement that writes a record to `localStorage`
  (`ciphercode:dummy-activation:<org_id>`) and returns a `DUMMY-…` reference.

`useAccountBilling` overlays that record onto the API response, so the banner
clears and the plan renders as `active` immediately. **No card is charged and no
provider is contacted.** `clearDummyActivation(orgId)` in
`services/dummy-payment.service.ts` resets the test state.

### Why credits stay at zero without the overlay

`GET /account/credits` is unchanged by the local payment (the server still sees
`pending_activation_payment`, and may reject the call). More importantly, by
design **activation grants no credits** — credit batches are issued by a paid
recurring invoice or a top-up. So the test activation also records a simulated
grant of `included_credits_per_period` (fallback `1000`) with a 12-month expiry:

- `buildDummyCredits()` supplies the `/account/credits` shape (available,
estimated IDs, earliest expiry);
- `buildDummyGrant()` supplies a synthetic batch (`source_type: promo`) and a
`grant` ledger row;
- `CreditsPanel` prepends both and adds the expiry to the timeline.

Real server credits always win: the overlay only applies when the API returns
`available` of zero (or the call fails).

Replace `DummyPaymentService` and the overlay in `useAccountBilling` once Core
exposes a customer activation endpoint + verified provider webhook
(`POST /api/v1/account/subscription/activate`).

## Changing the plan

There is **no customer-facing plan-change endpoint** in the deployed API
(verified against `https://dev-core-api.ciphercode.ai/openapi.json`); plan
mutation is ops-only (`PATCH /admin/organizations/{org_id}/subscription`
requiring `system_admin.billing_update`). The UI therefore has two modes:

- **Ops user signed in** (`system_admin.billing_update|billing_manage|*.*`):
  the dialog loads published plans and schedules an effective-dated version
  change with a required reason.
- **Organization user** (`billing.manage` or any other role): the dialog shows
  the current plan and a prefilled **Request plan change** email to
  `billing@ciphercode.ai` — no fake write is attempted.

## Permissions

| Capability | Codes checked |
| --- | --- |
| Open the dashboard | `subscription.read` or `org.read` (route guard) |
| Buy credits | `billing.topup`, `billing.manage`, `qr_product.manage`, `*.*` |
| Real plan change (ops) | `system_admin.billing_update`, `system_admin.billing_manage`, `*.*` |

API calls are organization-scoped by the JWT; the client never sends an
`organization_id`.

## Files

```
apps/platform/src/app/
  features/subscription/
    types.ts                                  # mirrors deployed account schemas
    services/account-billing.service.ts       # typed client, Idempotency-Key, error codes
    hooks/useAccountBilling.ts                # subscription + credits, 60s credit poll
    components/
      BillingFormat.tsx                       # Money / CreditQuantity / StatusPill / dates
      SubscriptionSettings.tsx                # header, tabs, dialogs
      PlanOverview.tsx                        # banners, plan facts, credits widget
      CreditsPanel.tsx                        # balances, expiry, batches, ledger
      InvoicesPanel.tsx                       # invoice history
      BuyCreditsDialog.tsx                    # quote → order → poll
      ChangePlanDialog.tsx                    # ops form or request guidance
  pages/subscription.tsx                      # /subscriptions page wrapper
  pages/settings.tsx                          # Subscription & Credits tab (+ ?tab= support)
```

## Known gaps

- `GET /account/invoices/{id}/download` is not deployed; the download action is
  rendered only when `download_url` is returned by the list API.
- Customer plan changes require Ciphercode operations (no customer API).
- `/admin/organizations/{id}/credits/batches` is not deployed; the customer
  batches endpoint (`/account/credits/batches`) is used instead.
