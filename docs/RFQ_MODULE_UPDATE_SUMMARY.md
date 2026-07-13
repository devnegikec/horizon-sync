# RFQ Module Update - Implementation Summary

## Overview

Updated the RFQ Management module to follow the same pattern as Quotation and Material Request modules, with improved architecture, better state management, and enhanced user experience.

## Changes Made

### 1. New Consolidated Hook (`useRFQManagement.ts`)
- Created comprehensive management hook consolidating all RFQ operations
- Includes state management for dialogs, filters, pagination, and table instance
- Implements server-side pagination support
- Provides stats calculation (total, draft, sent, responded)
- Handles all CRUD operations with proper error handling and toast notifications
- Follows the exact pattern from `useQuotationManagement` and `useMaterialRequestManagement`

### 2. New Stats Component (`RFQStats.tsx`)
- Displays 4 stat cards: Total RFQs, Draft, Sent, Responded
- Uses the shared `StatCard` component for consistency
- Matches the visual style of QuotationStats and MaterialRequestStats

### 3. Updated Main Component (`RFQManagement.tsx`)
- Complete refactor to use the new consolidated hook
- Added error display component
- Added stats cards section
- Improved component organization
- Better separation of concerns
- Follows the exact structure of QuotationManagement

## Components That Need Updates

### 1. RFQManagementHeader (rename from RFQHeader)
**File**: `apps/inventory/src/app/components/rfqs/RFQHeader.tsx` → `RFQManagementHeader.tsx`

**Required Changes**:
```typescript
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components/ui/button';

interface RFQManagementHeaderProps {
  onRefresh: () => void;
  onCreateRFQ: () => void;
  isLoading?: boolean;
}

export function RFQManagementHeader({
  onRefresh,
  onCreateRFQ,
  isLoading = false,
}: RFQManagementHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Request for Quotations</h1>
        <p className="text-muted-foreground mt-1">
          Send RFQs to suppliers and collect quotes
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
        <Button
          onClick={onCreateRFQ}
          className="gap-2 bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          New RFQ
        </Button>
      </div>
    </div>
  );
}
```

### 2. RFQManagementFilters (rename from RFQFilters)
**File**: `apps/inventory/src/app/components/rfqs/RFQFilters.tsx` → `RFQManagementFilters.tsx`

**Required Changes**:
- Add table instance support
- Update to work with the new consolidated hook
- Follow the pattern from MaterialRequestManagementFilters

### 3. RFQsTable (rename from RFQTable)
**File**: `apps/inventory/src/app/components/rfqs/RFQTable.tsx` → `RFQsTable.tsx`

**Required Changes**:
- Complete rewrite using DataTable component with TanStack Table
- Server-side pagination support
- Proper column definitions with sorting
- Action dropdown menu with conditional actions based on status
- Empty state with helpful messaging
- Loading skeleton
- Error handling
- Follow the pattern from MaterialRequestsTable and QuotationsTable

**Columns to Display**:
- RFQ # (with closing date)
- Material Request (if linked)
- Suppliers Count
- Line Items Count
- Status
- Actions (View, Edit, Send, Close, Delete)

**Status-Based Actions**:
- **Draft**: Can Edit, Send, Delete
- **Sent**: Can Close only
- **Partially Responded**: Can Close only
- **Fully Responded**: Can Close only
- **Closed**: View only

### 4. RFQDialog
**File**: `apps/inventory/src/app/components/rfqs/RFQDialog.tsx`

**Required Changes**:
- Update to accept new `onSave` signature: `(data: CreateRFQPayload | UpdateRFQPayload, id?: string) => Promise<void>`
- Add proper form state management with all required fields:
  - Closing Date
  - Supplier Selection (multi-select)
  - Line Items (with item picker, quantity, required date, description)
  - Material Request Reference (optional)
- Remove dependency on separate action hooks
- Use the parent's handleSave function
- Follow the pattern from QuotationDialog

**Form Fields**:
```typescript
- Closing Date * (date picker)
- Material Request (optional dropdown - for linking)
- Suppliers * (multi-select with search)
- Line Items:
  - Item * (item picker)
  - Quantity *
  - Required Date *
  - Description (optional)
```

### 5. RFQDetailDialog
**File**: `apps/inventory/src/app/components/rfqs/RFQDetailDialog.tsx`

**Required Changes**:
- Update to accept `rfq: RFQ | null` instead of `rfqId`
- Add proper detail view with:
  - RFQ header information
  - Supplier list
  - Line items table
  - Quote comparison (if quotes exist)
  - Actions: Edit, Send Email, Convert to PO
- Follow the pattern from QuotationDetailDialog

**Sections to Display**:
1. Header: RFQ #, Status, Closing Date
2. Reference: Material Request (if linked)
3. Suppliers: List of suppliers with contact info
4. Line Items: Table with item details
5. Quotes: Quote comparison table (if any quotes exist)
6. Actions: Edit (draft only), Send Email, Convert to PO (if fully responded)

### 6. Quote Comparison Component (NEW)
**File**: `apps/inventory/src/app/components/rfqs/QuoteComparison.tsx`

**Purpose**: Display supplier quotes side-by-side for comparison

**Features**:
- Table showing all line items
- Columns for each supplier who provided quotes
- Price and delivery date for each quote
- Highlight best price
- Sort by price or delivery date
- Calculate total for each supplier

**Reference**: See the QuoteComparison component example in the steering file

### 7. Supplier Quote Form (NEW)
**File**: `apps/inventory/src/app/components/rfqs/SupplierQuoteForm.tsx`

**Purpose**: Record supplier quotes for RFQ line items

**Features**:
- Select supplier
- For each line item:
  - Quoted price
  - Quoted delivery date
  - Supplier notes
- Validate all fields
- Submit quote

### 8. Convert to PO Button (NEW)
**File**: `apps/inventory/src/app/components/rfqs/ConvertToPOButton.tsx`

**Purpose**: Convert RFQ to Purchase Order

**Features**:
- Show only for fully_responded or partially_responded RFQs
- Select supplier
- Select quotes for each line item
- Add tax rate and discount
- Preview PO before creation
- Create PO and close RFQ

**Reference**: See the ConvertToPOButton component example in the steering file

## Updated Exports

**File**: `apps/inventory/src/app/components/rfqs/index.ts`

```typescript
export { RFQManagement } from './RFQManagement';
export { RFQManagementHeader } from './RFQManagementHeader';
export { RFQManagementFilters } from './RFQManagementFilters';
export { RFQsTable } from './RFQsTable';
export { RFQDialog } from './RFQDialog';
export { RFQDetailDialog } from './RFQDetailDialog';
export { RFQStats } from './RFQStats';
export { QuoteComparison } from './QuoteComparison';
export { SupplierQuoteForm } from './SupplierQuoteForm';
export { ConvertToPOButton } from './ConvertToPOButton';
```

## API Integration

### Required API Endpoints

1. **List RFQs**: `GET /api/v1/rfqs`
2. **Get RFQ**: `GET /api/v1/rfqs/{id}`
3. **Create RFQ**: `POST /api/v1/rfqs`
4. **Update RFQ**: `PATCH /api/v1/rfqs/{id}` (DRAFT only)
5. **Delete RFQ**: `DELETE /api/v1/rfqs/{id}` (DRAFT only)
6. **Send RFQ**: `POST /api/v1/rfqs/{id}/send`
7. **Close RFQ**: `POST /api/v1/rfqs/{id}/close`
8. **Add Quote**: `POST /api/v1/rfqs/{id}/quotes`
9. **Convert to PO**: `POST /api/v1/purchase-orders/from-rfq`

### API Service Updates

Ensure `rfqApi` in `apps/inventory/src/app/utility/api/rfqs.ts` has all required methods:

```typescript
- list(accessToken, filters)
- getById(accessToken, id)
- create(accessToken, payload)
- update(accessToken, id, payload)
- delete(accessToken, id)
- send(accessToken, id)
- close(accessToken, id)
- addQuote(accessToken, id, quoteData)
```

## Type Updates

**File**: `apps/inventory/src/app/types/rfq.types.ts`

Ensure all types match the API specification:

```typescript
- RFQ (full object with line_items and suppliers)
- RFQListItem (list view with counts)
- RFQLine (line item with quotes)
- RFQSupplier (supplier reference)
- SupplierQuote (quote details)
- CreateRFQPayload
- UpdateRFQPayload
- RecordQuotePayload
- RFQFilters
- RFQsResponse
```

## Key Features

1. **Server-Side Pagination**: Full support for paginated data from the API
2. **Stats Dashboard**: Real-time statistics showing RFQ counts by status
3. **Advanced Filtering**: Search and status filtering with table integration
4. **Conditional Actions**: Actions are enabled/disabled based on RFQ status
5. **Error Handling**: Comprehensive error display and toast notifications
6. **Loading States**: Proper loading indicators throughout the UI
7. **Empty States**: Helpful empty state messages with call-to-action
8. **Type Safety**: Full TypeScript support with proper type definitions
9. **Consistent UI**: Matches the design pattern of other management pages
10. **Quote Comparison**: Side-by-side comparison of supplier quotes
11. **Email Integration**: Send RFQs to suppliers via email
12. **PO Conversion**: Convert RFQs to Purchase Orders

## Next Steps

1. ✅ Create `useRFQManagement` hook
2. ✅ Create `RFQStats` component
3. ✅ Update `RFQManagement` component
4. ⏳ Rename and update `RFQHeader` → `RFQManagementHeader`
5. ⏳ Rename and update `RFQFilters` → `RFQManagementFilters`
6. ⏳ Rename and update `RFQTable` → `RFQsTable` (complete rewrite)
7. ⏳ Update `RFQDialog` with new signature and form fields
8. ⏳ Update `RFQDetailDialog` with proper detail view
9. ⏳ Create `QuoteComparison` component
10. ⏳ Create `SupplierQuoteForm` component
11. ⏳ Create `ConvertToPOButton` component
12. ⏳ Update exports in `index.ts`
13. ⏳ Test all functionality

## Testing Checklist

- [ ] Create RFQ with line items and suppliers
- [ ] Send RFQ to suppliers
- [ ] Record supplier quotes
- [ ] View quote comparison
- [ ] Convert RFQ to Purchase Order
- [ ] Close RFQ
- [ ] Update RFQ (DRAFT only)
- [ ] Delete RFQ (DRAFT only)
- [ ] List RFQs with filters
- [ ] View RFQ details
- [ ] Send RFQ via email
- [ ] Link RFQ to Material Request

## Reference Components

For implementation patterns, refer to:
- **Quotation Module**: `apps/inventory/src/app/components/quotations/`
- **Material Request Module**: `apps/inventory/src/app/components/material-requests/`
- **Steering File**: `.kiro/steering/frontend-sourcing-flow-module.md`

