# Implementation Plan: Invoice and Payment Management

## Overview

This implementation plan breaks down the invoice and payment management features into discrete, incremental tasks. The approach follows the established patterns from quotations and sales orders, building invoice management first, then payment management, and finally integrating them together.

The implementation prioritizes core functionality first (list views, CRUD operations), followed by advanced features (PDF generation, email sending), and concludes with integration and testing.

## Tasks

- [x] 1. Set up invoice and payment component structure
  - Create directory structure: `apps/inventory/src/app/components/invoices/` and `apps/inventory/src/app/components/payments/`
  - Create barrel exports (index.ts) for both directories
  - Create placeholder components: InvoiceManagement.tsx and PaymentManagement.tsx
  - Update RevenuePage.tsx to include Invoices and Payments tabs in navigation
  - Update RevenuePage.tsx to render InvoiceManagement and PaymentManagement components
  - _Requirements: 1.1, 11.1, 20.1, 20.2_

- [x] 2. Implement invoice API client and types
  - [x] 2.1 Create invoice types and interfaces
    - Create `apps/inventory/src/app/types/invoice.ts` with Invoice, InvoiceLineItem, InvoiceFormData types
    - Define InvoiceStatus, InvoiceType enums
    - Define InvoiceListResponse, InvoiceStats types
    - _Requirements: 1.5, 3.1, 6.2_
  
  - [x] 2.2 Create invoice API client functions
    - Create `apps/inventory/src/app/api/invoices.ts` with CRUD functions
    - Implement listInvoices, getInvoice, createInvoice, updateInvoice, deleteInvoice
    - Implement createInvoiceFromSalesOrder, generateInvoicePDF, sendInvoiceEmail
    - Add proper error handling and type safety
    - _Requirements: 1.2, 3.17, 4.11, 5.6, 8.6, 9.1, 10.5_

- [x] 3. Implement invoice list view and table
  - [x] 3.1 Create InvoicesTable component
    - Create `apps/inventory/src/app/components/invoices/InvoicesTable.tsx`
    - Implement TanStack Table with columns: invoice number, customer, dates, amounts, status
    - Add server-side pagination support
    - Add column sorting and visibility toggle
    - Add row action buttons: View, Edit, Delete, Send Email
    - Add empty state with "Create Invoice" button
    - Add loading skeletons
    - _Requirements: 1.1, 1.5, 1.6, 1.10, 1.11, 1.12_
  
  - [ ]* 3.2 Write property test for invoice table pagination
    - **Property 6: Filter pagination reset**
    - **Validates: Requirements 1.9**
  
  - [x] 3.3 Create InvoiceManagementHeader component
    - Create `apps/inventory/src/app/components/invoices/InvoiceManagementHeader.tsx`
    - Add "New Invoice" button
    - Add refresh button
    - Add loading indicator
    - _Requirements: 3.1_
  
  - [x] 3.4 Create InvoiceManagementFilters component
    - Create `apps/inventory/src/app/components/invoices/InvoiceManagementFilters.tsx`
    - Add search input for invoice number and customer name
    - Add status dropdown filter
    - Add date range picker for posting date
    - Implement filter state management
    - _Requirements: 1.7, 1.8, 1.9_
  
  - [ ]* 3.5 Write property test for invoice search filter
    - **Property 27: Search filter application**
    - **Validates: Requirements 1.7**

- [x] 4. Implement invoice statistics dashboard
  - [x] 4.1 Create InvoiceStats component
    - Create `apps/inventory/src/app/components/invoices/InvoiceStats.tsx`
    - Display stats cards: total, draft, submitted, paid, overdue, total outstanding
    - Use appropriate icons and styling
    - Implement responsive grid layout
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 5. Implement invoice management hook
  - [x] 5.1 Create useInvoiceManagement hook
    - Create `apps/inventory/src/app/hooks/useInvoiceManagement.ts`
    - Implement TanStack Query hooks for invoice list and stats
    - Implement filter state management
    - Implement dialog state management (detail, create/edit, email)
    - Implement CRUD handlers: handleView, handleCreate, handleEdit, handleDelete, handleSave
    - Implement handleSendEmail, handleGeneratePDF
    - Implement server pagination configuration
    - Add proper error handling and loading states
    - _Requirements: 1.2, 1.3, 1.4, 3.17, 5.6, 8.6, 9.1, 10.5_

- [x] 6. Implement invoice detail dialog
  - [x] 6.1 Create InvoiceDetailDialog component
    - Create `apps/inventory/src/app/components/invoices/InvoiceDetailDialog.tsx`
    - Display invoice header with number and status badge
    - Display customer information
    - Display dates (posting, due)
    - Display line items table (read-only)
    - Display totals: subtotal, tax, grand total, paid, outstanding
    - Display remarks if present
    - Display payment history list
    - Display reference link to sales order if applicable
    - Display audit trail (created/updated timestamps)
    - Add action buttons: Edit, Record Payment, Generate PDF, Send Email
    - Conditionally enable/disable actions based on status
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12, 6.13_
  
  - [ ]* 6.2 Write property test for invoice reference link
    - **Property 17: Sales order reference link**
    - **Validates: Requirements 1.13, 6.7**

- [x] 7. Checkpoint - Ensure invoice list and detail views work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement invoice form dialog
  - [x] 8.1 Create InvoiceDialog component
    - Create `apps/inventory/src/app/components/invoices/InvoiceDialog.tsx`
    - Implement React Hook Form with Zod validation
    - Add form fields: customer, posting date, due date, currency, invoice type, status, remarks
    - Add InvoiceLineItemTable for line items
    - Implement line item add/remove functionality
    - Display calculated totals: subtotal, tax, grand total
    - Implement form submission with loading state
    - Handle create and edit modes
    - Display validation errors
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.12, 3.17, 3.18, 3.19, 3.20, 3.21, 5.1, 5.6, 5.8, 5.9_
  
  - [x] 8.2 Create InvoiceLineItemTable component
    - Create `apps/inventory/src/app/components/invoices/InvoiceLineItemTable.tsx`
    - Display line items with editable fields: item, description, quantity, UOM, rate, tax template
    - Display calculated fields: tax amount, amount
    - Implement add/remove line item buttons
    - Implement item selection with search
    - Auto-fill UOM from selected item
    - _Requirements: 3.8, 3.9_
  
  - [ ]* 8.3 Write property tests for invoice calculations
    - **Property 1: Line item amount calculation**
    - **Validates: Requirements 3.10**
    - **Property 2: Tax amount calculation**
    - **Validates: Requirements 3.11, 26.2**
    - **Property 3: Invoice totals calculation**
    - **Validates: Requirements 3.12, 26.4, 26.5**
  
  - [ ]* 8.4 Write property tests for invoice validation
    - **Property 5: Customer required validation**
    - **Validates: Requirements 3.13**
    - **Property 6: Line items required validation**
    - **Validates: Requirements 3.14**
    - **Property 7: Positive quantities and rates validation**
    - **Validates: Requirements 3.15**
    - **Property 8: Due date validation**
    - **Validates: Requirements 3.16**
  
  - [ ]* 8.5 Write property test for new invoice status
    - **Property 11: New invoice status**
    - **Validates: Requirements 7.1**

- [x] 9. Implement invoice status management
  - [x] 9.1 Create StatusBadge component (if not already exists)
    - Create `apps/inventory/src/app/components/common/StatusBadge.tsx`
    - Support invoice statuses: Draft, Submitted, Paid, Partially Paid, Overdue, Cancelled
    - Support payment statuses: Draft, Submitted, Reconciled, Cancelled
    - Use appropriate colors and styling for each status
    - Ensure accessibility (color + text)
    - _Requirements: 1.5, 6.12, 7.9, 7.10, 7.11, 7.12, 7.13, 7.14_
  
  - [x] 9.2 Implement invoice status dropdown in InvoiceDialog
    - Add status dropdown with conditional options based on current status
    - Implement status transition rules
    - _Requirements: 7.2, 7.3, 7.4, 7.5_
  
  - [ ]* 9.3 Write property tests for invoice status transitions
    - **Property 12: Invoice status based on payment**
    - **Validates: Requirements 7.7, 7.8, 28.1, 28.2**
    - **Property 13: Overdue invoice detection**
    - **Validates: Requirements 7.6**

- [x] 10. Implement invoice delete functionality
  - [x] 10.1 Add delete confirmation dialog
    - Create `apps/inventory/src/app/components/common/DeleteConfirmationDialog.tsx` (if not exists)
    - Display invoice/payment number in confirmation message
    - Add cancel and confirm buttons
    - _Requirements: 8.4, 8.5_
  
  - [x] 10.2 Implement delete handler in useInvoiceManagement
    - Add handleDelete function with confirmation
    - Call delete API endpoint
    - Invalidate query cache on success
    - Display success/error toast
    - _Requirements: 8.6, 8.7, 8.8, 8.9_
  
  - [ ]* 10.3 Write property tests for invoice delete permissions
    - **Property 14: Draft invoice edit permission**
    - **Validates: Requirements 5.2, 8.2**
    - **Property 15: Non-draft invoice edit restriction**
    - **Validates: Requirements 5.3, 8.3**

- [x] 11. Implement create invoice from sales order
  - [x] 11.1 Create CreateInvoiceFromSalesOrderDialog component
    - Create `apps/inventory/src/app/components/invoices/CreateInvoiceFromSalesOrderDialog.tsx`
    - Display sales order details
    - Add posting date and due date pickers
    - Display line items table with quantity to bill inputs
    - Show: quantity ordered, already billed, available to bill, quantity to bill
    - Calculate invoice total based on quantities and rates
    - Implement form validation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.10_
  
  - [x] 11.2 Add "Create Invoice" button to SalesOrderDetailDialog
    - Update `apps/inventory/src/app/components/sales-orders/SalesOrderDetailDialog.tsx`
    - Add "Create Invoice" button (conditionally shown for confirmed orders)
    - Wire up to open CreateInvoiceFromSalesOrderDialog
    - _Requirements: 4.1_
  
  - [x] 11.3 Implement createInvoiceFromSalesOrder handler
    - Add handler in useInvoiceManagement or useSalesOrderManagement
    - Call createInvoiceFromSalesOrder API endpoint
    - Navigate to Invoices tab on success
    - Update sales order billed_qty
    - Invalidate relevant query caches
    - _Requirements: 4.11, 4.12, 4.13, 4.14, 4.15, 4.16, 4.17, 4.18_
  
  - [ ]* 11.4 Write property tests for invoice from sales order
    - **Property 9: Billed quantity validation**
    - **Validates: Requirements 4.8**
    - **Property 10: Non-zero quantity validation**
    - **Validates: Requirements 4.9**
    - **Property 16: Sales order billed quantity update**
    - **Validates: Requirements 4.15**

- [x] 12. Checkpoint - Ensure invoice creation and editing work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement invoice PDF generation
  - [x] 13.1 Add generateInvoicePDF function to API client
    - Implement generateInvoicePDF in `apps/inventory/src/app/api/invoices.ts`
    - Handle PDF blob response
    - Trigger browser download
    - _Requirements: 9.1, 9.2_
  
  - [x] 13.2 Add "Generate PDF" button to InvoiceDetailDialog
    - Add button with loading state
    - Call generateInvoicePDF handler
    - Display success/error toast
    - _Requirements: 6.10, 9.1, 9.3, 9.4, 9.5, 9.6_

- [x] 14. Implement invoice email sending
  - [x] 14.1 Create SendInvoiceEmailDialog component
    - Create `apps/inventory/src/app/components/invoices/SendInvoiceEmailDialog.tsx`
    - Display customer email (editable)
    - Add subject and body fields with default templates
    - Show attachment indicator (invoice PDF)
    - Implement form submission with loading state
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 14.2 Add sendInvoiceEmail function to API client
    - Implement sendInvoiceEmail in `apps/inventory/src/app/api/invoices.ts`
    - Handle email sending response
    - _Requirements: 10.5_
  
  - [x] 14.3 Add "Send Email" button to InvoiceDetailDialog and table
    - Add button to detail dialog and table row actions
    - Open SendInvoiceEmailDialog on click
    - Display success/error toast
    - _Requirements: 1.11, 6.11, 10.5, 10.6, 10.7, 10.8_

- [x] 15. Set up payment component structure and types
  - [x] 15.1 Create payment types and interfaces
    - Create `apps/inventory/src/app/types/payment.ts` with Payment, PaymentAllocation, PaymentFormData types
    - Define PaymentStatus, PaymentMode enums
    - Define PaymentListResponse, PaymentStats types
    - _Requirements: 11.5, 13.1, 16.2_
  
  - [x] 15.2 Create payment API client functions
    - Create `apps/inventory/src/app/api/payments.ts` with CRUD functions
    - Implement listPayments, getPayment, createPayment, updatePayment, deletePayment
    - Implement getOutstandingInvoices
    - Add proper error handling and type safety
    - _Requirements: 11.2, 13.20, 15.5, 18.6_

- [x] 16. Implement payment list view and table
  - [x] 16.1 Create PaymentsTable component
    - Create `apps/inventory/src/app/components/payments/PaymentsTable.tsx`
    - Implement TanStack Table with columns: payment number, party, date, mode, amounts, status
    - Add server-side pagination support
    - Add column sorting and visibility toggle
    - Add row action buttons: View, Edit, Delete
    - Add empty state with "Create Payment" button
    - Add loading skeletons
    - _Requirements: 11.1, 11.5, 11.6, 11.12, 11.13, 11.14_
  
  - [x] 16.2 Create PaymentManagementHeader component
    - Create `apps/inventory/src/app/components/payments/PaymentManagementHeader.tsx`
    - Add "New Payment" button
    - Add refresh button
    - Add loading indicator
    - _Requirements: 13.1_
  
  - [x] 16.3 Create PaymentManagementFilters component
    - Create `apps/inventory/src/app/components/payments/PaymentManagementFilters.tsx`
    - Add search input for payment number and party name
    - Add status dropdown filter
    - Add payment mode dropdown filter
    - Add date range picker for payment date
    - Implement filter state management
    - _Requirements: 11.7, 11.8, 11.9, 11.10, 11.11_

- [x] 17. Implement payment statistics dashboard
  - [x] 17.1 Create PaymentStats component
    - Create `apps/inventory/src/app/components/payments/PaymentStats.tsx`
    - Display stats cards: total, pending, completed, total amount
    - Use appropriate icons and styling
    - Implement responsive grid layout
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [x] 18. Implement payment management hook
  - [x] 18.1 Create usePaymentManagement hook
    - Create `apps/inventory/src/app/hooks/usePaymentManagement.ts`
    - Implement TanStack Query hooks for payment list and stats
    - Implement filter state management
    - Implement dialog state management (detail, create/edit)
    - Implement CRUD handlers: handleView, handleCreate, handleEdit, handleDelete, handleSave
    - Implement server pagination configuration
    - Add proper error handling and loading states
    - _Requirements: 11.2, 11.3, 11.4, 13.20, 15.5, 18.6_

- [x] 19. Implement payment detail dialog
  - [x] 19.1 Create PaymentDetailDialog component
    - Create `apps/inventory/src/app/components/payments/PaymentDetailDialog.tsx`
    - Display payment header with number and status badge
    - Display party information
    - Display payment details: date, mode, reference number, currency
    - Display amounts: total, allocated, unallocated
    - Display invoice allocations table (read-only) with links to invoices
    - Display remarks if present
    - Display audit trail (created/updated timestamps)
    - Add action buttons: Edit
    - Conditionally enable/disable actions based on status
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9_

- [x] 20. Implement payment form dialog
  - [x] 20.1 Create PaymentDialog component
    - Create `apps/inventory/src/app/components/payments/PaymentDialog.tsx`
    - Implement React Hook Form with Zod validation
    - Add form fields: party type, party, payment date, payment mode, reference number, currency, total amount, status, remarks
    - Add PaymentAllocationTable for invoice allocations
    - Display total allocated and unallocated amounts
    - Implement form submission with loading state
    - Handle create and edit modes
    - Support pre-selected invoice (from "Record Payment" button)
    - Display validation errors
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10, 13.16, 13.17, 13.20, 13.21, 13.22, 13.23, 13.24, 14.1, 14.2, 14.9, 15.1, 15.5, 15.7, 15.8_
  
  - [x] 20.2 Create PaymentAllocationTable component
    - Create `apps/inventory/src/app/components/payments/PaymentAllocationTable.tsx`
    - Fetch outstanding invoices for selected party
    - Display invoices with: number, date, grand total, outstanding amount
    - Add allocation amount input for each invoice
    - Add select checkboxes for invoices
    - Display total allocated and unallocated amounts
    - Implement validation for allocation amounts
    - Add auto-allocation button (allocate by due date order)
    - _Requirements: 13.10, 13.11, 13.12, 13.13, 13.14, 13.15, 13.16, 29.1, 29.3, 29.4, 29.5_
  
  - [ ]* 20.3 Write property tests for payment allocation validation
    - **Property 18: Payment allocation limit per invoice**
    - **Validates: Requirements 13.14**
    - **Property 19: Payment allocation total limit**
    - **Validates: Requirements 13.15, 29.2**
    - **Property 20: Outstanding invoices fetch**
    - **Validates: Requirements 13.10**
  
  - [ ]* 20.4 Write property test for new payment status
    - **Property 21: New payment status**
    - **Validates: Requirements 17.1**

- [x] 21. Implement payment status management
  - [x] 21.1 Implement payment status dropdown in PaymentDialog
    - Add status dropdown with conditional options based on current status
    - Implement status transition rules
    - _Requirements: 17.2, 17.3, 17.4, 17.5_
  
  - [ ]* 21.2 Write property tests for payment status and permissions
    - **Property 22: Draft payment edit permission**
    - **Validates: Requirements 15.2, 18.2**
    - **Property 23: Non-draft payment edit restriction**
    - **Validates: Requirements 15.3, 18.3**

- [x] 22. Implement payment delete functionality
  - [x] 22.1 Implement delete handler in usePaymentManagement
    - Add handleDelete function with confirmation
    - Call delete API endpoint
    - Invalidate query cache on success
    - Display success/error toast
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9_

- [x] 23. Checkpoint - Ensure payment creation and editing work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Implement payment-invoice integration
  - [x] 24.1 Add "Record Payment" button to InvoiceDetailDialog
    - Add button to invoice detail dialog (conditionally shown for submitted invoices with outstanding amount)
    - Open PaymentDialog with invoice pre-selected
    - Pre-fill party, currency, and allocation from invoice
    - _Requirements: 6.9, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9_
  
  - [x] 24.2 Implement payment submission with invoice updates
    - When payment is submitted, update paid_amount for all allocated invoices
    - Update invoice status based on new outstanding amount
    - Invalidate invoice query cache
    - _Requirements: 17.6, 17.7_
  
  - [ ]* 24.3 Write property tests for payment-invoice updates
    - **Property 24: Invoice paid amount update**
    - **Validates: Requirements 17.6**
    - **Property 25: Invoice status update on payment**
    - **Validates: Requirements 17.7**
    - **Property 26: Multiple payment aggregation**
    - **Validates: Requirements 28.5**

- [x] 25. Implement cross-document navigation
  - [x] 25.1 Add navigation links in InvoiceDetailDialog
    - Add link to view source sales order (if reference exists)
    - Add links to view related payments
    - Implement navigation handlers to switch tabs and open detail dialogs
    - _Requirements: 21.1, 21.3_
  
  - [x] 25.2 Add navigation links in PaymentDetailDialog
    - Add links to view allocated invoices
    - Implement navigation handlers to switch tabs and open detail dialogs
    - _Requirements: 16.9, 21.4_
  
  - [x] 25.3 Add navigation links in SalesOrderDetailDialog
    - Add links to view related invoices
    - Implement navigation handlers to switch tabs and open detail dialogs
    - _Requirements: 21.2_
  
  - [x] 25.4 Implement cross-document navigation utility
    - Create utility function to handle tab switching and dialog opening
    - Support navigation between sales orders, invoices, and payments
    - _Requirements: 21.5_

- [x] 26. Implement payment reconciliation
  - [x] 26.1 Add reconciliation status to PaymentDetailDialog
    - Display reconciliation status
    - Disable edit/delete for reconciled payments
    - _Requirements: 19.1, 19.2, 19.3_
  
  - [x] 26.2 Add reconciliation filter to PaymentManagementFilters
    - Add reconciliation status filter
    - _Requirements: 19.4_
  
  - [x] 26.3 Implement reconciliation status update
    - Update payment status to RECONCILED
    - _Requirements: 19.5_

- [x] 27. Implement overdue invoice detection
  - [x] 27.1 Add overdue detection logic
    - Check for overdue invoices when loading invoice list
    - Automatically update status to OVERDUE for eligible invoices
    - _Requirements: 27.1, 27.2_
  
  - [x] 27.2 Add overdue styling to InvoicesTable
    - Display overdue invoices with red styling
    - _Requirements: 27.3_
  
  - [x] 27.3 Update InvoiceStats to show overdue count
    - Display overdue count prominently in stats cards
    - _Requirements: 27.4_
  
  - [x] 27.4 Add overdue filter to InvoiceManagementFilters
    - Add overdue status filter option
    - _Requirements: 27.5_

- [x] 28. Implement responsive design and accessibility
  - [x] 28.1 Add responsive breakpoints to all components
    - Ensure dialogs are full-screen on mobile, centered on desktop
    - Stack stats cards vertically on mobile, grid on desktop
    - Stack filter controls vertically on mobile, horizontal on desktop
    - Make tables horizontally scrollable on small screens
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_
  
  - [x] 28.2 Add accessibility features
    - Ensure keyboard navigation works for all interactive elements
    - Add proper ARIA labels to all form inputs
    - Add aria-labels to icon-only buttons
    - Ensure status badges use both color and text
    - Test with screen reader
    - _Requirements: 22.7, 22.8, 22.9, 22.10_

- [x] 29. Implement error handling and validation
  - [x] 29.1 Add comprehensive form validation
    - Implement Zod schemas for invoice and payment forms
    - Add field-level validation errors
    - Add custom validation messages
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7_
  
  - [x] 29.2 Add API error handling
    - Handle network errors with retry option
    - Handle validation errors from backend
    - Handle authorization errors
    - Display user-friendly error messages
    - _Requirements: 23.8, 23.9, 23.10, 23.11_

- [x] 30. Implement performance optimizations
  - [x] 30.1 Add TanStack Query caching configuration
    - Set stale time to 30 seconds for invoice and payment queries
    - Implement proper cache invalidation on mutations
    - Add optimistic updates for status changes
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6_
  
  - [x] 30.2 Add performance optimizations
    - Lazy load invoice and payment management components
    - Debounce search input (300ms)
    - Prefetch customer and item data on dialog open
    - Use React.memo for expensive components
    - _Requirements: 24.7, 24.8, 24.9, 24.10_

- [x] 31. Final checkpoint - Integration testing and polish
  - [x] 31.1 Test complete invoice workflow
    - Test creating invoice manually
    - Test creating invoice from sales order
    - Test editing and deleting invoices
    - Test invoice status transitions
    - Test PDF generation and email sending
    - _Requirements: All invoice requirements_
  
  - [x] 31.2 Test complete payment workflow
    - Test creating payment with allocations
    - Test recording payment from invoice
    - Test editing and deleting payments
    - Test payment status transitions
    - Test multi-invoice allocation
    - _Requirements: All payment requirements_
  
  - [x] 31.3 Test cross-document navigation
    - Test navigation from sales order to invoice
    - Test navigation from invoice to payment
    - Test navigation from payment to invoice
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_
  
  - [x] 31.4 Test responsive design
    - Test on mobile, tablet, and desktop screen sizes
    - Verify all components are responsive
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6_
  
  - [x] 31.5 Test accessibility
    - Test keyboard navigation
    - Test with screen reader
    - Verify ARIA labels
    - _Requirements: 22.7, 22.8, 22.9, 22.10_
  
  - [ ]* 31.6 Run all property-based tests
    - Ensure all 28 property tests pass with 100+ iterations
    - Fix any failing tests
    - Verify test coverage

- [ ] 32. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Follow established patterns from quotations and sales orders for consistency
- Use TanStack Query for all API calls with proper caching
- Use TanStack Table for all data tables
- Use Shadcn UI components for all UI elements
- Ensure responsive design and accessibility compliance
