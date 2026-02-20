# Design Document: Invoice and Payment Management

## Overview

This design document specifies the technical implementation for Invoice and Payment management features in the Revenue module. The system follows established patterns from the Quotations and Sales Orders implementation, using React, TypeScript, TanStack Query for data management, TanStack Table for data grids, and Shadcn UI components.

The implementation consists of two main management interfaces (Invoices and Payments), each with list views, detail dialogs, create/edit forms, and supporting components. The system integrates with the existing Revenue page navigation and maintains consistency with established UI patterns.

## Architecture

### Component Hierarchy

```
RevenuePage
├── Revenue_Navigation (updated with Invoices and Payments tabs)
├── InvoiceManagement
│   ├── InvoiceManagementHeader
│   ├── InvoiceStats
│   ├── InvoiceManagementFilters
│   ├── InvoicesTable
│   ├── InvoiceDetailDialog
│   ├── InvoiceDialog (Create/Edit)
│   ├── CreateInvoiceFromSalesOrderDialog
│   ├── SendInvoiceEmailDialog
│   └── GenerateInvoicePDFButton
└── PaymentManagement
    ├── PaymentManagementHeader
    ├── PaymentStats
    ├── PaymentManagementFilters
    ├── PaymentsTable
    ├── PaymentDetailDialog
    ├── PaymentDialog (Create/Edit)
    └── PaymentAllocationTable
```

### Data Flow

1. **Query Layer**: TanStack Query manages all API calls with caching
2. **Hook Layer**: Custom hooks encapsulate business logic and state management
3. **Component Layer**: Presentational components render UI
4. **API Layer**: API client utilities handle HTTP requests

### State Management

- **Server State**: Managed by TanStack Query (invoices, payments, customers, items)
- **UI State**: Managed by React useState (dialogs, filters, selections)
- **Form State**: Managed by React Hook Form with Zod validation

## Components and Interfaces

### 1. InvoiceManagement Component

Main container component for invoice management.

**Props**: None (root component)

**State**:
- `filters`: Object containing search, status, and date range filters
- `detailDialogOpen`: Boolean for detail dialog visibility
- `createDialogOpen`: Boolean for create/edit dialog visibility
- `emailDialogOpen`: Boolean for email dialog visibility
- `selectedInvoice`: Currently selected invoice object
- `editInvoice`: Invoice being edited

**Hooks Used**:
- `useInvoiceManagement`: Custom hook encapsulating invoice management logic
- `useToast`: For displaying notifications

**Child Components**:
- InvoiceManagementHeader
- InvoiceStats
- InvoiceManagementFilters
- InvoicesTable
- InvoiceDetailDialog
- InvoiceDialog
- SendInvoiceEmailDialog

### 2. InvoicesTable Component

Data table displaying invoices with pagination, sorting, and filtering.

**Props**:
```typescript
interface InvoicesTableProps {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (invoice: Invoice) => void;
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onSendEmail: (invoice: Invoice) => void;
  onCreateInvoice: () => void;
  onTableReady: (table: Table<Invoice>) => void;
  serverPagination: ServerPaginationConfig;
}
```

**Columns**:
- Invoice Number (with link to detail)
- Customer Name
- Posting Date
- Due Date
- Grand Total
- Paid Amount
- Outstanding Amount
- Currency
- Status (with Status_Badge)
- Actions (View, Edit, Delete, Send Email)

**Features**:
- Server-side pagination
- Column sorting
- Column visibility toggle
- Row actions dropdown
- Empty state with create button
- Loading skeletons

### 3. InvoiceDialog Component

Dialog for creating and editing invoices.

**Props**:
```typescript
interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice?: Invoice | null;
  onSave: (data: InvoiceFormData, id?: string) => Promise<void>;
  saving: boolean;
}
```

**Form Fields**:
- Customer (select dropdown)
- Posting Date (date picker)
- Due Date (date picker)
- Currency (select dropdown)
- Invoice Type (select: Sales, Purchase, Debit Note, Credit Note)
- Status (select: Draft, Submitted)
- Remarks (textarea)
- Line Items (dynamic table)

**Line Item Fields**:
- Item (select dropdown with search)
- Description (text input)
- Quantity (number input)
- UOM (text input, auto-filled from item)
- Rate (number input)
- Tax Template (select dropdown)
- Tax Amount (calculated, read-only)
- Amount (calculated, read-only)

**Calculations**:
- Line Amount = Quantity × Rate
- Tax Amount = Line Amount × (Tax Rate / 100)
- Subtotal = Sum of all Line Amounts
- Total Tax = Sum of all Tax Amounts
- Grand Total = Subtotal + Total Tax

**Validation**:
- Customer is required
- At least one line item is required
- All line items must have positive quantity and rate
- Due date must not be before posting date
- Posting date is required

### 4. InvoiceDetailDialog Component

Read-only dialog displaying complete invoice details.

**Props**:
```typescript
interface InvoiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onEdit: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onGeneratePDF: (invoiceId: string) => void;
  onSendEmail: (invoice: Invoice) => void;
}
```

**Sections**:
- Header: Invoice number, status badge, action buttons
- Customer Information: Name, contact details
- Dates: Posting date, due date
- Line Items Table: All line items with amounts
- Totals: Subtotal, total tax, grand total, paid amount, outstanding amount
- Payment History: List of linked payments
- Reference: Link to source sales order (if applicable)
- Audit Trail: Created/updated timestamps and users

**Actions**:
- Edit (if status is DRAFT)
- Record Payment (if status is SUBMITTED and outstanding > 0)
- Generate PDF
- Send Email
- View Sales Order (if reference exists)

### 5. CreateInvoiceFromSalesOrderDialog Component

Dialog for creating invoices from sales orders.

**Props**:
```typescript
interface CreateInvoiceFromSalesOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: SalesOrder | null;
  onCreateInvoice: (salesOrderId: string, data: CreateInvoiceData) => Promise<void>;
  creating: boolean;
}
```

**Form Fields**:
- Posting Date (date picker, default: today)
- Due Date (date picker)
- Line Items (table with quantity to bill)

**Line Item Display**:
- Item Name
- Quantity Ordered
- Quantity Already Billed
- Quantity Available to Bill
- Quantity to Bill (editable, default: available quantity)
- Rate (from sales order, read-only)
- Amount (calculated)

**Validation**:
- At least one line item must have quantity to bill > 0
- Quantity to bill must not exceed available quantity
- Due date must not be before posting date

### 6. SendInvoiceEmailDialog Component

Dialog for sending invoice via email.

**Props**:
```typescript
interface SendInvoiceEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSend: (invoiceId: string, emailData: EmailData) => Promise<void>;
  sending: boolean;
}
```

**Form Fields**:
- To (email address, pre-filled from customer)
- Subject (text input, default: "Invoice {invoice_number}")
- Body (textarea, default template)
- Attachment (read-only: invoice PDF)

### 7. PaymentManagement Component

Main container component for payment management.

**Props**: None (root component)

**State**:
- `filters`: Object containing search, status, payment mode, and date range filters
- `detailDialogOpen`: Boolean for detail dialog visibility
- `createDialogOpen`: Boolean for create/edit dialog visibility
- `selectedPayment`: Currently selected payment object
- `editPayment`: Payment being edited

**Hooks Used**:
- `usePaymentManagement`: Custom hook encapsulating payment management logic
- `useToast`: For displaying notifications

**Child Components**:
- PaymentManagementHeader
- PaymentStats
- PaymentManagementFilters
- PaymentsTable
- PaymentDetailDialog
- PaymentDialog

### 8. PaymentsTable Component

Data table displaying payments with pagination, sorting, and filtering.

**Props**:
```typescript
interface PaymentsTableProps {
  payments: Payment[];
  loading: boolean;
  error: string | null;
  hasActiveFilters: boolean;
  onView: (payment: Payment) => void;
  onEdit: (payment: Payment) => void;
  onDelete: (paymentId: string) => void;
  onCreatePayment: () => void;
  onTableReady: (table: Table<Payment>) => void;
  serverPagination: ServerPaginationConfig;
}
```

**Columns**:
- Payment Number (with link to detail)
- Party Name
- Payment Date
- Payment Mode
- Total Amount
- Allocated Amount
- Unallocated Amount
- Currency
- Status (with Status_Badge)
- Actions (View, Edit, Delete)

### 9. PaymentDialog Component

Dialog for creating and editing payments.

**Props**:
```typescript
interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment?: Payment | null;
  preSelectedInvoice?: Invoice | null;
  onSave: (data: PaymentFormData, id?: string) => Promise<void>;
  saving: boolean;
}
```

**Form Fields**:
- Party Type (select: Customer, Supplier)
- Party (select dropdown, filtered by party type)
- Payment Date (date picker)
- Payment Mode (select: Cash, Bank Transfer, Credit Card, Check, Other)
- Reference Number (text input)
- Currency (select dropdown)
- Total Amount (number input)
- Status (select: Draft, Submitted)
- Remarks (textarea)
- Invoice Allocations (PaymentAllocationTable)

**Validation**:
- Party is required
- Payment mode is required
- Total amount must be greater than zero
- Total allocated amount must not exceed total amount
- Each allocation must not exceed invoice outstanding amount

### 10. PaymentAllocationTable Component

Table for allocating payment amounts to invoices.

**Props**:
```typescript
interface PaymentAllocationTableProps {
  partyId: string | null;
  partyType: 'Customer' | 'Supplier' | null;
  currency: string;
  totalAmount: number;
  allocations: PaymentAllocation[];
  onAllocationsChange: (allocations: PaymentAllocation[]) => void;
}
```

**Columns**:
- Select (checkbox)
- Invoice Number (with link)
- Posting Date
- Grand Total
- Outstanding Amount
- Allocated Amount (editable input)

**Features**:
- Fetches outstanding invoices for selected party
- Allows selecting multiple invoices
- Validates allocation amounts
- Displays total allocated and unallocated amounts
- Auto-allocation button (allocates in order of due date)

### 11. PaymentDetailDialog Component

Read-only dialog displaying complete payment details.

**Props**:
```typescript
interface PaymentDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: Payment | null;
  onEdit: (payment: Payment) => void;
}
```

**Sections**:
- Header: Payment number, status badge, action buttons
- Party Information: Name, type
- Payment Details: Date, mode, reference number, currency
- Amounts: Total amount, allocated amount, unallocated amount
- Invoice Allocations Table: All allocated invoices with amounts
- Audit Trail: Created/updated timestamps and users

**Actions**:
- Edit (if status is DRAFT)
- View Invoice (for each allocation)

### 12. Statistics Components

**InvoiceStats**:
```typescript
interface InvoiceStatsProps {
  total: number;
  draft: number;
  submitted: number;
  paid: number;
  overdue: number;
  totalOutstanding: number;
}
```

**PaymentStats**:
```typescript
interface PaymentStatsProps {
  total: number;
  pending: number;
  completed: number;
  totalAmount: number;
}
```

### 13. Filter Components

**InvoiceManagementFilters**:
- Search input (invoice number, customer name)
- Status dropdown (All, Draft, Submitted, Paid, Partially Paid, Overdue, Cancelled)
- Date range picker (posting date)

**PaymentManagementFilters**:
- Search input (payment number, party name)
- Status dropdown (All, Draft, Submitted, Reconciled, Cancelled)
- Payment mode dropdown (All, Cash, Bank Transfer, Credit Card, Check, Other)
- Date range picker (payment date)

## Data Models

### Invoice Type

```typescript
interface Invoice {
  id: string;
  invoice_number: string;
  party_id: string;
  party_type: 'Customer' | 'Supplier';
  party_name: string; // Populated from join
  posting_date: string; // ISO date
  due_date: string; // ISO date
  currency: string;
  invoice_type: 'Sales' | 'Purchase' | 'Debit Note' | 'Credit Note';
  status: 'Draft' | 'Submitted' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Cancelled';
  subtotal: number;
  total_tax: number;
  grand_total: number;
  paid_amount: number;
  outstanding_amount: number;
  remarks: string | null;
  reference_type: string | null; // 'Sales Order'
  reference_id: string | null;
  line_items: InvoiceLineItem[];
  payments: PaymentAllocation[]; // Linked payments
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

interface InvoiceLineItem {
  id: string;
  item_id: string;
  item_name: string; // Populated from join
  description: string;
  quantity: number;
  uom: string;
  rate: number;
  tax_template_id: string | null;
  tax_rate: number;
  tax_amount: number;
  amount: number;
}
```

### Payment Type

```typescript
interface Payment {
  id: string;
  payment_number: string;
  party_id: string;
  party_type: 'Customer' | 'Supplier';
  party_name: string; // Populated from join
  payment_date: string; // ISO date
  payment_mode: 'Cash' | 'Bank Transfer' | 'Credit Card' | 'Check' | 'Other';
  reference_number: string | null;
  currency: string;
  total_amount: number;
  allocated_amount: number;
  unallocated_amount: number;
  status: 'Draft' | 'Submitted' | 'Reconciled' | 'Cancelled';
  remarks: string | null;
  allocations: PaymentAllocation[];
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
}

interface PaymentAllocation {
  id: string;
  invoice_id: string;
  invoice_number: string; // Populated from join
  invoice_date: string;
  invoice_amount: number;
  outstanding_before: number;
  allocated_amount: number;
}
```

### Form Data Types

```typescript
interface InvoiceFormData {
  party_id: string;
  party_type: 'Customer' | 'Supplier';
  posting_date: Date;
  due_date: Date;
  currency: string;
  invoice_type: 'Sales' | 'Purchase' | 'Debit Note' | 'Credit Note';
  status: 'Draft' | 'Submitted';
  remarks: string;
  line_items: InvoiceLineItemFormData[];
}

interface InvoiceLineItemFormData {
  item_id: string;
  description: string;
  quantity: number;
  uom: string;
  rate: number;
  tax_template_id: string | null;
}

interface PaymentFormData {
  party_id: string;
  party_type: 'Customer' | 'Supplier';
  payment_date: Date;
  payment_mode: string;
  reference_number: string;
  currency: string;
  total_amount: number;
  status: 'Draft' | 'Submitted';
  remarks: string;
  allocations: PaymentAllocationFormData[];
}

interface PaymentAllocationFormData {
  invoice_id: string;
  allocated_amount: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Invoice Calculation Properties

Property 1: Line item amount calculation
*For any* invoice line item with quantity and rate, the amount should equal quantity × rate
**Validates: Requirements 3.10**

Property 2: Tax amount calculation
*For any* invoice line item with tax template, the tax amount should equal (quantity × rate) × (tax_rate / 100)
**Validates: Requirements 3.11, 26.2**

Property 3: Invoice totals calculation
*For any* invoice with line items, the subtotal should equal the sum of all line amounts, the total tax should equal the sum of all tax amounts, and the grand total should equal subtotal + total_tax
**Validates: Requirements 3.12, 26.4, 26.5**

Property 4: Outstanding amount calculation
*For any* invoice, the outstanding amount should equal grand_total - paid_amount
**Validates: Requirements 6.4**

### Invoice Validation Properties

Property 5: Customer required validation
*For any* invoice submission attempt without a customer selected, the system should reject the submission with a validation error
**Validates: Requirements 3.13**

Property 6: Line items required validation
*For any* invoice submission attempt with zero line items, the system should reject the submission with a validation error
**Validates: Requirements 3.14**

Property 7: Positive quantities and rates validation
*For any* invoice line item with zero or negative quantity or rate, the system should reject the submission with a validation error
**Validates: Requirements 3.15**

Property 8: Due date validation
*For any* invoice where due date is before posting date, the system should reject the submission with a validation error
**Validates: Requirements 3.16**

Property 9: Billed quantity validation
*For any* invoice created from a sales order, the quantity to bill for each line item should not exceed the available quantity (ordered - already billed)
**Validates: Requirements 4.8**

Property 10: Non-zero quantity validation
*For any* invoice created from a sales order, at least one line item must have quantity to bill greater than zero
**Validates: Requirements 4.9**

### Invoice Status Properties

Property 11: New invoice status
*For any* newly created invoice, the status should be set to DRAFT
**Validates: Requirements 7.1**

Property 12: Invoice status based on payment
*For any* invoice, when a payment is recorded: if outstanding amount becomes zero, status should be PAID; if outstanding amount is greater than zero and less than grand total, status should be PARTIALLY_PAID; if outstanding amount equals grand total, status should remain SUBMITTED
**Validates: Requirements 7.7, 7.8, 28.1, 28.2**

Property 13: Overdue invoice detection
*For any* invoice in SUBMITTED status where current date is after due date and outstanding amount is greater than zero, the status should be automatically updated to OVERDUE
**Validates: Requirements 7.6**

### Invoice Permission Properties

Property 14: Draft invoice edit permission
*For any* invoice with status DRAFT, the edit and delete actions should be enabled
**Validates: Requirements 5.2, 8.2**

Property 15: Non-draft invoice edit restriction
*For any* invoice with status other than DRAFT, the edit and delete actions should be disabled
**Validates: Requirements 5.3, 8.3**

### Sales Order Integration Properties

Property 16: Sales order billed quantity update
*For any* invoice created from a sales order, the sales order line item billed_qty should be incremented by the invoice line item quantity
**Validates: Requirements 4.15**

Property 17: Sales order reference link
*For any* invoice with reference_type "Sales Order", the invoice detail view should display a link to the source sales order
**Validates: Requirements 1.13**

### Payment Allocation Properties

Property 18: Payment allocation limit per invoice
*For any* payment allocation to an invoice, the allocated amount should not exceed the invoice outstanding amount
**Validates: Requirements 13.14**

Property 19: Payment allocation total limit
*For any* payment with multiple allocations, the sum of all allocated amounts should not exceed the payment total amount
**Validates: Requirements 13.15, 29.2**

Property 20: Outstanding invoices fetch
*For any* party selected in a payment form, the payment allocation table should fetch and display only invoices for that party with outstanding amount greater than zero
**Validates: Requirements 13.10**

### Payment Status Properties

Property 21: New payment status
*For any* newly created payment, the status should be set to DRAFT
**Validates: Requirements 17.1**

Property 22: Draft payment edit permission
*For any* payment with status DRAFT, the edit and delete actions should be enabled
**Validates: Requirements 15.2, 18.2**

Property 23: Non-draft payment edit restriction
*For any* payment with status other than DRAFT, the edit and delete actions should be disabled
**Validates: Requirements 15.3, 18.3**

### Payment-Invoice Update Properties

Property 24: Invoice paid amount update
*For any* payment that is submitted, all allocated invoices should have their paid_amount incremented by the allocated amount
**Validates: Requirements 17.6**

Property 25: Invoice status update on payment
*For any* payment that is submitted, all allocated invoices should have their status updated based on the new outstanding amount (PAID if outstanding = 0, PARTIALLY_PAID if 0 < outstanding < grand_total)
**Validates: Requirements 17.7**

Property 26: Multiple payment aggregation
*For any* invoice with multiple payments, the total paid_amount should equal the sum of all payment allocations to that invoice
**Validates: Requirements 28.5**

### UI Filter Properties

Property 27: Search filter application
*For any* search term entered in the invoice or payment filter, the table should display only records where the invoice/payment number or customer/party name contains the search term
**Validates: Requirements 1.7**

Property 28: Filter pagination reset
*For any* filter value change (search, status, date range, payment mode), the table pagination should reset to page 1
**Validates: Requirements 1.9**

## Error Handling

### API Error Handling

1. **Network Errors**: Display user-friendly error message with retry option
2. **Validation Errors**: Display specific field-level validation errors from backend
3. **Authorization Errors**: Display appropriate permission denied message
4. **Not Found Errors**: Display "Invoice/Payment not found" message
5. **Conflict Errors**: Display specific conflict message (e.g., "Invoice already paid")

### Form Validation Errors

1. **Required Fields**: Display "This field is required" message
2. **Invalid Dates**: Display "Invalid date format" message
3. **Date Range Errors**: Display "Due date cannot be before posting date" message
4. **Numeric Validation**: Display "Must be a positive number" message
5. **Allocation Errors**: Display "Allocated amount exceeds outstanding amount" message

### Error Display Strategy

- Use toast notifications for API errors (destructive variant)
- Use inline field errors for form validation
- Use confirmation dialogs for destructive actions (delete)
- Provide retry mechanisms for transient errors
- Log errors to console for debugging

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Specific UI interactions (button clicks, dialog opens)
- Edge cases (empty lists, zero amounts, null values)
- Error conditions (API failures, validation errors)
- Component rendering and styling
- Integration between components

**Property-Based Tests**: Verify universal properties across all inputs
- Calculation properties (amounts, taxes, totals)
- Validation properties (required fields, date ranges, numeric limits)
- Status transition properties (invoice/payment status updates)
- Data integrity properties (allocation limits, outstanding amounts)
- Each property test runs minimum 100 iterations with randomized inputs

### Property-Based Testing Configuration

**Library**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: **Feature: invoice-payment-management, Property {number}: {property_text}**
- Generators for: invoices, payments, line items, allocations, dates, amounts
- Shrinking enabled to find minimal failing examples

**Example Property Test Structure**:
```typescript
import fc from 'fast-check';

// Feature: invoice-payment-management, Property 1: Line item amount calculation
test('line item amount equals quantity times rate', () => {
  fc.assert(
    fc.property(
      fc.float({ min: 0.01, max: 10000 }), // quantity
      fc.float({ min: 0.01, max: 10000 }), // rate
      (quantity, rate) => {
        const lineItem = createLineItem({ quantity, rate });
        const expectedAmount = quantity * rate;
        expect(lineItem.amount).toBeCloseTo(expectedAmount, 2);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Coverage

**Component Tests**:
- InvoiceManagement: Rendering, dialog state management, error display
- InvoicesTable: Column rendering, action buttons, pagination, sorting
- InvoiceDialog: Form rendering, validation, submission
- PaymentManagement: Rendering, dialog state management, error display
- PaymentsTable: Column rendering, action buttons, pagination, sorting
- PaymentDialog: Form rendering, validation, submission
- PaymentAllocationTable: Invoice fetching, allocation input, validation

**Hook Tests**:
- useInvoiceManagement: CRUD operations, filtering, pagination
- usePaymentManagement: CRUD operations, filtering, pagination
- API client functions: Request/response handling, error handling

**Integration Tests**:
- Invoice creation flow: Form → API → Cache invalidation → Table update
- Payment creation flow: Form → API → Invoice update → Cache invalidation
- Invoice from sales order: Sales order → Invoice creation → Billed qty update
- Payment allocation: Payment → Multiple invoices → Status updates

### Test Data Generators

**Invoice Generator**:
```typescript
const invoiceArbitrary = fc.record({
  party_id: fc.uuid(),
  party_type: fc.constantFrom('Customer', 'Supplier'),
  posting_date: fc.date(),
  due_date: fc.date(),
  currency: fc.constantFrom('USD', 'EUR', 'GBP'),
  invoice_type: fc.constantFrom('Sales', 'Purchase', 'Debit Note', 'Credit Note'),
  status: fc.constantFrom('Draft', 'Submitted', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'),
  line_items: fc.array(lineItemArbitrary, { minLength: 1, maxLength: 10 }),
});
```

**Payment Generator**:
```typescript
const paymentArbitrary = fc.record({
  party_id: fc.uuid(),
  party_type: fc.constantFrom('Customer', 'Supplier'),
  payment_date: fc.date(),
  payment_mode: fc.constantFrom('Cash', 'Bank Transfer', 'Credit Card', 'Check', 'Other'),
  total_amount: fc.float({ min: 0.01, max: 100000 }),
  allocations: fc.array(allocationArbitrary, { minLength: 0, maxLength: 5 }),
});
```

### Testing Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Use afterEach hooks to clean up state and mocks
3. **Mocking**: Mock API calls and external dependencies
4. **Assertions**: Use specific assertions (toBeCloseTo for floats, toEqual for objects)
5. **Coverage**: Aim for >80% code coverage, 100% for critical paths
6. **Performance**: Keep tests fast (<100ms per test)
7. **Readability**: Use descriptive test names and clear arrange-act-assert structure

## Implementation Notes

### API Integration

**Base URL**: `/api/v1`

**Invoice Endpoints**:
- `GET /invoices` - List invoices with filters and pagination
- `POST /invoices` - Create invoice
- `GET /invoices/:id` - Get invoice details
- `PUT /invoices/:id` - Update invoice
- `DELETE /invoices/:id` - Delete invoice
- `POST /invoices/from-sales-order/:salesOrderId` - Create invoice from sales order
- `GET /invoices/:id/pdf` - Generate invoice PDF
- `POST /invoices/:id/send-email` - Send invoice email

**Payment Endpoints**:
- `GET /payments` - List payments with filters and pagination
- `POST /payments` - Create payment
- `GET /payments/:id` - Get payment details
- `PUT /payments/:id` - Update payment
- `DELETE /payments/:id` - Delete payment
- `GET /payments/outstanding-invoices/:partyId` - Get outstanding invoices for party

### Query Keys

**Invoice Queries**:
- `['invoices', filters]` - Invoice list with filters
- `['invoice', invoiceId]` - Single invoice details
- `['invoice-stats', filters]` - Invoice statistics

**Payment Queries**:
- `['payments', filters]` - Payment list with filters
- `['payment', paymentId]` - Single payment details
- `['payment-stats', filters]` - Payment statistics
- `['outstanding-invoices', partyId]` - Outstanding invoices for party

### Cache Invalidation Strategy

**On Invoice Create/Update/Delete**:
- Invalidate `['invoices']` queries
- Invalidate `['invoice-stats']` queries
- If created from sales order, invalidate `['sales-order', salesOrderId]`

**On Payment Create/Update/Delete**:
- Invalidate `['payments']` queries
- Invalidate `['payment-stats']` queries
- Invalidate `['invoices']` queries (due to paid_amount updates)
- Invalidate `['invoice-stats']` queries
- For each allocated invoice, invalidate `['invoice', invoiceId]`

### State Management Patterns

**Dialog State**:
```typescript
const [detailDialogOpen, setDetailDialogOpen] = useState(false);
const [createDialogOpen, setCreateDialogOpen] = useState(false);
const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
```

**Filter State**:
```typescript
const [filters, setFilters] = useState({
  search: '',
  status: 'all',
  dateFrom: null,
  dateTo: null,
  page: 1,
  pageSize: 20,
});
```

**Form State** (using React Hook Form):
```typescript
const form = useForm<InvoiceFormData>({
  resolver: zodResolver(invoiceSchema),
  defaultValues: {
    party_id: '',
    posting_date: new Date(),
    due_date: addDays(new Date(), 30),
    currency: 'USD',
    invoice_type: 'Sales',
    status: 'Draft',
    line_items: [],
  },
});
```

### Performance Optimizations

1. **Lazy Loading**: Lazy load invoice and payment management components
2. **Memoization**: Use React.memo for expensive components
3. **Debouncing**: Debounce search input (300ms delay)
4. **Virtualization**: Use virtual scrolling for large tables (if needed)
5. **Prefetching**: Prefetch customer and item data on dialog open
6. **Optimistic Updates**: Update UI immediately for status changes
7. **Pagination**: Use server-side pagination for large datasets
8. **Caching**: Cache API responses with 30-second stale time

### Accessibility Considerations

1. **Keyboard Navigation**: All interactive elements accessible via keyboard
2. **Screen Readers**: Proper ARIA labels and roles
3. **Focus Management**: Focus trapping in dialogs, focus restoration on close
4. **Color Contrast**: WCAG AA compliant color contrast ratios
5. **Status Indicators**: Use both color and text for status badges
6. **Error Announcements**: Use aria-live regions for error messages
7. **Form Labels**: All inputs have associated labels
8. **Button Labels**: Icon-only buttons have aria-labels

### Responsive Design Breakpoints

- **Mobile**: < 640px (sm)
  - Full-screen dialogs
  - Stacked stats cards
  - Vertical filter controls
  - Horizontal scrolling tables
  
- **Tablet**: 640px - 1024px (md)
  - Centered dialogs
  - 2-column stats grid
  - Horizontal filter controls
  - Horizontal scrolling tables
  
- **Desktop**: > 1024px (lg)
  - Centered dialogs with max width
  - 4-column stats grid
  - Horizontal filter controls
  - Full-width tables

### Security Considerations

1. **Authentication**: All API calls require valid JWT token
2. **Authorization**: Check user permissions for create/edit/delete actions
3. **Input Sanitization**: Sanitize all user inputs before API calls
4. **XSS Prevention**: Use React's built-in XSS protection
5. **CSRF Protection**: Include CSRF tokens in API requests
6. **Data Validation**: Validate all data on both client and server
7. **Sensitive Data**: Don't log sensitive data (payment details, customer info)

## Migration and Deployment

### Database Migrations

No database migrations required - backend API already supports invoices and payments.

### Feature Flags

Consider using feature flags for gradual rollout:
- `invoice-management-enabled`: Enable invoice management UI
- `payment-management-enabled`: Enable payment management UI
- `invoice-pdf-generation-enabled`: Enable PDF generation
- `invoice-email-sending-enabled`: Enable email sending

### Rollout Strategy

1. **Phase 1**: Deploy invoice management (read-only)
2. **Phase 2**: Enable invoice creation and editing
3. **Phase 3**: Deploy payment management (read-only)
4. **Phase 4**: Enable payment creation and editing
5. **Phase 5**: Enable PDF generation and email sending

### Monitoring and Logging

**Metrics to Track**:
- Invoice creation rate
- Payment processing rate
- API response times
- Error rates by endpoint
- User engagement (page views, actions per session)

**Logging**:
- API errors with stack traces
- Validation errors with context
- User actions (create, edit, delete)
- Performance metrics (render times, API latency)

## Future Enhancements

1. **Bulk Operations**: Bulk invoice creation, bulk payment processing
2. **Recurring Invoices**: Automated recurring invoice generation
3. **Payment Reminders**: Automated email reminders for overdue invoices
4. **Payment Gateway Integration**: Direct payment processing via Stripe/PayPal
5. **Invoice Templates**: Customizable invoice PDF templates
6. **Multi-Currency Support**: Enhanced multi-currency handling with exchange rates
7. **Credit Notes**: Full credit note workflow with invoice reversal
8. **Payment Plans**: Installment payment plans for invoices
9. **Invoice Approval Workflow**: Multi-level approval for invoices
10. **Advanced Reporting**: Invoice aging reports, payment collection reports
