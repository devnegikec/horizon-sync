# Requirements Document

## Introduction

The Material Request Module is a frontend feature within the Procure-to-Pay (P2P) workflow of the ERP system. It enables users to formally request materials by creating, managing, and submitting material requests that feed into the sourcing flow (RFQ → Purchase Order). The module supports three request types (purchase, transfer, issue), four priority levels, and tracks requests through a defined status lifecycle from draft to fulfilment or cancellation.

The module is built in React with TypeScript, uses shadcn/ui components, follows the existing feature-based folder structure, and integrates with the backend API at `http://localhost:8001/api/v1/material-requests` using Bearer token authentication via `useUserStore`.

## Glossary

- **Material_Request_Module**: The frontend feature described in this document
- **Material_Request**: A formal request for materials, identified by a unique `request_no` (e.g. MR-2025-0001)
- **Line_Item**: A single item entry within a Material Request, specifying item, quantity, UOM, required date, and cost estimate
- **Request_Type**: The category of a Material Request — one of `purchase`, `transfer`, or `issue`
- **Priority**: The urgency level of a Material Request — one of `low`, `medium`, `high`, or `urgent`
- **Status**: The lifecycle state of a Material Request — one of `draft`, `submitted`, `partially_quoted`, `fully_quoted`, or `cancelled`
- **Service_Layer**: The `materialRequestService` class that wraps all API calls
- **List_View**: The paginated, filterable table of Material Requests
- **Detail_View**: The read-only view of a single Material Request and its line items
- **Form**: The create/edit form for a Material Request and its line items
- **useUserStore**: The Zustand store that provides the Bearer token for API authentication

---

## Requirements

### Requirement 1: Material Request Service Layer

**User Story:** As a frontend developer, I want a typed service class that wraps all Material Request API endpoints, so that components and hooks never call axios directly.

#### Acceptance Criteria

1. THE Service_Layer SHALL expose methods for `create`, `list`, `getById`, `update`, `delete`, `submit`, and `cancel` operations against the API base URL `http://localhost:8001/api/v1/material-requests`.
2. THE Service_Layer SHALL retrieve the Bearer token from `useUserStore.getState().accessToken` and include it as `Authorization: Bearer {token}` on every request.
3. WHEN an API call is made, THE Service_Layer SHALL use axios with `Content-Type: application/json` headers.
4. THE Service_Layer SHALL be exported as a singleton instance named `materialRequestService`.

---

### Requirement 2: TypeScript Types

**User Story:** As a frontend developer, I want complete TypeScript type definitions for all Material Request data structures, so that the module is fully type-safe.

#### Acceptance Criteria

1. THE Material_Request_Module SHALL define `MaterialRequestType` as the union `"purchase" | "transfer" | "issue"`.
2. THE Material_Request_Module SHALL define `MaterialRequestPriority` as the union `"low" | "medium" | "high" | "urgent"`.
3. THE Material_Request_Module SHALL define `MaterialRequestStatus` as the union `"draft" | "submitted" | "partially_quoted" | "fully_quoted" | "cancelled"`.
4. THE Material_Request_Module SHALL define `MaterialRequestLine`, `MaterialRequestLineResponse`, `MaterialRequestCreate`, `MaterialRequestUpdate`, `MaterialRequest`, `MaterialRequestListItem`, and `MaterialRequestListResponse` interfaces matching the API contract.
5. THE Material_Request_Module SHALL export all types from a single `materialRequest.types.ts` file.

---

### Requirement 3: Create Material Request

**User Story:** As a procurement user, I want to create a new material request with header fields and line items, so that I can formally request materials for procurement processing.

#### Acceptance Criteria

1. WHEN a user submits the Form with valid data, THE Material_Request_Module SHALL call `POST /material-requests` with the `MaterialRequestCreate` payload and display the created request.
2. THE Form SHALL require at least one Line_Item before allowing submission.
3. THE Form SHALL allow the user to select `type` from `purchase`, `transfer`, and `issue`.
4. THE Form SHALL allow the user to select `priority` from `low`, `medium`, `high`, and `urgent`.
5. THE Form SHALL allow optional fields: `target_warehouse_id`, `requested_by`, `department`, and `notes`.
6. WHEN a Line_Item is added, THE Form SHALL require `item_id`, `quantity` (greater than 0), and `required_date`.
7. WHEN a Line_Item is added, THE Form SHALL allow optional fields: `uom`, `estimated_unit_cost`, `description`, `requested_for`, and `requested_for_department`.
8. IF the API returns an error, THEN THE Form SHALL display the error message from `err.response?.data?.detail` inline without navigating away.

---

### Requirement 4: List Material Requests

**User Story:** As a procurement user, I want to view a paginated list of material requests with filtering options, so that I can find and manage requests efficiently.

#### Acceptance Criteria

1. THE List_View SHALL fetch material requests from `GET /material-requests` and display them in a table with columns for `request_no`, `type`, `priority`, `status`, `department`, `line_items_count`, and `created_at`.
2. THE List_View SHALL support filtering by `status`, `type`, and `priority` via query parameters passed to the API.
3. THE List_View SHALL implement pagination using the `pagination` object returned by the API, with a default `page_size` of 20.
4. WHEN the filter values change, THE List_View SHALL re-fetch the list from the first page.
5. WHILE data is loading, THE List_View SHALL display a loading indicator.
6. IF the API returns an error, THEN THE List_View SHALL display the error message from `err.response?.data?.detail`.

---

### Requirement 5: View Material Request Detail

**User Story:** As a procurement user, I want to view the full details of a material request including all line items, so that I can review what was requested.

#### Acceptance Criteria

1. WHEN a user navigates to a material request, THE Detail_View SHALL fetch the request from `GET /material-requests/{id}` and display all header fields and line items.
2. THE Detail_View SHALL display the `status` using a `StatusBadge` component with colours: `draft` → gray, `submitted` → blue, `partially_quoted` → yellow, `fully_quoted` → green, `cancelled` → red.
3. THE Detail_View SHALL display the `priority` using a `PriorityBadge` component.
4. THE Detail_View SHALL display all Line_Item fields: `item_id`, `quantity`, `uom`, `required_date`, `estimated_unit_cost`, `description`, `requested_for`, and `requested_for_department`.
5. WHILE data is loading, THE Detail_View SHALL display a loading indicator.
6. IF the API returns a 404, THEN THE Detail_View SHALL display a not-found message.

---

### Requirement 6: Update Draft Material Request

**User Story:** As a procurement user, I want to edit a material request that is still in draft status, so that I can correct or add information before submitting.

#### Acceptance Criteria

1. WHEN a user saves edits on a draft request, THE Material_Request_Module SHALL call `PATCH /material-requests/{id}` with the `MaterialRequestUpdate` payload.
2. THE Form SHALL only be editable WHILE the Material_Request has `status` equal to `draft`.
3. WHEN the request is not in `draft` status, THE Material_Request_Module SHALL display the request in read-only mode and not render the edit form.
4. IF the API returns a 409, THEN THE Form SHALL display the error message from `err.response?.data?.detail`.

---

### Requirement 7: Delete Draft Material Request

**User Story:** As a procurement user, I want to delete a material request that is still in draft status, so that I can remove requests that are no longer needed.

#### Acceptance Criteria

1. WHEN a user confirms deletion of a draft request, THE Material_Request_Module SHALL call `DELETE /material-requests/{id}`.
2. THE Material_Request_Module SHALL only render the delete action WHILE the Material_Request has `status` equal to `draft`.
3. WHEN the delete action is triggered, THE Material_Request_Module SHALL display a confirmation dialog before calling the API.
4. WHEN deletion succeeds, THE Material_Request_Module SHALL navigate the user back to the List_View.
5. IF the API returns an error, THEN THE Material_Request_Module SHALL display the error message from `err.response?.data?.detail`.

---

### Requirement 8: Submit Material Request

**User Story:** As a procurement user, I want to submit a draft material request for procurement processing, so that the sourcing team can act on it.

#### Acceptance Criteria

1. WHEN a user confirms submission of a draft request, THE Material_Request_Module SHALL call `POST /material-requests/{id}/submit`.
2. THE Material_Request_Module SHALL only render the submit action WHILE the Material_Request has `status` equal to `draft`.
3. WHEN submission succeeds, THE Material_Request_Module SHALL update the displayed status to `submitted`.
4. IF the API returns a 409, THEN THE Material_Request_Module SHALL display the error message from `err.response?.data?.detail` inline.

---

### Requirement 9: Cancel Material Request

**User Story:** As a procurement user, I want to cancel a material request that is no longer needed, so that the sourcing team does not process it.

#### Acceptance Criteria

1. WHEN a user confirms cancellation, THE Material_Request_Module SHALL call `POST /material-requests/{id}/cancel`.
2. THE Material_Request_Module SHALL render the cancel action WHILE the Material_Request has `status` in `draft` or `submitted`.
3. WHEN the cancel action is triggered, THE Material_Request_Module SHALL display a confirmation dialog before calling the API.
4. WHEN cancellation succeeds, THE Material_Request_Module SHALL update the displayed status to `cancelled`.
5. IF the API returns a 409, THEN THE Material_Request_Module SHALL display the error message from `err.response?.data?.detail` inline.

---

### Requirement 10: Data Fetching Hooks

**User Story:** As a frontend developer, I want React hooks that encapsulate all data fetching and mutation logic, so that components remain free of direct API calls.

#### Acceptance Criteria

1. THE Material_Request_Module SHALL provide `useMaterialRequests` for fetching the paginated list, `useMaterialRequest` for fetching a single request, `useCreateMaterialRequest`, `useUpdateMaterialRequest`, `useSubmitMaterialRequest`, and `useCancelMaterialRequest` hooks.
2. WHEN a hook initiates an API call, THE hook SHALL set a `loading` state to `true` and reset it to `false` when the call completes.
3. IF an API call fails, THEN THE hook SHALL set an `error` state to the value of `err.response?.data?.detail` or a fallback string.
4. THE `useMaterialRequests` hook SHALL accept filter parameters and re-fetch WHEN those parameters change.
5. THE `useMaterialRequests` hook SHALL expose a `refetch` function that accepts a `page` number.

---

### Requirement 11: Status and Priority Display

**User Story:** As a procurement user, I want consistent visual indicators for request status and priority across all views, so that I can quickly assess the state of requests at a glance.

#### Acceptance Criteria

1. THE `StatusBadge` component SHALL render with background color gray for `draft`, blue for `submitted`, yellow for `partially_quoted`, green for `fully_quoted`, and red for `cancelled`.
2. THE `PriorityBadge` component SHALL visually distinguish between `low`, `medium`, `high`, and `urgent` priority levels.
3. THE Material_Request_Module SHALL use `StatusBadge` and `PriorityBadge` consistently in both the List_View and Detail_View.

---

### Requirement 12: Error Handling

**User Story:** As a procurement user, I want clear error messages when something goes wrong, so that I understand what happened and can take corrective action.

#### Acceptance Criteria

1. IF the API returns a `401`, THEN THE Material_Request_Module SHALL redirect the user to the login page.
2. IF the API returns a `403`, THEN THE Material_Request_Module SHALL display a permission-denied message without redirecting.
3. IF the API returns a `404`, THEN THE Material_Request_Module SHALL display a not-found message in the relevant view.
4. IF the API returns a `409`, THEN THE Material_Request_Module SHALL display the conflict error inline in the relevant component.
5. IF the API returns a `422`, THEN THE Material_Request_Module SHALL display field-level validation errors where available.
