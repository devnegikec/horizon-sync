# Implementation Plan: Quotation and Sales Order Management

## Overview

This implementation plan breaks down the Quotation and Sales Order management feature into discrete, incremental coding tasks. Each task builds on previous work and includes testing sub-tasks to validate functionality early. The implementation follows the established patterns in the application using React, TypeScript, TanStack Query, TanStack Table, and Shadcn UI components.

## Tasks

- [x] 1. Set up type definitions and API clients
  - Create TypeScript type definitions for Quotation and SalesOrder entities
  - Create quotationApi and salesOrderApi client functions following existing patterns
  - Define shared types (CustomerInfo, PaginationInfo, ServerPaginationConfig)
  - _Requirements: All requirements (foundation)_

- [ ] 2. Implement StatusBadge component
  - [x] 2.1 Create StatusBadge component with status-based styling
    - Implement component accepting QuotationStatus or SalesOrderStatus
    - Define color schemes for each status (DRAFT: amber, SENT: blue, ACCEPTED: green, etc.)
    - Use Shadcn Badge component as base
    - _Requirements: 6.6-6.10, 14.9-14.14_
  
  - [ ] 2.2 Write unit tests for StatusBadge
    - Test each status renders with correct styling
    - Test className prop merging
    - _Requirements: 6.6-6.10, 14.9-14.14_

- [ ] 3. Implement LineItemTable component
  - [x] 3.1 Create LineItemTable component for managing line items
    - Implement add/remove line item functionality
    - Create item selection dropdown
    - Implement quantity, UOM, rate inputs
    - Add automatic amount calculation on quantity/rate change
    - Support readonly mode for detail views
    - Support fulfillment status display for sales orders
    - _Requirements: 3.8, 11.8_
  
  - [ ] 3.2 Write property test for line item amount calculation
    - **Property 1: Line Item Amount Calculation**
    - **Validates: Requirements 3.9, 11.9**
  
  - [ ] 3.3 Write unit tests for LineItemTable
    - Test adding and removing line items
    - Test readonly mode
    - Test fulfillment status display
    - _Requirements: 3.8, 11.8_

- [ ] 4. Implement QuotationDialog component
  - [x] 4.1 Create QuotationDialog form component
    - Implement dialog with form fields (customer, dates, currency, remarks)
    - Integrate LineItemTable for line items management
    - Add form validation (required fields, date validation)
    - Implement grand total calculation
    - Handle create and edit modes
    - Disable line item editing for SENT status
    - Fetch customers and items data for dropdowns
    - _Requirements: 3.1-3.18, 4.1-4.9_
  
  - [ ] 4.2 Write property test for grand total calculation
    - **Property 2: Grand Total Calculation**
    - **Validates: Requirements 3.10, 11.10**
  
  - [ ] 4.3 Write property test for line item validation
    - **Property 8: Line Item Validation**
    - **Validates: Requirements 3.13, 11.13, 19.5, 19.6**
  
  - [ ] 4.4 Write property test for date validation
    - **Property 9: Date Validation**
    - **Validates: Requirements 19.3, 19.4**
  
  - [ ] 4.5 Write unit tests for QuotationDialog
    - Test form opens in create mode
    - Test form opens in edit mode with pre-filled data
    - Test validation prevents submission with missing fields
    - Test SENT status disables line item editing
    - _Requirements: 3.1-3.18, 4.1-4.9_

- [ ] 5. Implement QuotationDetailDialog component
  - [x] 5.1 Create QuotationDetailDialog read-only view
    - Display quotation header with number and status badge
    - Display customer information
    - Display dates, currency, and grand total
    - Display line items in read-only table
    - Display remarks and timestamps
    - Add Edit button (disabled for terminal statuses)
    - Add "Convert to Sales Order" button (only for ACCEPTED status)
    - _Requirements: 5.1-5.9_
  
  - [ ] 5.2 Write unit tests for QuotationDetailDialog
    - Test all information displays correctly
    - Test Edit button disabled for terminal statuses
    - Test Convert button only shown for ACCEPTED status
    - _Requirements: 5.1-5.9_

- [ ] 6. Implement QuotationsTable component
  - [x] 6.1 Create QuotationsTable with TanStack Table
    - Define table columns (quotation number, customer, dates, total, status)
    - Implement row actions (View, Edit, Delete)
    - Add server-side pagination support
    - Add column visibility toggle
    - Add loading skeletons
    - Add empty state with "Create Quotation" CTA
    - Conditionally enable/disable actions based on status
    - _Requirements: 1.5, 1.6, 1.10, 1.11, 1.12_
  
  - [ ] 6.2 Write property test for pagination consistency
    - **Property 12: Pagination Consistency**
    - **Validates: Requirements 1.6, 9.6**
  
  - [ ] 6.3 Write unit tests for QuotationsTable
    - Test table renders with correct columns
    - Test row actions are conditionally enabled
    - Test empty state displays correctly
    - _Requirements: 1.5, 1.6, 1.10, 1.11, 1.12_

- [ ] 7. Implement QuotationManagement component
  - [x] 7.1 Create QuotationManagement container component
    - Implement stats cards for quotation metrics
    - Add filter controls (search input, status dropdown)
    - Integrate QuotationsTable
    - Add "New Quotation", "Refresh", and "Export" buttons
    - Implement dialog state management
    - Fetch quotation data with TanStack Query
    - Handle create, update, delete mutations
    - Implement query cache invalidation
    - _Requirements: 1.1-1.12, 2.1-2.7, 3.14-3.18, 4.6-4.9, 7.1-7.9_
  
  - [ ] 7.2 Write property test for statistics recalculation
    - **Property 3: Statistics Recalculation**
    - **Validates: Requirements 2.6, 10.6**
  
  - [ ] 7.3 Write property test for filter reset
    - **Property 4: Filter Reset on Change**
    - **Validates: Requirements 1.9, 9.9**
  
  - [ ] 7.4 Write property test for search filtering
    - **Property 5: Search Filtering Correctness**
    - **Validates: Requirements 1.7, 9.7**
  
  - [ ] 7.5 Write property test for form pre-population
    - **Property 6: Form Pre-population**
    - **Validates: Requirements 4.1, 12.1**
  
  - [ ] 7.6 Write property test for initial status assignment
    - **Property 7: Initial Status Assignment**
    - **Validates: Requirements 6.1, 14.1**
  
  - [ ] 7.7 Write unit tests for QuotationManagement
    - Test component renders with all sections
    - Test filter changes trigger data refresh
    - Test create quotation flow
    - Test edit quotation flow
    - Test delete quotation flow
    - Test error handling displays correctly
    - _Requirements: 1.1-1.12, 2.1-2.7_

- [ ] 8. Checkpoint - Ensure quotation management tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement ConvertToSalesOrderDialog component
  - [ ] 9.1 Create ConvertToSalesOrderDialog
    - Display quotation summary
    - Add order date picker (default: current date)
    - Add optional delivery date picker
    - Display line items from quotation
    - Call conversion API endpoint
    - Handle success and error states
    - _Requirements: 8.1-8.13_
  
  - [ ] 9.2 Write unit tests for ConvertToSalesOrderDialog
    - Test dialog displays quotation summary
    - Test conversion API call with correct data
    - Test success navigation to Sales Orders tab
    - _Requirements: 8.1-8.13_

- [ ] 10. Implement SalesOrderDialog component
  - [ ] 10.1 Create SalesOrderDialog form component
    - Implement dialog with form fields (customer, dates, currency, remarks)
    - Integrate LineItemTable for line items management
    - Display billed_qty and delivered_qty as read-only
    - Add form validation (required fields, date validation)
    - Implement grand total calculation
    - Handle create and edit modes
    - Disable line item editing for CONFIRMED or later status
    - Fetch customers and items data for dropdowns
    - _Requirements: 11.1-11.18, 12.1-12.10_
  
  - [ ] 10.2 Write unit tests for SalesOrderDialog
    - Test form opens in create mode
    - Test form opens in edit mode with pre-filled data
    - Test validation prevents submission with missing fields
    - Test CONFIRMED status disables line item editing
    - Test billed_qty and delivered_qty display as read-only
    - _Requirements: 11.1-11.18, 12.1-12.10_

- [ ] 11. Implement SalesOrderDetailDialog component
  - [ ] 11.1 Create SalesOrderDetailDialog read-only view
    - Display sales order header with number and status badge
    - Display customer information
    - Display dates, currency, and grand total
    - Display reference to source quotation (if applicable)
    - Display line items with fulfillment status (billed_qty, delivered_qty)
    - Display remarks and timestamps
    - Add Edit button (disabled for CLOSED status)
    - Add "Create Invoice" button (only for CONFIRMED or later statuses)
    - _Requirements: 13.1-13.11_
  
  - [ ] 11.2 Write unit tests for SalesOrderDetailDialog
    - Test all information displays correctly
    - Test Edit button disabled for CLOSED status
    - Test Create Invoice button only shown for CONFIRMED+ statuses
    - Test quotation reference link displays when applicable
    - _Requirements: 13.1-13.11_

- [ ] 12. Implement CreateInvoiceDialog component
  - [ ] 12.1 Create CreateInvoiceDialog
    - Display sales order summary
    - Add posting date and due date pickers
    - Display line items with quantity information (ordered, billed, available)
    - Add quantity to bill input for each line item
    - Validate qty_to_bill ≤ available quantity
    - Calculate invoice total based on selected quantities
    - Call invoice creation API endpoint
    - Handle success and error states
    - _Requirements: 16.1-16.17_
  
  - [ ] 12.2 Write property test for invoice quantity validation
    - **Property 10: Invoice Quantity Validation**
    - **Validates: Requirements 16.8, 16.14**
  
  - [ ] 12.3 Write unit tests for CreateInvoiceDialog
    - Test dialog displays sales order summary
    - Test quantity validation prevents over-billing
    - Test invoice total calculation
    - Test invoice creation API call with correct data
    - _Requirements: 16.1-16.17_

- [ ] 13. Implement SalesOrdersTable component
  - [ ] 13.1 Create SalesOrdersTable with TanStack Table
    - Define table columns (order number, customer, dates, total, status, reference)
    - Implement row actions (View, Edit, Delete)
    - Add server-side pagination support
    - Add column visibility toggle
    - Add loading skeletons
    - Add empty state with "Create Sales Order" CTA
    - Display reference link icon for orders from quotations
    - Conditionally enable/disable actions based on status
    - _Requirements: 9.5, 9.6, 9.10, 9.11, 9.12, 9.13_
  
  - [ ] 13.2 Write unit tests for SalesOrdersTable
    - Test table renders with correct columns
    - Test row actions are conditionally enabled
    - Test reference link displays for quotation-sourced orders
    - Test empty state displays correctly
    - _Requirements: 9.5, 9.6, 9.10, 9.11, 9.12, 9.13_

- [ ] 14. Implement SalesOrderManagement component
  - [ ] 14.1 Create SalesOrderManagement container component
    - Implement stats cards for sales order metrics
    - Add filter controls (search input, status dropdown)
    - Integrate SalesOrdersTable
    - Add "New Sales Order", "Refresh", and "Export" buttons
    - Implement dialog state management
    - Fetch sales order data with TanStack Query
    - Handle create, update, delete mutations
    - Implement query cache invalidation
    - _Requirements: 9.1-9.13, 10.1-10.7, 11.14-11.18, 12.7-12.10, 15.1-15.9_
  
  - [ ] 14.2 Write property test for status transition validation
    - **Property 11: Status Transition Validation**
    - **Validates: Requirements 6.2-6.5, 14.3-14.7**
  
  - [ ] 14.3 Write unit tests for SalesOrderManagement
    - Test component renders with all sections
    - Test filter changes trigger data refresh
    - Test create sales order flow
    - Test edit sales order flow
    - Test delete sales order flow
    - Test error handling displays correctly
    - _Requirements: 9.1-9.13, 10.1-10.7_

- [ ] 15. Checkpoint - Ensure sales order management tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Update RevenuePage with new navigation tabs
  - [x] 16.1 Add Quotations and Sales Orders tabs to Revenue_Navigation
    - Add "Quotations" tab with appropriate icon (FileText)
    - Add "Sales Orders" tab with appropriate icon (ShoppingCart)
    - Update activeView type to include 'quotations' and 'sales_orders'
    - Update navigation rendering to include new tabs
    - Update main content rendering to show QuotationManagement and SalesOrderManagement
    - _Requirements: 17.1-17.7_
  
  - [ ] 16.2 Write unit tests for RevenuePage navigation
    - Test new tabs render correctly
    - Test clicking tabs updates active view
    - Test active tab styling
    - Test correct component renders for each tab
    - _Requirements: 17.1-17.7_

- [ ] 17. Implement error handling and loading states
  - [ ] 17.1 Add error boundaries and error displays
    - Implement error cards for page-level errors
    - Add inline field errors for form validation
    - Implement toast notifications for API operations
    - Add confirmation dialogs for destructive actions
    - Add retry mechanisms for failed API calls
    - Preserve form state when errors occur
    - _Requirements: 19.1-19.10_
  
  - [ ] 17.2 Write unit tests for error handling
    - Test error card displays on API failure
    - Test form validation errors display inline
    - Test toast notifications on success/failure
    - Test confirmation dialog for delete actions
    - _Requirements: 19.1-19.10_

- [ ] 18. Implement query caching and optimization
  - [ ] 18.1 Configure TanStack Query caching strategies
    - Set stale time to 30 seconds for quotation and sales order queries
    - Implement query invalidation after mutations
    - Add prefetching for customer and item data
    - Implement debounced search input
    - Add loading skeletons for better perceived performance
    - _Requirements: 20.1-20.10_
  
  - [ ] 18.2 Write unit tests for caching behavior
    - Test query cache invalidation after create
    - Test query cache invalidation after update
    - Test query cache invalidation after delete
    - Test debounced search input
    - _Requirements: 20.1-20.10_

- [ ] 19. Final integration and end-to-end testing
  - [ ] 19.1 Test complete workflows
    - Test creating quotation → sending → accepting → converting to sales order
    - Test creating sales order → confirming → creating invoice
    - Test editing quotations and sales orders in various statuses
    - Test filtering and searching across both modules
    - Test navigation between tabs preserves state
    - _Requirements: All requirements_
  
  - [ ] 19.2 Write integration tests for complete workflows
    - Test quotation to sales order to invoice workflow
    - Test navigation and state preservation
    - Test error recovery scenarios
    - _Requirements: All requirements_

- [ ] 20. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (12 properties total)
- Unit tests validate specific examples, edge cases, and UI behaviors
- The implementation follows established patterns in the existing codebase
- All components use TypeScript for type safety
- All API calls use TanStack Query for caching and state management
- All UI components use Shadcn UI for consistency
