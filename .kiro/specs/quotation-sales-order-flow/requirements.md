# Requirements Document

## Introduction

This document specifies the requirements for implementing a complete Quotation and Sales Order management system within the Revenue module of the ERP application. The system enables sales representatives to create quotations, manage their lifecycle, convert accepted quotations to sales orders, and track orders through fulfillment and invoicing.

The frontend implementation follows established UI patterns using React, TypeScript, TanStack Query, TanStack Table, and Shadcn UI components. The system integrates with existing Customer Management and extends the Revenue page navigation.

## Glossary

- **Quotation_Management_UI**: The React component that displays and manages quotations
- **Sales_Order_Management_UI**: The React component that displays and manages sales orders
- **Quotation_Form**: The dialog component for creating and editing quotations
- **Sales_Order_Form**: The dialog component for creating and editing sales orders
- **Line_Item_Table**: The table component displaying product line items within a quotation or sales order
- **Status_Badge**: The UI component displaying the current status of a quotation or sales order
- **Conversion_Dialog**: The dialog component for converting quotations to sales orders
- **Revenue_Navigation**: The top navigation bar in the Revenue page
- **Stats_Cards**: The dashboard cards displaying key metrics
- **Filter_Controls**: The UI components for searching and filtering records
- **Detail_Dialog**: The read-only dialog displaying full record details
- **API_Client**: The utility module for making backend API calls
- **Query_Cache**: The TanStack Query cache managing data state

## Requirements

### Requirement 1: Quotation List View

**User Story:** As a sales representative, I want to view all quotations in a paginated table with filtering and search capabilities, so that I can quickly find and manage quotations.

#### Acceptance Criteria

1. WHEN the Quotations tab is selected in Revenue_Navigation, THE Quotation_Management_UI SHALL display a table of quotations
2. THE Quotation_Management_UI SHALL fetch quotation data from the backend API using Query_Cache
3. WHEN quotation data is loading, THE Quotation_Management_UI SHALL display loading indicators
4. WHEN the API returns an error, THE Quotation_Management_UI SHALL display an error message with retry option
5. THE table SHALL display columns for quotation number, customer name, quotation date, valid until date, grand total, currency, and status
6. THE table SHALL support server-side pagination with configurable page size
7. THE Filter_Controls SHALL include a search input that filters by quotation number or customer name
8. THE Filter_Controls SHALL include a status dropdown with options: All, Draft, Sent, Accepted, Rejected, Expired
9. WHEN filter values change, THE Quotation_Management_UI SHALL reset to page 1 and fetch filtered data
10. THE table SHALL include action buttons for View, Edit, and Delete on each row
11. THE table SHALL support column visibility toggling through DataTableViewOptions
12. THE table SHALL display "No quotations found" when the result set is empty

### Requirement 2: Quotation Statistics Dashboard

**User Story:** As a sales manager, I want to see key quotation metrics at a glance, so that I can monitor sales pipeline health.

#### Acceptance Criteria

1. THE Quotation_Management_UI SHALL display Stats_Cards above the quotation table
2. THE Stats_Cards SHALL include a card showing total number of quotations
3. THE Stats_Cards SHALL include a card showing count of draft quotations
4. THE Stats_Cards SHALL include a card showing count of sent quotations
5. THE Stats_Cards SHALL include a card showing count of accepted quotations
6. WHEN quotation data updates, THE Stats_Cards SHALL recalculate and display updated metrics
7. THE Stats_Cards SHALL use appropriate icons and color schemes matching existing patterns

### Requirement 3: Create Quotation

**User Story:** As a sales representative, I want to create new quotations with customer and line item details, so that I can provide formal price proposals to customers.

#### Acceptance Criteria

1. WHEN the "New Quotation" button is clicked, THE Quotation_Form SHALL open in a dialog
2. THE Quotation_Form SHALL include a customer selection dropdown populated from the customer API
3. THE Quotation_Form SHALL include a quotation date picker with default value of current date
4. THE Quotation_Form SHALL include a valid until date picker
5. THE Quotation_Form SHALL include a currency selection dropdown
6. THE Quotation_Form SHALL include a remarks textarea for optional notes
7. THE Quotation_Form SHALL include a Line_Item_Table for adding products
8. THE Line_Item_Table SHALL allow adding multiple line items with item selection, quantity, UOM, and rate
9. WHEN line item quantity or rate changes, THE system SHALL calculate amount as quantity × rate
10. WHEN line items are added, removed, or modified, THE Quotation_Form SHALL recalculate and display grand total
11. THE Quotation_Form SHALL validate that customer is selected before submission
12. THE Quotation_Form SHALL validate that at least one line item exists before submission
13. THE Quotation_Form SHALL validate that all line items have positive quantities and rates
14. WHEN the form is submitted, THE system SHALL call the create quotation API endpoint
15. WHEN the API call succeeds, THE system SHALL display a success toast notification
16. WHEN the API call succeeds, THE system SHALL invalidate Query_Cache and close the dialog
17. WHEN the API call fails, THE system SHALL display an error toast with the error message
18. WHILE the API call is in progress, THE Quotation_Form SHALL disable the submit button and show loading state

### Requirement 4: Edit Quotation

**User Story:** As a sales representative, I want to edit existing quotations, so that I can correct errors or update pricing before sending to customers.

#### Acceptance Criteria

1. WHEN the Edit action is clicked on a quotation row, THE Quotation_Form SHALL open with the quotation data pre-filled
2. IF the quotation status is DRAFT, THE Quotation_Form SHALL allow editing all fields including line items
3. IF the quotation status is SENT, THE Quotation_Form SHALL prevent editing line items and pricing fields
4. IF the quotation status is ACCEPTED, REJECTED, or EXPIRED, THE Edit action SHALL be disabled
5. THE Quotation_Form SHALL display the current quotation number as read-only
6. WHEN the form is submitted, THE system SHALL call the update quotation API endpoint
7. WHEN the API call succeeds, THE system SHALL display a success toast notification
8. WHEN the API call succeeds, THE system SHALL invalidate Query_Cache and close the dialog
9. WHEN the API call fails, THE system SHALL display an error toast with the error message

### Requirement 5: View Quotation Details

**User Story:** As a sales representative, I want to view complete quotation details in a read-only format, so that I can review all information without risk of accidental changes.

#### Acceptance Criteria

1. WHEN the View action is clicked on a quotation row, THE Detail_Dialog SHALL open displaying the quotation
2. THE Detail_Dialog SHALL display quotation number, customer name, dates, currency, and status
3. THE Detail_Dialog SHALL display all line items in a read-only table with item name, quantity, UOM, rate, and amount
4. THE Detail_Dialog SHALL display the grand total prominently
5. THE Detail_Dialog SHALL display remarks if present
6. THE Detail_Dialog SHALL display created and updated timestamps
7. THE Detail_Dialog SHALL include an Edit button that opens the Quotation_Form
8. IF the quotation status is ACCEPTED, THE Detail_Dialog SHALL include a "Convert to Sales Order" button
9. THE Detail_Dialog SHALL use Status_Badge to display the current status with appropriate styling

### Requirement 6: Quotation Status Management

**User Story:** As a sales representative, I want to change quotation status through the workflow, so that I can track the quotation lifecycle.

#### Acceptance Criteria

1. WHEN a quotation is created, THE system SHALL set status to DRAFT
2. THE Quotation_Form SHALL include a status dropdown when editing existing quotations
3. IF the current status is DRAFT, THE status dropdown SHALL allow selecting DRAFT or SENT
4. IF the current status is SENT, THE status dropdown SHALL allow selecting SENT, ACCEPTED, REJECTED, or EXPIRED
5. IF the current status is ACCEPTED, REJECTED, or EXPIRED, THE status dropdown SHALL be disabled
6. THE Status_Badge SHALL display DRAFT status with amber/yellow styling
7. THE Status_Badge SHALL display SENT status with blue styling
8. THE Status_Badge SHALL display ACCEPTED status with green styling
9. THE Status_Badge SHALL display REJECTED status with red styling
10. THE Status_Badge SHALL display EXPIRED status with gray styling

### Requirement 7: Delete Quotation

**User Story:** As a sales representative, I want to delete draft quotations that are no longer needed, so that I can keep the quotation list clean.

#### Acceptance Criteria

1. THE quotation table row actions SHALL include a Delete button
2. IF the quotation status is DRAFT, THE Delete button SHALL be enabled
3. IF the quotation status is not DRAFT, THE Delete button SHALL be disabled
4. WHEN the Delete button is clicked, THE system SHALL display a confirmation dialog
5. THE confirmation dialog SHALL clearly state the quotation number being deleted
6. WHEN deletion is confirmed, THE system SHALL call the delete quotation API endpoint
7. WHEN the API call succeeds, THE system SHALL display a success toast notification
8. WHEN the API call succeeds, THE system SHALL invalidate Query_Cache
9. WHEN the API call fails, THE system SHALL display an error toast with the error message

### Requirement 8: Convert Quotation to Sales Order

**User Story:** As a sales representative, I want to convert accepted quotations to sales orders, so that I can efficiently create orders from approved quotes.

#### Acceptance Criteria

1. WHEN the "Convert to Sales Order" button is clicked in Detail_Dialog, THE Conversion_Dialog SHALL open
2. THE Conversion_Dialog SHALL display the quotation details being converted
3. THE Conversion_Dialog SHALL include an order date picker with default value of current date
4. THE Conversion_Dialog SHALL include an optional delivery date picker
5. THE Conversion_Dialog SHALL display all line items from the quotation
6. THE Conversion_Dialog SHALL allow editing the delivery date but not line items
7. WHEN the conversion is confirmed, THE system SHALL call the convert quotation API endpoint
8. THE API call SHALL create a new sales order with status DRAFT
9. THE API call SHALL copy customer, currency, remarks, and all line items from the quotation
10. THE API call SHALL set reference_type to "Quotation" and reference_id to the quotation ID
11. WHEN the API call succeeds, THE system SHALL display a success toast notification
12. WHEN the API call succeeds, THE system SHALL navigate to the Sales Orders tab showing the new order
13. WHEN the API call fails, THE system SHALL display an error toast with the error message

### Requirement 9: Sales Order List View

**User Story:** As a sales manager, I want to view all sales orders in a paginated table with filtering and search capabilities, so that I can monitor and manage orders.

#### Acceptance Criteria

1. WHEN the Sales Orders tab is selected in Revenue_Navigation, THE Sales_Order_Management_UI SHALL display a table of sales orders
2. THE Sales_Order_Management_UI SHALL fetch sales order data from the backend API using Query_Cache
3. WHEN sales order data is loading, THE Sales_Order_Management_UI SHALL display loading indicators
4. WHEN the API returns an error, THE Sales_Order_Management_UI SHALL display an error message with retry option
5. THE table SHALL display columns for sales order number, customer name, order date, delivery date, grand total, currency, and status
6. THE table SHALL support server-side pagination with configurable page size
7. THE Filter_Controls SHALL include a search input that filters by sales order number or customer name
8. THE Filter_Controls SHALL include a status dropdown with options: All, Draft, Confirmed, Partially Delivered, Delivered, Closed, Cancelled
9. WHEN filter values change, THE Sales_Order_Management_UI SHALL reset to page 1 and fetch filtered data
10. THE table SHALL include action buttons for View, Edit, and Delete on each row
11. THE table SHALL support column visibility toggling through DataTableViewOptions
12. THE table SHALL display "No sales orders found" when the result set is empty
13. IF a sales order has reference_type "Quotation", THE table SHALL display a link icon to view the source quotation

### Requirement 10: Sales Order Statistics Dashboard

**User Story:** As a sales manager, I want to see key sales order metrics at a glance, so that I can monitor order fulfillment status.

#### Acceptance Criteria

1. THE Sales_Order_Management_UI SHALL display Stats_Cards above the sales order table
2. THE Stats_Cards SHALL include a card showing total number of sales orders
3. THE Stats_Cards SHALL include a card showing count of confirmed sales orders
4. THE Stats_Cards SHALL include a card showing total value of confirmed orders
5. THE Stats_Cards SHALL include a card showing count of orders pending delivery
6. WHEN sales order data updates, THE Stats_Cards SHALL recalculate and display updated metrics
7. THE Stats_Cards SHALL use appropriate icons and color schemes matching existing patterns

### Requirement 11: Create Sales Order

**User Story:** As a sales manager, I want to create new sales orders directly, so that I can process orders that don't originate from quotations.

#### Acceptance Criteria

1. WHEN the "New Sales Order" button is clicked, THE Sales_Order_Form SHALL open in a dialog
2. THE Sales_Order_Form SHALL include a customer selection dropdown populated from the customer API
3. THE Sales_Order_Form SHALL include an order date picker with default value of current date
4. THE Sales_Order_Form SHALL include an optional delivery date picker
5. THE Sales_Order_Form SHALL include a currency selection dropdown
6. THE Sales_Order_Form SHALL include a remarks textarea for optional notes
7. THE Sales_Order_Form SHALL include a Line_Item_Table for adding products
8. THE Line_Item_Table SHALL allow adding multiple line items with item selection, quantity, UOM, and rate
9. WHEN line item quantity or rate changes, THE system SHALL calculate amount as quantity × rate
10. WHEN line items are added, removed, or modified, THE Sales_Order_Form SHALL recalculate and display grand total
11. THE Sales_Order_Form SHALL validate that customer is selected before submission
12. THE Sales_Order_Form SHALL validate that at least one line item exists before submission
13. THE Sales_Order_Form SHALL validate that all line items have positive quantities and rates
14. WHEN the form is submitted, THE system SHALL call the create sales order API endpoint
15. WHEN the API call succeeds, THE system SHALL display a success toast notification
16. WHEN the API call succeeds, THE system SHALL invalidate Query_Cache and close the dialog
17. WHEN the API call fails, THE system SHALL display an error toast with the error message
18. WHILE the API call is in progress, THE Sales_Order_Form SHALL disable the submit button and show loading state

### Requirement 12: Edit Sales Order

**User Story:** As a sales manager, I want to edit existing sales orders, so that I can update order details before confirmation.

#### Acceptance Criteria

1. WHEN the Edit action is clicked on a sales order row, THE Sales_Order_Form SHALL open with the sales order data pre-filled
2. IF the sales order status is DRAFT, THE Sales_Order_Form SHALL allow editing all fields including line items
3. IF the sales order status is CONFIRMED or later, THE Sales_Order_Form SHALL prevent editing line items that would invalidate existing invoices or delivery notes
4. IF the sales order status is CLOSED, THE Edit action SHALL be disabled
5. THE Sales_Order_Form SHALL display the current sales order number as read-only
6. THE Sales_Order_Form SHALL display billed_qty and delivered_qty for each line item as read-only
7. WHEN the form is submitted, THE system SHALL call the update sales order API endpoint
8. WHEN the API call succeeds, THE system SHALL display a success toast notification
9. WHEN the API call succeeds, THE system SHALL invalidate Query_Cache and close the dialog
10. WHEN the API call fails, THE system SHALL display an error toast with the error message

### Requirement 13: View Sales Order Details

**User Story:** As a sales manager, I want to view complete sales order details including fulfillment status, so that I can track order progress.

#### Acceptance Criteria

1. WHEN the View action is clicked on a sales order row, THE Detail_Dialog SHALL open displaying the sales order
2. THE Detail_Dialog SHALL display sales order number, customer name, dates, currency, and status
3. THE Detail_Dialog SHALL display all line items in a read-only table with item name, quantity, UOM, rate, amount, billed quantity, and delivered quantity
4. THE Detail_Dialog SHALL display the grand total prominently
5. THE Detail_Dialog SHALL display remarks if present
6. THE Detail_Dialog SHALL display created and updated timestamps
7. IF the sales order has reference_type "Quotation", THE Detail_Dialog SHALL display a link to view the source quotation
8. THE Detail_Dialog SHALL include an Edit button that opens the Sales_Order_Form
9. IF the sales order status is CONFIRMED or later, THE Detail_Dialog SHALL include a "Create Invoice" button
10. THE Detail_Dialog SHALL use Status_Badge to display the current status with appropriate styling
11. FOR each line item, THE Detail_Dialog SHALL visually indicate fulfillment progress based on billed_qty and delivered_qty

### Requirement 14: Sales Order Status Management

**User Story:** As a sales manager, I want to change sales order status through the workflow, so that I can track the order lifecycle.

#### Acceptance Criteria

1. WHEN a sales order is created, THE system SHALL set status to DRAFT
2. THE Sales_Order_Form SHALL include a status dropdown when editing existing sales orders
3. IF the current status is DRAFT, THE status dropdown SHALL allow selecting DRAFT or CONFIRMED
4. IF the current status is CONFIRMED, THE status dropdown SHALL allow selecting CONFIRMED, PARTIALLY_DELIVERED, DELIVERED, or CANCELLED
5. IF the current status is PARTIALLY_DELIVERED, THE status dropdown SHALL allow selecting PARTIALLY_DELIVERED, DELIVERED, or CANCELLED
6. IF the current status is DELIVERED, THE status dropdown SHALL allow selecting DELIVERED, CLOSED, or CANCELLED
7. IF the current status is CLOSED or CANCELLED, THE status dropdown SHALL be disabled
8. WHEN all line items have billed_qty equal to qty, THE status dropdown SHALL allow selecting CLOSED
9. THE Status_Badge SHALL display DRAFT status with amber/yellow styling
10. THE Status_Badge SHALL display CONFIRMED status with blue styling
11. THE Status_Badge SHALL display PARTIALLY_DELIVERED status with purple styling
12. THE Status_Badge SHALL display DELIVERED status with green styling
13. THE Status_Badge SHALL display CLOSED status with gray styling
14. THE Status_Badge SHALL display CANCELLED status with red styling

### Requirement 15: Delete Sales Order

**User Story:** As a sales manager, I want to delete draft sales orders that are no longer needed, so that I can keep the sales order list clean.

#### Acceptance Criteria

1. THE sales order table row actions SHALL include a Delete button
2. IF the sales order status is DRAFT, THE Delete button SHALL be enabled
3. IF the sales order status is not DRAFT, THE Delete button SHALL be disabled
4. WHEN the Delete button is clicked, THE system SHALL display a confirmation dialog
5. THE confirmation dialog SHALL clearly state the sales order number being deleted
6. WHEN deletion is confirmed, THE system SHALL call the delete sales order API endpoint
7. WHEN the API call succeeds, THE system SHALL display a success toast notification
8. WHEN the API call succeeds, THE system SHALL invalidate Query_Cache
9. WHEN the API call fails, THE system SHALL display an error toast with the error message

### Requirement 16: Create Invoice from Sales Order

**User Story:** As an accounts manager, I want to create invoices from sales orders, so that I can bill customers for confirmed orders.

#### Acceptance Criteria

1. WHEN the "Create Invoice" button is clicked in the sales order Detail_Dialog, THE system SHALL open an invoice creation dialog
2. THE invoice creation dialog SHALL display the sales order details being invoiced
3. THE invoice creation dialog SHALL include a posting date picker with default value of current date
4. THE invoice creation dialog SHALL include a due date picker
5. THE invoice creation dialog SHALL display all sales order line items with their quantities
6. FOR each line item, THE invoice creation dialog SHALL show quantity ordered, quantity already billed, and quantity available to bill
7. THE invoice creation dialog SHALL allow specifying the quantity to bill for each line item
8. THE invoice creation dialog SHALL validate that billed quantity does not exceed available quantity
9. THE invoice creation dialog SHALL calculate the invoice total based on selected quantities and rates
10. WHEN the invoice creation is confirmed, THE system SHALL call the create invoice from sales order API endpoint
11. THE API call SHALL create a new invoice with status DRAFT and invoice_type SALES
12. THE API call SHALL set party_id to customer_id, party_type to "Customer", and copy currency and remarks
13. THE API call SHALL set reference_type to "Sales Order" and reference_id to the sales order ID
14. THE API call SHALL update the sales order line item billed_qty values
15. WHEN the API call succeeds, THE system SHALL display a success toast notification
16. WHEN the API call succeeds, THE system SHALL navigate to the Invoices tab showing the new invoice
17. WHEN the API call fails, THE system SHALL display an error toast with the error message

### Requirement 17: Revenue Navigation Integration

**User Story:** As a user, I want to navigate between Quotations and Sales Orders tabs, so that I can access different parts of the sales workflow.

#### Acceptance Criteria

1. THE Revenue_Navigation SHALL include a "Quotations" tab with an appropriate icon
2. THE Revenue_Navigation SHALL include a "Sales Orders" tab with an appropriate icon
3. WHEN a navigation tab is clicked, THE system SHALL update the active view state
4. THE active tab SHALL be visually highlighted with primary color styling
5. WHEN the active view changes, THE system SHALL render the corresponding management component
6. THE system SHALL preserve the previous tab's state when switching between tabs
7. THE navigation tabs SHALL be responsive and work on mobile devices

### Requirement 18: Responsive Design and Accessibility

**User Story:** As a user, I want the quotation and sales order interfaces to work well on different screen sizes and be accessible, so that I can use the system effectively on any device.

#### Acceptance Criteria

1. THE Quotation_Management_UI and Sales_Order_Management_UI SHALL be responsive and adapt to mobile, tablet, and desktop screen sizes
2. THE Stats_Cards SHALL stack vertically on mobile devices and display in a grid on larger screens
3. THE Filter_Controls SHALL stack vertically on mobile devices and display horizontally on larger screens
4. THE data tables SHALL be horizontally scrollable on small screens
5. THE dialogs SHALL be full-screen on mobile devices and centered modals on larger screens
6. THE Line_Item_Table SHALL be scrollable on small screens
7. ALL interactive elements SHALL be keyboard accessible
8. ALL form inputs SHALL have associated labels for screen readers
9. THE Status_Badge SHALL use both color and text to convey status for color-blind users
10. ALL buttons SHALL have appropriate aria-labels when icon-only

### Requirement 19: Data Validation and Error Handling

**User Story:** As a user, I want clear validation messages and error handling, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a required field is empty on form submission, THE system SHALL display a validation error message next to the field
2. WHEN a date field has an invalid date, THE system SHALL display a validation error message
3. WHEN valid until date is before quotation date, THE system SHALL display a validation error message
4. WHEN delivery date is before order date, THE system SHALL display a validation error message
5. WHEN a line item has zero or negative quantity, THE system SHALL display a validation error message
6. WHEN a line item has zero or negative rate, THE system SHALL display a validation error message
7. WHEN an API call fails due to network error, THE system SHALL display a user-friendly error message with retry option
8. WHEN an API call fails due to validation error, THE system SHALL display the specific validation errors from the backend
9. WHEN an API call fails due to authorization error, THE system SHALL display an appropriate message
10. ALL error messages SHALL be displayed using toast notifications with destructive variant

### Requirement 20: Performance and Caching

**User Story:** As a user, I want the application to load quickly and feel responsive, so that I can work efficiently.

#### Acceptance Criteria

1. THE system SHALL use TanStack Query for all API calls with appropriate caching strategies
2. THE Query_Cache SHALL have a stale time of 30 seconds for quotation and sales order data
3. WHEN data is being fetched, THE system SHALL show loading skeletons or spinners
4. WHEN data is in cache and being revalidated, THE system SHALL show the cached data with a subtle loading indicator
5. WHEN a mutation succeeds, THE system SHALL invalidate relevant query cache entries
6. THE system SHALL implement optimistic updates for status changes when appropriate
7. THE data tables SHALL use virtualization for large datasets if needed
8. THE system SHALL debounce search input to avoid excessive API calls
9. THE system SHALL prefetch customer and item data when opening create/edit dialogs
10. THE system SHALL lazy load the quotation and sales order management components
