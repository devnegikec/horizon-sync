# QSeal MSW Mock Setup

Mock Service Worker handlers for all QSeal frontend modules. Covers every active feature from the migration scope.

## Structure

```
mocks/
├── data/           # Static seed data (products, campaigns, analytics, etc.)
├── handlers/       # MSW request handlers per module
├── browser.ts      # Browser worker setup (React dev)
├── node.ts         # Node server setup (Jest/Vitest tests)
└── utils.ts        # resolveTenant(), paginate() helpers
```

## Quick Start

### 1. Install MSW

```bash
npm install msw --save-dev
npx msw init public/ --save
```

### 2. Start the worker in your app entry point

```tsx
// src/main.tsx
async function enableMocking() {
  if (process.env.NODE_ENV !== "development") return;
  const { worker } = await import("../mocks/browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
});
```

### 3. Use in Vitest / Jest

```ts
// src/setupTests.ts
import { server } from "../mocks/node";
import { beforeAll, afterAll, afterEach } from "vitest";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Mock Credentials

All passwords are `password123`.

| Email                | Tenant                   | Role     |
| -------------------- | ------------------------ | -------- |
| admin@acmepharma.com | tenant-001 (Acme Pharma) | admin    |
| ops@acmepharma.com   | tenant-001 (Acme Pharma) | operator |
| admin@luxbrand.com   | tenant-002 (LuxBrand)    | admin    |

## Covered Endpoints

| Module    | Endpoints                                                              |
| --------- | ---------------------------------------------------------------------- |
| Auth      | login, logout, OTP (email + mobile), me                                |
| Products  | CRUD, distribution/destination channels, QR credits                    |
| Blocks    | list, create (with credit check)                                       |
| Analytics | dashboard metrics, scans by product/date/location/device               |
| Campaigns | CRUD, leads, coupon verify/redeem/unlock                               |
| Messaging | template CRUD (with DLT validation), scheduled sends, delivery reports |
| Warranty  | register, check by serial, search                                      |

## Tenant Isolation

Every handler calls `resolveTenant(request)` which reads the Bearer token and maps it to a `tenant_id`. Data is always filtered by tenant — cross-tenant data never leaks.

## OTP Testing

Use `123456` as the OTP for any email or mobile verification flow.

## Notes

- Block creation returns `status: "processing"` — simulate completion by polling or manually updating the mock data
- Coupon codes in seed data: `WIN50-ABCD1`, `WIN100-XYZ99`, `FB75-MNOP2`
- Serial numbers for warranty check: `PAR500-000001`, `AMX250-000010`, `LUX-HB-000042`
- Append `FAKE` to any serial number to get an `is_authentic: false` response
