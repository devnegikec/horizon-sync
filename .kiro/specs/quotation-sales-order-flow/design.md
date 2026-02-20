# Design Document: Quotation and Sales Order Management

## Overview

This design specifies the frontend implementation of a complete Quotation and Sales Order management system within the Revenue module. The system enables sales representatives to create and manage quotations, track their lifecycle through various statuses, convert accepted quotations to sales orders, and manage orders through fulfillment and invoicing.

The implementation follows established patterns in the application:
- React with TypeScript for type safety
- TanStack Query for server state management with caching
- TanStack Table for data table functionality
- Shadcn UI components for consistent design
- Lucide React icons for visual elements
- Tailwind CSS for styling

The system integrates seamlessly with existing Customer Management and extends the Revenue page navigation with two new tabs: Quotations and Sales Orders.

## Architecture

### Component Hierarchy

```
RevenuePage
├── Revenue_Navigation (updated with new tabs)
├── QuotationManagement
│   ├── Stats_Cards (quotation metrics)
│   ├── Filter_Controls (search and status filter)
│   ├── QuotationsTable
│   │   └── Row actions (View, Edit, Delete)
│   ├── QuotationDialog (create/edit form)
│   │   ├── Customer selection
│   │   ├── Date pickers
│   │   ├── Currency selection
│   │   ├── Line_Item_Table
│   │   └── Grand total calculation
│   ├── QuotationDetailDialog (read-only view)
│   │   ├── Status_Badge
│   │   ├── Line items display
│   │   └── Action buttons (Edit, Convert)
│   └── ConvertToSalesOrderDialog
│       ├── Quotation summary
│       ├── Order date picker
│       └── Delivery date picker
└── SalesOrderManagement
    ├── Stats_Cards (sales order metrics)
    ├── Filter_Controls (search and status filter)
    ├── SalesOrdersTable
    │   └── Row actions (View, Edit, Delete)
    ├── SalesOrderDialog (create/edit form)
    │   ├── Customer selection
    │   ├── Date pickers
    │   ├── Currency selection
    │   ├── Line_Item_Table (with billed/delivered qty)
    │   └── Grand total calculation
    ├── SalesOrderDetailDialog (read-only view)
    │   ├── Status_Badge
    │   ├── Line items with fulfillment status
    │   ├── Reference to source quotation
    │   └── Action buttons (Edit, Create Invoice)
    └── CreateInvoiceDialog
        ├── Sales order summary
        ├── Date pickers
        ├── Line items with quantity selection
        └── Invoice total calculation
```

### Data Flow

1. **Query Flow**: Components use TanStack Query hooks to fetch data from backend APIs
2. **Mutation Flow**: Form submissions trigger mutations that invalidate relevant queries
3. **Cache Management**: Query cache maintains data consistency across components
4. **State Management**: Local component state for UI interactions, server state via TanStack Query

### API Integration

The system communicates with backend REST APIs through standardized API client functions:

```typescript
// API client pattern
export const quotationApi = {
  list: (accessToken, page, pageSize, filters) => apiRequest('/quotations', ...),
  get: (accessToken, id) => apiRequest(`/quotations/${id}`, ...),
  create: (accessToken, data) => apiRequest('/quotations', { method: 'POST', body: data }),
  update: (accessToken, id, data) => apiRequest(`/quotations/${id}`, { method: 'PUT', body: data }),
  delete: (accessToken, id) => apiRequest(`/quotations/${id}`, { method: 'DELETE' }),
  convertToSalesOrder: (accessToken, id, data) => apiRequest(`/quotations/${id}/convert-to-sales-order`, { method: 'POST', body: data })
}

export const salesOrderApi = {
  list: (accessToken, page, pageSize, filters) => apiRequest('/sales-orders', ...),
  get: (accessToken, id) => apiRequest(`/sales-orders/${id}`, ...),
  create: (accessToken, data) => apiRequest('/sales-orders', { method: 'POST', body: data }),
  update: (accessToken, id, data) => apiRequest(`/sales-orders/${id}`, { method: 'PUT', body: data }),
  delete: (accessToken, id) => apiRequest(`/sales-orders/${id}`, { method: 'DELETE' }),
  createInvoice: (accessToken, id, data) => apiRequest(`/sales-orders/${id}/create-invoice`, { method: 'POST', body: data })
}
```

## Components and Interfaces

### 1. QuotationManagement Component

Main container component for quotation management.

**Props**: None (uses global state and hooks)

**State**:
```typescript
interface QuotationManagementState {
  filters: {
    search: string;
    status: 'all' | 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  };
  page: number;
  pageSize: number;
  dialogStates: {
    create: boolean;
    detail: boolean;
    convert: boolean;
  };
  selectedQuotation: Quotation | null;
  editQuotation: Quotation | null;
}
```

**Responsibilities**:
- Fetch and display quotation list with pagination
- Manage filter state and trigger filtered queries
- Calculate and display statistics
- Coordinate dialog opening/closing
- Handle quotation CRUD operations
- Invalidate query cache after mutations

### 2. QuotationDialog Component

Form dialog for creating and editing quotations.

**Props**:
```typescript
interface QuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null; // null for create, populated for edit
  onSave: (data: QuotationCreate | QuotationUpdate, id?: string) => Promise<void>;
  saving: boolean;
}
```

**State**:
```typescript
interface QuotationFormState {
  customer_id: string;
  quotation_date: string; // ISO date string
  valid_until: string; // ISO date string
  currency: string;
  remarks: string;
  status: QuotationStatus;
  lineItems: QuotationLineItem[];
}
```

**Validation Rules**:
- Customer must be selected
- Quotation date is required
- Valid until date must be after quotation date
- At least one line item required
- All line items must have positive quantity and rate
- Status transitions must follow workflow rules

**Behavior**:
- Pre-populate form when editing existing quotation
- Disable line item editing when status is SENT or later
- Calculate line item amounts automatically (qty × rate)
- Calculate grand total from all line items
- Show loading state during save operation

### 3. QuotationDetailDialog Component

Read-only dialog displaying complete quotation details.

**Props**:
```typescript
interface QuotationDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null;
  onEdit: (quotation: Quotation) => void;
  onConvert: (quotation: Quotation) => void;
}
```

**Display Sections**:
- Header with quotation number and status badge
- Customer information
- Dates (quotation date, valid until)
- Currency and grand total
- Line items table (read-only)
- Remarks
- Timestamps (created, updated)
- Action buttons (Edit, Convert to Sales Order)

**Conditional Rendering**:
- Edit button disabled for terminal statuses (ACCEPTED, REJECTED, EXPIRED)
- Convert button only shown for ACCEPTED status

### 4. ConvertToSalesOrderDialog Component

Dialog for converting accepted quotations to sales orders.

**Props**:
```typescript
interface ConvertToSalesOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation | null;
  onConvert: (quotationId: string, data: ConversionData) => Promise<void>;
  converting: boolean;
}

interface ConversionData {
  order_date: string;
  delivery_date?: string;
}
```

**Behavior**:
- Display quotation summary (customer, total, line items)
- Allow setting order date (default: current date)
- Allow setting optional delivery date
- Call conversion API endpoint
- Navigate to Sales Orders tab on success

### 5. SalesOrderManagement Component

Main container component for sales order management.

**Props**: None (uses global state and hooks)

**State**:
```typescript
interface SalesOrderManagementState {
  filters: {
    search: string;
    status: 'all' | 'draft' | 'confirmed' | 'partially_delivered' | 'delivered' | 'closed' | 'cancelled';
  };
  page: number;
  pageSize: number;
  dialogStates: {
    create: boolean;
    detail: boolean;
    invoice: boolean;
  };
  selectedSalesOrder: SalesOrder | null;
  editSalesOrder: SalesOrder | null;
}
```

**Responsibilities**:
- Fetch and display sales order list with pagination
- Manage filter state and trigger filtered queries
- Calculate and display statistics
- Coordinate dialog opening/closing
- Handle sales order CRUD operations
- Invalidate query cache after mutations

### 6. SalesOrderDialog Component

Form dialog for creating and editing sales orders.

**Props**:
```typescript
interface SalesOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null; // null for create, populated for edit
  onSave: (data: SalesOrderCreate | SalesOrderUpdate, id?: string) => Promise<void>;
  saving: boolean;
}
```

**State**:
```typescript
interface SalesOrderFormState {
  customer_id: string;
  order_date: string; // ISO date string
  delivery_date?: string; // ISO date string
  currency: string;
  remarks: string;
  status: SalesOrderStatus;
  lineItems: SalesOrderLineItem[];
}
```

**Validation Rules**:
- Customer must be selected
- Order date is required
- Delivery date must be after order date if provided
- At least one line item required
- All line items must have positive quantity and rate
- Status transitions must follow workflow rules
- Cannot edit line items that would invalidate existing invoices/deliveries

**Behavior**:
- Pre-populate form when editing existing sales order
- Display billed_qty and delivered_qty as read-only for each line item
- Disable line item editing when status is CONFIRMED or later
- Calculate line item amounts automatically (qty × rate)
- Calculate grand total from all line items
- Show loading state during save operation

### 7. SalesOrderDetailDialog Component

Read-only dialog displaying complete sales order details.

**Props**:
```typescript
interface SalesOrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null;
  onEdit: (salesOrder: SalesOrder) => void;
  onCreateInvoice: (salesOrder: SalesOrder) => void;
}
```

**Display Sections**:
- Header with sales order number and status badge
- Customer information
- Dates (order date, delivery date)
- Currency and grand total
- Reference to source quotation (if applicable)
- Line items table with fulfillment status
  - Item name, quantity, UOM, rate, amount
  - Billed quantity with progress indicator
  - Delivered quantity with progress indicator
- Remarks
- Timestamps (created, updated, submitted)
- Action buttons (Edit, Create Invoice)

**Conditional Rendering**:
- Edit button disabled for CLOSED status
- Create Invoice button only shown for CONFIRMED or later statuses
- Quotation reference link only shown when reference_type is "Quotation"

### 8. CreateInvoiceDialog Component

Dialog for creating invoices from sales orders.

**Props**:
```typescript
interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null;
  onCreateInvoice: (salesOrderId: string, data: InvoiceCreationData) => Promise<void>;
  creating: boolean;
}

interface InvoiceCreationData {
  posting_date: string;
  due_date: string;
  line_items: {
    sales_order_line_item_id: string;
    qty_to_bill: number;
  }[];
}
```

**Behavior**:
- Display sales order summary
- Show line items with:
  - Quantity ordered
  - Quantity already billed
  - Quantity available to bill
  - Input for quantity to bill (default: available quantity)
- Validate that qty_to_bill ≤ available quantity
- Calculate invoice total based on selected quantities
- Call invoice creation API endpoint
- Navigate to Invoices tab on success

### 9. QuotationsTable Component

Data table displaying quotation list.

**Props**:
```typescript
interface QuotationsTableProps {
  quotations: Quotation[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (quotation: Quotation) => void;
  onEdit: (quotation: Quotation) => void;
  onDelete: (quotation: Quotation) => void;
  onTableReady: (table: Table<Quotation>) => void;
  serverPagination: ServerPaginationConfig;
}
```

**Columns**:
- Quotation Number (sortable)
- Customer Name (sortable)
- Quotation Date (sortable)
- Valid Until (sortable)
- Grand Total (formatted with currency)
- Status (with Status_Badge)
- Actions (View, Edit, Delete buttons)

**Features**:
- Server-side pagination
- Column visibility toggle
- Row actions with conditional enabling
- Empty state with "Create Quotation" CTA
- Loading skeletons

### 10. SalesOrdersTable Component

Data table displaying sales order list.

**Props**:
```typescript
interface SalesOrdersTableProps {
  salesOrders: SalesOrder[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (salesOrder: SalesOrder) => void;
  onEdit: (salesOrder: SalesOrder) => void;
  onDelete: (salesOrder: SalesOrder) => void;
  onTableReady: (table: Table<SalesOrder>) => void;
  serverPagination: ServerPaginationConfig;
}
```

**Columns**:
- Sales Order Number (sortable)
- Customer Name (sortable)
- Order Date (sortable)
- Delivery Date (sortable)
- Grand Total (formatted with currency)
- Status (with Status_Badge)
- Reference (link icon if from quotation)
- Actions (View, Edit, Delete buttons)

**Features**:
- Server-side pagination
- Column visibility toggle
- Row actions with conditional enabling
- Empty state with "Create Sales Order" CTA
- Loading skeletons

### 11. StatusBadge Component

Reusable component for displaying status with appropriate styling.

**Props**:
```typescript
interface StatusBadgeProps {
  status: QuotationStatus | SalesOrderStatus;
  className?: string;
}
```

**Status Styling**:
- DRAFT: amber/yellow background
- SENT: blue background
- ACCEPTED: green background
- REJECTED: red background
- EXPIRED: gray background
- CONFIRMED: blue background
- PARTIALLY_DELIVERED: purple background
- DELIVERED: green background
- CLOSED: gray background
- CANCELLED: red background

### 12. LineItemTable Component

Reusable component for managing line items in forms.

**Props**:
```typescript
interface LineItemTableProps {
  items: LineItem[];
  onItemsChange: (items: LineItem[]) => void;
  readonly?: boolean;
  showFulfillmentStatus?: boolean; // for sales orders
  disabled?: boolean;
}
```

**Features**:
- Add/remove line items
- Item selection dropdown
- Quantity, UOM, rate inputs
- Automatic amount calculation
- Sort order management
- Fulfillment status display (for sales orders)
- Validation feedback

## Data Models

### Quotation Types

```typescript
interface Quotation {
  id: string;
  quotation_no: string;
  organization_id: string;
  customer_id: string;
  customer_name: string;
  customer?: CustomerInfo;
  quotation_date: string; // ISO date string
  valid_until: string; // ISO date string
  grand_total: string; // decimal as string
  currency: string;
  status: QuotationStatus;
  remarks?: string;
  line_items: QuotationLineItem[];
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  extra_data?: Record<string, unknown>;
}

type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

interface QuotationLineItem {
  id: string;
  quotation_id: string;
  item_id: string;
  item_name: string;
  item_sku?: string;
  qty: number;
  uom: string;
  rate: string; // decimal as string
  amount: string; // decimal as string (qty × rate)
  sort_order: number;
  extra_data?: Record<string, unknown>;
}

interface QuotationCreate {
  customer_id: string;
  quotation_date: string;
  valid_until: string;
  currency: string;
  remarks?: string;
  line_items: QuotationLineItemCreate[];
}

interface QuotationLineItemCreate {
  item_id: string;
  qty: number;
  uom: string;
  rate: number;
  sort_order: number;
}

interface QuotationUpdate {
  quotation_date?: string;
  valid_until?: string;
  currency?: string;
  status?: QuotationStatus;
  remarks?: string;
  line_items?: QuotationLineItemCreate[];
}

interface QuotationResponse {
  quotations: Quotation[];
  pagination: PaginationInfo;
}
```

### Sales Order Types

```typescript
interface SalesOrder {
  id: string;
  sales_order_no: string;
  organization_id: string;
  customer_id: string;
  customer_name: string;
  customer?: CustomerInfo;
  order_date: string; // ISO date string
  delivery_date?: string; // ISO date string
  grand_total: string; // decimal as string
  currency: string;
  status: SalesOrderStatus;
  reference_type?: string; // e.g., "Quotation"
  reference_id?: string; // UUID of source quotation
  remarks?: string;
  line_items: SalesOrderLineItem[];
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  submitted_at?: string;
  extra_data?: Record<string, unknown>;
}

type SalesOrderStatus = 
  | 'draft' 
  | 'confirmed' 
  | 'partially_delivered' 
  | 'delivered' 
  | 'closed' 
  | 'cancelled';

interface SalesOrderLineItem {
  id: string;
  sales_order_id: string;
  item_id: string;
  item_name: string;
  item_sku?: string;
  qty: number;
  uom: string;
  rate: string; // decimal as string
  amount: string; // decimal as string (qty × rate)
  billed_qty: number;
  delivered_qty: number;
  sort_order: number;
  extra_data?: Record<string, unknown>;
}

interface SalesOrderCreate {
  customer_id: string;
  order_date: string;
  delivery_date?: string;
  currency: string;
  reference_type?: string;
  reference_id?: string;
  remarks?: string;
  line_items: SalesOrderLineItemCreate[];
}

interface SalesOrderLineItemCreate {
  item_id: string;
  qty: number;
  uom: string;
  rate: number;
  sort_order: number;
}

interface SalesOrderUpdate {
  order_date?: string;
  delivery_date?: string;
  currency?: string;
  status?: SalesOrderStatus;
  remarks?: string;
  line_items?: SalesOrderLineItemCreate[];
}

interface SalesOrderResponse {
  sales_orders: SalesOrder[];
  pagination: PaginationInfo;
}
```

### Shared Types

```typescript
interface CustomerInfo {
  customer_code: string;
  customer_name: string;
  email?: string;
  phone?: string;
}

interface PaginationInfo {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

interface ServerPaginationConfig {
  pageIndex: number; // 0-based for TanStack Table
  pageSize: number;
  totalItems: number;
  onPaginationChange: (pageIndex: number, pageSize: number) => void;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Line Item Amount Calculation

*For any* line item with quantity and rate values, the calculated amount should equal quantity multiplied by rate.

**Validates: Requirements 3.9, 11.9**

### Property 2: Grand Total Calculation

*For any* quotation or sales order with line items, the grand total should equal the sum of all line item amounts.

**Validates: Requirements 3.10, 11.10**

### Property 3: Statistics Recalculation

*For any* change to the quotation or sales order dataset, the displayed statistics (total count, status counts, totals) should accurately reflect the current data.

**Validates: Requirements 2.6, 10.6**

### Property 4: Filter Reset on Change

*For any* filter value change (search term or status), the pagination should reset to page 1.

**Validates: Requirements 1.9, 9.9**

### Property 5: Search Filtering Correctness

*For any* search term, the filtered results should only include quotations or sales orders where the quotation/order number or customer name contains the search term (case-insensitive).

**Validates: Requirements 1.7, 9.7**

### Property 6: Form Pre-population

*For any* existing quotation or sales order, when the edit dialog opens, all form fields should be pre-populated with the current values from that record.

**Validates: Requirements 4.1, 12.1**

### Property 7: Initial Status Assignment

*For any* newly created quotation or sales order, the initial status should be set to DRAFT.

**Validates: Requirements 6.1, 14.1**

### Property 8: Line Item Validation

*For any* line item, if the quantity or rate is zero or negative, the form validation should reject the submission and display an error message.

**Validates: Requirements 3.13, 11.13, 19.5, 19.6**

### Property 9: Date Validation

*For any* quotation, if the valid_until date is before the quotation_date, the form validation should reject the submission. Similarly, for any sales order, if the delivery_date is before the order_date, the form validation should reject the submission.

**Validates: Requirements 19.3, 19.4**

### Property 10: Invoice Quantity Validation

*For any* sales order line item when creating an invoice, if the quantity to bill exceeds the available quantity (ordered quantity minus already billed quantity), the form validation should reject the submission.

**Validates: Requirements 16.8, 16.14**

### Property 11: Status Transition Validation

*For any* quotation status transition, the system should only allow transitions that follow the defined workflow: DRAFT → SENT → (ACCEPTED | REJECTED | EXPIRED). Similarly, for sales orders: DRAFT → CONFIRMED → PARTIALLY_DELIVERED → DELIVERED → CLOSED, with CANCELLED available from any non-terminal state.

**Validates: Requirements 6.2, 6.3, 6.4, 6.5, 14.3, 14.4, 14.5, 14.6, 14.7**

### Property 12: Pagination Consistency

*For any* page size and total item count, the pagination should correctly calculate the number of pages and enable/disable next/previous buttons appropriately.

**Validates: Requirements 1.6, 9.6**

## Error Handling

### API Error Handling

All API calls should implement consistent error handling:

1. **Network Errors**: Display user-friendly message with retry option
2. **Validation Errors**: Display specific field-level errors from backend
3. **Authorization Errors**: Display appropriate message and potentially redirect to login
4. **Server Errors (5xx)**: Display generic error message with support contact information

### Form Validation Errors

Form validation should provide immediate feedback:

1. **Required Fields**: Display "This field is required" message
2. **Invalid Dates**: Display "Invalid date format" or "Date must be after X"
3. **Invalid Numbers**: Display "Must be a positive number"
4. **Business Rule Violations**: Display specific business rule message

### Error Display Patterns

- **Toast Notifications**: For API operation results (success/failure)
- **Inline Field Errors**: For form validation errors
- **Error Cards**: For page-level errors (e.g., failed to load data)
- **Confirmation Dialogs**: For destructive actions (delete)

### Error Recovery

- **Retry Mechanisms**: Provide retry buttons for failed API calls
- **Form State Preservation**: Maintain form data when errors occur
- **Graceful Degradation**: Show cached data when refresh fails
- **Clear Error Messages**: Explain what went wrong and how to fix it

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific UI component rendering
- User interaction flows (button clicks, form submissions)
- Edge cases (empty data, single item, maximum items)
- Error state handling
- Integration between components
- Specific examples of business logic

**Property-Based Tests** focus on:
- Universal calculation correctness (amounts, totals)
- Validation rules across all possible inputs
- Data transformation correctness
- State management consistency
- Filter and search behavior across random inputs

### Property-Based Testing Configuration

**Library**: Use `fast-check` for TypeScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: quotation-sales-order-flow, Property {number}: {property_text}`

**Example Property Test Structure**:

```typescript
import fc from 'fast-check';

describe('Feature: quotation-sales-order-flow, Property 1: Line Item Amount Calculation', () => {
  it('should calculate amount as quantity × rate for all line items', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.01, max: 10000 }), // quantity
        fc.float({ min: 0.01, max: 10000 }), // rate
        (qty, rate) => {
          const lineItem = { qty, rate };
          const calculatedAmount = calculateLineItemAmount(lineItem);
          const expectedAmount = qty * rate;
          expect(calculatedAmount).toBeCloseTo(expectedAmount, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing Focus Areas

**Component Rendering Tests**:
- QuotationManagement renders with correct initial state
- SalesOrderManagement renders with correct initial state
- Tables render with correct columns
- Dialogs open and close correctly
- Status badges display with correct styling

**User Interaction Tests**:
- Creating a new quotation with valid data succeeds
- Editing an existing quotation updates correctly
- Deleting a draft quotation works
- Converting accepted quotation to sales order works
- Creating invoice from sales order works
- Filter changes trigger data refresh
- Pagination controls work correctly

**Edge Case Tests**:
- Empty quotation list displays correct message
- Single line item can be added and removed
- Form validation prevents submission with missing required fields
- Terminal status quotations cannot be edited
- Sales order with fully billed items can be closed

**Integration Tests**:
- Navigation between tabs preserves state
- Query cache invalidation after mutations
- Dialog state management across components
- Error handling displays correct messages

### Test Data Generators

Create reusable generators for test data:

```typescript
// For property-based tests
const quotationArbitrary = fc.record({
  customer_id: fc.uuid(),
  quotation_date: fc.date(),
  valid_until: fc.date(),
  currency: fc.constantFrom('USD', 'EUR', 'GBP'),
  line_items: fc.array(lineItemArbitrary, { minLength: 1, maxLength: 10 })
});

const lineItemArbitrary = fc.record({
  item_id: fc.uuid(),
  qty: fc.float({ min: 0.01, max: 1000 }),
  uom: fc.constantFrom('pcs', 'kg', 'ltr'),
  rate: fc.float({ min: 0.01, max: 10000 }),
  sort_order: fc.nat()
});

// For unit tests
const mockQuotation = (overrides?: Partial<Quotation>): Quotation => ({
  id: 'test-id',
  quotation_no: 'QT-2026-001',
  customer_id: 'customer-id',
  customer_name: 'Test Customer',
  quotation_date: '2026-01-15',
  valid_until: '2026-02-15',
  grand_total: '1000.00',
  currency: 'USD',
  status: 'draft',
  line_items: [],
  created_at: '2026-01-15T10:00:00Z',
  updated_at: '2026-01-15T10:00:00Z',
  ...overrides
});
```

### Testing Tools and Libraries

- **Testing Framework**: Vitest (already configured in project)
- **React Testing**: @testing-library/react
- **Property-Based Testing**: fast-check
- **API Mocking**: MSW (Mock Service Worker)
- **Query Testing**: @tanstack/react-query testing utilities

### Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 12 correctness properties implemented
- **Integration Test Coverage**: All major user workflows covered
- **Edge Case Coverage**: All identified edge cases tested

### Continuous Testing

- Run unit tests on every commit
- Run property tests in CI pipeline
- Run integration tests before deployment
- Monitor test execution time and optimize slow tests
