# Search API Integration Fixes

## Changes Made

### 1. Fixed SearchRequest Interface (`search.types.ts`)
**Problem:** Frontend types didn't match backend API schema

**Before:**
```typescript
export interface SearchRequest {
  query: string;
  sort?: string;           // ❌ Wrong field name
  sort_order?: 'asc' | 'desc';  // ❌ Not in backend schema
  // ... other fields
}
```

**After:**
```typescript
export interface SearchRequest {
  query: string;
  sort_by?: string;        // ✅ Matches backend schema
  // ... other fields
}
```

### 2. Updated useLocalSearch Hook
**Problem:** Hook was sending `sort` and `sort_order` fields

**Before:**
```typescript
SearchService.localSearch(entityType, {
  query: debouncedQuery,
  sort: 'created_at',      // ❌ Wrong field
  sort_order: 'desc',      // ❌ Not in backend
})
```

**After:**
```typescript
SearchService.localSearch(entityType, {
  query: debouncedQuery,
  sort_by: 'created_at',   // ✅ Correct field
})
```

### 3. Updated useGlobalSearch Hook
Same fix as useLocalSearch - changed `sort` to `sort_by`.

### 4. Fixed Infinite Loop in LocalSearch Component
**Problem:** `onResultsChange` callback in dependencies caused infinite re-renders

**Solution:** Used ref pattern to store callback without triggering re-renders
```typescript
const onResultsChangeRef = useRef(onResultsChange);

useEffect(() => {
  onResultsChangeRef.current = onResultsChange;
}, [onResultsChange]);

useEffect(() => {
  // Use ref instead of direct callback
  onResultsChangeRef.current(data.results);
}, [data, searchQuery]); // No onResultsChange dependency!
```

## Backend API Contract

### Endpoint: POST /search/{entity_type}
**URL:** `http://localhost:8002/api/v1/search/items`

**Request Body:**
```json
{
  "query": "laptop",
  "entity_types": null,
  "filters": null,
  "page": 1,
  "page_size": 20,
  "sort_by": "created_at"
}
```

**Response:**
```json
{
  "results": [
    {
      "entity_id": "uuid-here",
      "entity_type": "items",
      "title": "Dell Laptop",
      "snippet": "High-performance laptop...",
      "relevance_score": 0.95,
      "metadata": {}
    }
  ],
  "total_count": 15,
  "page": 1,
  "page_size": 20,
  "total_pages": 1,
  "has_next_page": false,
  "has_previous_page": false,
  "query_time_ms": 45,
  "suggestions": null
}
```

## Build Warnings (Not Errors)

The build log shows warnings about missing exports:
- `rfqApi` not found in `api.ts`
- `materialRequestApi` not found in `api.ts`

These are **warnings**, not errors. They indicate that RFQ and Material Request features are referencing APIs that haven't been implemented yet. This doesn't affect the search functionality.

## Troubleshooting "Remote failed to start"

If you're seeing "Remote failed to start" error, try these steps:

### 1. Clear Build Cache
```bash
cd horizon-sync
npx nx reset
```

### 2. Rebuild Everything
```bash
npm run build
```

### 3. Start Apps Separately
```bash
# Terminal 1 - Platform app
npm run start:platform

# Terminal 2 - Inventory app (wait for platform to start first)
npm run start:inventory
```

### 4. Check Console for Errors
Open browser console (F12) and look for:
- Module Federation errors
- Network errors (failed API calls)
- JavaScript errors

### 5. Verify Environment Variables
Check that these are set correctly:

**Platform app** (`apps/platform/src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8000/api/v1',      // Identity service
  searchApiBaseUrl: 'http://localhost:8002/api/v1', // Search service
};
```

**Inventory app** (`apps/inventory/src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiCoreUrl: 'http://localhost:8001/api/v1',  // Core service
  apiBaseUrl: 'http://localhost:8000/api/v1',  // Identity service
};
```

### 6. Verify Backend Services Running
Ensure all backend services are running:
- Identity Service: `http://localhost:8000`
- Core Service: `http://localhost:8001`
- Search Service: `http://localhost:8002`

Test with curl:
```bash
curl http://localhost:8002/api/v1/health
```

### 7. Check Module Federation
The inventory app is loaded as a remote module. If it fails to load:

1. Check that both apps are running
2. Verify `remoteEntry.js` is accessible:
   - Platform: `http://localhost:4200/remoteEntry.js`
   - Inventory: `http://localhost:4201/remoteEntry.js`

3. Check browser network tab for failed script loads

### 8. Common Issues

**Issue:** "Cannot find module '@horizon-sync/search'"
**Solution:** The path mapping was added to `tsconfig.base.json`. Restart your IDE/editor.

**Issue:** "Authentication required" error
**Solution:** Make sure you're logged in and the auth token is valid.

**Issue:** Search returns empty results
**Solution:** 
1. Check that search-service database is synced with core-service
2. Run the sync script: `python horizon-sync-erp-be/search-service/sync_data.py`

**Issue:** CORS errors
**Solution:** Backend services should have CORS enabled for `http://localhost:4200` and `http://localhost:4201`

## Testing the Integration

### Manual Test Steps

1. **Start all services:**
   ```bash
   # Backend (in horizon-sync-erp-be directory)
   docker-compose up -d  # or start services individually
   
   # Frontend (in horizon-sync directory)
   npm run start:platform  # Terminal 1
   npm run start:inventory # Terminal 2
   ```

2. **Navigate to Items Management:**
   - Open `http://localhost:4200`
   - Log in
   - Click "Inventory" tab
   - You should see the Items Management page

3. **Test LocalSearch:**
   - Type in the search box (e.g., "laptop")
   - Wait 300ms (debounce delay)
   - Check browser console for logs:
     ```
     [SearchService] Local search request: {...}
     [SearchService] Response status: 200
     [SearchService] Local search response: {...}
     [ItemManagementFilters] Search results received: X
     [ItemManagement] Received search results: X
     ```
   - Verify table shows only matching items
   - Click X button to clear search
   - Verify all items are shown again

4. **Test Error Handling:**
   - Stop search-service backend
   - Try searching
   - Should see error message: "Search service unavailable. Please try again later."

### Expected Console Logs

**Successful search:**
```
[SearchService] Initialized with API_BASE_URL: http://localhost:8002/api/v1
[useLocalSearch] Hook called: {query: "laptop", debouncedQuery: "laptop", enabled: true, hasToken: true}
[SearchService] Local search request: {url: "http://localhost:8002/api/v1/search/items", entityType: "items", request: {...}}
[SearchService] Response status: 200
[SearchService] Local search response: {results: Array(5), total_count: 5, ...}
[ItemManagementFilters] Search results received: 5
[ItemManagementFilters] Search result IDs: ["uuid1", "uuid2", ...]
[ItemManagement] Received search results: 5
[ItemManagement] Display state: {isSearchActive: true, searchResultsCount: 5, totalItems: 100, displayedItems: 5}
```

**Empty results:**
```
[SearchService] Local search response: {results: [], total_count: 0, ...}
[ItemManagementFilters] Search results received: 0
[ItemManagement] Received search results: 0
[ItemManagement] Display state: {isSearchActive: true, searchResultsCount: 0, totalItems: 100, displayedItems: 0}
```

**Error:**
```
[SearchService] Local search error: Error: Search service unavailable. Please try again later.
```

## Files Modified

1. `horizon-sync/tsconfig.base.json` - Added `@horizon-sync/search` path mapping
2. `horizon-sync/apps/platform/src/app/features/search/types/search.types.ts` - Fixed SearchRequest interface
3. `horizon-sync/apps/platform/src/app/features/search/hooks/useLocalSearch.ts` - Updated to use `sort_by`
4. `horizon-sync/apps/platform/src/app/features/search/hooks/useGlobalSearch.ts` - Updated to use `sort_by`
5. `horizon-sync/apps/platform/src/app/features/search/components/LocalSearch.tsx` - Fixed infinite loop with ref pattern
6. `horizon-sync/apps/inventory/src/app/components/items/ItemManagementFilters.tsx` - Integrated LocalSearch
7. `horizon-sync/apps/inventory/src/app/components/items/ItemManagement.tsx` - Added search result handling

## Next Steps

1. Test the search functionality with real data
2. Verify search-service is properly synced with core-service
3. Add LocalSearch to other management pages (Customers, Suppliers, etc.)
4. Consider moving search feature to a shared library for better reusability
