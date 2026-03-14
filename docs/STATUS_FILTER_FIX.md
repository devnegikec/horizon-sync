# Status Filter Validation Fix

## Issue
Backend was returning 400 validation error when frontend sent `status=all` in the query parameters:

```
GET http://localhost:8001/api/v1/material-requests?page=1&page_size=10&status=all&sort_by=created_at&sort_order=desc

Response:
{
  "detail": {
    "message": "Invalid input data",
    "status_code": 400,
    "code": "VALIDATION_ERROR"
  }
}
```

## Root Cause
The backend validates status values against a specific enum (draft, submitted, partially_quoted, fully_quoted, cancelled, etc.). The value "all" is not a valid status in the backend schema.

When the frontend wants to show all statuses, it should **omit the status parameter entirely** rather than sending `status=all`.

## Solution Applied

### Files Fixed
1. ✅ `material-requests.ts` - Skip status parameter when value is 'all'
2. ✅ `rfqs.ts` - Skip status parameter when value is 'all'
3. ✅ `purchase-orders.ts` - Skip status parameter when value is 'all'

### Code Change Pattern

**Before:**
```typescript
if (filters.status) params.append('status', filters.status);
```

**After:**
```typescript
// Only include status if it's not 'all' - backend doesn't accept 'all' as a value
if (filters.status && filters.status !== 'all') params.append('status', filters.status);
```

## Behavior

### When status = 'all'
```typescript
// Frontend hook state
filters = { status: 'all', page: 1, page_size: 10 }

// API call made
GET /api/v1/material-requests?page=1&page_size=10&sort_by=created_at&sort_order=desc
// Note: status parameter is omitted

// Backend returns all material requests regardless of status
```

### When status = 'draft'
```typescript
// Frontend hook state
filters = { status: 'draft', page: 1, page_size: 10 }

// API call made
GET /api/v1/material-requests?page=1&page_size=10&status=draft&sort_by=created_at&sort_order=desc
// Note: status parameter is included

// Backend returns only draft material requests
```

## Valid Status Values

### Material Requests
- `draft` - Initial state, can be edited
- `submitted` - Submitted for processing
- `partially_quoted` - Some items have RFQs
- `fully_quoted` - All items have RFQs
- `cancelled` - Cancelled by user

### RFQs
- `draft` - Initial state, can be edited
- `sent` - Sent to suppliers
- `partially_responded` - Some suppliers responded
- `fully_responded` - All suppliers responded
- `closed` - RFQ closed

### Purchase Orders
- `draft` - Initial state, can be edited
- `submitted` - Submitted to supplier
- `partially_received` - Some items received
- `fully_received` - All items received
- `closed` - PO closed
- `cancelled` - PO cancelled

## Testing

### Before Fix
```bash
# Request
GET /api/v1/material-requests?status=all

# Response
400 Bad Request
{
  "detail": {
    "message": "Invalid input data",
    "status_code": 400,
    "code": "VALIDATION_ERROR"
  }
}
```

### After Fix
```bash
# Request (status parameter omitted)
GET /api/v1/material-requests?page=1&page_size=10

# Response
200 OK
{
  "material_requests": [...],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total_count": 45,
    "total_pages": 5
  }
}
```

## Related Files

### API Clients (All Fixed)
- `horizon-sync/apps/inventory/src/app/utility/api/material-requests.ts`
- `horizon-sync/apps/inventory/src/app/utility/api/rfqs.ts`
- `horizon-sync/apps/inventory/src/app/utility/api/purchase-orders.ts`

### Hooks (No changes needed)
- `horizon-sync/apps/inventory/src/app/hooks/useMaterialRequests.ts`
- `horizon-sync/apps/inventory/src/app/hooks/useRFQs.ts`
- `horizon-sync/apps/inventory/src/app/hooks/usePurchaseOrders.ts`

The hooks correctly initialize with `status: 'all'`, and the API clients now handle this properly by omitting the parameter.

### Components (No changes needed)
Filter components continue to work as expected, offering "All" as an option which sets `status: 'all'` in the hook state.

## Backend API Documentation Reference

From `horizon-sync-erp-be/core-service/SOURCING_FLOW_API_DOCUMENTATION.md`:

```
Query Parameters:
- page (integer, default: 1)
- page_size (integer, default: 20, max: 100)
- sort_by (string, default: created_at)
- sort_order (string, default: desc)
- status (string, optional): Filter by status (draft, submitted, etc.)
```

Note: The status parameter is **optional**. When omitted, the backend returns all records regardless of status.

## Key Takeaway

When implementing filter dropdowns with an "All" option:
- Frontend can use a special value like `'all'` for UI state management
- API client must check for this special value and **omit the parameter** from the request
- Backend receives no status filter and returns all records

This pattern should be applied to any future filter implementations where "All" is an option.
