# Complete Sourcing Flow UI Implementation Guide

## Overview

This document provides a complete implementation guide for the remaining parts of the Sourcing Flow (Procure-to-Pay) UI based on the backend API documentation at `horizon-sync-erp-be/core-service/SOURCING_FLOW_API_DOCUMENTATION.md`.

## Current Status

### ✅ Completed
1. **Material Requests** - Full CRUD, submit, cancel operations
2. **RFQs** - Full CRUD, send, record quotes, close operations  
3. **Purchase Orders** - Full CRUD, submit, cancel, close operations
4. **Purchase Receipts (Types & API)** - Types and API client created

### 🔨 In Progress
4. **Purchase Receipts (UI)** - Hooks created, components needed

### ❌ Not Started
5. **Purchase Invoices** - Complete implementation needed
6. **Payment Made** - Complete implementation needed

---

## 1. Purchase Receipts (Receipt Notes) - REMAINING WORK

### Already Created
- ✅ `purchase-receipt.types.ts` - TypeScript types
- ✅ `purchase-receipts.ts` - API client
- ✅ `usePurchaseReceipts.ts` - List hook
- ✅ `usePurchaseReceiptActions.ts` - Create hook
- ✅ API exports updated

### Components Needed

Create in `horizon-sync/apps/inventory/src/app/components/purchase-receipts/`:

#### 1.1 PurchaseReceiptManagement.tsx
Main container component that:
- Uses `usePurchaseReceipts` and `usePurchaseReceiptActions` hooks
- Manages dialog state for create/view
- Handles create action
- Filters by Purchase Order if needed

```typescript
import { useState } from 'react';
import { usePurchaseReceipts } from '../../hooks/usePurchaseReceipts';
import { usePurchaseReceiptActions } from '../../hooks/usePurchaseReceiptActions';

export function PurchaseReceiptManagement() {
  const { purchaseReceipts, loading, error, totalCount, filters, setFilters, refetch } = usePurchaseReceipts();
  const { loading: actionLoading, createPurchaseReceipt } = usePurchaseReceiptActions();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  
  // Handler functions...
  
  return (
    <div className="space-y-6">
      <PurchaseReceiptHeader onCreateReceipt={handleCreate} />
      <PurchaseReceiptFilters filters={filters} setFilters={setFilters} />
      <PurchaseReceiptTable ... />
      <PurchaseReceiptDialog ... />
      <PurchaseReceiptDetailDialog ... />
    </div>
  );
}
```

#### 1.2 PurchaseReceiptHeader.tsx
Header with "Record Receipt" button

#### 1.3 PurchaseReceiptFilters.tsx
- Search by Purchase Order ID
- Filter by reference type
- Date range filter

#### 1.4 PurchaseReceiptTable.tsx
Display columns:
- Receipt Number
- Purchase Order Reference
- Received Date
- Line Items Count
- Status (always "completed")
- Actions: View

#### 1.5 PurchaseReceiptDialog.tsx
**IMPORTANT**: This is the most complex component

Form fields:
- Purchase Order selection (dropdown of submitted/partially_received POs)
- Received Date (date picker)
- Line items (dynamic list):
  - Item (auto-populated from PO, read-only)
  - Ordered Quantity (read-only)
  - Already Received (read-only)
  - Remaining Quantity (read-only)
  - Receiving Now (input, max = remaining quantity)

Validation:
- At least one line item with quantity > 0
- Receiving quantity cannot exceed remaining quantity
- Purchase Order must be in submitted or partially_received status

Side Effects Display:
- Show warning: "This will update stock levels and PO status"
- Display calculated stock impact

#### 1.6 PurchaseReceiptDetailDialog.tsx
Display:
- Receipt information
- Purchase Order reference (link)
- Received date
- Line items table with quantities
- Stock impact summary

---

## 2. Purchase Invoices - COMPLETE IMPLEMENTATION NEEDED

### 2.1 Types

Create `horizon-sync/apps/inventory/src/app/types/purchase-invoice.types.ts`:

```typescript
export interface PurchaseInvoiceLine {
  id: string;
  invoice_id: string;
  purchase_order_line_id?: string;
  item_id: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
}

export interface PurchaseInvoice {
  id: string;
  organization_id: string;
  invoice_type: 'PURCHASE';
  reference_type?: 'PURCHASE_ORDER';
  reference_id?: string;
  party_type: 'SUPPLIER';
  party_id: string;
  invoice_date: string;
  due_date: string;
  status: 'draft' | 'submitted' | 'paid' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  discount_amount?: number;
  grand_total: number;
  outstanding_balance: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  line_items: PurchaseInvoiceLine[];
}

export type PurchaseInvoiceStatus = PurchaseInvoice['status'];

export interface PurchaseInvoiceListItem {
  id: string;
  organization_id: string;
  invoice_type: string;
  reference_id?: string;
  party_id: string;
  supplier_name?: string;
  invoice_date: string;
  due_date: string;
  status: string;
  grand_total: number;
  outstanding_balance: number;
  created_at: string;
  line_items_count?: number;
}

export interface PurchaseInvoiceLineCreate {
  purchase_order_line_id?: string;
  item_id: string;
  quantity: number;
  unit_price: number;
}

export interface CreatePurchaseInvoicePayload {
  invoice_type: 'PURCHASE';
  reference_type?: 'PURCHASE_ORDER';
  reference_id?: string;
  party_type: 'SUPPLIER';
  party_id: string;
  invoice_date: string;
  due_date: string;
  line_items: PurchaseInvoiceLineCreate[];
}

export interface UpdatePurchaseInvoicePayload {
  invoice_date?: string;
  due_date?: string;
  line_items?: PurchaseInvoiceLineCreate[];
}

export interface PurchaseInvoiceFilters {
  page?: number;
  page_size?: number;
  invoice_type?: string;
  party_id?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

export interface PurchaseInvoicesResponse {
  invoices: PurchaseInvoiceListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}
```

### 2.2 API Client

Create `horizon-sync/apps/inventory/src/app/utility/api/purchase-invoices.ts`:

```typescript
import type {
  PurchaseInvoice,
  PurchaseInvoicesResponse,
  CreatePurchaseInvoicePayload,
  UpdatePurchaseInvoicePayload,
  PurchaseInvoiceFilters,
} from '../../types/purchase-invoice.types';

const BASE_URL = 'http://localhost:8000/api/v1';

export const purchaseInvoiceApi = {
  async list(accessToken: string, filters: Partial<PurchaseInvoiceFilters> = {}): Promise<PurchaseInvoicesResponse> {
    const params = new URLSearchParams();
    params.append('invoice_type', 'PURCHASE'); // Always filter for purchase invoices
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    if (filters.party_id) params.append('party_id', filters.party_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.sort_order) params.append('sort_order', filters.sort_order);

    const response = await fetch(`${BASE_URL}/invoices?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Failed to fetch purchase invoices');
    }

    return response.json();
  },

  async getById(accessToken: string, id: string): Promise<PurchaseInvoice> {
    const response = await fetch(`${BASE_URL}/invoices/${id}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Failed to fetch purchase invoice');
    }

    return response.json();
  },

  async create(accessToken: string, payload: CreatePurchaseInvoicePayload): Promise<PurchaseInvoice> {
    const response = await fetch(`${BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Failed to create purchase invoice');
    }

    return response.json();
  },

  async update(accessToken: string, id: string, payload: UpdatePurchaseInvoicePayload): Promise<PurchaseInvoice> {
    const response = await fetch(`${BASE_URL}/invoices/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Failed to update purchase invoice');
    }

    return response.json();
  },

  async submit(accessToken: string, id: string): Promise<PurchaseInvoice> {
    const response = await fetch(`${BASE_URL}/invoices/${id}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Failed to submit purchase invoice');
    }

    return response.json();
  },

  async delete(accessToken: string, id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/invoices/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Failed to delete purchase invoice');
    }
  },
};
```

### 2.3 Hooks

Create `usePurchaseInvoices.ts` and `usePurchaseInvoiceActions.ts` following the same patterns as Purchase Orders.

### 2.4 Components

Create in `horizon-sync/apps/inventory/src/app/components/purchase-invoices/`:

1. **PurchaseInvoiceManagement.tsx** - Main container
2. **PurchaseInvoiceHeader.tsx** - Header with "Create Invoice" button
3. **PurchaseInvoiceFilters.tsx** - Search, status, supplier filters
4. **PurchaseInvoiceTable.tsx** - Display invoices with columns:
   - Invoice Number
   - Supplier
   - Invoice Date
   - Due Date
   - Status
   - Grand Total
   - Outstanding Balance
   - Actions: View, Edit (draft only), Submit (draft only), Delete (draft only)
5. **PurchaseInvoiceDialog.tsx** - Create/Edit form:
   - Purchase Order selection (optional)
   - Supplier selection
   - Invoice date
   - Due date
   - Line items (from PO or manual entry)
   - Totals display (subtotal, tax, grand total)
   - **Three-Way Matching Validation**: Invoiced quantity cannot exceed received quantity
6. **PurchaseInvoiceDetailDialog.tsx** - View details:
   - Invoice information
   - Line items table
   - Payment history
   - Outstanding balance

### Status Colors
```typescript
const STATUS_COLORS: Record<PurchaseInvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};
```

---

## 3. Payment Made - COMPLETE IMPLEMENTATION NEEDED

### 3.1 Types

Create `horizon-sync/apps/inventory/src/app/types/payment.types.ts`:

```typescript
export interface Payment {
  id: string;
  organization_id: string;
  payment_type: 'PAY' | 'RECEIVE';
  reference_type?: 'PURCHASE_INVOICE' | 'SALES_INVOICE';
  reference_id?: string;
  party_type: 'SUPPLIER' | 'CUSTOMER';
  party_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD';
  status: 'completed' | 'pending' | 'failed';
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type PaymentType = Payment['payment_type'];
export type PaymentMethod = Payment['payment_method'];
export type PaymentStatus = Payment['status'];

export interface PaymentListItem {
  id: string;
  organization_id: string;
  payment_type: string;
  reference_id?: string;
  party_id: string;
  supplier_name?: string;
  customer_name?: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: string;
  created_at: string;
}

export interface CreatePaymentPayload {
  payment_type: 'PAY' | 'RECEIVE';
  reference_type?: 'PURCHASE_INVOICE' | 'SALES_INVOICE';
  reference_id?: string;
  party_type: 'SUPPLIER' | 'CUSTOMER';
  party_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  notes?: string;
}

export interface PaymentFilters {
  page?: number;
  page_size?: number;
  payment_type?: string;
  party_id?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaymentsResponse {
  payments: PaymentListItem[];
  pagination: {
    page: number;
    page_size: number;
    total_count: number;
    total_pages: number;
  };
}
```

### 3.2 API Client

Create `horizon-sync/apps/inventory/src/app/utility/api/payments.ts` with methods:
- `list()` - Filter by payment_type='PAY' for supplier payments
- `getById()`
- `create()`

### 3.3 Hooks

Create `usePayments.ts` and `usePaymentActions.ts`.

### 3.4 Components

Create in `horizon-sync/apps/inventory/src/app/components/payments/`:

1. **PaymentManagement.tsx** - Main container
2. **PaymentHeader.tsx** - Header with "Record Payment" button
3. **PaymentFilters.tsx** - Search, payment type, supplier filters
4. **PaymentTable.tsx** - Display payments with columns:
   - Payment Number
   - Supplier/Customer
   - Payment Type (Pay/Receive)
   - Amount
   - Payment Date
   - Payment Method
   - Status
   - Actions: View
5. **PaymentDialog.tsx** - Create form:
   - Payment Type selection (PAY for suppliers, RECEIVE for customers)
   - Invoice selection (shows outstanding balance)
   - Supplier/Customer (auto-filled from invoice)
   - Amount (max = outstanding balance)
   - Payment Date
   - Payment Method dropdown
   - Notes
   - **Validation**: Amount cannot exceed outstanding balance
6. **PaymentDetailDialog.tsx** - View details:
   - Payment information
   - Invoice reference (link)
   - Party information
   - Payment method details

### Payment Methods
```typescript
const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHECK', label: 'Check' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
];
```

### Status Colors
```typescript
const STATUS_COLORS: Record<PaymentStatus, string> = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
};
```

---

## 4. Integration with SourcingPage

Update `horizon-sync/apps/inventory/src/app/pages/SourcingPage.tsx`:

```typescript
import { PurchaseReceiptManagement } from '../components/purchase-receipts';
import { PurchaseInvoiceManagement } from '../components/purchase-invoices';
import { PaymentManagement } from '../components/payments';

// In the render section:
{activeView === 'purchase_receipts' && <PurchaseReceiptManagement />}
{activeView === 'purchase_invoices' && <PurchaseInvoiceManagement />}
{activeView === 'payments' && <PaymentManagement />}
```

Update the navigation to include these views.

---

## 5. Key Implementation Notes

### Three-Way Matching
Purchase Invoices must validate against received quantities:
- Fetch Purchase Order with received quantities
- Compare invoice line quantities with received quantities
- Show error if invoice quantity > received quantity
- Display warning message about three-way matching

### Stock Level Updates
Purchase Receipts automatically update stock levels:
- Display confirmation message about stock impact
- Show before/after stock levels in UI
- Consider adding a stock level check before creating receipt

### Outstanding Balance Tracking
Purchase Invoices track outstanding balance:
- Display outstanding balance prominently
- Update in real-time as payments are made
- Show payment history in invoice detail view

### Status Transitions
All documents follow state machines:
- Disable actions based on current status
- Show allowed transitions in UI
- Display status history/audit trail

### Workflow Integration
Link documents in the workflow:
- Material Request → RFQ (link in RFQ detail)
- RFQ → Purchase Order (link in PO detail)
- Purchase Order → Receipt Note (link in receipt detail)
- Purchase Order → Purchase Invoice (link in invoice detail)
- Purchase Invoice → Payment (link in payment detail)

### Error Handling
Handle specific API errors:
- Quantity exceeded errors
- State conflict errors
- Three-way matching failures
- Outstanding balance errors
- Display user-friendly error messages

---

## 6. Testing Checklist

### Purchase Receipts
- [ ] Create receipt for submitted PO
- [ ] Create partial receipt
- [ ] Create second receipt to complete PO
- [ ] Verify PO status updates (submitted → partially_received → fully_received)
- [ ] Verify stock levels increment correctly
- [ ] Cannot receive more than ordered quantity
- [ ] View receipt details
- [ ] Filter receipts by PO

### Purchase Invoices
- [ ] Create invoice from PO
- [ ] Create standalone invoice
- [ ] Edit draft invoice
- [ ] Submit invoice
- [ ] Delete draft invoice
- [ ] Three-way matching validation works
- [ ] Cannot invoice more than received
- [ ] Totals calculate correctly
- [ ] Outstanding balance displays correctly
- [ ] View invoice details
- [ ] Filter by status and supplier

### Payments
- [ ] Create payment for invoice
- [ ] Partial payment updates outstanding balance
- [ ] Full payment marks invoice as paid
- [ ] Cannot pay more than outstanding balance
- [ ] Payment methods work correctly
- [ ] View payment details
- [ ] Filter by payment type and supplier

### Integration
- [ ] Complete workflow: MR → RFQ → PO → Receipt → Invoice → Payment
- [ ] All document links work correctly
- [ ] Status transitions flow properly
- [ ] Stock levels update correctly
- [ ] Outstanding balances track correctly

---

## 7. API Endpoint Reference

### Purchase Receipts
- `GET /api/v1/purchase-receipts` - List
- `POST /api/v1/purchase-receipts` - Create
- `GET /api/v1/purchase-receipts/{id}` - Get by ID

### Purchase Invoices
- `GET /api/v1/invoices?invoice_type=PURCHASE` - List
- `POST /api/v1/invoices` - Create
- `GET /api/v1/invoices/{id}` - Get by ID
- `PUT /api/v1/invoices/{id}` - Update (DRAFT only)
- `DELETE /api/v1/invoices/{id}` - Delete (DRAFT only)
- `POST /api/v1/invoices/{id}/submit` - Submit

### Payments
- `GET /api/v1/payments?payment_type=PAY` - List
- `POST /api/v1/payments` - Create
- `GET /api/v1/payments/{id}` - Get by ID

---

## 8. Next Steps

1. Complete Purchase Receipt components (highest priority - needed for workflow)
2. Implement Purchase Invoice types, API, hooks, and components
3. Implement Payment types, API, hooks, and components
4. Update SourcingPage navigation
5. Test complete workflow end-to-end
6. Add workflow visualization/status tracking
7. Consider adding dashboard/analytics for procurement metrics

---

## Notes

- All status values are lowercase (draft, submitted, paid, etc.)
- All API endpoints use hyphens not underscores
- Transaction Engine automatically calculates totals on backend
- Three-way matching is enforced by backend
- Stock levels are automatically updated by backend
- Outstanding balances are automatically tracked by backend
