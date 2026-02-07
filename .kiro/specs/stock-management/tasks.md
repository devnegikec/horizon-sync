# Implementation Plan: Stock Management

## Overview

This implementation plan breaks down the Stock Management feature into incremental, testable steps. The approach follows the existing warehouse management pattern, building each tab's functionality progressively while ensuring proper integration with the existing codebase. The implementation prioritizes core display functionality first, with comprehensive testing integrated throughout.

## Tasks

- [x] 1. Set up project structure and shared types
  - Create directory structure: `apps/inventory/src/app/components/stock-management/`
  - Define TypeScript interfaces for all data models (StockLevel, StockMovement, StockEntry, StockReconciliation)
  - Define filter interfaces and pagination types
  - Create shared utility functions for formatting (currency, dates, numbers)
  - Set up API client functions in `apps/inventory/src/app/utility/api.ts`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.5_

- [x] 1.1 Write property test for API endpoint correctness
  - **Property 4: API endpoint correctness**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 1.2 Write property test for API response parsing
  - **Property 5: API response parsing**
  - **Validates: Requirements 5.7**

- [x] 1.3 Write property test for currency formatting
  - **Property 10: Currency formatting consistency**
  - **Validates: Requirements 7.5**

- [x] 1.4 Write property test for date/time formatting
  - **Property 11: Date and time formatting consistency**
  - **Validates: Requirements 7.6**
    git
- [x] 1.5 Write property test for number formatting in stats
  - **Property 13: Number formatting in stats**
  - **Validates: Requirements 9.6**

- [x] 2. Implement Stock Levels custom hook
  - Create `useStockLevels.ts` hook with pagination, filtering, and search support
  - Implement API call to GET /api/v1/stock-levels with query parameters
  - Handle loading, error, and success states
  - Parse response data and pagination metadata
  - Calculate stats (total items, total warehouses, low stock, out of stock)
  - Implement refetch function
  - _Requirements: 1.2, 1.4, 1.5, 1.6, 1.7, 5.1, 5.5, 5.6, 5.7_

- [x] 2.1 Write property test for pagination consistency
  - **Property 1: Server-side pagination consistency**
  - **Validates: Requirements 1.2, 1.7**

- [x] 2.2 Write property test for filter application
  - **Property 2: Filter application correctness**
  - **Validates: Requirements 1.4, 8.1, 8.7**

- [x] 2.3 Write property test for search result relevance
  - **Property 3: Search result relevance**
  - **Validates: Requirements 1.5**

- [x] 2.4 Write property test for stats calculation accuracy
  - **Property 12: Stats calculation accuracy**
  - **Validates: Requirements 9.1, 9.5**

- [x] 2.5 Write property test for loading state visibility
  - **Property 6: Loading state visibility**
  - **Validates: Requirements 5.6, 9.7**

- [x] 2.6 Write property test for error handling
  - **Property 7: Error handling and display**
  - **Validates: Requirements 5.5, 10.1, 10.2, 10.3, 10.4, 10.7**

- [x] 3. Implement StockLevelsTable component
  - Create `StockLevelsTable.tsx` component
  - Define column configuration with proper formatting
  - Integrate with useStockLevels hook
  - Render DataTable component with data
  - Implement empty state with visible headers
  - Display loading and error states
  - Handle pagination events
  - Render filter controls (item dropdown, warehouse dropdown, search input)
  - Render stats cards at the top
  - _Requirements: 1.1, 1.3, 1.6, 6.1, 6.4, 6.7, 7.1, 7.3, 7.7_

- [x] 3.1 Write unit tests for StockLevelsTable component
  - Test component renders with data
  - Test empty state displays with headers
  - Test loading state displays
  - Test error state displays
  - Test filter controls update state
  - Test pagination controls work

- [x] 3.2 Write property test for empty state header preservation
  - **Property 8: Empty state header preservation**
  - **Validates: Requirements 6.7**

- [ ] 4. Implement Stock Movements custom hook
  - Create `useStockMovements.ts` hook with pagination, filtering, and search support
  - Implement API call to GET /api/v1/stock-movements with query parameters
  - Handle loading, error, and success states
  - Parse response data and pagination metadata
  - Calculate stats (total movements, stock in, stock out, adjustments)
  - Implement refetch function
  - _Requirements: 2.2, 2.4, 2.5, 2.6, 2.7, 5.2, 5.5, 5.6, 5.7_

- [ ] 4.1 Write property tests for useStockMovements hook
  - Reuse pagination, filtering, search, stats, loading, and error property tests
  - **Validates: Requirements 2.2, 2.4, 2.5, 2.7, 9.2**

- [ ] 5. Implement StockMovementsTable component
  - Create `StockMovementsTable.tsx` component
  - Define column configuration with proper formatting (badges for movement type)
  - Integrate with useStockMovements hook
  - Render DataTable component with data
  - Implement empty state with visible headers
  - Display loading and error states
  - Handle pagination events
  - Render filter controls (item, warehouse, movement type, reference type dropdowns, search)
  - Render stats cards at the top
  - _Requirements: 2.1, 2.3, 2.6, 6.1, 6.4, 6.7, 7.3, 7.7_

- [ ] 5.1 Write unit tests for StockMovementsTable component
  - Test component renders with data
  - Test empty state displays with headers
  - Test movement type badges display correctly
  - Test filter controls work

- [ ] 6. Checkpoint - Ensure Stock Levels and Stock Movements tabs work
  - Verify both tabs display data correctly
  - Verify pagination works on both tabs
  - Verify filters work on both tabs
  - Verify stats cards display correctly
  - Ensure all tests pass, ask the user if questions arise

- [ ] 7. Implement Stock Entries custom hook
  - Create `useStockEntries.ts` hook with pagination, filtering, and search support
  - Implement API call to GET /api/v1/stock-entries with query parameters
  - Handle loading, error, and success states
  - Parse response data and pagination metadata
  - Calculate stats (total entries, draft count, submitted count, total value)
  - Implement refetch function
  - _Requirements: 3.2, 3.4, 3.5, 3.6, 3.7, 5.3, 5.5, 5.6, 5.7_

- [ ] 7.1 Write property tests for useStockEntries hook
  - Reuse pagination, filtering, search, stats, loading, and error property tests
  - **Validates: Requirements 3.2, 3.4, 3.5, 3.7, 9.3**

- [ ] 8. Implement StockEntriesTable component
  - Create `StockEntriesTable.tsx` component
  - Define column configuration with proper formatting (badges for type and status)
  - Integrate with useStockEntries hook
  - Render DataTable component with data
  - Implement empty state with visible headers
  - Display loading and error states
  - Handle pagination events
  - Render filter controls (entry type, status, warehouse dropdowns, search by entry number)
  - Render stats cards at the top
  - Implement action buttons (View, Edit, Delete) with conditional rendering based on status
  - Add "Create New Entry" button
  - _Requirements: 3.1, 3.3, 3.6, 3.8, 3.9, 3.10, 6.1, 6.4, 6.7, 7.3, 7.7_

- [ ] 8.1 Write unit tests for StockEntriesTable component
  - Test component renders with data
  - Test action buttons display correctly based on status
  - Test create button is present
  - Test filter controls work

- [ ] 8.2 Write property test for status-based action button rendering
  - **Property 9: Status-based action button rendering**
  - **Validates: Requirements 3.8, 3.9**

- [ ] 9. Implement Stock Reconciliations custom hook
  - Create `useStockReconciliations.ts` hook with pagination, filtering, and search support
  - Implement API call to GET /api/v1/stock-reconciliations with query parameters
  - Handle loading, error, and success states
  - Parse response data and pagination metadata
  - Calculate stats (total reconciliations, pending count, completed count, total adjustments)
  - Implement refetch function
  - _Requirements: 4.2, 4.4, 4.5, 4.6, 4.7, 5.4, 5.5, 5.6, 5.7_

- [ ] 9.1 Write property tests for useStockReconciliations hook
  - Reuse pagination, filtering, search, stats, loading, and error property tests
  - **Validates: Requirements 4.2, 4.4, 4.5, 4.7, 9.4**

- [ ] 10. Implement StockReconciliationsTable component
  - Create `StockReconciliationsTable.tsx` component
  - Define column configuration with proper formatting (badges for status)
  - Integrate with useStockReconciliations hook
  - Render DataTable component with data
  - Implement empty state with visible headers
  - Display loading and error states
  - Handle pagination events
  - Render filter controls (status dropdown, search by reconciliation number)
  - Render stats cards at the top
  - Implement action buttons (View, Edit, Delete) with conditional rendering based on status
  - Add "Create New Reconciliation" button
  - _Requirements: 4.1, 4.3, 4.6, 4.8, 4.9, 4.10, 6.1, 6.4, 6.7, 7.3, 7.7_

- [ ] 10.1 Write unit tests for StockReconciliationsTable component
  - Test component renders with data
  - Test action buttons display correctly based on status
  - Test create button is present
  - Test filter controls work

- [ ] 10.2 Write property test for status-based action button rendering
  - **Property 9: Status-based action button rendering**
  - **Validates: Requirements 4.8, 4.9**

- [ ] 11. Implement main StockManagement component
  - Create `StockManagement.tsx` main container component
  - Implement tab navigation (Stock Levels, Stock Movements, Stock Entries, Stock Reconciliations)
  - Manage active tab state
  - Conditionally render active tab content
  - Implement filter state management for each tab
  - Ensure filter state persists within tab during pagination
  - Ensure filter state resets when switching tabs
  - _Requirements: 6.1, 8.4, 8.5_

- [ ] 11.1 Write unit tests for StockManagement component
  - Test all tabs render correctly
  - Test tab switching works
  - Test active tab state management

- [ ] 11.2 Write property test for filter state persistence within tab
  - **Property 15: Filter state persistence within tab**
  - **Validates: Requirements 8.4**

- [ ] 11.3 Write property test for filter state reset between tabs
  - **Property 16: Filter state reset between tabs**
  - **Validates: Requirements 8.5**

- [ ] 12. Implement search debouncing
  - Add debounce utility function or use existing library
  - Integrate debouncing into search inputs across all table components
  - Ensure search triggers API calls only after input stabilizes
  - _Requirements: 8.3_

- [ ] 12.1 Write property test for search debouncing
  - **Property 14: Search debouncing**
  - **Validates: Requirements 8.3**

- [ ] 13. Implement filter UI enhancements
  - Add active filter indicators showing which filters are applied
  - Add clear filters button for each tab
  - Ensure filter clearing resets to default state and fetches all data
  - _Requirements: 8.2, 8.6_

- [ ] 13.1 Write property test for active filter indicators
  - **Property 17: Active filter indicators**
  - **Validates: Requirements 8.6**

- [ ] 13.2 Write property test for filter clearing behavior
  - **Property 18: Filter clearing behavior**
  - **Validates: Requirements 8.2**

- [ ] 14. Implement error retry functionality
  - Add retry button to error states
  - Ensure retry clears error state before making new request
  - Implement request deduplication to prevent multiple simultaneous requests
  - _Requirements: 10.5, 10.6_

- [ ] 14.1 Write property test for error retry state management
  - **Property 19: Error retry state management**
  - **Validates: Requirements 10.5**

- [ ] 14.2 Write property test for request deduplication
  - **Property 20: Request deduplication**
  - **Validates: Requirements 10.6**

- [ ] 15. Add routing and navigation
  - Add route for Stock Management feature in app routing
  - Ensure navigation to /stock-management loads the component
  - Add navigation link in main menu or sidebar
  - _Requirements: 6.1_

- [ ] 16. Final integration and polish
  - Verify responsive design works on mobile and tablet
  - Ensure all tooltips and help text are present for ERP concepts
  - Verify all empty state messages are clear and helpful
  - Test all tabs with real API data
  - Verify error handling works for all error types
  - Ensure loading states are smooth and non-jarring
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.7_

- [ ] 16.1 Write integration tests
  - Test full user flow: navigate to page, switch tabs, apply filters, paginate
  - Test error recovery flow: trigger error, retry, verify success
  - Test filter persistence: apply filters, paginate, verify filters still active

- [ ] 17. Final checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property tests and verify they pass
  - Run integration tests and verify they pass
  - Verify test coverage meets goals (80% line coverage, 75% branch coverage)
  - Ensure all tests pass, ask the user if questions arise

## Notes

- All tasks including tests are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation follows the existing warehouse management pattern for consistency
- All four tabs follow the same architectural pattern for maintainability
- Server-side pagination is used throughout to handle large datasets efficiently
