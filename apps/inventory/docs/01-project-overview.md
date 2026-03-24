# Brandwise Platform — Project Overview

## What Is This?

Brandwise is a multi-tenant SaaS platform for brand authentication, product verification, and customer engagement. Brands use it to generate QR codes for products, run scan-to-win campaigns, manage coupons, track warranties, and communicate with customers via SMS, WhatsApp, and RCS.

## Tech Stack (Current)

| Layer        | Technology                                             |
| ------------ | ------------------------------------------------------ |
| Framework    | Django 4.0                                             |
| Language     | Python 3.11.5                                          |
| Database     | PostgreSQL (via `tenant_schemas` for multi-tenancy)    |
| Task Queue   | Celery + RabbitMQ                                      |
| Cache        | Redis                                                  |
| File Storage | Google Cloud Storage                                   |
| Real-time    | Firebase Firestore                                     |
| API          | Django REST Framework + DRF Spectacular (OpenAPI)      |
| Auth         | Token-based (expiring) + API Key                       |
| Frontend     | Django templates + Material Frontend (server-rendered) |

## Multi-Tenancy Model

The platform uses `django-tenant-schemas` to isolate each brand/client in its own PostgreSQL schema. Each tenant gets a subdomain and a dedicated schema.

- **Public schema** — shared apps: `dashboard`, `tenant_portal`
- **Tenant schemas** — per-brand apps: `integration`, `certgen`, `api`

The `Client` model (in `dashboard`) is the root tenant object. It holds the schema name, domain URL, industry, trial status, and subscription expiry.

## Django Apps

| App             | Schema | Responsibility                                               |
| --------------- | ------ | ------------------------------------------------------------ |
| `dashboard`     | Public | Tenant (Client) model, shared admin                          |
| `tenant_portal` | Public | Tenant self-service portal                                   |
| `api`           | Tenant | REST API endpoints for mobile/external consumers             |
| `integration`   | Tenant | Core business logic — campaigns, leads, messaging, analytics |
| `certgen`       | Tenant | Coupon/certificate generation, QR management                 |
| `dynamic_forms` | Tenant | Survey and assessment form builder                           |
| `users`         | Tenant | User management                                              |
| `onboarding`    | Tenant | Tenant onboarding workflows                                  |
| `middlewares`   | —      | Custom request/timezone middleware                           |
| `brandwise`     | —      | Signature verification utilities                             |

## High-Level Architecture Diagram

```
Browser / Mobile App
        │
        ▼
   Nginx / Load Balancer
        │
        ▼
  Django Application
  ┌─────────────────────────────────────────┐
  │  TenantMiddleware (schema routing)      │
  │                                         │
  │  ┌──────────┐  ┌──────────┐            │
  │  │  api app │  │integration│            │
  │  │  (REST)  │  │  (logic) │            │
  │  └──────────┘  └──────────┘            │
  │  ┌──────────┐  ┌──────────┐            │
  │  │ certgen  │  │dashboard │            │
  │  │(coupons) │  │(tenants) │            │
  │  └──────────┘  └──────────┘            │
  └─────────────────────────────────────────┘
        │                │
        ▼                ▼
  PostgreSQL          Celery Workers
  (per-tenant         (async tasks,
   schemas)            scheduled jobs)
        │
        ▼
  Google Cloud Storage / Firebase
```
