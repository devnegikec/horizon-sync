# Missing API Exports Fix

## Problem
Build was failing with TypeScript errors about missing exports:
- `supplierApi` was not found in `../utility/api`
- `rfqApi` was not found in `../utility/api`
- `materialRequestApi` was not found in `../utility/api`

These APIs were being imported by various hooks and components but weren't exported from the API utility module.

## Root Cause
The RFQ and Material Request features were partially implemented - the UI components and hooks were created, but the API client implementations were missing.

## Solution
Created placeholder API implementations to prevent build errors while the full implementations are being developed.

## Files Created

### 1. `apps/inventory/src/app/utility/api/rfqs.ts`
Placeholder RFQ API with stub methods:
- `list()` - List RFQs with pagination and filters
- `getById()` - Get single RFQ by ID
- `create()` - Create new RFQ
- `update()` - Update existing RFQ
- `delete()` - Delete RFQ

All methods currently:
- Log a warning to console
- Return a rejected promise with "not implemented" error

### 2. `apps/inventory/src/app/utility/api/material-requests.ts`
Placeholder Material Request API with stub methods:
- `list()` - List material requests
- `getById()` - Get single material request
- `create()` - Create new material request
- `update()` - Update material request
- `delete()` - Delete material request
- `approve()` - Approve material request
- `reject()` - Reject material request

All methods currently:
- Log a warning to console
- Return a rejected promise with "not implemented" error

### 3. Updated `apps/inventory/src/app/utility/api/suppliers.ts`
Added `supplierApi` export alongside existing `itemSupplierApi`:
- `list()` - List suppliers (partially implemented, calls `/suppliers` endpoint)
- `getById()` - Get supplier by ID
- `create()` - Create new supplier
- `update()` - Update supplier
- `delete()` - Delete supplier

These methods make actual API calls but log warnings indicating they're not fully tested.

## Files Modified

### 1. `apps/inventory/src/app/utility/api/index.ts`
Added exports:
```typescript
export { itemSupplierApi, supplierApi } from './suppliers';
export { rfqApi } from './rfqs';
export { materialRequestApi } from './material-requests';
```

### 2. `apps/inventory/src/app/utility/api.ts`
Added to barrel exports:
```typescript
export {
  // ... existing exports
  supplierApi,
  rfqApi,
  materialRequestApi,
} from './api/index';
```

## Build Status
✅ TypeScript compilation now succeeds
✅ No more missing export errors
⚠️ RFQ and Material Request features will show warnings when used (expected behavior)

## Next Steps

### For RFQ Feature
1. Implement actual RFQ API endpoints in backend
2. Update `rfqApi` methods in `apps/inventory/src/app/utility/api/rfqs.ts`
3. Add proper TypeScript types for RFQ payloads
4. Test all CRUD operations
5. Remove console warnings

### For Material Request Feature
1. Implement actual Material Request API endpoints in backend
2. Update `materialRequestApi` methods in `apps/inventory/src/app/utility/api/material-requests.ts`
3. Add proper TypeScript types for Material Request payloads
4. Implement approval workflow
5. Test all operations
6. Remove console warnings

### For Supplier Feature
1. Verify `/suppliers` endpoint exists in backend
2. Test all supplier CRUD operations
3. Add proper error handling
4. Remove console warnings
5. Add TypeScript types for supplier payloads

## Testing

### Verify Build Success
```bash
cd horizon-sync
npm run build
```

Should complete without TypeScript errors.

### Test Runtime Behavior
If you try to use RFQ or Material Request features:
1. Console will show warning: `[rfqApi] list() not implemented yet`
2. Promise will reject with error: `RFQ API not implemented`
3. UI should handle the error gracefully (show error message to user)

### Expected Console Output
When RFQ/Material Request features are accessed:
```
[rfqApi] list() not implemented yet
Error: RFQ API not implemented
```

This is expected behavior until the backend APIs are implemented.

## Important Notes

1. **These are placeholder implementations** - They prevent build errors but don't provide actual functionality
2. **Console warnings are intentional** - They help developers identify which APIs need implementation
3. **Error handling required** - UI components should handle rejected promises gracefully
4. **Backend implementation needed** - These placeholders should be replaced with real implementations once backend endpoints are ready

## Related Files

### Files That Import These APIs

**supplierApi:**
- `apps/inventory/src/app/hooks/useSuppliers.ts`

**rfqApi:**
- `apps/inventory/src/app/hooks/useRFQs.ts`
- `apps/inventory/src/app/hooks/useRFQActions.ts`
- `apps/inventory/src/app/components/rfqs/RFQDialog.tsx`
- `apps/inventory/src/app/components/rfqs/RFQDetailDialog.tsx`

**materialRequestApi:**
- `apps/inventory/src/app/hooks/useMaterialRequests.ts`
- `apps/inventory/src/app/hooks/useMaterialRequestActions.ts`
- `apps/inventory/src/app/components/material-requests/MaterialRequestDetailDialog.tsx`

All these files will now compile successfully, but will show runtime warnings when the features are used.
