# Stack Comparison — Old vs New

Prepared for: Leadership
Purpose: Understand what is changing and why

---

## Side-by-Side Comparison

| Concern           | Old Stack                                                | New Stack                                     | Why the Change                                                                       |
| ----------------- | -------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| Backend framework | Django 4.0 (monolith)                                    | FastAPI (microservices)                       | FastAPI is async-native, faster, lighter, and better suited for independent services |
| Language          | Python 3.11                                              | Python 3.11                                   | No change                                                                            |
| Database          | PostgreSQL (schema-per-tenant via django-tenant-schemas) | PostgreSQL (tenant_id column per service)     | Simpler to scale, easier to manage, no schema proliferation                          |
| Multi-tenancy     | One PostgreSQL schema per tenant                         | tenant_id column in every table               | Reduces DB complexity; easier to query across tenants for ops/reporting              |
| API style         | Django REST Framework (DRF)                              | FastAPI with Pydantic models                  | Automatic OpenAPI docs, async support, better performance                            |
| Frontend          | Django templates (server-rendered HTML)                  | React (micro-frontend, Module Federation)     | Modern SPA experience; independent deployability per module                          |
| Auth              | Expiring token auth (DRF) + API keys                     | JWT (centralized Auth Service)                | Stateless, works across all services without shared DB                               |
| Async tasks       | Celery + RabbitMQ (shared, monolith-wide)                | Per-service Celery workers or event consumers | Each service owns its async workload; no shared failure domain                       |
| Analytics         | Metamo (external, free EC2 instance)                     | In-house Analytics Service (PostgreSQL)       | Eliminates data loss risk, removes external latency, full control                    |
| GPS resolution    | Google Maps API (external)                               | In-house reverse geocoding                    | Reduces cost and latency                                                             |
| File storage      | Google Cloud Storage                                     | Google Cloud Storage                          | No change — keep what works                                                          |
| Real-time         | Firebase Firestore                                       | Evaluate: PostgreSQL + Redis pub/sub          | Reduce external dependencies; Firebase adds cost and complexity                      |
| SMS               | Mobtexting                                               | Mobtexting                                    | No change — keep provider                                                            |
| WhatsApp          | Meta Cloud API                                           | Meta Cloud API                                | No change — keep provider                                                            |
| RCS               | Existing provider                                        | Existing provider                             | No change — keep provider                                                            |
| Shopify sync      | Celery task in monolith                                  | Celery task in Campaign Service               | Same logic, isolated to the right service                                            |
| Brand entity      | Separate Brand model with key pairs                      | Key pairs at Organization level               | Simplifies onboarding; most orgs have one brand                                      |
| Permissions       | Admin-only config, user-level product creation           | Role-based access control (RBAC) per service  | Supports larger teams with granular tab/feature-level permissions                    |
| API documentation | drf-spectacular (Swagger)                                | FastAPI built-in OpenAPI                      | Automatic, always up-to-date                                                         |
| Deployment        | Single Django app (Dockerfile)                           | Per-service Docker containers                 | Independent scaling and deployment                                                   |

---

## What Stays the Same

- PostgreSQL as the database engine
- Google Cloud Storage for files
- Mobtexting for SMS
- Meta Cloud API for WhatsApp
- RabbitMQ as message broker
- Python as the primary language
- Existing Android app (activation) — API compatibility maintained

---

## What Gets Simplified

- Brand entity removed — key pairs move to Organization
- Industry field removed from product form (redundant)
- Analytics moved in-house — no more Metamo dependency
- QR design settings moved to global level (optional product-level override)
- Certificate module and Track & Trace excluded (no active users)

---

## What Gets Added

- API Gateway — single entry point, routes to correct service
- JWT-based auth — stateless, works across all services
- RBAC — granular permissions for larger teams
- In-house analytics — full scan data ownership
- React micro-frontend shell — modern, modular UI
- Per-service health checks and independent deployability

---

## Developer Experience Improvements

| Area                  | Before                                         | After                                                   |
| --------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| Adding a new endpoint | Modify monolith, risk breaking other features  | Add to isolated service, no blast radius                |
| Deploying a fix       | Redeploy entire Django app                     | Deploy only the affected service                        |
| Scaling a hot service | Scale entire monolith                          | Scale only the service under load (e.g., QR generation) |
| API docs              | Manually maintained or auto-generated from DRF | Always accurate, auto-generated by FastAPI              |
| Frontend changes      | Edit Django templates, redeploy backend        | Deploy only the affected React module                   |
| Onboarding new devs   | Must understand entire monolith                | Can work on a single service in isolation               |
