# Requirements Document

## Introduction

This document specifies the requirements for implementing Invoice and Payment management features to complete the Revenue module flow in the ERP application. The system enables accounts managers to create invoices from sales orders, manage invoice lifecycle, record payments against invoices, and track payment allocation and reconciliation.

The frontend implementation follows established UI patterns using React, TypeScript, TanStack Query, TanStack Table, and Shadcn UI components. The system integrates with existing Customer Management, Sales Orders, and extends the Revenue page navigation.

## Glossary

- **Invoice_Management_UI**: The React component that displays and manages invoices
- **Payment_Management_UI**: The React component that displays and manages payments
- **Invoice_Form**: The dialog component for creating and editing invoices
- **Payment_Form**: The dialog component for creating and editing payments
- **Invoice_Line_Item_Table**: The table component displaying line items within an invoice
- **Payment_Allocation_Table**: The table component for allocating payment amounts to invoices
- **Status_Badge**: The UI component displaying the current status of an invoice or payment
- **Create_Invoice_Dialog**: The dialog component for creating invoices from sales orders
- **Revenue_Navigation**: The top navigation bar in the Revenue page
- **Stats_Cards**: The dashboard cards displaying key metrics
- **Filter_Controls**: The UI components for searching and filtering records
- **Detail_Dialog**: The read-only dialog displaying full record details
- **API_Client**: The utility module for making backend API calls
- **Query_Cache**: The TanStack Query cache managing data state
- **Payment_Mode**: The method of payment (cash, bank transfer, credit card, check, etc.)

## Requirements

### Requirement 1: Invoice List View

**User Story:** As an accounts manager, I want to view all invoices in a paginated table with filtering and search capabilities, so that I can quickly find and manage invoices.

#### Acceptance Criteria

1. WHEN the Invoices tab is selected in Revenue_Navigation, THE Invoice_Management_UI SHALL display a table of invoices
2. THE Invoice_Management_UI SHALL fetch invoice data from the backend API using Query_Cache
3. WHEN invoice data is loading, THE Invoice_Management_UI SHALL display loading indicators
4. WHEN the API returns an error, THE Invoice_Management_UI SHALL display an error message with retry option
5. THE table SHALL display columns for invoice number, customer name, posting date, due date, grand total, paid amount, outstanding amount, currency, and status
6. THE table SHALL support server-side pagination with configurable page size
7. THE Filter_Controls SHALL include a search input that filters by invoice number or customer name
8. THE Filter_Controls SHALL include a status dropdown with options: All, Draft, Submitted, Paid, Partially Paid, Overdue, Cancelled
9. THE Filter_Controls SHALL include a date range filter for posting date
10. WHEN filter values change, THE Invoice_Management_UI SHALL reset to page 1 and fetch filtered data
11. THE table SHALL include action buttons for View, Edit, Delete, and Send Email on each row
12. THE table SHALL support column visibility toggling through DataTableViewOptions
13. THE table SHALL display "No invoices found" when the result set is empty
14. IF an invoice has reference_type "Sales Order", THE table SHALL display a link icon to view the source sales order

### Requirement 2: Invoice Statistics Dashboard

**User Story:** As an accounts manager, I want to see key invoice metrics at a glance, so that I can monitor billing and collection status.

#### Acceptance Criteria

1. THE Invoice_Management_UI SHALL display Stats_Cards above the invoice table
2. THE Stats_Cards SHALL include a card showing total number of invoices
3. THE Stats_Cards SHALL include a card showing count of draft invoices
4. THE Stats_Cards SHALL include a card showing count of submitted invoices
5. THE Stats_Cards SHALL include a card showing count of paid invoices
6. THE Stats_Cards SHALL include a card showing count of overdue invoices
7. THE Stats_Cards SHALL include a card showing total outstanding amount across all invoices
8. WHEN invoice data updates, THE Stats_Cards SHALL recalculate and display updated metrics
9. THE Stats_Cards SHALL use appropriate icons and color schemes matching existing patterns

### Requirement 3: Create Invoice Manually

**User Story:** As an accounts manager, I want to create new invoices manually without a sales order, so that I can bill customers for ad-hoc services or adjustments.

#### Acceptance Criteria

1. WHEN the "New Invoice" button is clicked, THE Invoice_Form SHALL open in a dialog
2. THE Invoice_Form SHALL include a customer selection dropdown populated from the customer API
3. THE Invoice_Form SHALL include a posting date picker with default value of current date
4. THE Invoice_Form SHALL include a due date picker
5. THE Invoice_Form SHALL include a currency selection dropdown
6. THE Invoice_Form SHALL include an invoice type selection (Sales, Purchase, Debit Note, Credit Note)
7. THE Invoice_Form SHALL include a remarks textarea for optional notes
8. THE Invoice_Form SHALL include an Invoice_Line_Item_Table for adding line items
9. THE Invoice_Line_Item_Table SHALL allow adding multiple line items with item selection, description, quantity, UOM, rate, and tax template
10. WHEN line item quantity or rate changes, THE system SHALL calculate amount as quantity × rate
11. WHEN tax template is selected, THE system SHALL calculate tax amount based on the tax rate
12. WHEN line items are added, removed, or modified, THE Invoice_Form SHALL recalculate and display subtotal, total tax, and grand total
13. THE Invoice_Form SHALL validate that customer is selected before submission
14. THE Invoice_Form SHALL validate that at least one line item exists before submission
15. THE Invoice_Form SHALL validate that all line items have positive quantities and rates
16. THE Invoice_Form SHALL validate that due date is not before posting date
17. WHEN the form is submitted, THE system SHALL call the create invoice API endpoint
18. WHEN the API call succeeds, THE system SHALL display a success toast notification
19. WHEN the API call succeeds, THE system SHALL invalidate Query_Cache and close the dialog
20. WHEN the API call fails, THE system SHALL display an error toast with the error message
21. WHILE the API call is in progress, THE Invoice_Form SHALL disable the submit button and show loading state

### Requirement 4: Create Invoice from Sales Order

**User Story:** As an accounts manager, I want to create invoices from sales orders, so that I can efficiently bill customers for confirmed orders.

#### Acceptance Criteria

1. WHEN the "Create Invoice" button is clicked in the sales order Detail_Dialog, THE Create_Invoice_Dialog SHALL open
2. THE Create_Invoice_Dialog SHALL display the sales order details being invoiced
3. THE Create_Invoice_Dialog SHALL include a posting date picker with default value of current date
4. THE Create_Invoice_Dialog SHALL include a due date picker
5. THE Create_Invoice_Dialog SHALL display all sales order line items with their quantities
6. FOR each line item, THE Create_Invoice_Dialog SHALL show quantity ordered, quantity already billed, and quantity available to bill
7. THE Create_Invoice_Dialog SHALL allow specifying the quantity to bill for each line item with default value of available quantity
8. THE Create_Invoice_Dialog SHALL validate that billed quantity does not exceed available quantity
9. THE Create_Invoice_Dialog SHALL validate that at least one line item has quantity greater than zero
10. THE Create_Invoice_Dialog SHALL calculate the invoice total based on selected quantities and rates from the sales order
11. WHEN the invoice creation is confirmed, THE system SHALL call the create invoice from sales order API endpoint
12. THE API call SHALL create a new invoice with status DRAFT and invoice_type SALES
13. THE API call SHALL set party_id to customer_id, party_type to "Customer", and copy currency and remarks
14. THE API call SHALL set reference_type to "Sales Order" and reference_id to the sales order ID
15. THE API call SHALL update the sales order line item billed_qty values
16. WHEN the API call succeeds, THE system SHALL display a success toast notification
17. WHEN the API call succeeds, THE system SHALL navigate to the Invoices tab showing the new invoice
18. WHEN the API call fails, THE system SHALL display an error toast with the error message

### Requirement 5: Edit Invoice

**User Story:** As an accounts manager, I want to edit existing invoices, so that I can correct errors before submission.

#### Acceptance Criteria

1. WHEN the Edit action is clicked on an invoice row, THE Invoice_Form SHALL open with the invoice data pre-filled
2. IF the invoice status is DRAFT, THE Invoice_Form SHALL allow editing all fields including line items
3. IF the invoice status is SUBMITTED or later, THE Edit action SHALL be disabled
4. THE Invoice_Form SHALL display the current invoice number as read-only
5. THE Invoice_Form SHALL display paid_amount as read-only
6. WHEN the form is submitted, THE system SHALL call the update invoice API endpoint
7. WHEN the API call succeeds, THE system SHALL display a success toast notification
8. WHEN the API call succeeds, THE system SHALL invalidate Query_Cache and close the dialog
9. WHEN the API call fails, THE system SHALL display an error toast with the error message

### Requirement 6: View Invoice Details

**User Story:** As an accounts manager, I want to view complete invoice details including payment status, so that I can track billing and collection.

#### Acceptance Criteria

1. WHEN the View action is clicked on an invoice row, THE Detail_Dialog SHALL open displaying the invoice
2. THE Detail_Dialog SHALL display invoice number, customer name, posting date, due date, currency, and status
3. THE Detail_Dialog SHALL display all line items in a read-only table with item name, description, quantity, UOM, rate, tax amount, and amount
4. THE Detail_Dialog SHALL display subtotal, total tax, grand total, paid amount, and outstanding amount prominently
5. THE Detail_Dialog SHALL display remarks if present
6. THE Detail_Dialog SHALL display created and updated timestamps
7. IF the invoice has reference_type "Sales Order", THE Detail_Dialog SHALL display a link to view the source sales order
8. THE Detail_Dialog SHALL include an Edit button that opens the Invoice_Form
9. IF the invoice status is SUBMITTED and outstanding amount is greater than zero, THE Detail_Dialog SHALL include a "Record Payment" button
10. THE Detail_Dialog SHALL include a "Generate PDF" button to download the invoice
11. THE Detail_Dialog SHALL include a "Send Email" button to email the invoice to the customer
12. THE Detail_Dialog SHALL use Status_Badge to display the current status with appropriate styling
13. THE Detail_Dialog SHALL display a list of linked payments with payment number, date, amount, and payment mode

### Requirement 7: Invoice Status Management

**User Story:** As an accounts manager, I want to change invoice status through the workflow, so that I can track the invoice lifecycle.

#### Acceptance Criteria

1. WHEN an invoice is created, THE system SHALL set status to DRAFT
2. THE Invoice_Form SHALL include a status dropdown when editing existing invoices
3. IF the current status is DRAFT, THE status dropdown SHALL allow selecting DRAFT or SUBMITTED
4. IF the current status is SUBMITTED, THE status dropdown SHALL allow selecting SUBMITTED or CANCELLED
5. IF the current status is PAID, PARTIALLY_PAID, OVERDUE, or CANCELLED, THE status dropdown SHALL be disabled
6. WHEN an invoice is submitted and due date is in the past and outstanding amount is greater than zero, THE system SHALL automatically set status to OVERDUE
7. WHEN a payment is recorded against an invoice and outstanding amount becomes zero, THE system SHALL automatically set status to PAID
8. WHEN a payment is recorded against an invoice and outstanding amount is greater than zero, THE system SHALL automatically set status to PARTIALLY_PAID
9. THE Status_Badge SHALL display DRAFT status with amber/yellow styling
10. THE Status_Badge SHALL display SUBMITTED status with blue styling
11. THE Status_Badge SHALL display PAID status with green styling
12. THE Status_Badge SHALL display PARTIALLY_PAID status with purple styling
13. THE Status_Badge SHALL display OVERDUE status with red styling
14. THE Status_Badge SHALL display CANCELLED status with gray styling

### Requirement 8: Delete Invoice

**User Story:** As an accounts manager, I want to delete draft invoices that are no longer needed, so that I can keep the invoice list clean.

#### Acceptance Criteria

1. THE invoice table row actions SHALL include a Delete button
2. IF the invoice status is DRAFT, THE Delete button SHALL be enabled
3. IF the invoice status is not DRAFT, THE Delete button SHALL be disabled
4. WHEN the Delete button is clicked, THE system SHALL display a confirmation dialog
5. THE confirmation dialog SHALL clearly state the invoice number being deleted
6. WHEN deletion is confirmed, THE system SHALL call the delete invoice API endpoint
7. WHEN the API call succeeds, THE system SHALL display a success toast notification
8. WHEN the API call succeeds, THE system SHALL invalidate Query_Cache
9. WHEN the API call fails, THE system SHALL display an error toast with the error message

### Requirement 9: Generate Invoice PDF

**User Story:** As an accounts manager, I want to generate and download invoice PDFs, so that I can print or share invoices with customers.

#### Acceptance Criteria

1. WHEN the "Generate PDF" button is clicked in the invoice Detail_Dialog, THE system SHALL call the generate invoice PDF API endpoint
2. THE API call SHALL return a PDF file stream
3. WHEN the API call succeeds, THE system SHALL trigger a browser download of the PDF file
4. THE PDF filename SHALL include the invoice number
5. WHEN the API call fails, THE system SHALL display an error toast with the error message
6. WHILE the PDF is being generated, THE button SHALL show a loading state

### Requirement 10: Send Invoice Email

**User Story:** As an accounts manager, I want to send invoices to customers via email, so that customers receive their bills promptly.

#### Acceptance Criteria

1. WHEN the "Send Email" button is clicked in the invoice Detail_Dialog or table row, THE system SHALL display an email confirmation dialog
2. THE email confirmation dialog SHALL display the customer email address
3. THE email confirmation dialog SHALL allow editing the email subject and body
4. THE email confirmation dialog SHALL indicate that the invoice PDF will be attached
5. WHEN the send is confirmed, THE system SHALL call the send invoice email API endpoint
6. WHEN the API call succeeds, THE system SHALL display a success toast notification
7. WHEN the API call fails, THE system SHALL display an error toast with the error message
8. WHILE the email is being sent, THE dialog SHALL show a loading state

### Requirement 11: Payment List View

**User Story:** As an accounts manager, I want to view all payments in a paginated table with filtering and search capabilities, so that I can quickly find and manage payments.

#### Acceptance Criteria

1. WHEN the Payments tab is selected in Revenue_Navigation, THE Payment_Management_UI SHALL display a table of payments
2. THE Payment_Management_UI SHALL fetch payment data from the backend API using Query_Cache
3. WHEN payment data is loading, THE Payment_Management_UI SHALL display loading indicators
4. WHEN the API returns an error, THE Payment_Management_UI SHALL display an error message with retry option
5. THE table SHALL display columns for payment number, party name, payment date, payment mode, total amount, allocated amount, unallocated amount, currency, and status
6. THE table SHALL support server-side pagination with configurable page size
7. THE Filter_Controls SHALL include a search input that filters by payment number or party name
8. THE Filter_Controls SHALL include a status dropdown with options: All, Draft, Submitted, Reconciled, Cancelled
9. THE Filter_Controls SHALL include a payment mode dropdown with options: All, Cash, Bank Transfer, Credit Card, Check, Other
10. THE Filter_Controls SHALL include a date range filter for payment date
11. WHEN filter values change, THE Payment_Management_UI SHALL reset to page 1 and fetch filtered data
12. THE table SHALL include action buttons for View, Edit, and Delete on each row
13. THE table SHALL support column visibility toggling through DataTableViewOptions
14. THE table SHALL display "No payments found" when the result set is empty

### Requirement 12: Payment Statistics Dashboard

**User Story:** As an accounts manager, I want to see key payment metrics at a glance, so that I can monitor cash flow and payment processing.

#### Acceptance Criteria

1. THE Payment_Management_UI SHALL display Stats_Cards above the payment table
2. THE Stats_Cards SHALL include a card showing total number of payments
3. THE Stats_Cards SHALL include a card showing count of pending payments (draft status)
4. THE Stats_Cards SHALL include a card showing count of completed payments (submitted or reconciled status)
5. THE Stats_Cards SHALL include a card showing total payment amount for completed payments
6. WHEN payment data updates, THE Stats_Cards SHALL recalculate and display updated metrics
7. THE Stats_Cards SHALL use appropriate icons and color schemes matching existing patterns

### Requirement 13: Create Payment Entry

**User Story:** As an accounts manager, I want to create payment entries and allocate them to invoices, so that I can record customer payments and update invoice balances.

#### Acceptance Criteria

1. WHEN the "New Payment" button is clicked, THE Payment_Form SHALL open in a dialog
2. THE Payment_Form SHALL include a party type selection (Customer, Supplier)
3. THE Payment_Form SHALL include a party selection dropdown populated based on party type
4. THE Payment_Form SHALL include a payment date picker with default value of current date
5. THE Payment_Form SHALL include a payment mode dropdown with options: Cash, Bank Transfer, Credit Card, Check, Other
6. THE Payment_Form SHALL include a reference number input for check numbers or transaction IDs
7. THE Payment_Form SHALL include a currency selection dropdown
8. THE Payment_Form SHALL include a total amount input
9. THE Payment_Form SHALL include a remarks textarea for optional notes
10. THE Payment_Form SHALL include a Payment_Allocation_Table for allocating payment to invoices
11. WHEN party is selected, THE Payment_Allocation_Table SHALL fetch and display outstanding invoices for that party
12. FOR each invoice, THE Payment_Allocation_Table SHALL show invoice number, posting date, grand total, outstanding amount, and an allocation amount input
13. THE Payment_Allocation_Table SHALL allow specifying the amount to allocate to each invoice
14. THE Payment_Allocation_Table SHALL validate that allocated amount does not exceed invoice outstanding amount
15. THE Payment_Allocation_Table SHALL validate that total allocated amount does not exceed payment total amount
16. THE Payment_Allocation_Table SHALL display total allocated amount and unallocated amount
17. THE Payment_Form SHALL validate that party is selected before submission
18. THE Payment_Form SHALL validate that payment mode is selected before submission
19. THE Payment_Form SHALL validate that total amount is greater than zero before submission
20. WHEN the form is submitted, THE system SHALL call the create payment API endpoint
21. WHEN the API call succeeds, THE system SHALL display a success toast notification
22. WHEN the API call succeeds, THE system SHALL invalidate Query_Cache and close the dialog
23. WHEN the API call fails, THE system SHALL display an error toast with the error message
24. WHILE the API call is in progress, THE Payment_Form SHALL disable the submit button and show loading state

### Requirement 14: Record Payment from Invoice

**User Story:** As an accounts manager, I want to record payments directly from an invoice detail view, so that I can quickly process payments for specific invoices.

#### Acceptance Criteria

1. WHEN the "Record Payment" button is clicked in the invoice Detail_Dialog, THE Payment_Form SHALL open with the invoice pre-selected
2. THE Payment_Form SHALL pre-fill party type and party from the invoice
3. THE Payment_Form SHALL pre-fill currency from the invoice
4. THE Payment_Allocation_Table SHALL display the selected invoice with its outstanding amount
5. THE Payment_Form SHALL default the total amount to the invoice outstanding amount
6. THE Payment_Allocation_Table SHALL default the allocation amount to the invoice outstanding amount
7. THE user SHALL be able to modify the payment amount and allocation
8. THE user SHALL be able to add additional invoices to the payment allocation
9. WHEN the form is submitted, THE system SHALL follow the same validation and API call process as creating a new payment

### Requirement 15: Edit Payment

**User Story:** As an accounts manager, I want to edit existing payments, so that I can correct errors before submission.

#### Acceptance Criteria

1. WHEN the Edit action is clicked on a payment row, THE Payment_Form SHALL open with the payment data pre-filled
2. IF the payment status is DRAFT, THE Payment_Form SHALL allow editing all fields including allocations
3. IF the payment status is SUBMITTED or later, THE Edit action SHALL be disabled
4. THE Payment_Form SHALL display the current payment number as read-only
5. WHEN the form is submitted, THE system SHALL call the update payment API endpoint
6. WHEN the API call succeeds, THE system SHALL display a success toast notification
7. WHEN the API call succeeds, THE system SHALL invalidate Query_Cache and close the dialog
8. WHEN the API call fails, THE system SHALL display an error toast with the error message

### Requirement 16: View Payment Details

**User Story:** As an accounts manager, I want to view complete payment details including invoice allocations, so that I can track payment application.

#### Acceptance Criteria

1. WHEN the View action is clicked on a payment row, THE Detail_Dialog SHALL open displaying the payment
2. THE Detail_Dialog SHALL display payment number, party name, payment date, payment mode, reference number, currency, and status
3. THE Detail_Dialog SHALL display total amount, allocated amount, and unallocated amount prominently
4. THE Detail_Dialog SHALL display all invoice allocations in a read-only table with invoice number, invoice date, invoice amount, outstanding amount before payment, and allocated amount
5. THE Detail_Dialog SHALL display remarks if present
6. THE Detail_Dialog SHALL display created and updated timestamps
7. THE Detail_Dialog SHALL include an Edit button that opens the Payment_Form
8. THE Detail_Dialog SHALL use Status_Badge to display the current status with appropriate styling
9. FOR each allocated invoice, THE Detail_Dialog SHALL include a link to view the invoice details

### Requirement 17: Payment Status Management

**User Story:** As an accounts manager, I want to change payment status through the workflow, so that I can track the payment lifecycle.

#### Acceptance Criteria

1. WHEN a payment is created, THE system SHALL set status to DRAFT
2. THE Payment_Form SHALL include a status dropdown when editing existing payments
3. IF the current status is DRAFT, THE status dropdown SHALL allow selecting DRAFT or SUBMITTED
4. IF the current status is SUBMITTED, THE status dropdown SHALL allow selecting SUBMITTED, RECONCILED, or CANCELLED
5. IF the current status is RECONCILED or CANCELLED, THE status dropdown SHALL be disabled
6. WHEN a payment is submitted, THE system SHALL update the paid_amount for all allocated invoices
7. WHEN a payment is submitted, THE system SHALL update the invoice status based on the new outstanding amount
8. THE Status_Badge SHALL display DRAFT status with amber/yellow styling
9. THE Status_Badge SHALL display SUBMITTED status with blue styling
10. THE Status_Badge SHALL display RECONCILED status with green styling
11. THE Status_Badge SHALL display CANCELLED status with gray styling

### Requirement 18: Delete Payment

**User Story:** As an accounts manager, I want to delete draft payments that are no longer needed, so that I can keep the payment list clean.

#### Acceptance Criteria

1. THE payment table row actions SHALL include a Delete button
2. IF the payment status is DRAFT, THE Delete button SHALL be enabled
3. IF the payment status is not DRAFT, THE Delete button SHALL be disabled
4. WHEN the Delete button is clicked, THE system SHALL display a confirmation dialog
5. THE confirmation dialog SHALL clearly state the payment number being deleted
6. WHEN deletion is confirmed, THE system SHALL call the delete payment API endpoint
7. WHEN the API call succeeds, THE system SHALL display a success toast notification
8. WHEN the API call succeeds, THE system SHALL invalidate Query_Cache
9. WHEN the API call fails, THE system SHALL display an error toast with the error message

### Requirement 19: Payment Reconciliation

**User Story:** As an accounts manager, I want to reconcile payments with bank statements, so that I can ensure accurate financial records.

#### Acceptance Criteria

1. WHEN a payment status is changed to RECONCILED, THE system SHALL mark the payment as reconciled
2. THE payment Detail_Dialog SHALL display reconciliation status
3. IF a payment is reconciled, THE Edit and Delete actions SHALL be disabled
4. THE payment table SHALL allow filtering by reconciliation status
5. WHEN a payment is reconciled, THE system SHALL update the payment status to RECONCILED

### Requirement 20: Revenue Navigation Integration

**User Story:** As a user, I want to navigate between Invoices and Payments tabs, so that I can access different parts of the billing workflow.

#### Acceptance Criteria

1. THE Revenue_Navigation SHALL include an "Invoices" tab with an appropriate icon
2. THE Revenue_Navigation SHALL include a "Payments" tab with an appropriate icon
3. WHEN a navigation tab is clicked, THE system SHALL update the active view state
4. THE active tab SHALL be visually highlighted with primary color styling
5. WHEN the active view changes, THE system SHALL render the corresponding management component
6. THE system SHALL preserve the previous tab's state when switching between tabs
7. THE navigation tabs SHALL be responsive and work on mobile devices

### Requirement 21: Cross-Document Navigation

**User Story:** As a user, I want to navigate between related documents (sales order, invoice, payment), so that I can easily track the complete transaction flow.

#### Acceptance Criteria

1. WHEN viewing an invoice that has reference_type "Sales Order", THE Detail_Dialog SHALL include a link to view the source sales order
2. WHEN viewing a sales order that has been invoiced, THE Detail_Dialog SHALL include a link to view related invoices
3. WHEN viewing an invoice that has payments, THE Detail_Dialog SHALL include links to view related payments
4. WHEN viewing a payment that has invoice allocations, THE Detail_Dialog SHALL include links to view allocated invoices
5. WHEN a cross-document link is clicked, THE system SHALL navigate to the appropriate tab and open the detail dialog for that document

### Requirement 22: Responsive Design and Accessibility

**User Story:** As a user, I want the invoice and payment interfaces to work well on different screen sizes and be accessible, so that I can use the system effectively on any device.

#### Acceptance Criteria

1. THE Invoice_Management_UI and Payment_Management_UI SHALL be responsive and adapt to mobile, tablet, and desktop screen sizes
2. THE Stats_Cards SHALL stack vertically on mobile devices and display in a grid on larger screens
3. THE Filter_Controls SHALL stack vertically on mobile devices and display horizontally on larger screens
4. THE data tables SHALL be horizontally scrollable on small screens
5. THE dialogs SHALL be full-screen on mobile devices and centered modals on larger screens
6. THE Invoice_Line_Item_Table and Payment_Allocation_Table SHALL be scrollable on small screens
7. ALL interactive elements SHALL be keyboard accessible
8. ALL form inputs SHALL have associated labels for screen readers
9. THE Status_Badge SHALL use both color and text to convey status for color-blind users
10. ALL buttons SHALL have appropriate aria-labels when icon-only

### Requirement 23: Data Validation and Error Handling

**User Story:** As a user, I want clear validation messages and error handling, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a required field is empty on form submission, THE system SHALL display a validation error message next to the field
2. WHEN a date field has an invalid date, THE system SHALL display a validation error message
3. WHEN due date is before posting date, THE system SHALL display a validation error message
4. WHEN a line item has zero or negative quantity, THE system SHALL display a validation error message
5. WHEN a line item has zero or negative rate, THE system SHALL display a validation error message
6. WHEN payment allocation exceeds invoice outstanding amount, THE system SHALL display a validation error message
7. WHEN total payment allocation exceeds payment total amount, THE system SHALL display a validation error message
8. WHEN an API call fails due to network error, THE system SHALL display a user-friendly error message with retry option
9. WHEN an API call fails due to validation error, THE system SHALL display the specific validation errors from the backend
10. WHEN an API call fails due to authorization error, THE system SHALL display an appropriate message
11. ALL error messages SHALL be displayed using toast notifications with destructive variant

### Requirement 24: Performance and Caching

**User Story:** As a user, I want the application to load quickly and feel responsive, so that I can work efficiently.

#### Acceptance Criteria

1. THE system SHALL use TanStack Query for all API calls with appropriate caching strategies
2. THE Query_Cache SHALL have a stale time of 30 seconds for invoice and payment data
3. WHEN data is being fetched, THE system SHALL show loading skeletons or spinners
4. WHEN data is in cache and being revalidated, THE system SHALL show the cached data with a subtle loading indicator
5. WHEN a mutation succeeds, THE system SHALL invalidate relevant query cache entries
6. THE system SHALL implement optimistic updates for status changes when appropriate
7. THE data tables SHALL use virtualization for large datasets if needed
8. THE system SHALL debounce search input to avoid excessive API calls
9. THE system SHALL prefetch customer and item data when opening create/edit dialogs
10. THE system SHALL lazy load the invoice and payment management components

### Requirement 25: Invoice and Payment Number Generation

**User Story:** As a system administrator, I want invoice and payment numbers to be automatically generated with a consistent format, so that documents are properly tracked and organized.

#### Acceptance Criteria

1. WHEN an invoice is created, THE system SHALL automatically generate a unique invoice number
2. WHEN a payment is created, THE system SHALL automatically generate a unique payment number
3. THE invoice number format SHALL follow the pattern: INV-YYYY-NNNN (e.g., INV-2024-0001)
4. THE payment number format SHALL follow the pattern: PAY-YYYY-NNNN (e.g., PAY-2024-0001)
5. THE system SHALL ensure invoice and payment numbers are sequential within each year
6. THE invoice and payment number fields SHALL be read-only in all forms

### Requirement 26: Tax Calculation

**User Story:** As an accounts manager, I want taxes to be automatically calculated on invoice line items, so that invoices are accurate and compliant.

#### Acceptance Criteria

1. WHEN a tax template is selected for an invoice line item, THE system SHALL fetch the tax rate from the tax template
2. THE system SHALL calculate tax amount as: (quantity × rate) × (tax_rate / 100)
3. THE system SHALL display tax amount for each line item
4. THE system SHALL calculate total tax as the sum of all line item tax amounts
5. THE system SHALL calculate grand total as: subtotal + total_tax
6. WHEN tax template is changed, THE system SHALL recalculate tax amounts immediately
7. THE invoice Detail_Dialog SHALL display tax breakdown by tax template

### Requirement 27: Overdue Invoice Detection

**User Story:** As an accounts manager, I want the system to automatically detect overdue invoices, so that I can follow up on late payments.

#### Acceptance Criteria

1. WHEN an invoice is in SUBMITTED status and the current date is after the due date and outstanding amount is greater than zero, THE system SHALL automatically update the status to OVERDUE
2. THE system SHALL check for overdue invoices when the invoice list is loaded
3. THE system SHALL display overdue invoices with red styling in the table
4. THE Stats_Cards SHALL display the count of overdue invoices prominently
5. THE Filter_Controls SHALL allow filtering by overdue status

### Requirement 28: Partial Payment Handling

**User Story:** As an accounts manager, I want to record partial payments against invoices, so that I can track progressive payment collection.

#### Acceptance Criteria

1. WHEN a payment is allocated to an invoice and the allocated amount is less than the outstanding amount, THE system SHALL update the invoice status to PARTIALLY_PAID
2. WHEN a payment is allocated to an invoice and the allocated amount equals the outstanding amount, THE system SHALL update the invoice status to PAID
3. THE invoice Detail_Dialog SHALL display a payment history showing all payments with dates and amounts
4. THE invoice table SHALL display paid amount and outstanding amount for each invoice
5. WHEN multiple payments are recorded against an invoice, THE system SHALL sum all payment allocations to calculate total paid amount

### Requirement 29: Multi-Invoice Payment Allocation

**User Story:** As an accounts manager, I want to allocate a single payment to multiple invoices, so that I can efficiently process bulk payments from customers.

#### Acceptance Criteria

1. THE Payment_Allocation_Table SHALL allow selecting multiple invoices for allocation
2. THE system SHALL validate that the sum of all allocations does not exceed the payment total amount
3. WHEN the payment total amount is entered, THE system SHALL suggest automatic allocation to invoices in order of due date
4. THE user SHALL be able to manually adjust allocation amounts for each invoice
5. THE Payment_Allocation_Table SHALL display remaining unallocated amount as allocations are entered
6. WHEN the payment is submitted, THE system SHALL update paid_amount for all allocated invoices

### Requirement 30: Invoice and Payment Audit Trail

**User Story:** As a system administrator, I want to track all changes to invoices and payments, so that I can maintain an audit trail for compliance.

#### Acceptance Criteria

1. THE invoice Detail_Dialog SHALL display created_at timestamp with creator name
2. THE invoice Detail_Dialog SHALL display updated_at timestamp with last modifier name
3. THE payment Detail_Dialog SHALL display created_at timestamp with creator name
4. THE payment Detail_Dialog SHALL display updated_at timestamp with last modifier name
5. WHEN an invoice status changes, THE system SHALL record the status change with timestamp and user
6. WHEN a payment status changes, THE system SHALL record the status change with timestamp and user
7. THE Detail_Dialog SHALL display a status history showing all status changes with dates and users
