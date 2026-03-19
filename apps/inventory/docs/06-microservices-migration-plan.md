# Microservices Migration Plan

## Target Architecture

- Backend: Independent microservices (Python/FastAPI or Node.js), each with its own PostgreSQL database
- Frontend: React micro-frontend (Module Federation or similar)
- API Gateway: Routes requests to the correct service
- Auth: Centralized auth service (JWT)
- Async: Each service owns its own Celery workers or event-driven via message broker (RabbitMQ / Kafka)
- Storage: Keep Google Cloud Storage, abstract behind a storage service or shared SDK
- Multi-tenancy: Move from schema-per-tenant to tenant_id column-based isolation (simpler to scale)

---

## Proposed Microservices

### 1. Auth Service

Extracted from: `app/api/authentication.py`, `app/api/views.py` (LoginView, LogoutView, OTP views)

Responsibilities:

- User login / logout
- Token issuance and validation (JWT)
- OTP generation and verification (email + mobile)
- Web registration
- Tenant context resolution (maps domain → tenant_id)

Database tables: `auth_user`, `authtoken_token`, `otp_records`

---

### 2. Tenant Service

Extracted from: `app/dashboard/`, `app/tenant_portal/`, `app/onboarding/`

Responsibilities:

- Tenant CRUD (create, suspend, terminate)
- Subscription and trial management
- Tenant provisioning (async)
- Industry and timezone config

Database tables: `tenants`, `tenant_data`

---

### 3. Product & QR Service

Extracted from: `app/integration/` (product, order, QR models and views), `app/api/views.py` (product endpoints)

Responsibilities:

- Brand, Product, Order, ProductItem management
- QR code generation (block generation)
- QR activation and scan tracking
- Product authentication (anti-counterfeit)
- Product expiry tracking
- Cascade / hierarchical QR management
- QR settings (activation parameters)
- Short URL generation and resolution

Database tables: `brands`, `products`, `orders`, `product_items`, `qr_activation_parameters`, `qr_activation_track`

---

### 4. Campaign & Coupon Service

Extracted from: `app/integration/` (Campaign, Lead, Coupon models), `app/certgen/`

Responsibilities:

- Campaign CRUD (Scan2Win, Feedback2Win, Play2Win, etc.)
- Web campaigns
- Lead capture and management
- Coupon generation, verification, redemption, unlock
- Coupon unlock audit log
- Shopify coupon sync
- External coupon management

Database tables: `campaigns`, `web_campaigns`, `leads`, `tags`, `lead_tags`, `coupons`, `coupon_unlock_logs`, `external_coupons`, `coupon_durations`, `shopify_coupons`

---

### 5. Messaging Service

Extracted from: `app/integration/` (messaging models, SMS/WhatsApp/RCS views), `app/certgen/sms.py`, `app/certgen/whatsappsms.py`

Responsibilities:

- Message template management
- Bulk SMS sending (via Mobtexting)
- Bulk WhatsApp sending (via Meta Cloud API)
- RCS messaging
- Scheduled message jobs
- Delivery report webhooks (SMS, WhatsApp, RCS)
- Message usage tracking

Database tables: `message_templates`, `schedule_messages`, `rcs_messages`, `rcs_credentials`, `sms_reports`, `whatsapp_reports`, `rcs_reports`, `message_summaries`

---

### 6. Warranty Service

Extracted from: `app/api/views.py` (warranty endpoints), `app/integration/` (Warranty model)

Responsibilities:

- Warranty registration
- Warranty lookup by serial number
- Warranty period configuration

Database tables: `warranties`, `warranty_periods`

---

### 7. Certificate Service

Extracted from: `app/certgen/` (certificate models, helpers, tasks)

Responsibilities:

- Certificate template management
- Bulk certificate generation from Excel
- PDF rendering and ZIP packaging
- GCS upload and signed URL generation
- Async download job tracking

Database tables: `certificate_templates`, `certificate_recipients`, `certificate_async_downloads`

---

### 8. Analytics & Reporting Service

Extracted from: `app/integration/qreach_analytics.py`, `app/integration/bussiness_dashboard.py`, `app/integration/matmo_dashboard.py`

Responsibilities:

- QR scan analytics
- Business dashboard metrics (revenue, retention, growth)
- Matomo event tracking
- Meta campaign performance sync
- Scheduled report generation (daily, weekly, monthly)
- POS sales reports

Database tables: `meta_campaigns`, `pos_report_history`, `schedule_reports`

---

### 9. Engagement Service

Extracted from: `app/api/views.py` (feedback, survey, assessment, contact, careers)

Responsibilities:

- Feedback submission
- Survey creation and response collection
- Brand trust assessment (questions, answers, scoring, PDF report)
- Contact form, career applications, demo scheduling, subscriptions

Database tables: `feedback`, `surveys`, `survey_responses`, `assessment_questions`, `assessment_answers`, `brand_leads`, `contacts`, `careers`, `subscriptions`

---

### 10. POS / Retail Service

Extracted from: `app/integration/` (Store, StorePOSBill, StorePOSPurchaseItem, StorePOSPayment)

Responsibilities:

- Store management
- POS bill and payment tracking
- POS purchase item records

Database tables: `stores`, `pos_bills`, `pos_purchase_items`, `pos_payments`

---

## React Micro-Frontend Modules

Corresponding to the backend services:

| Module             | Serves                                |
| ------------------ | ------------------------------------- |
| `shell`            | App shell, routing, auth context      |
| `auth-mfe`         | Login, registration, OTP              |
| `tenant-mfe`       | Tenant portal, onboarding             |
| `dashboard-mfe`    | Analytics dashboard, insights         |
| `products-mfe`     | Product management, QR generation     |
| `campaigns-mfe`    | Campaign builder, coupon management   |
| `messaging-mfe`    | Message templates, bulk send, reports |
| `warranty-mfe`     | Warranty registration and lookup      |
| `certificates-mfe` | Certificate generation and downloads  |
| `engagement-mfe`   | Surveys, assessments, feedback        |
| `pos-mfe`          | POS and retail management             |

---

## Migration Approach

### Phase 1 — Stabilize & Document (current)

- Complete documentation of existing system (this doc set)
- Add integration tests to cover critical paths before refactoring
- Identify shared data dependencies between apps

### Phase 2 — Database Decomposition

- Move from schema-per-tenant to `tenant_id` column-based isolation
- Split the monolithic PostgreSQL schema into logical database groups per service
- Keep a shared `tenants` database for auth and tenant resolution

### Phase 3 — Extract Services (strangler fig pattern)

- Start with low-dependency services: Auth, Tenant, Warranty
- Add an API Gateway in front of the monolith
- Route specific paths to new services while monolith handles the rest
- Gradually migrate: Campaign → Messaging → Product & QR → Analytics

### Phase 4 — Frontend Migration

- Build React shell app with Module Federation
- Migrate one UI module at a time, starting with Auth and Dashboard
- Keep Django templates for unmigrated sections during transition

### Phase 5 — Decommission Monolith

- Once all services are live and stable, retire the Django monolith
- Migrate Celery tasks to service-owned workers or event-driven consumers

---

## Key Risks & Considerations

| Risk                      | Mitigation                                                              |
| ------------------------- | ----------------------------------------------------------------------- |
| Multi-tenancy complexity  | Move to `tenant_id` columns early; use middleware in each service       |
| Shared models across apps | Define clear service ownership; use async events for cross-service data |
| Celery task distribution  | Each service owns its workers; use shared RabbitMQ/Kafka broker         |
| GCS file references       | Centralize storage behind a storage service or shared SDK               |
| DLT compliance (SMS)      | Keep in Messaging Service; ensure template IDs are preserved            |
| Shopify sync              | Belongs to Campaign/Coupon Service; keep as a scheduled task            |
| Firebase Firestore        | Evaluate if still needed; consider replacing with PostgreSQL + Redis    |
| Existing API consumers    | Maintain `/api/v1/` path compatibility via API Gateway routing          |
