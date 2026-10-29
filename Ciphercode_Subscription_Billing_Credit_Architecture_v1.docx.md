# **Subscription, Billing & Credit Management**

## *Ciphercode Enterprise Platform | Engineering Architecture & Test Reference*

Version 1.0  •  17 October 2026  •  Owner: Product & Engineering  •  Classification: Confidential

Design intent: implementation-ready functional and technical baseline. Items marked DECISION REQUIRED must be approved before production deployment.

# **1\. Scope and architecture decisions**

In scope: enterprise tenant onboarding, activation fee, customer-specific package and prices, monthly/annual invoice schedules, payment reconciliation, time-limited credit grants, weighted QR/ID consumption, top-ups, invoices, reports, alerts and operations administration. Out of scope: accounting general ledger, taxation engine, physical QR security, and refund-to-bank execution (handled by payment provider).

* Tenant isolation: every record and authorization decision is scoped by tenant\_id.  
* Billing and credit services are logically separate; use a single database initially if appropriate, but enforce service boundaries and atomic ledger writes.  
* Never grant credits on browser redirects or unverified webhook messages; grant only after server-side verified payment settlement/success per provider contract.  
* Ledger is authoritative; displayed balance is a derived/materialized projection, rebuildable from ledger and allocations.  
* Use fixed-point DECIMAL (not floating point) for weighted credit quantities and money.

# **2\. Actors and permissions**

| Actor | Permissions |
| :---- | :---- |
| **Ciphercode Operations Admin** | Create tenant, configure plan/prices/ID weight, suspend service, view transactions, initiate approved adjustments |
| **Finance Admin** | Manage invoice lifecycle, reconciliation, refunds/credit notes and exports |
| **Customer Account Admin** | View billing, pay invoices, purchase credits, download invoices and reports |
| **Customer Viewer** | Read-only dashboard and reports |
| **Identity Generation Service** | Authorized, metered consume/reverse operations only |

# **3\. Commercial configuration model**

| Parameter | Type / rule |
| :---- | :---- |
| **Activation fee** | One-time, configured per tenant; payment required to activate account |
| **Plan / package** | Versioned plan\_id and tenant-specific contract version |
| **Billing cadence** | MONTHLY or ANNUAL; billing anchor and timezone stored |
| **Recurring fee** | Currency, price before tax, applicable tax configuration, due date |
| **Included credits** | Grant quantity per successfully paid invoice; annual grant policy configurable |
| **ID weight** | Positive decimal credits per generated ID; e.g. 0.5, 1, 2; versioned effective date |
| **Top-up products** | Price, grant quantity, currency, validity; configurable per tenant |
| **Credit validity** | 12 calendar months from issuance timestamp; expiry at same local time (clamp end-of-month), store UTC |
| **Overage / grace** | Default deny issuance if insufficient credits; no negative balance |
| **Notifications** | Invoice issued/due/overdue, payment confirmed, low balance, upcoming expiry |

DECISION REQUIRED: whether annual prepaid plans grant all credits at payment or release monthly entitlements; recommended: monthly scheduled release against a paid annual contract if monthly allocation is intended. Decide whether activation fee is separate from first recurring invoice, taxes, credit note rules, and whether credits are transferable (default: no).

# **4\. Lifecycle and state machines**

## **4.1 Tenant activation**

DRAFT → PENDING\_ACTIVATION\_PAYMENT → ACTIVE after verified activation payment → SUSPENDED (manual/risk) or PAST\_DUE (billing policy) → CLOSED. Activation payment alone does not imply recurring invoice payment or grant recurring credits.

## **4.2 Invoice and payment**

Invoice: DRAFT → ISSUED → PARTIALLY\_PAID / PAID / OVERDUE / VOID; credit notes adjust settled value, never erase invoice history. Payment: CREATED → PENDING → SUCCEEDED / FAILED / CANCELLED / REFUNDED / DISPUTED. Use provider reference and immutable event history.

## **4.3 Credit allocation**

On verified eligible payment, issue an allocation batch with granted, consumed, expired, reversed quantities, issued\_at, expires\_at and source\_invoice/payment. Available quantity \= granted − consumed − expired − reversed. Allocation state: ACTIVE → EXHAUSTED or EXPIRED. Do not mutate past issuance records to represent consumption.

# **5\. Primary workflows**

## **5.1 Onboard and activate**

Ops creates tenant and versioned contract → activation invoice/payment link generated → customer pays → provider webhook signature verified \+ provider transaction confirmed → payment recorded once → activation marked complete → tenant becomes ACTIVE → recurring billing schedule begins at configured anchor. No credit grant unless contract explicitly includes activation credits.

## **5.2 Recurring billing**

Scheduler creates exactly one invoice per tenant \+ billing period \+ contract version; tax and prices snapshot at issue time → notify customer → collect payment → verify and reconcile → mark invoice paid → issue included credit batch once → update dashboard and receipt. Failed payment keeps invoice unpaid and does not grant credits. Retrying jobs must not duplicate invoices or grants.

## **5.3 Customer top-up**

Dashboard → Account → Buy Credits → choose available top-up → server quotes price/tax/credits/expiry → customer confirms → payment intent → verified success → exactly one top-up allocation → updated balance and downloadable receipt/invoice. Quote must expire and be bound to tenant, price version and currency.

## **5.4 Generate IDs / QR codes**

Identity service requests reserve/consume for a uniquely identified generation operation → ledger engine locks eligible allocations → consumes earliest-expiring credits first (FEFO) across batches → commits debit and generation authorization atomically → generates/returns IDs. Retries with same operation key return same result; do not debit again. For asynchronous bulk generation use reservation → finalize, with automatic reservation expiry and release on failure.

## **5.5 Expiry and reversal**

Scheduled expiry posts a ledger EXPIRE transaction for remaining available units of each batch at expires\_at. Concurrent generation and expiry must serialize on batch locks. If generation fails before durable issue, reverse its reservation/debit with an explicit linked transaction. Refunds/chargebacks trigger a controlled entitlement review; do not silently delete consumed credits.

# **6\. Ledger rules and worked example**

Authoritative transaction types: GRANT, CONSUME, RESERVE, RELEASE, EXPIRE, ADJUST\_POSITIVE, ADJUST\_NEGATIVE, REVERSAL. Ledger entries include tenant, batch, quantity, type, source reference, idempotency key, actor, timestamp and reason. Every allocation and transaction is append-only; corrections are compensating entries.

| Event | Available credits | Explanation |
| :---- | :---- | :---- |
| **Jan 1: grant 1,000** | 1,000 | Batch A expires next Jan 1 |
| **Jan 10: 100 IDs × weight 0.5** | 950 | Debit 50 from A |
| **Feb 1: grant 1,000** | 1,950 | Batch B independent expiry |
| **Feb 5: 100 IDs × weight 2** | 1,750 | Debit 200 from A first |
| **Next Jan 1: expire A remainder** | 1,000 | A has 750 remaining; B remains valid (assuming no other activity) |

Important: weight changes apply only to future generation operations, not historical debits. Snapshot the weight and contract version on every operation. Prevent fractional rounding drift with DECIMAL(20,6) or an integer microcredit unit (1 credit \= 1,000,000 microcredits).

# **7\. Logical data model**

| Entity | Core fields / constraints |
| :---- | :---- |
| **tenants** | id, legal\_name, status, timezone, currency, activated\_at |
| **users / memberships** | user\_id, tenant\_id, role, status; RBAC |
| **plans / contract\_versions** | plan\_id, tenant\_id, cadence, fee, included\_credits, id\_weight, effective\_from/to, approved\_by |
| **invoices / invoice\_lines** | invoice\_id, tenant\_id, period\_start/end, number, status, subtotal, tax, total, due\_at; UNIQUE(tenant,period,type) |
| **payments / provider\_events** | payment\_id, invoice\_id, provider, provider\_ref UNIQUE, status, amount, verified\_at; event\_id UNIQUE |
| **credit\_batches** | batch\_id, tenant\_id, source\_type/id UNIQUE, granted\_qty, issued\_at, expires\_at |
| **credit\_ledger** | entry\_id, tenant\_id, batch\_id, type, qty, operation\_id, idempotency\_key, occurred\_at |
| **generation\_operations** | operation\_id UNIQUE per tenant, count, weight\_snapshot, debit\_qty, status, generated\_count |
| **topup\_orders** | order\_id, quote\_version, amount, credits, invoice\_id, status |
| **audit\_log / outbox** | actor, before/after, reason, request\_id, event\_type, published\_at |

Index tenant\_id \+ expires\_at for FEFO, tenant\_id \+ occurred\_at for reporting, and invoice due dates for billing jobs. Keep tenant\_id in every child record and validate tenant ownership in foreign-key/service logic. Use transactional outbox for durable dashboard/notification events.

# **8\. Service interfaces (illustrative REST)**

| Endpoint | Purpose |
| :---- | :---- |
| **POST /ops/tenants** | Create tenant and activation configuration |
| **PUT /ops/tenants/{id}/contracts** | Create future-effective contract version; approval required |
| **GET /account/subscription** | Current package, renewal, weight, payment status |
| **GET /account/credits** | Available, reserved, expiring soon and batch history |
| **GET /account/invoices** | Paginated invoice history; signed download URLs |
| **POST /account/topups/quotes** | Price/tax/credit quote |
| **POST /account/topups/orders** | Create idempotent checkout order |
| **POST /payments/webhooks/{provider}** | Signature verify, deduplicate, reconcile |
| **POST /internal/credits/reserve** | Reserve weighted quantity for generation |
| **POST /internal/credits/commit** | Finalize generated IDs and debit |
| **POST /internal/credits/release** | Release failed/unused reservation |
| **GET /account/reports/credits** | CSV export with filters and audit IDs |

All mutation endpoints require Idempotency-Key, authenticated actor/service identity, tenant authorization, input validation and request tracing. Pagination and filters mandatory for histories. Return 409 for conflicting operations, 402/409 for insufficient credits, and stable machine-readable error codes.

# **9\. Interface requirements**

## **Customer dashboard**

* Account overview: subscription status, plan, billing cadence, next invoice/due date, current ID weight, available and reserved credits.  
* Credits widget: total available, expiring in 30/60/90 days, recent grants/usage, earliest expiry, usage trend.  
* Billing: invoices, status, line-item taxes, payment links, receipts and downloadable PDFs.  
* Buy Credits: available top-up options, total payable, expiry disclosure, payment status and confirmation.  
* History/reporting: filter by date, event, source, credit batch, user; export CSV/PDF as applicable.

## **Operations console**

* Tenant onboarding wizard and activation payment configuration; draft/publish contract version with approval and audit.  
* Plan/price/weight overrides; effective-dated changes, no retroactive mutation of issued invoices or prior usage.  
* Invoice/payment reconciliation, failed webhook retry, dispute/refund queue, credit adjustments with reason and dual approval.  
* Tenant credit exposure, expiring balances, invoice aging, failed jobs, reconciliation discrepancies and audit exports.

# **10\. Security, compliance and reliability**

* Payment card details remain exclusively with PCI-compliant payment provider; platform stores tokens/references, not PAN/CVV.  
* Validate webhook signatures, timestamps, replay windows, event IDs and transaction amount/currency/tenant against server-side order.  
* RBAC \+ least privilege, tenant isolation, encrypted secrets and PII, immutable audit trails, signed short-lived report URLs.  
* Invoice numbers unique per legal entity/series; retain tax documents and evidence per applicable jurisdiction; tax rules reviewed by finance/legal.  
* Transactional row locking or serializable allocation for concurrent credit spends; no overspend under parallel workers.  
* Background jobs with retries, dead-letter queue, observability and reconciliation against provider settlements and ledger totals.  
* Alert on negative balance, orphan payment, duplicate grant, allocation mismatch, stuck reservation, expired-credit spend and webhook failures.

# **11\. Acceptance tests and engineering verification**

| ID | Scenario / expected result |
| :---- | :---- |
| **T01** | Activation unpaid: tenant not ACTIVE; successful verified payment activates exactly once |
| **T02** | Same webhook 10 times: one payment transition and one grant only |
| **T03** | Monthly scheduler rerun: one invoice per period; invoice price snapshot stable |
| **T04** | Annual billing: allocation schedule follows approved annual grant policy |
| **T05** | 100 IDs at weight 0.5 / 1 / 2 debit 50 / 100 / 200 respectively |
| **T06** | Concurrent requests exceeding balance: at most available credits consumed; no negative balance |
| **T07** | FEFO: earliest-expiring batch consumed before later batch |
| **T08** | 12-month boundary and leap/end-month: expiry occurs at defined instant; no early/late usage |
| **T09** | Expired A \+ valid B: A expires without erasing B; aggregate reflects B |
| **T10** | Top-up paid: one new batch, correct credits/expiry; failure grants none |
| **T11** | Weight changed mid-cycle: past debits unchanged; new generation uses effective weight |
| **T12** | Generation retry/partial failure: no duplicate debit; unused reservation released |
| **T13** | Cross-tenant API/report attempt denied; no data leakage |
| **T14** | Payment mismatch / forged webhook: rejected and alerted |
| **T15** | Refund/dispute and admin adjustment: traceable compensating entries with approval |
| **T16** | Dashboard, ledger, batch balances and CSV exports reconcile exactly |
| **T17** | Overdue invoice and tenant suspension obey configured grace policy |
| **T18** | Recovery after worker crash between payment and grant: outbox retry issues grant once |

# **12\. Delivery plan and release gates**

Phase 1 — Foundations: schema, contract versioning, RBAC, activation, invoice lifecycle, provider sandbox integration and ledger. Phase 2 — Credit engine: FEFO, weighted consumption, reservation/finalization, expiry jobs, idempotency and concurrency tests. Phase 3 — Customer/ops UI: dashboards, top-ups, reports, alerts and approvals. Phase 4 — Hardening: reconciliation, load tests, recovery drills, security review and production rollout.

Release gates: (1) finance signs off commercial/tax/annual-grant policy; (2) architecture signs off ledger and locking design; (3) QA passes T01–T18 plus performance/load thresholds; (4) operations validates reconciliation and audit workflow; (5) production rollout uses feature flags, backups and rollback plan.

# **13\. Open decisions for product and finance**

* Confirm activation fee relation to first recurring invoice and subscription start date.  
* Define annual prepaid entitlement release (upfront versus monthly tranches).  
* Confirm 12-month expiry calendar/timezone convention and whether unused top-up credits have identical validity.  
* Define billing grace/suspension and behavior of previously paid valid credits during overdue periods.  
* Confirm taxes, currencies, invoice numbering, payment gateway, refunds, and legal-entity requirements.  
* Define whether weight may vary by ID type/SKU or only per tenant; default implementation is tenant-level effective-dated weight.  
* Define credit transfer, manual promotional credits, and customer-visible adjustments; default transfers disabled.