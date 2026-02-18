# Port Configuration Fix

## Issue
Frontend API clients were pointing to the wrong backend port, causing 404 errors when creating Material Requests and other sourcing flow operations.

## Root Cause
- Backend **core-service** runs on **port 8001**
- Backend **identity-service** runs on **port 8000**
- Some API clients were incorrectly using port 8000 for core-service endpoints

## Solution Applied

### Files Fixed
All sourcing flow API clients now correctly use port 8001:

1. ✅ `material-requests.ts` - Changed from 8000 to 8001
2. ✅ `rfqs.ts` - Changed from 8000 to 8001
3. ✅ `purchase-orders.ts` - Changed from 8000 to 8001
4. ✅ `purchase-receipts.ts` - Already using 8001

### Configuration Pattern
```typescript
const API_BASE_URL = process.env['NX_API_BASE_URL'] || 'http://localhost:8001';
```

This allows:
- Environment variable override via `NX_API_BASE_URL`
- Default fallback to `http://localhost:8001` for local development

### Environment Configuration
The environment file at `horizon-sync/apps/inventory/src/environments/environment.ts` correctly defines:

```typescript
export const environment = {
  production: false,
  apiCoreUrl: 'http://localhost:8001/api/v1',  // Core service (sourcing flow)
  apiBaseUrl: 'http://localhost:8000/api/v1',  // Identity service (auth)
};
```

## Port Mapping Reference

| Service | Port | Purpose | Endpoints |
|---------|------|---------|-----------|
| **identity-service** | 8000 | Authentication & Authorization | `/api/v1/auth/*` |
| **core-service** | 8001 | Business Logic & Data | `/api/v1/material-requests`, `/api/v1/rfqs`, `/api/v1/purchase-orders`, `/api/v1/purchase-receipts`, `/api/v1/invoices`, `/api/v1/payments` |

## Verification

### Before Fix
```
POST http://localhost:8000/api/v1/material-requests
❌ 404 Not Found
```

### After Fix
```
POST http://localhost:8001/api/v1/material-requests
✅ 200 OK
```

## Testing Checklist

- [x] Material Request creation works
- [x] RFQ creation works
- [x] Purchase Order creation works
- [x] Purchase Receipt creation works
- [ ] Test in production environment with proper `NX_API_BASE_URL` set

## Related Files

### API Clients (All Fixed)
- `horizon-sync/apps/inventory/src/app/utility/api/material-requests.ts`
- `horizon-sync/apps/inventory/src/app/utility/api/rfqs.ts`
- `horizon-sync/apps/inventory/src/app/utility/api/purchase-orders.ts`
- `horizon-sync/apps/inventory/src/app/utility/api/purchase-receipts.ts`

### Environment Configuration
- `horizon-sync/apps/inventory/src/environments/environment.ts`

### Documentation Updated
- `horizon-sync/SOURCING_FLOW_IMPLEMENTATION_STATUS.md`

## Notes

- Other API clients (items, suppliers, stock, etc.) use the `core.ts` helper which correctly reads from `environment.apiCoreUrl` (port 8001)
- The sourcing flow API clients were using direct URL configuration, which is why they needed manual fixes
- Consider refactoring sourcing flow API clients to use the `core.ts` helper for consistency

## Future Improvements

1. **Standardize API Client Pattern**: Refactor all API clients to use the `core.ts` helper functions
2. **Environment Variable Documentation**: Document all required environment variables for deployment
3. **API Gateway**: Consider implementing an API gateway to provide a single entry point
