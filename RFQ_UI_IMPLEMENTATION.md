# RFQ UI Implementation Summary

## Overview
Implemented complete RFQ (Request for Quotation) UI for the sourcing flow, following the same patterns as Material Requests.

## Files Created

### Types
- `apps/inventory/src/app/types/rfq.types.ts` - RFQ TypeScript interfaces and types

### API Integration
- Updated `apps/inventory/src/app/utility/api.ts` - Added rfqApi with all CRUD operations

### Hooks
- `apps/inventory/src/app/hooks/useRFQs.ts` - Hook for fetching and managing RFQ list
- `apps/inventory/src/app/hooks/useRFQActions.ts` - Hook for RFQ actions (send, close, delete)

### Components
- `apps/inventory/src/app/components/rfqs/RFQHeader.tsx` - Header with "New RFQ" button
- `apps/inventory/src/app/components/rfqs/RFQFilters.tsx` - Search and status filters
- `apps/inventory/src/app/components/rfqs/RFQTable.tsx` - Table displaying RFQs with actions
- `apps/inventory/src/app/components/rfqs/RFQDialog.tsx` - Create/Edit RFQ dialog
- `apps/inventory/src/app/components/rfqs/RFQDetailDialog.tsx` - View RFQ details dialog
- `apps/inventory/src/app/components/rfqs/RFQManagement.tsx` - Main management component
- `apps/inventory/src/app/components/rfqs/index.ts` - Export barrel file

### Pages
- Updated `apps/inventory/src/app/pages/SourcingPage.tsx` - Added RFQ tab

## Features Implemented

### RFQ List View
- Display RFQs in a table with:
  - RFQ ID (first 8 characters)
  - Status badge with color coding
  - Number of suppliers
  - Number of line items
  - Closing date
  - Actions dropdown

### Status Management
- **DRAFT** - Can edit, send, or delete
- **SENT** - Can close
- **PARTIALLY_RESPONDED** - Can close
- **FULLY_RESPONDED** - Can close
- **CLOSED** - Terminal state, no actions

### Actions
- **View** - Opens detail dialog showing full RFQ information
- **Edit** - Opens edit dialog (DRAFT only)
- **Send to Suppliers** - Sends RFQ to selected suppliers (DRAFT only)
- **Close** - Closes the RFQ (SENT/PARTIALLY_RESPONDED/FULLY_RESPONDED)
- **Delete** - Deletes the RFQ (DRAFT only)

### Filters
- Search by RFQ details
- Filter by status (All, Draft, Sent, Partially Responded, Fully Responded, Closed)
- Pagination support

### Create/Edit Dialog
- Material Request ID input
- Supplier IDs (comma-separated)
- Closing date picker
- Notes textarea
- Form validation

### Detail Dialog
- RFQ header information (ID, status, dates)
- Material Request reference
- Supplier count
- Line items table with:
  - Item ID
  - Quantity
  - Required date
  - Number of quotes received
  - Description

## API Endpoints Used

- `GET /api/v1/rfqs` - List RFQs with pagination
- `GET /api/v1/rfqs/:id` - Get RFQ details
- `POST /api/v1/rfqs` - Create new RFQ
- `PUT /api/v1/rfqs/:id` - Update RFQ (DRAFT only)
- `DELETE /api/v1/rfqs/:id` - Delete RFQ (DRAFT only)
- `POST /api/v1/rfqs/:id/send` - Send RFQ to suppliers
- `POST /api/v1/rfqs/:id/quotes` - Record supplier quote
- `POST /api/v1/rfqs/:id/close` - Close RFQ

## Backend Response Format

The API integration handles backend responses in the format:
```json
{
  "rfqs": [
    {
      "id": "uuid",
      "status": "draft",
      "material_request_id": "uuid",
      "supplier_ids": ["uuid1", "uuid2"],
      "closing_date": "2026-03-01",
      "created_at": "2026-02-15T...",
      "line_items_count": 3
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total_items": 25,
    "total_pages": 3
  }
}
```

The frontend transforms this to:
- Uppercase status values (DRAFT, SENT, etc.)
- Add `updated_at` fallback
- Add empty `line_items` array for list view
- Preserve `line_items_count` for display

## UI/UX Features

- Consistent styling with Material Requests
- Card-based layout
- Icon indicators for RFQs
- Color-coded status badges
- Responsive design
- Loading states with skeletons
- Error handling with toast notifications
- Empty state messages
- Pagination controls

## Next Steps

To complete the sourcing flow UI, you'll need to implement:
1. Purchase Order UI (Task 6)
2. Integration with existing Purchase Receipt UI
3. Integration with existing Invoice UI
4. Integration with existing Payment UI

## Testing

To test the RFQ UI:
1. Navigate to Sourcing tab
2. Click on "RFQs" sub-tab
3. Create a new RFQ with a Material Request ID
4. Add supplier IDs (comma-separated)
5. Set closing date
6. Send RFQ to suppliers
7. View RFQ details
8. Close or delete RFQs as needed

## Notes

- The RFQ Dialog currently requires manual entry of Material Request ID and Supplier IDs
- Future enhancement: Add dropdowns/selectors for Material Requests and Suppliers
- Future enhancement: Add quote recording UI within the detail dialog
- The implementation follows the same patterns as Material Requests for consistency
