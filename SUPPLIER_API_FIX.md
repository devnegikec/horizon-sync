# Supplier API Integration Fix

## Problem
The Supplier Management dialog was showing hardcoded mock suppliers instead of fetching real suppliers from the backend API. Even though the backend was returning an empty list, the UI was displaying 4 mock suppliers:
- Acme Corporation (ACME)
- Global Supplies Inc (GSI)
- Tech Parts Ltd (TPL)
- Industrial Materials Co (IMC)

## Root Cause
In `apps/inventory/src/app/components/suppliers/SupplierManagement.tsx`, suppliers were hardcoded as mock data:

```typescript
const mockSuppliers = [
  { id: 'sup-001', name: 'Acme Corporation', code: 'ACME' },
  { id: 'sup-002', name: 'Global Supplies Inc', code: 'GSI' },
  { id: 'sup-003', name: 'Tech Parts Ltd', code: 'TPL' },
  { id: 'sup-004', name: 'Industrial Materials Co', code: 'IMC' },
];
```

## Solution

### 1. Added Supplier Types
**File**: `apps/inventory/src/app/types/supplier.types.ts`

Added proper Supplier interface and response type:
```typescript
export interface Supplier {
  id: string;
  supplier_code: string;
  supplier_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
}

export interface SuppliersResponse {
  suppliers: Supplier[];
  pagination: Pagination;
}
```

### 2. Fixed API Endpoints
**File**: `apps/inventory/src/app/utility/api.ts`

- Fixed `itemSupplierApi` to use correct endpoint `/item-suppliers` instead of `/suppliers`
- Added new `supplierApi` for fetching suppliers:

```typescript
export const supplierApi = {
  list: (accessToken: string, page = 1, pageSize = 20, filters?: { search?: string; status?: string }) =>
    apiRequest('/suppliers', accessToken, {
      params: {
        ...buildPaginationParams(page, pageSize),
        ...filters,
      },
    }),
  // ... other CRUD methods
};
```

### 3. Created useSuppliers Hook
**File**: `apps/inventory/src/app/hooks/useSuppliers.ts`

Created a new hook to fetch suppliers from the API:
```typescript
export function useSuppliers(page = 1, pageSize = 100) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetches suppliers from /api/v1/suppliers endpoint
  // ...
}
```

### 4. Updated SupplierManagement Component
**File**: `apps/inventory/src/app/components/suppliers/SupplierManagement.tsx`

Changes made:
- Removed `mockSuppliers` constant
- Added `useSuppliers()` hook to fetch real suppliers
- Updated `supplierMap` to use `supplier_name` from API response
- Updated supplier dropdown to use real suppliers
- Transformed supplier data for ItemSupplierDialog to match expected format

```typescript
const { suppliers, loading: suppliersLoading } = useSuppliers(1, 100);

// Transform for dialog
suppliers={suppliers.map(s => ({ 
  id: s.id, 
  name: s.supplier_name, 
  code: s.supplier_code 
}))}
```

## API Endpoint
The suppliers are now fetched from:
```
GET /api/v1/suppliers?page=1&page_size=100&sort_by=created_at&sort_order=desc
```

Expected backend response format:
```json
{
  "suppliers": [
    {
      "id": "uuid",
      "supplier_code": "SUP001",
      "supplier_name": "Supplier Name",
      "contact_person": "John Doe",
      "email": "contact@supplier.com",
      "phone": "+1234567890",
      "address": "123 Main St",
      "status": "active",
      "created_at": "2026-02-15T...",
      "updated_at": "2026-02-15T..."
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 100,
    "total_items": 10,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

## Testing
1. Ensure backend `/api/v1/suppliers` endpoint returns suppliers
2. Navigate to Sourcing > Suppliers tab
3. Click "Link Item to Supplier"
4. The supplier dropdown should now show real suppliers from the backend
5. If backend returns empty list, dropdown will be empty (no mock data)

## Benefits
- Real-time data from backend
- No hardcoded mock data
- Consistent with other API integrations
- Proper error handling
- Loading states
- Scalable solution

## Notes
- The hook fetches up to 100 suppliers by default (can be adjusted)
- If backend returns empty suppliers list, the dropdown will be empty
- Make sure backend has suppliers created before testing
- The `itemSupplierApi` endpoint was also fixed to use `/item-suppliers` instead of `/suppliers`
