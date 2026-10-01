# Error Response Standardization — Frontend Notes

Date: 2026-10-01

The identity-service and core-service error response bodies were standardized so
the UI has a consistent, machine-readable contract. HTTP status codes, URLs, and
success (2xx) payloads are **unchanged**. Only the **error body shape** changed.

---

## 1. Identity service — new error shape

**Before**
```json
{ "detail": "Login username worker.two already in use" }
```

**After**
```json
{
  "error": "LOGIN_USERNAME_TAKEN",
  "message": "Login username worker.two already in use",
  "timestamp": "2026-10-01T10:00:00Z"
}
```

- `error` = stable machine-readable code (branch on this, never on message text).
- `message` = human-readable text (show this).
- `timestamp` = ISO-8601 timestamp.

### Affected identity endpoints

| Endpoint | New `error` codes |
|---|---|
| `POST /api/v1/identity/workers` | `EMAIL_TAKEN`, `QR_CODE_TAKEN`, `LOGIN_USERNAME_TAKEN` |
| `POST /api/v1/identity/admin/create-worker` | `EMAIL_TAKEN`, `QR_CODE_TAKEN`, `LOGIN_USERNAME_TAKEN` |
| Any plain `HTTPException` (login, register, etc.) | generic status codes: `UNAUTHORIZED`, `CONFLICT`, `BAD_REQUEST`, `NOT_FOUND`, `FORBIDDEN`, … |
| `POST /api/v1/identity/login` failures | `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `ACCOUNT_SUSPENDED` |
| `POST /api/v1/identity/login/worker` | `UNAUTHORIZED` |
| `POST /api/v1/identity/login/qr-code` / `barcode` | unchanged (already structured) |

> Validation responses in identity are **unchanged**:
> `{"error": "VALIDATION_ERROR", "message": "...", "details": [...], "timestamp": ...}`.

---

## 2. Core service — new error shape

**Before**
```json
{ "detail": "Item not found" }
```

**After**
```json
{
  "detail": {
    "message": "Item not found",
    "status_code": 404,
    "code": "NOT_FOUND"
  }
}
```

### Core-service quirks to keep handling

Core service was already mixed and still is in a few handlers:

| Source | Shape |
|---|---|
| Plain `HTTPException` + most domain handlers | `detail.message`, `detail.code`, `detail.status_code` |
| `ValidationError` (400) | `{ "error": "VALIDATION_ERROR", "message": "...", "details": [...] }` (no `detail`) |
| `NotFoundError` (404) | `{ "error": "...", "message": "...", "entity_type": "...", "entity_id": "..." }` |
| `IntegrationError` | `{ "error": "...", "message": "...", "service": "...", "details": ... }` |
| Request validation (400) | `detail.code == "VALIDATION_ERROR"`, extra key `detail.errors` |

---

## 3. Recommended frontend handling

Add one normalization helper and route all API errors through it:

```ts
type ApiError = { code: string; message: string };

function normalizeApiError(payload: any, fallback = "Something went wrong"): ApiError {
  // Identity service style: { error, message }
  if (typeof payload?.error === "string" && typeof payload?.message === "string") {
    return { code: payload.error, message: payload.message };
  }
  // Core service style: { detail: { message, code } }
  if (payload?.detail && typeof payload.detail === "object") {
    return {
      code: payload.detail.code ?? "ERROR",
      message: payload.detail.message ?? fallback,
    };
  }
  // Legacy/fallback: { detail: "string" }
  if (typeof payload?.detail === "string") {
    return { code: "ERROR", message: payload.detail };
  }
  return { code: "ERROR", message: fallback };
}
```

Key rules:
- **Show** `message` in toasts/inline errors.
- **Branch** on `code` for special cases (e.g., `LOGIN_USERNAME_TAKEN` → "Username taken in this organization").
- Do **not** string-match on `message`.

---

## 4. What did NOT change

- HTTP status codes (409 is still 409, 404 is still 404, etc.).
- Endpoint URLs and methods.
- Success (2xx) response bodies.
- Validation error bodies (both services).
- QR-code login flow shape.
