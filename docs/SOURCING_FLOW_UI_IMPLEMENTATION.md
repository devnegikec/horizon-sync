# Sourcing Flow UI Implementation Guide

## Overview

This document outlines the complete UI implementation for the Sourcing Flow (Procure-to-Pay) feature based on the backend specification in `horizon-sync-erp-be/.kiro/specs/sourcing-flow/`.

## Current Status

### ✅ Completed (Tasks 1-5.3)
- Material Request UI (fully implemented)
- RFQ UI (fully implemented)
- Material Request API client with correct endpoints (`/material-requests` with hyphens)
- RFQ API client
- TypeScript types for Material Requests and RFQs
- Status constants fixed (lowercase: draft, submitted, etc.)

### ✅ Just Completed
- Purchase Order TypeScript types (`purchase-order.types.ts`)
- Purchase Order API client (`purchase-orders.ts`)
- API exports updated to include Purchase Orders

### 🔨 Remaining Work

#### 1. Purchase Order Hooks

Create the following hooks in `horizon-sync/apps/inventory/src/app/hooks/`:

**usePurchaseOrders.ts** - List and fetch Purchase Orders
```typescript
import { useState, useEffect, useCallback } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { purchaseOrderApi } from '../utility/api';
import type { PurchaseOrderListItem, PurchaseOrderFilters } from '../types/purchase-order.types';

export function usePurchaseOrders(initialFilters: Partial<PurchaseOrderFilters> = {}) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<Partial<PurchaseOrderFilters>>({
    status: 'all',
    search: '',
    page: 1,
    page_size: 10,
    sort_by: 'created_at',
    sort_order: 'desc',
    ...initialFilters,
  });

  const fetchPurchaseOrders = useCallback(async () => {
    if (!accessToken) {
      setPurchaseOrders([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await purchaseOrderApi.list(accessToken, filters);
      setPurchaseOrders(response.purchase_orders || []);
      setTotalCount(response.pagination?.total_count || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Purchase Orders';
      setError(errorMessage);
      console.error('Error fetching Purchase Orders:', err);
      setPurchaseOrders([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [accessToken, filters]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  const refetch = useCallback(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  return {
    purchaseOrders,
    loading,
    error,
    totalCount,
    filters,
    setFilters,
    refetch,
  };
}
```

**usePurchaseOrderActions.ts** - CRUD operations
```typescript
import { useState } from 'react';
import { useUserStore } from '@horizon-sync/store';
import { useToast } from '@horizon-sync/ui/hooks';
import { purchaseOrderApi } from '../utility/api';
import type { PurchaseOrder, CreatePurchaseOrderPayload, UpdatePurchaseOrderPayload } from '../types/purchase-order.types';

export function usePurchaseOrderActions() {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const createPurchaseOrder = async (payload: CreatePurchaseOrderPayload): Promise<PurchaseOrder | null> => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const result = await purchaseOrderApi.create(accessToken, payload);
      toast({
        title: 'Success',
        description: 'Purchase Order created successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create Purchase Order';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updatePurchaseOrder = async (id: string, payload: UpdatePurchaseOrderPayload): Promise<PurchaseOrder | null> => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const result = await purchaseOrderApi.update(accessToken, id, payload);
      toast({
        title: 'Success',
        description: 'Purchase Order updated successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update Purchase Order';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deletePurchaseOrder = async (id: string): Promise<boolean> => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return false;
    }

    setLoading(true);
    try {
      await purchaseOrderApi.delete(accessToken, id);
      toast({
        title: 'Success',
        description: 'Purchase Order deleted successfully',
      });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete Purchase Order';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const submitPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const result = await purchaseOrderApi.submit(accessToken, id);
      toast({
        title: 'Success',
        description: 'Purchase Order submitted successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit Purchase Order';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cancelPurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const result = await purchaseOrderApi.cancel(accessToken, id);
      toast({
        title: 'Success',
        description: 'Purchase Order cancelled successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel Purchase Order';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const closePurchaseOrder = async (id: string): Promise<PurchaseOrder | null> => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Not authenticated',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);
    try {
      const result = await purchaseOrderApi.close(accessToken, id);
      toast({
        title: 'Success',
        description: 'Purchase Order closed successfully',
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to close Purchase Order';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    submitPurchaseOrder,
    cancelPurchaseOrder,
    closePurchaseOrder,
  };
}
```

#### 2. Purchase Order Components

Create the following components in `horizon-sync/apps/inventory/src/app/components/purchase-orders/`:

**Component Structure:**
```
purchase-orders/
├── index.ts                          # Barrel export
├── PurchaseOrderManagement.tsx       # Main container component
├── PurchaseOrderHeader.tsx           # Header with "Create PO" button
├── PurchaseOrderFilters.tsx          # Search and status filters
├── PurchaseOrderTable.tsx            # Table with list of POs
├── PurchaseOrderDialog.tsx           # Create/Edit dialog
└── PurchaseOrderDetailDialog.tsx     # View details dialog
```

**Key Features to Implement:**

1. **PurchaseOrderTable.tsx**
   - Display columns: PO Number, Supplier, Status, Grand Total, Created Date, Actions
   - Status badges with colors (draft, submitted, partially_received, fully_received, closed, cancelled)
   - Action buttons: View, Edit (draft only), Submit (draft only), Cancel, Close (fully_received only), Delete (draft only)
   - Pagination controls

2. **PurchaseOrderDialog.tsx**
   - Form fields:
     - Supplier selection (dropdown)
     - RFQ reference (optional, dropdown)
     - Line items (dynamic list):
       - Item selection
       - Quantity
       - Unit price
       - Line total (calculated)
     - Tax rate (percentage)
     - Discount amount
     - Subtotal (calculated)
     - Tax amount (calculated)
     - Grand total (calculated)
   - Validation:
     - At least one line item required
     - Positive quantities and prices
     - Valid supplier selection

3. **PurchaseOrderDetailDialog.tsx**
   - Display all PO information
   - Show line items in a table
   - Display calculated totals
   - Show received quantities for each line item
   - Display status history (if available)

#### 3. Status Constants and Colors

```typescript
// In PurchaseOrderTable.tsx and PurchaseOrderDetailDialog.tsx
const STATUS_COLORS: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  partially_received: 'bg-yellow-100 text-yellow-800',
  fully_received: 'bg-green-100 text-green-800',
  closed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};
```

#### 4. Integration with SourcingPage

Update `horizon-sync/apps/inventory/src/app/pages/SourcingPage.tsx`:

```typescript
import { PurchaseOrderManagement } from '../components/purchase-orders';

// In the render section:
{activeView === 'purchase_orders' && <PurchaseOrderManagement />}
```

#### 5. Potential Issues to Fix

Based on the existing code review:

1. **RFQTable.tsx** - Status checks use uppercase (DRAFT, SENT) but backend returns lowercase
   - Fix: Change all status comparisons to lowercase

2. **MaterialRequestTable.tsx** - Remove unused MaterialRequest import

3. **API Endpoint Consistency** - Ensure all endpoints use hyphens not underscores:
   - ✅ `/material-requests` (fixed)
   - ✅ `/rfqs` (correct)
   - ✅ `/purchase-orders` (correct)

## Testing Checklist

### Material Requests
- [ ] Create new Material Request
- [ ] Edit draft Material Request
- [ ] Submit Material Request
- [ ] Cancel Material Request
- [ ] View Material Request details
- [ ] Delete draft Material Request
- [ ] Filter by status
- [ ] Search Material Requests
- [ ] Pagination works correctly

### RFQs
- [ ] Create RFQ from Material Request
- [ ] Create standalone RFQ
- [ ] Edit draft RFQ
- [ ] Send RFQ to suppliers
- [ ] Record supplier quotes
- [ ] Close RFQ
- [ ] View RFQ details
- [ ] Delete draft RFQ
- [ ] Filter by status
- [ ] Search RFQs
- [ ] Pagination works correctly

### Purchase Orders
- [ ] Create PO from RFQ
- [ ] Create standalone PO
- [ ] Edit draft PO
- [ ] Submit PO
- [ ] Cancel PO
- [ ] Close PO (only when fully received)
- [ ] View PO details
- [ ] Delete draft PO
- [ ] Filter by status
- [ ] Search POs
- [ ] Pagination works correctly
- [ ] Totals calculate correctly (subtotal, tax, grand total)

### Integration Tests
- [ ] Material Request → RFQ workflow
- [ ] RFQ → Purchase Order workflow
- [ ] Status transitions work correctly
- [ ] Validation errors display properly
- [ ] Authentication required for all operations
- [ ] Permissions enforced correctly

## Backend API Endpoints Reference

### Material Requests
- `GET /api/v1/material-requests` - List
- `POST /api/v1/material-requests` - Create
- `GET /api/v1/material-requests/{id}` - Get by ID
- `PUT /api/v1/material-requests/{id}` - Update (DRAFT only)
- `DELETE /api/v1/material-requests/{id}` - Delete (DRAFT only)
- `POST /api/v1/material-requests/{id}/submit` - Submit
- `POST /api/v1/material-requests/{id}/cancel` - Cancel

### RFQs
- `GET /api/v1/rfqs` - List
- `POST /api/v1/rfqs` - Create
- `GET /api/v1/rfqs/{id}` - Get by ID
- `PUT /api/v1/rfqs/{id}` - Update (DRAFT only)
- `DELETE /api/v1/rfqs/{id}` - Delete (DRAFT only)
- `POST /api/v1/rfqs/{id}/send` - Send to suppliers
- `POST /api/v1/rfqs/{id}/quotes` - Record quote
- `POST /api/v1/rfqs/{id}/close` - Close

### Purchase Orders
- `GET /api/v1/purchase-orders` - List
- `POST /api/v1/purchase-orders` - Create
- `GET /api/v1/purchase-orders/{id}` - Get by ID
- `PUT /api/v1/purchase-orders/{id}` - Update (DRAFT only)
- `DELETE /api/v1/purchase-orders/{id}` - Delete (DRAFT only)
- `POST /api/v1/purchase-orders/{id}/submit` - Submit
- `POST /api/v1/purchase-orders/{id}/cancel` - Cancel
- `POST /api/v1/purchase-orders/{id}/close` - Close

## Next Steps

1. Create the Purchase Order hooks (usePurchaseOrders.ts, usePurchaseOrderActions.ts)
2. Create the Purchase Order components directory and files
3. Implement each component following the existing patterns from Material Requests and RFQs
4. Fix the RFQTable status comparison issue (uppercase → lowercase)
5. Update SourcingPage to include Purchase Order management
6. Test the complete workflow: Material Request → RFQ → Purchase Order
7. Consider implementing Purchase Receipts and Landed Costs (future work)

## Notes

- All status values from backend are lowercase (draft, submitted, etc.)
- All API endpoints use hyphens not underscores (/material-requests not /material_requests)
- Transaction Engine automatically calculates totals on the backend
- Purchase Orders can only be closed when status is fully_received
- Draft documents can be edited and deleted, submitted documents cannot
