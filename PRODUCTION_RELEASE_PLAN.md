# Production Release Plan — Horizon Sync Platform

**Timeline:** May 11, 2026 – May 20, 2026 (10 days)
**Goal:** Ship all listed features to production with testing, bug fixes, and automation coverage.

---

## Feature Modules in Scope

| #   | Module                | Key Features                                                                                |
| --- | --------------------- | ------------------------------------------------------------------------------------------- |
| 1   | Auth & Registration   | Login, Register, Forgot Password, Reset Password, Register Organization, Session Restore    |
| 2   | Inventory             | Create Item, Item Groups, Warehouses, Stock Management (entries, movements, reconciliation) |
| 3   | Revenue               | Create Customer, Quotation, Sales Order, Pick List, Delivery Notes, Invoice, Payment        |
| 4   | Tax Templates         | Create/Edit/Delete tax templates, assign to items                                           |
| 5   | Organization Settings | Org profile, display settings, configuration                                                |
| 6   | User Profile          | Profile view/edit, avatar, password change                                                  |
| 7   | Role-Based Access     | Create roles, assign permissions, invite user, manage users                                 |
| 8   | QSeal                 | Create Brand, Products, QR Blocks, Analytics, Product Settings                              |

---

## 10-Day Sprint Plan

### Day 1 — May 11 (Sunday)

| Time Block | Task                                                                                   | Owner |
| ---------- | -------------------------------------------------------------------------------------- | ----- |
| Morning    | Smoke test all 8 modules on dev environment — identify broken flows                    | QA    |
| Morning    | Fix critical blockers: session restore, navigation, API URL issues                     | Dev   |
| Afternoon  | Auth module full manual test: login, register, forgot/reset password, org registration | QA    |
| Afternoon  | Fix auth bugs found                                                                    | Dev   |
| EOD        | Auth module signed off ✅                                                              | —     |

**Deliverable:** Auth & Registration fully functional, no blockers.

---

### Day 2 — May 12 (Monday)

| Time Block | Task                                                                                   | Owner |
| ---------- | -------------------------------------------------------------------------------------- | ----- |
| Morning    | Inventory module manual test: create item (multi-step), edit item, view detail, delete | QA    |
| Morning    | Test Item Groups CRUD, Warehouse CRUD                                                  | QA    |
| Afternoon  | Fix inventory bugs (form validation, API mapping, edit pre-fill)                       | Dev   |
| Afternoon  | Stock Management test: stock entries, movements, reconciliation                        | QA    |
| EOD        | Write unit tests for `useItemForm`, `useItemSubmission`, `apiItemToItem`               | Dev   |

**Deliverable:** Inventory module functional, unit tests for item creation flow.

---

### Day 3 — May 13 (Tuesday)

| Time Block | Task                                                   | Owner |
| ---------- | ------------------------------------------------------ | ----- |
| Morning    | Revenue module test: Create Customer, Quotation CRUD   | QA    |
| Morning    | Fix customer/quotation bugs                            | Dev   |
| Afternoon  | Revenue module test: Sales Order, convert to Pick List | QA    |
| Afternoon  | Fix sales order → pick list flow bugs                  | Dev   |
| EOD        | Revenue: Delivery Notes, Invoice, Payment flow test    | QA    |

**Deliverable:** Revenue module end-to-end flow working (Customer → Quotation → SO → Pick List → DN → Invoice → Payment).

---

### Day 4 — May 14 (Wednesday)

| Time Block | Task                                                 | Owner |
| ---------- | ---------------------------------------------------- | ----- |
| Morning    | Fix remaining revenue bugs from Day 3                | Dev   |
| Morning    | Tax Templates: create, edit, delete, assign to items | QA    |
| Afternoon  | Organization Settings: full test                     | QA    |
| Afternoon  | User Profile: view, edit, password change            | QA    |
| EOD        | Fix settings/profile bugs                            | Dev   |

**Deliverable:** Tax Templates, Org Settings, User Profile signed off.

---

### Day 5 — May 15 (Thursday)

| Time Block | Task                                                                          | Owner |
| ---------- | ----------------------------------------------------------------------------- | ----- |
| Morning    | Role-Based Access: create role, assign permissions                            | QA    |
| Morning    | Invite user, manage users (activate/deactivate)                               | QA    |
| Afternoon  | Test permission enforcement: restricted users can't access unauthorized pages | QA    |
| Afternoon  | Fix RBAC bugs                                                                 | Dev   |
| EOD        | Write unit tests for `usePermissions`, permission guard logic                 | Dev   |

**Deliverable:** RBAC fully functional, permission enforcement verified.

---

### Day 6 — May 16 (Friday)

| Time Block | Task                                                | Owner |
| ---------- | --------------------------------------------------- | ----- |
| Morning    | QSeal: Create Brand, verify key pair generation     | QA    |
| Morning    | QSeal: Create Product, link to brand                | QA    |
| Afternoon  | QSeal: Create QR Block, poll status, download Excel | QA    |
| Afternoon  | QSeal: Analytics dashboard, Product Settings        | QA    |
| EOD        | Fix QSeal bugs                                      | Dev   |

**Deliverable:** QSeal module fully functional.

---

### Day 7 — May 17 (Saturday)

| Time Block | Task                                                                      | Owner |
| ---------- | ------------------------------------------------------------------------- | ----- |
| Morning    | Write E2E automation tests for critical flows (see Automation Plan below) | Dev   |
| Afternoon  | Cross-browser testing: Chrome, Firefox, Safari                            | QA    |
| Afternoon  | Mobile responsive check on key pages (login, dashboard, inventory list)   | QA    |
| EOD        | Fix responsive/cross-browser issues                                       | Dev   |

**Deliverable:** Automation tests for critical paths, cross-browser issues resolved.

---

### Day 8 — May 18 (Sunday)

| Time Block | Task                                                                      | Owner |
| ---------- | ------------------------------------------------------------------------- | ----- |
| Morning    | Full regression test — all 8 modules end-to-end                           | QA    |
| Morning    | Performance check: page load times, API response times                    | Dev   |
| Afternoon  | Fix regression bugs                                                       | Dev   |
| Afternoon  | Security review: token handling, permission enforcement, input validation | Dev   |
| EOD        | All critical/high bugs resolved                                           | —     |

**Deliverable:** Full regression pass, security review complete.

---

### Day 9 — May 19 (Monday)

| Time Block | Task                                                     | Owner  |
| ---------- | -------------------------------------------------------- | ------ |
| Morning    | Staging deployment + smoke test on staging               | Dev/QA |
| Morning    | Fix staging-specific issues (env vars, CORS, API URLs)   | Dev    |
| Afternoon  | UAT (User Acceptance Testing) with stakeholders          | QA/PM  |
| Afternoon  | Fix UAT feedback items                                   | Dev    |
| EOD        | Staging signed off, production deployment plan finalized | —      |

**Deliverable:** Staging validated, UAT complete, deployment plan ready.

---

### Day 10 — May 20 (Tuesday)

| Time Block | Task                                              | Owner      |
| ---------- | ------------------------------------------------- | ---------- |
| Morning    | Production deployment                             | Dev/DevOps |
| Morning    | Production smoke test — all 8 modules             | QA         |
| Afternoon  | Monitor error logs, fix any production hotfixes   | Dev        |
| Afternoon  | Document known issues, create post-launch backlog | PM         |
| EOD        | **Production Live** 🚀                            | —          |

**Deliverable:** Production deployed and verified.

---

## Unit Testing Plan

| Module    | Files to Test                                                                           | Priority |
| --------- | --------------------------------------------------------------------------------------- | -------- |
| Auth      | `useAuth.ts`, `useLoginForm.ts`, `AuthSessionRestore.tsx`, `AuthGuard.tsx`              | Critical |
| Store     | `user-store.ts` (setAuth, clearAuth, persist/hydrate)                                   | Critical |
| Inventory | `useItemForm.ts`, `useItemSubmission.ts`, `item-mappers.ts`, `item-payload-builders.ts` | High     |
| Revenue   | `useSalesOrders.ts`, `useInvoiceManagement.ts`, `usePickListManagement.ts`              | High     |
| RBAC      | `usePermissions.ts`, permission utility functions                                       | High     |
| QSeal     | `useQSealProducts.ts`, `useQRProductSettings.ts`                                        | Medium   |
| Shared    | `apiRequest` (core.ts), error handling utilities                                        | Critical |

### Unit Test Coverage Targets

| Category                               | Target |
| -------------------------------------- | ------ |
| Auth & Session                         | 90%    |
| API utilities                          | 85%    |
| Form hooks (item, customer, quotation) | 80%    |
| Permission logic                       | 90%    |
| Mappers & payload builders             | 95%    |

---

## Automation Testing Plan (E2E)

**Tool:** Playwright (already configured via `apps/platform-e2e`)

### Critical Flows to Automate

| #   | Flow                     | Steps                                                                                                               | Priority |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------- | -------- |
| 1   | Login & Session Restore  | Login → navigate to page → refresh → verify still on same page                                                      | P0       |
| 2   | Registration + Org Setup | Register → create org → land on dashboard                                                                           | P0       |
| 3   | Create Item (full flow)  | Login → Inventory → Create Item → fill form → submit → verify in list                                               | P0       |
| 4   | Revenue Flow             | Create Customer → Create Quotation → Convert to SO → Create Pick List → Create DN → Create Invoice → Record Payment | P0       |
| 5   | RBAC Enforcement         | Login as restricted user → verify can't access admin pages → verify can access allowed pages                        | P1       |
| 6   | QSeal Block Generation   | Create Brand → Create Product → Generate QR Block → verify status polling → download                                | P1       |
| 7   | Forgot Password          | Submit forgot password → verify success message                                                                     | P2       |
| 8   | Item Edit                | Click edit on item → verify form pre-filled → modify → save → verify changes                                        | P1       |

### Automation Test Structure

```
apps/platform-e2e/src/
├── tests/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   ├── register.spec.ts
│   │   ├── session-restore.spec.ts
│   │   └── forgot-password.spec.ts
│   ├── inventory/
│   │   ├── create-item.spec.ts
│   │   ├── edit-item.spec.ts
│   │   └── stock-management.spec.ts
│   ├── revenue/
│   │   ├── customer-crud.spec.ts
│   │   ├── quotation-to-payment.spec.ts
│   │   └── pick-list-delivery.spec.ts
│   ├── rbac/
│   │   ├── role-creation.spec.ts
│   │   └── permission-enforcement.spec.ts
│   └── qseal/
│       ├── brand-product.spec.ts
│       └── qr-block-generation.spec.ts
├── fixtures/
│   ├── auth.fixture.ts
│   └── api.fixture.ts
└── pages/
    ├── LoginPage.ts
    ├── InventoryPage.ts
    ├── RevenuePage.ts
    └── QSealPage.ts
```

---

## Bug Severity Classification

| Severity      | Definition                                    | SLA                 |
| ------------- | --------------------------------------------- | ------------------- |
| P0 — Blocker  | Feature completely broken, no workaround      | Fix same day        |
| P1 — Critical | Major functionality broken, workaround exists | Fix within 24h      |
| P2 — Major    | Feature works but with significant UX issues  | Fix within 48h      |
| P3 — Minor    | Cosmetic issues, minor UX improvements        | Post-launch backlog |

---

## Bug Tracking Template

| ID      | Module    | Summary                                            | Severity | Status | Assigned | Found Date | Fixed Date |
| ------- | --------- | -------------------------------------------------- | -------- | ------ | -------- | ---------- | ---------- |
| BUG-001 | Auth      | Session restore fails on refresh                   | P0       | Fixed  | Dev      | May 11     | May 11     |
| BUG-002 | Auth      | getUserProfile double /api/v1 path                 | P0       | Fixed  | Dev      | May 11     | May 11     |
| BUG-003 | Auth      | Redirect to / instead of original page after login | P1       | Fixed  | Dev      | May 11     | May 11     |
| BUG-004 | Inventory | Edit form not pre-filled with full item data       | P1       | Fixed  | Dev      | May 11     | May 11     |

---

## Pre-Production Checklist

### Code Quality

- [ ] All lint errors resolved
- [ ] No TypeScript errors
- [ ] No console.log statements in production code (remove debug logs)
- [ ] All API endpoints use correct base URLs for production

### Security

- [ ] JWT tokens not stored in localStorage (access token in memory only)
- [ ] Refresh token persisted securely
- [ ] CORS configured correctly for production domain
- [ ] Input validation on all forms
- [ ] XSS prevention (no dangerouslySetInnerHTML with user input)
- [ ] Permission checks enforced on frontend routes

### Performance

- [ ] Lazy loading for route-level code splitting
- [ ] No unnecessary re-renders in list views
- [ ] Pagination implemented on all list endpoints
- [ ] Images optimized and lazy loaded

### Deployment

- [ ] Environment variables configured for production
- [ ] Build succeeds with production config
- [ ] Docker image builds successfully
- [ ] Nginx config serves SPA correctly (fallback to index.html)
- [ ] Health check endpoint accessible
- [ ] SSL/TLS configured

### Monitoring

- [ ] Error tracking configured (Sentry or equivalent)
- [ ] API response time monitoring
- [ ] Uptime monitoring on critical endpoints
- [ ] Alert thresholds set for error rates

---

## Risk Register

| Risk                                                           | Impact | Likelihood | Mitigation                                                 |
| -------------------------------------------------------------- | ------ | ---------- | ---------------------------------------------------------- |
| API endpoints not ready for all features                       | High   | Medium     | Coordinate with backend team daily, mock missing endpoints |
| Session restore fails in production (different domain/cookies) | High   | Medium     | Test on staging with production-like domain config         |
| Permission enforcement gaps                                    | High   | Low        | Dedicated RBAC testing day (Day 5)                         |
| QR block generation timeout in production                      | Medium | Medium     | Implement proper polling with timeout messaging            |
| Cross-browser CSS issues                                       | Low    | Medium     | Cross-browser testing on Day 7                             |

---

## Daily Standup Format

Each day at 9:00 AM:

1. What was completed yesterday?
2. What's planned for today?
3. Any blockers?
4. Bug count: Open / Fixed / Verified

---

## Sign-Off Criteria for Production

All of the following must be true:

1. ✅ All P0 and P1 bugs resolved
2. ✅ All 8 modules pass manual testing on staging
3. ✅ Critical E2E automation tests passing
4. ✅ Unit test coverage meets targets
5. ✅ Security checklist complete
6. ✅ UAT sign-off from stakeholders
7. ✅ Deployment runbook reviewed
8. ✅ Rollback plan documented
