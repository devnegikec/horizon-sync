# Requirements Document: Stock Management

## Introduction

The Stock Management feature provides comprehensive inventory tracking and control across four main areas: viewing current stock levels, tracking stock movements, managing stock entries, and performing stock reconciliations. This feature enables users to monitor inventory positions, trace all stock transactions, create formal stock documents, and reconcile physical counts with system records.

The system is built for an inventory ERP using React and TypeScript, integrating with existing REST APIs for stock operations. It follows established patterns from the warehouse management screen, using server-side pagination, data tables, and filter capabilities.

## Glossary

- **Stock_Level**: The current inventory position for a specific product in a specific warehouse, including quantities on hand, reserved, and available
- **Stock_Movement**: An audit trail record of any inventory change, capturing the type, quantity, and reference information
- **Stock_Entry**: A formal document recording stock transactions such as receipts, issues, or transfers, containing header information and line items
- **Stock_Reconciliation**: A document recording physical inventory counts and adjustments to align system quantities with actual counts
- **Quantity_On_Hand**: The total physical quantity of an item present in a warehouse
- **Quantity_Reserved**: Stock allocated to orders or other commitments but not yet consumed
- **Quantity_Available**: Stock available for new allocations, calculated as on_hand minus reserved
- **Movement_Type**: Classification of stock movement as "in" (receiving), "out" (consumption), "transfer" (between locations), or "adjustment" (corrections)
- **Stock_Entry_Type**: Classification of stock entry documents such as material receipt, material issue, or material transfer
- **Entry_Status**: Workflow state of a stock entry or reconciliation: draft, submitted, or cancelled
- **DataTable_Component**: Reusable UI component for displaying tabular data with pagination, sorting, and filtering
- **Server_Side_Pagination**: Pagination where data fetching and page calculation occur on the server rather than client

## Requirements

### Requirement 1: Stock Levels Display

**User Story:** As an inventory manager, I want to view current stock levels across all items and warehouses, so that I can monitor inventory positions and identify stock issues.

#### Acceptance Criteria

1. WHEN the Stock Levels tab is accessed, THE System SHALL display a table with columns for item name/code, warehouse, quantity on hand, quantity reserved, quantity available, last counted date, and updated date
2. WHEN stock level data is available, THE System SHALL fetch and display records using server-side pagination
3. WHEN no stock level data exists, THE System SHALL display an empty state while maintaining visible table headers
4. WHEN a user applies item or warehouse filters, THE System SHALL fetch and display only stock levels matching the selected criteria
5. WHEN a user enters search text, THE System SHALL filter stock levels based on the search term
6. THE System SHALL display stats cards showing total items tracked, total warehouses, low stock items count, and out of stock items count
7. WHEN pagination controls are used, THE System SHALL fetch the appropriate page of stock level data from the server

### Requirement 2: Stock Movements Display

**User Story:** As an inventory manager, I want to view all stock movements, so that I can trace inventory changes and audit stock transactions.

#### Acceptance Criteria

1. WHEN the Stock Movements tab is accessed, THE System SHALL display a table with columns for date/time, item, warehouse, movement type, quantity, unit cost, reference, performed by, and notes
2. WHEN stock movement data is available, THE System SHALL fetch and display records using server-side pagination
3. WHEN no stock movement data exists, THE System SHALL display an empty state while maintaining visible table headers
4. WHEN a user applies filters for item, warehouse, movement type, or reference type, THE System SHALL fetch and display only movements matching the selected criteria
5. WHEN a user enters search text, THE System SHALL filter stock movements based on the search term
6. THE System SHALL display stats cards showing total movements, stock in count, stock out count, and adjustments count
7. WHEN pagination controls are used, THE System SHALL fetch the appropriate page of stock movement data from the server

### Requirement 3: Stock Entries Display and Management

**User Story:** As an inventory manager, I want to view and manage stock entries, so that I can track formal stock transactions like receipts, issues, and transfers.

#### Acceptance Criteria

1. WHEN the Stock Entries tab is accessed, THE System SHALL display a table with columns for entry number, type, date, from warehouse, to warehouse, status, total value, and remarks
2. WHEN stock entry data is available, THE System SHALL fetch and display records using server-side pagination
3. WHEN no stock entry data exists, THE System SHALL display an empty state while maintaining visible table headers
4. WHEN a user applies filters for entry type, status, or warehouse, THE System SHALL fetch and display only entries matching the selected criteria
5. WHEN a user enters search text for entry number, THE System SHALL filter stock entries based on the search term
6. THE System SHALL display stats cards showing total entries, draft count, submitted count, and total value
7. WHEN pagination controls are used, THE System SHALL fetch the appropriate page of stock entry data from the server
8. WHEN a user views a stock entry with status "draft", THE System SHALL display edit and delete action buttons
9. WHEN a user views a stock entry with status "submitted" or "cancelled", THE System SHALL display only a view details action button
10. THE System SHALL provide a create new entry button for initiating stock entry creation

### Requirement 4: Stock Reconciliations Display and Management

**User Story:** As an inventory manager, I want to view and manage stock reconciliations, so that I can perform physical counts and adjust system quantities to match actual inventory.

#### Acceptance Criteria

1. WHEN the Stock Reconciliations tab is accessed, THE System SHALL display a table with columns for reconciliation number, date, purpose, status, items count, total difference, and remarks
2. WHEN stock reconciliation data is available, THE System SHALL fetch and display records using server-side pagination
3. WHEN no stock reconciliation data exists, THE System SHALL display an empty state while maintaining visible table headers
4. WHEN a user applies status filters, THE System SHALL fetch and display only reconciliations matching the selected status
5. WHEN a user enters search text for reconciliation number, THE System SHALL filter reconciliations based on the search term
6. THE System SHALL display stats cards showing total reconciliations, pending count, completed count, and total adjustments value
7. WHEN pagination controls are used, THE System SHALL fetch the appropriate page of reconciliation data from the server
8. WHEN a user views a reconciliation with status "draft", THE System SHALL display edit and delete action buttons
9. WHEN a user views a reconciliation with status "submitted", THE System SHALL display only a view details action button
10. THE System SHALL provide a create new reconciliation button for initiating reconciliation creation

### Requirement 5: API Integration

**User Story:** As a developer, I want to integrate with existing REST APIs, so that the stock management feature can fetch and display data from the backend.

#### Acceptance Criteria

1. WHEN fetching stock levels, THE System SHALL call GET /api/v1/stock-levels with pagination and filter parameters
2. WHEN fetching stock movements, THE System SHALL call GET /api/v1/stock-movements with pagination and filter parameters
3. WHEN fetching stock entries, THE System SHALL call GET /api/v1/stock-entries with pagination and filter parameters
4. WHEN fetching stock reconciliations, THE System SHALL call GET /api/v1/stock-reconciliations with pagination and filter parameters
5. WHEN API requests fail, THE System SHALL display appropriate error messages to the user
6. WHEN API requests are in progress, THE System SHALL display loading states
7. THE System SHALL parse API responses according to the documented field structures for each endpoint

### Requirement 6: Component Architecture

**User Story:** As a developer, I want to follow established component patterns, so that the stock management feature is consistent with existing codebase architecture.

#### Acceptance Criteria

1. THE System SHALL implement a main StockManagement component containing tab navigation, filters, and stats cards
2. THE System SHALL implement separate table components for each tab: StockLevelsTable, StockMovementsTable, StockEntriesTable, and StockReconciliationsTable
3. THE System SHALL implement custom hooks for API calls: useStockLevels, useStockMovements, useStockEntries, and useStockReconciliations
4. THE System SHALL use the existing DataTable component from @horizon-sync/ui/components
5. THE System SHALL implement TypeScript interfaces for all data structures matching API field definitions
6. THE System SHALL use Tailwind CSS for styling following existing patterns
7. WHEN rendering empty states, THE System SHALL maintain visible table headers

### Requirement 7: User Experience

**User Story:** As a user new to ERP systems, I want clear explanations and intuitive interfaces, so that I can understand and use the stock management features effectively.

#### Acceptance Criteria

1. THE System SHALL provide tooltips or help text explaining ERP concepts like quantity reserved, movement types, and reconciliation purpose
2. THE System SHALL use clear, descriptive labels for all fields and actions
3. THE System SHALL provide visual feedback for loading, success, and error states
4. THE System SHALL maintain responsive design across different screen sizes
5. WHEN displaying monetary values, THE System SHALL format them with appropriate currency symbols and decimal places
6. WHEN displaying dates and times, THE System SHALL format them in a user-friendly, localized format
7. THE System SHALL provide clear empty state messages explaining what each tab displays when no data exists

### Requirement 8: Data Filtering and Search

**User Story:** As an inventory manager, I want to filter and search stock data, so that I can quickly find specific items, warehouses, or transactions.

#### Acceptance Criteria

1. WHEN a user selects filter criteria, THE System SHALL apply filters before fetching data from the server
2. WHEN a user clears filters, THE System SHALL reset to displaying all records
3. WHEN a user types in search fields, THE System SHALL debounce input and trigger search after a brief delay
4. THE System SHALL maintain filter and search state when switching between pages within the same tab
5. WHEN switching between tabs, THE System SHALL reset filters to default values for the new tab
6. THE System SHALL display active filter indicators showing which filters are currently applied
7. WHEN multiple filters are applied, THE System SHALL combine them using AND logic

### Requirement 9: Statistics and Metrics

**User Story:** As an inventory manager, I want to see key metrics at a glance, so that I can quickly assess inventory status without analyzing detailed data.

#### Acceptance Criteria

1. WHEN the Stock Levels tab loads, THE System SHALL calculate and display total items tracked, total warehouses, low stock items, and out of stock items
2. WHEN the Stock Movements tab loads, THE System SHALL calculate and display total movements, stock in count, stock out count, and adjustments count
3. WHEN the Stock Entries tab loads, THE System SHALL calculate and display total entries, draft count, submitted count, and total value
4. WHEN the Stock Reconciliations tab loads, THE System SHALL calculate and display total reconciliations, pending count, completed count, and total adjustments
5. WHEN filters are applied, THE System SHALL update stats cards to reflect only filtered data
6. THE System SHALL format large numbers in stats cards with appropriate separators for readability
7. WHEN stats data is loading, THE System SHALL display loading indicators in stats cards

### Requirement 10: Error Handling and Resilience

**User Story:** As a user, I want the system to handle errors gracefully, so that I can understand what went wrong and how to proceed.

#### Acceptance Criteria

1. WHEN an API request fails with a network error, THE System SHALL display a user-friendly error message with retry option
2. WHEN an API request fails with a 4xx error, THE System SHALL display the error message from the API response
3. WHEN an API request fails with a 5xx error, THE System SHALL display a generic server error message
4. WHEN data parsing fails, THE System SHALL log the error and display a data format error message
5. WHEN a user retries after an error, THE System SHALL clear the previous error state before making a new request
6. THE System SHALL prevent multiple simultaneous requests for the same data
7. WHEN an error occurs, THE System SHALL maintain the last successfully loaded data if available
