# QSeal Migration Plan

Prepared for: Leadership / Stakeholder Sign-off
Status: Pending Review

---

## Objective

Migrate the QSeal platform from a Django monolith to a modern microservices backend (FastAPI) with a React micro-frontend architecture, using PostgreSQL as the primary database.

The migration covers only actively used features. Unused modules (Certificate Service, Track & Trace) are excluded to keep scope focused and timeline realistic.

---

## What We Are Migrating

| Module                       | Migrate? | Notes                               |
| ---------------------------- | -------- | ----------------------------------- |
| Product Management           | Yes      | Core feature                        |
| Block / QR Generation        | Yes      | Core feature                        |
| SKU QR Customization         | Yes      | Simplify to global setting          |
| Analytics                    | Yes      | Move from Metamo to in-house        |
| Activation Module            | Yes      | Web + Android app support           |
| Campaign & Coupon System     | Yes      | Scan2Win, Feedback2Win, etc.        |
| Messaging (SMS/WhatsApp/RCS) | Yes      | Keep existing provider integrations |
| Warranty                     | Yes      |                                     |
| Auth & User Management       | Yes      | Centralized JWT-based auth          |
| Certificate Module           | No       | No active users                     |
| Track & Trace                | No       | No active users                     |

---

## New Architecture

### Backend — FastAPI Microservices

Each service is independently deployable, has its own PostgreSQL database, and communicates via REST or async events.

```
API Gateway
    │
    ├── Auth Service
    ├── Tenant / Org Service
    ├── Product & QR Service
    ├── Campaign & Coupon Service
    ├── Messaging Service
    ├── Analytics Service (in-house, replaces Metamo)
    ├── Activation Service
    ├── Warranty Service
    └── Engagement Service (feedback, surveys, assessments)
```

### Frontend — React Micro-Frontend

A shell application hosts independent React modules, each owned by the corresponding backend service team.

```
Shell App (routing, auth context, navigation)
    │
    ├── Auth Module
    ├── Dashboard / Analytics Module
    ├── Product & QR Module
    ├── Campaign Module
    ├── Messaging Module
    ├── Warranty Module
    └── Activation Module
```

### Database

- PostgreSQL per service (logical separation)
- Multi-tenancy via `tenant_id` column (replaces current schema-per-tenant approach)
- Shared `tenants` database for auth and tenant resolution

### Key Infrastructure Changes

| Current                                   | New                                                   |
| ----------------------------------------- | ----------------------------------------------------- |
| Django monolith                           | FastAPI microservices                                 |
| Schema-per-tenant (django-tenant-schemas) | tenant_id column isolation                            |
| Metamo (external analytics)               | In-house analytics service                            |
| Google API for GPS conversion             | In-house reverse geocoding or lightweight alternative |
| Django templates (server-rendered UI)     | React micro-frontend                                  |
| Brand entity with key pairs               | Key pairs at Organization level                       |
| Celery + RabbitMQ (shared)                | Per-service Celery workers or event-driven consumers  |

---

## Migration Phases

### Phase 1 — Foundation

- Finalize database design for all active modules
- Set up API Gateway
- Build Auth Service (login, JWT, OTP, tenant resolution)
- Set up React shell app with routing

Deliverable: Working auth flow end-to-end on new stack

### Phase 2 — Core Product & QR

- Migrate Product, Block, QR Generation service
- Migrate SKU customization (as global setting)
- Connect to React Product module

Deliverable: Products can be created and QRs generated on new stack

### Phase 3 — Campaign & Coupon

- Migrate Campaign, Lead, Coupon service
- Migrate Shopify coupon sync
- Connect to React Campaign module

Deliverable: Campaigns live on new stack

### Phase 4 — Messaging & Analytics

- Migrate SMS, WhatsApp, RCS messaging service
- Build in-house Analytics service (replaces Metamo)
- Migrate scan data ingestion and reporting

Deliverable: Messaging and analytics on new stack, Metamo decommissioned

### Phase 5 — Remaining Services

- Warranty service
- Activation service (web + Android API)
- Engagement service (feedback, surveys, assessments)

Deliverable: All active features migrated

### Phase 6 — Cutover & Decommission

- Run old and new systems in parallel (shadow mode)
- Validate data integrity
- Switch DNS / traffic to new system
- Decommission Django monolith
