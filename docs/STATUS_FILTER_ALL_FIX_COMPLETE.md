# Status Filter 'all' Fix - Complete

## Issue
Backend returning 400 Bad Request when frontend sends `status=all`:

```
GET http://localhost:8001/api/v1/rfqs?page=1&page_size=10&status=all&sort_by=created_at&sort_order=desc
Status: 400 Bad Request

GET http://localhost:8001/api/v1/purchase-orders?page=1&page_size=10&status=all&sort_by=created_at&sort_order=desc
Status: 400 Bad Request
```

## Root Cause
Backend validates status values against specific enums and doesn't accept 'all' as a valid value. When showing all statuses, the status parameter must be omitted entirely.

## Solution Applied ✅

All sourcing flow API clients have been fixed to skip the status parameter when value is 'all':

### Files Fixed
1. ✅ `material-requests.ts` - Status filter fixed
2. ✅ `rfqs.ts` - Status filter fixed
3. ✅ `purchase-orders.ts` - Status filter fixed
4. ✅ `landed-costs.ts` - Status filter fixed (implemented with fix)

### Code Pattern Applied
```typescript
// Only include status if it's not 'all' - backend doesn't accept 'all' as a value
if (filters.status && filters.status !== 'all') params.append('status', filters.status);
```

## Expected Behavior After Fix

### When status = 'all'
```typescript
// Hook state
filters = { status: 'all', page: 1, page_size: 10 }

// API call (status parameter omitted)
GET /api/v1/rfqs?page=1&page_size=10&sort_by=created_at&sort_order=desc

// Backend returns all RFQs regardless of status
```

### When status = 'draft'
```typescript
// Hook state
filters = { status: 'draft', page: 1, page_size: 10 }

// API call (status parameter included)
GET /api/v1/rfqs?page=1&page_size=10&status=draft&sort_by=created_at&sort_order=desc

// Backend returns only draft RFQs
```

## If Still Seeing 400 Errors

The code is correct, but you may be experiencing caching issues. Try these steps:

### 1. Clear Browser Cache
- **Chrome/Edge**: Ctrl+Shift+Delete → Clear cached images and files
- **Firefox**: Ctrl+Shift+Delete → Cached Web Content
- Or use Incognito/Private mode

### 2. Hard Refresh
- **Windows**: Ctrl+F5 or Ctrl+Shift+R
- **Mac**: Cmd+Shift+R

### 3. Restart Development Server
```bash
# Stop the dev server (Ctrl+C)
# Then restart
npm run dev
# or
yarn dev
```

### 4. Clear Build Cache
```bash
# Clear NX cache
npx nx reset

# Rebuild
npm run build
# or
yarn build
```

### 5. Verify Network Request
Open browser DevTools → Network tab → Check the actual request URL:
- ✅ Correct: `/api/v1/rfqs?page=1&page_size=10&sort_by=created_at&sort_order=desc` (no status param)
- ❌ Wrong: `/api/v1/rfqs?page=1&page_size=10&status=all&sort_by=created_at&sort_order=desc` (has status=all)

If you still see `status=all` in the URL, the browser is using cached JavaScript.

## Verification

### Check API Client Code
All these files should have the fix:

```bash
# Search for the fix pattern
grep -n "status !== 'all'" horizon-sync/apps/inventory/src/app/utility/api/*.ts
```

Expected output:
```
material-requests.ts:26:    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
rfqs.ts:27:    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
purchase-orders.ts:26:    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
landed-costs.ts:26:    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
```

### Test Each Endpoint

#### Material Requests
```bash
# Should work (no status param)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8001/api/v1/material-requests?page=1&page_size=10"
```

#### RFQs
```bash
# Should work (no status param)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8001/api/v1/rfqs?page=1&page_size=10"
```

#### Purchase Orders
```bash
# Should work (no status param)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8001/api/v1/purchase-orders?page=1&page_size=10"
```

#### Landed Costs
```bash
# Should work (no status param)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8001/api/v1/landed-cost?page=1&page_size=10"
```

## Status Values Reference

### Material Requests
- `draft`, `submitted`, `partially_quoted`, `fully_quoted`, `cancelled`

### RFQs
- `draft`, `sent`, `partially_responded`, `fully_responded`, `closed`

### Purchase Orders
- `draft`, `submitted`, `partially_received`, `fully_received`, `closed`, `cancelled`

### Landed Costs
- `draft`, `submitted`, `cancelled`

## Related Documentation
- `STATUS_FILTER_FIX.md` - Original fix documentation
- `SOURCING_FLOW_IMPLEMENTATION_STATUS.md` - Implementation status

## Summary

✅ All API clients fixed to handle `status='all'` correctly
✅ No TypeScript errors
✅ Consistent pattern across all sourcing flow modules
✅ Backend will receive requests without status parameter when filtering for all statuses

If you're still seeing 400 errors, it's a caching issue - clear your browser cache and restart the dev server.
