---
inclusion: always
---

# QSeal Frontend Migration — Steering Guide

## Context

We are migrating the QSeal platform from Django server-rendered templates to a **React micro-frontend** architecture. The backend is being rewritten as FastAPI microservices. This guide governs all frontend work during and after the migration.

## Architecture

The frontend is a **React shell app** using Module Federation. Each module maps to a backend microservice.

```
Shell App (routing, auth context, navigation)
    ├── auth-mfe          → Auth Service
    ├── dashboard-mfe     → Analytics Service
    ├── products-mfe      → Product & QR Service
    ├── campaigns-mfe     → Campaign & Coupon Service
    ├── messaging-mfe     → Messaging Service
    ├── warranty-mfe      → Warranty Service
    └── activation-mfe    → Activation Service
```

## API Base URL & Auth

```
Base URL: http://localhost:8001/api/v1   (dev)
Auth:     Authorization: Bearer {jwt_token}
```

JWT tokens are issued by the Auth Service. Store in memory or httpOnly cookie — never localStorage for production.

Multi-tenancy is resolved via `tenant_id` in every API response. The shell app injects `X-Tenant-ID` header on all requests.

## Module Scope — What to Build

| Module        | Status  | Key Features                                                      |
| ------------- | ------- | ----------------------------------------------------------------- |
| Auth          | Phase 1 | Login, JWT, OTP (email + mobile), registration                    |
| Dashboard     | Phase 4 | QR scan analytics, business metrics (replaces Metamo)             |
| Products & QR | Phase 2 | Product CRUD, block/QR generation, SKU customization, activation  |
| Campaigns     | Phase 3 | Scan2Win, Feedback2Win, Play2Win, lead capture, coupon management |
| Messaging     | Phase 4 | SMS/WhatsApp/RCS templates, bulk send, delivery reports           |
| Warranty      | Phase 5 | Warranty registration, lookup by serial number                    |
| Activation    | Phase 5 | Web activation, batch activation support                          |

## What Is NOT Being Migrated

- Certificate Module (no active users — skip entirely)
- Track & Trace (no active users — skip entirely)

Do not build UI for these modules.

## Key Domain Concepts

### Organization vs Brand

The old system had a `Brand` entity between Organization and Products. In the new system, **key pairs live at the Organization level**. There is no separate Brand entity. Do not model or display a "Brand" layer in the UI.

### Multi-Tenancy

Every resource belongs to a `tenant_id`. The shell app resolves the tenant from the JWT and injects it. Individual modules do not need to handle tenant switching — the shell owns that.

### QR Credit System

Organizations have a monthly QR generation quota. The Products module must display remaining credits and warn when approaching limits.

### QR Types

Three types exist: `dynamic`, `secure_qr_runtime`, `static_qr`. Each has different generation and activation behavior. Display these clearly in the Block Creation UI.

## Component & File Conventions

```
src/
├── features/
│   └── {module-name}/
│       ├── components/     # UI components
│       ├── hooks/          # React hooks (data fetching, mutations)
│       ├── services/       # Axios API service classes
│       ├── types/          # TypeScript interfaces
│       └── utils/          # Pure helpers
```

- One service class per backend resource
- Hooks wrap service calls and manage loading/error state
- Components never call axios directly — always through hooks

## Service Class Pattern

```typescript
class ProductService {
  private getHeaders() {
    const token = /* get from auth context */;
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async list(params?: Record<string, any>) { ... }
  async getById(id: string) { ... }
  async create(data: any) { ... }
  async update(id: string, data: any) { ... }
  async delete(id: string) { ... }
}

export const productService = new ProductService();
```

## Hook Pattern

```typescript
export const useProducts = (filters?: FilterParams) => {
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = async (page = 1) => {
    setLoading(true);
    try {
      setData(await productService.list({ page, ...filters }));
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [filters?.status]);
  return { data, loading, error, refetch: fetch };
};
```

## Error Handling

All API errors follow: `{ "detail": "Error message string" }`

Extract with: `err.response?.data?.detail || 'Fallback message'`

Common status codes:

- `401` → redirect to login (token expired)
- `403` → show permission denied, do not redirect
- `404` → show not found state in component
- `409` → state conflict (e.g., wrong status for action) — show inline error
- `422` → validation error — show field-level errors if available

## Status Badge Colors

Use consistent colors across all modules:

| Status                         | Color     |
| ------------------------------ | --------- |
| draft                          | gray      |
| submitted / confirmed          | blue      |
| active / completed / delivered | green     |
| partial (partially\_\*)        | yellow    |
| cancelled / failed             | red       |
| closed                         | dark gray |

## Pagination

All list endpoints return:

```typescript
{
  items: T[];
  pagination: {
    page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  }
}
```

Always implement pagination controls. Default `page_size: 20`.

## Analytics Module Notes

The old system used Metamo (external). The new Analytics Service is in-house. The dashboard must display:

- QR scan counts (by product, by date range, by location)
- Device type breakdown
- Geographic distribution (GPS → address, resolved in-house — no Google Maps API)
- Campaign performance metrics

## Messaging Module Notes

Three channels: SMS (Mobtexting), WhatsApp (Meta Cloud API), RCS. The UI must support:

- Template management per channel
- Bulk send with lead segment targeting
- Delivery report viewing (per message, per lead)
- Scheduled send jobs

## Environment Variables

```env
REACT_APP_API_URL=http://localhost:8001
REACT_APP_TENANT_ID=          # injected by shell at runtime
```

## Do Not

- Do not use `localStorage` for JWT tokens in production
- Do not call axios directly in components — use hooks
- Do not build Certificate or Track & Trace modules
- Do not model a "Brand" entity — it no longer exists
- Do not hardcode tenant IDs
- Do not skip loading and error states in any data-fetching component
