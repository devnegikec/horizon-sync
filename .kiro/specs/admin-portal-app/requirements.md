# Requirements Document

## Introduction

The Admin Portal App is a standalone Nx application (`apps/admin`) dedicated to system administration of the Horizon Sync ERP platform. The Admin_Portal provides system administrators with a separate frontend to manage organizations, users, and view platform-wide metrics. The Admin_Portal reuses the existing shared UI library (`@horizon-sync/ui`), shared store (`@horizon-sync/store`), and follows the same layout patterns as the existing Platform app, but enforces admin-specific authentication and authorization. The Admin_Portal is NOT a Module Federation remote — it is a fully independent application served on its own port.

## Glossary

- **Admin_Portal**: The standalone Nx React application at `apps/admin` serving the system administration interface on port 4300.
- **Platform_App**: The existing host application at `apps/platform` serving the main ERP interface on port 4200.
- **System_Admin**: A user whose `user_type` field equals `"system_admin"`, granting access to all admin endpoints.
- **Identity_Service**: The backend service at `http://localhost:8000` responsible for authentication and admin profile retrieval.
- **Core_Service**: The backend service at `http://localhost:8001` responsible for admin data endpoints (dashboard, organizations, users).
- **Admin_Guard**: A React route-protection component that verifies the authenticated user is a System_Admin before rendering child routes.
- **Admin_Profile**: The user profile object returned by `GET /api/v1/identity/admin/me` containing `id`, `email`, `first_name`, `last_name`, `display_name`, `user_type`, `organization_id`, and `permissions`.
- **Dashboard_Overview**: The aggregated metrics object returned by `GET /api/v1/admin/dashboard/overview` containing organization counts, user counts, revenue totals, and recent activity.
- **Organization**: A tenant entity managed via CRUD endpoints at `/api/v1/admin/organizations`.
- **Admin_User**: A user entity managed via CRUD endpoints at `/api/v1/admin/users`.
- **Shared_UI**: The `@horizon-sync/ui` library providing Radix UI + Tailwind CSS components (Button, Card, Table, Dialog, etc.).
- **Shared_Store**: The `@horizon-sync/store` library providing Zustand stores for auth state management.
- **DashboardLayout**: A layout component with a collapsible sidebar, topbar, and main content area matching the Platform_App visual pattern.

## Requirements

### Requirement 1: Nx Application Scaffolding

**User Story:** As a developer, I want the Admin_Portal to be a standalone Nx application at `apps/admin`, so that it can be developed, built, and served independently from the Platform_App.

#### Acceptance Criteria

1. THE Admin_Portal SHALL be configured as an Nx application project at the path `apps/admin` with a `project.json` defining build, serve, lint, and test targets.
2. THE Admin_Portal SHALL use Webpack with Babel as the bundler and compiler, matching the Platform_App build configuration.
3. THE Admin_Portal SHALL serve on port 4300 in development mode.
4. THE Admin_Portal SHALL load environment variables `NX_API_BASE_URL` and `NX_API_CORE_URL` from the workspace root `.env` file via `dotenv` and inject them using Webpack DefinePlugin.
5. THE Admin_Portal SHALL provide an `environment.ts` file that resolves `apiBaseUrl` to `NX_API_BASE_URL` (default `http://localhost:8000`) and `apiCoreUrl` to `NX_API_CORE_URL` (default `http://localhost:8001`).
6. THE Admin_Portal SHALL import global styles from `@horizon-sync/ui/styles/globals.css`.
7. THE Admin_Portal SHALL NOT be registered as a Module Federation remote in the Platform_App configuration.

### Requirement 2: Admin Authentication and Authorization

**User Story:** As a system administrator, I want the Admin_Portal to verify my admin status on load, so that only System_Admin users can access the portal.

#### Acceptance Criteria

1. WHEN the Admin_Portal loads, THE Admin_Portal SHALL fetch the Admin_Profile from `GET /api/v1/identity/admin/me` on the Identity_Service using the Bearer token from the Shared_Store.
2. WHEN the Identity_Service returns a 200 response with `user_type` equal to `"system_admin"`, THE Admin_Portal SHALL store the Admin_Profile in application state and render the authenticated layout.
3. WHEN the Identity_Service returns a 401 response, THE Admin_Portal SHALL clear the stored token from the Shared_Store and redirect the user to the login page.
4. WHEN the Identity_Service returns a 403 response, THE Admin_Portal SHALL display an "Admin access required" message and redirect the user to the login page within 3 seconds.
5. WHILE the Admin_Profile fetch is in progress, THE Admin_Portal SHALL display a loading indicator.
6. THE Admin_Guard SHALL wrap all authenticated routes and prevent rendering of child components until the Admin_Profile fetch completes and confirms System_Admin status.

### Requirement 3: Login Page

**User Story:** As a system administrator, I want a login page in the Admin_Portal, so that I can authenticate with my credentials before accessing admin features.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide a login page at the `/login` route.
2. WHEN a user submits valid credentials, THE Admin_Portal SHALL store the access token and refresh token in the Shared_Store and redirect to the dashboard page.
3. WHEN a user submits invalid credentials, THE Admin_Portal SHALL display the error message returned by the Identity_Service.
4. WHILE a login request is in progress, THE Admin_Portal SHALL disable the submit button and display a loading indicator.
5. WHEN an already-authenticated System_Admin navigates to `/login`, THE Admin_Portal SHALL redirect the user to the dashboard page.
6. THE login page SHALL display the "Horizon Sync Admin" branding with the violet/fuchsia gradient logo matching the Platform_App visual style.

### Requirement 4: Admin Dashboard Layout

**User Story:** As a system administrator, I want the Admin_Portal to have a sidebar and topbar layout matching the Platform_App, so that the admin experience is visually consistent with the rest of the ERP system.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide a DashboardLayout component with a collapsible sidebar and a topbar.
2. THE sidebar SHALL display the "Horizon Sync Admin" branding with the violet/fuchsia gradient logo in the header section.
3. THE sidebar SHALL contain main navigation items: Dashboard, Organizations, and Users, each with an appropriate Lucide icon.
4. THE sidebar SHALL contain bottom navigation items: Settings and Help.
5. THE sidebar SHALL highlight the active navigation item using the violet/fuchsia gradient background matching the Platform_App sidebar style.
6. THE topbar SHALL display the authenticated admin's display name (falling back to `first_name` + `last_name` when `display_name` is null) and a logout action.
7. WHEN the viewport width is less than 768 pixels, THE sidebar SHALL collapse into a mobile drawer that opens and closes via a toggle button in the topbar.
8. THE DashboardLayout SHALL use the ThemeProvider and TooltipProvider from Shared_UI.

### Requirement 5: Dashboard Page

**User Story:** As a system administrator, I want a dashboard page showing platform-wide metrics, so that I can monitor organization, user, and revenue health at a glance.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide a dashboard page at the `/` route (default authenticated route).
2. WHEN the dashboard page loads, THE Admin_Portal SHALL fetch the Dashboard_Overview from `GET /api/v1/admin/dashboard/overview` on the Core_Service.
3. THE dashboard page SHALL display organization metrics (total, active, on_trial) in a Card component from Shared_UI.
4. THE dashboard page SHALL display user metrics (total, active) in a Card component from Shared_UI.
5. THE dashboard page SHALL display revenue metrics (total_invoiced, total_outstanding, total_received) in a Card component from Shared_UI, formatting decimal string values with `parseFloat()` and `toLocaleString()`.
6. THE dashboard page SHALL display a recent activity table using the Table component from Shared_UI, showing action, resource_type (displaying "—" when null), ip_address (displaying "—" when null), and created_at columns.
7. THE dashboard page SHALL provide date range filter inputs (`date_from`, `date_to`) that re-fetch the Dashboard_Overview with the selected date range as query parameters.
8. WHILE the Dashboard_Overview fetch is in progress, THE dashboard page SHALL display skeleton loading states using the TableSkeleton and Skeleton components from Shared_UI.
9. IF the Dashboard_Overview fetch fails, THEN THE dashboard page SHALL display an error message with a retry button.

### Requirement 6: Organization List Page

**User Story:** As a system administrator, I want to view a paginated list of all organizations with search and filter capabilities, so that I can find and manage organizations efficiently.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide an organization list page at the `/organizations` route.
2. WHEN the organization list page loads, THE Admin_Portal SHALL fetch organizations from `GET /api/v1/admin/organizations` on the Core_Service with default pagination (`page=1`, `page_size=20`).
3. THE organization list page SHALL display organizations in a Table component from Shared_UI showing name, slug, status, organization_type, and created_at columns.
4. THE organization list page SHALL provide a SearchInput component from Shared_UI that filters organizations by name or slug (case-insensitive) by passing the `search` query parameter.
5. THE organization list page SHALL provide a Select component from Shared_UI that filters organizations by status (`active`, `inactive`, `suspended`, `trial`).
6. WHEN the user changes search text or status filter, THE Admin_Portal SHALL reset pagination to page 1 and re-fetch the organization list.
7. THE organization list page SHALL display pagination controls showing current page, total pages, and next/previous buttons, driven by the `pagination` object in the API response.
8. THE organization list page SHALL provide a "Create Organization" button that navigates to the organization creation form.
9. WHEN the user clicks an organization row, THE Admin_Portal SHALL navigate to the organization detail page at `/organizations/{id}`.
10. WHILE the organization list fetch is in progress, THE Admin_Portal SHALL display a TableSkeleton loading state.
11. IF the organization list is empty, THEN THE Admin_Portal SHALL display an EmptyState component from Shared_UI.

### Requirement 7: Organization Detail Page

**User Story:** As a system administrator, I want to view and edit a single organization's details including aggregate counts, so that I can manage organization settings and monitor their usage.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide an organization detail page at the `/organizations/:id` route.
2. WHEN the organization detail page loads, THE Admin_Portal SHALL fetch the organization from `GET /api/v1/admin/organizations/{id}` on the Core_Service.
3. THE organization detail page SHALL display summary cards showing `user_count`, `invoice_count`, and `payment_total` (formatted with `parseFloat()` and `toLocaleString()`).
4. THE organization detail page SHALL display all organization fields: name, slug, display_name, description, email, phone, website, organization_type, industry, base_currency, country, status, and created_at.
5. THE organization detail page SHALL display "—" for any nullable field that is null.
6. THE organization detail page SHALL provide an "Edit" button that opens an edit form pre-populated with the organization's current values.
7. WHEN the admin updates organization fields and submits, THE Admin_Portal SHALL send a `PATCH /api/v1/admin/organizations/{id}` request to the Core_Service and refresh the displayed data on success.
8. WHEN the admin changes the status to `"suspended"`, THE Admin_Portal SHALL display a ConfirmationDialog from Shared_UI warning that suspension cascades deactivation to all organization users, and only send the update request upon confirmation.
9. IF the organization update returns a 404 response, THEN THE Admin_Portal SHALL display an "Organization not found" error message.
10. THE organization detail page SHALL treat the `slug` field as read-only in the edit form.

### Requirement 8: Organization Creation

**User Story:** As a system administrator, I want to create new organizations, so that I can onboard new tenants to the platform.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide an organization creation form accessible from the organization list page.
2. THE organization creation form SHALL require `name` and `slug` fields.
3. THE organization creation form SHALL validate that `slug` matches the pattern `^[a-z0-9-]+$` (lowercase alphanumeric and hyphens only) and display a validation error for non-matching input.
4. THE organization creation form SHALL provide optional fields: display_name, description, email, phone, website, organization_type (select from `enterprise`, `business`, `startup`, `individual`), industry, base_currency, status (select from `active`, `inactive`, `suspended`, `trial`), and country.
5. WHEN the admin submits a valid form, THE Admin_Portal SHALL send a `POST /api/v1/admin/organizations` request to the Core_Service.
6. WHEN the Core_Service returns a 201 response, THE Admin_Portal SHALL display a success toast notification and navigate to the newly created organization's detail page.
7. IF the Core_Service returns a 409 response, THEN THE Admin_Portal SHALL display the "Organization with this slug already exists" error on the slug field.
8. IF the Core_Service returns a 422 response, THEN THE Admin_Portal SHALL display the validation error messages on the corresponding form fields.

### Requirement 9: User List Page

**User Story:** As a system administrator, I want to view a paginated list of all users with search and filter capabilities, so that I can find and manage users across all organizations.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide a user list page at the `/users` route.
2. WHEN the user list page loads, THE Admin_Portal SHALL fetch users from `GET /api/v1/admin/users` on the Core_Service with default pagination (`page=1`, `page_size=20`).
3. THE user list page SHALL display users in a Table component from Shared_UI showing email, first_name, last_name, roles, user_type, is_active status, organization_name, and created_at columns.
4. THE user list page SHALL provide a SearchInput component from Shared_UI that filters users by email, phone, or name (case-insensitive) by passing the `search` query parameter.
5. THE user list page SHALL provide a Select component from Shared_UI that filters users by active status (`true`, `false`, or all).
6. WHEN the user changes search text or active status filter, THE Admin_Portal SHALL reset pagination to page 1 and re-fetch the user list.
7. THE user list page SHALL display pagination controls showing current page, total pages, and next/previous buttons, driven by the `pagination` object in the API response.
8. THE user list page SHALL provide a "Create User" button that navigates to the user creation form.
9. WHEN the user clicks a user row, THE Admin_Portal SHALL navigate to the user detail page at `/users/{id}`.
10. WHILE the user list fetch is in progress, THE Admin_Portal SHALL display a TableSkeleton loading state.
11. IF the user list is empty, THEN THE Admin_Portal SHALL display an EmptyState component from Shared_UI.

### Requirement 10: User Detail Page

**User Story:** As a system administrator, I want to view and edit a single user's details including their roles, so that I can manage user access and permissions.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide a user detail page at the `/users/:id` route.
2. WHEN the user detail page loads, THE Admin_Portal SHALL fetch the user from `GET /api/v1/admin/users/{id}` on the Core_Service.
3. THE user detail page SHALL display user fields: email, display_name (falling back to `first_name` + `last_name` when null), phone, roles, user_type, is_active status, organization_name, created_at, and updated_at.
4. THE user detail page SHALL display "—" for any nullable field that is null.
5. THE user detail page SHALL display the `is_active` status using a Badge component from Shared_UI with a green variant for active and a red variant for inactive.
6. THE user detail page SHALL provide an "Edit" button that opens an edit form pre-populated with the user's current values.
7. WHEN the admin updates user fields and submits, THE Admin_Portal SHALL send a `PATCH /api/v1/admin/users/{id}` request to the Core_Service and refresh the displayed data on success.
8. THE edit form SHALL allow updating `roles` by selecting from `system_admin`, `org_admin`, and `user` options, replacing the entire roles array on submission.
9. WHEN the admin sets `is_active` to `false`, THE Admin_Portal SHALL display a ConfirmationDialog from Shared_UI confirming user deactivation before sending the update request.
10. THE edit form SHALL treat the `email` field as read-only.
11. IF the user update returns a 404 response, THEN THE Admin_Portal SHALL display a "User not found" error message.

### Requirement 11: User Creation

**User Story:** As a system administrator, I want to create new users and assign them to organizations, so that I can provision access for new team members.

#### Acceptance Criteria

1. THE Admin_Portal SHALL provide a user creation form accessible from the user list page.
2. THE user creation form SHALL require `email`, `password`, `first_name`, `last_name`, and `organization_id` fields.
3. THE user creation form SHALL provide optional fields: roles (multi-select from `system_admin`, `org_admin`, `user`), phone, and user_type (select from `system_admin`, `organization_admin`, `user`, `guest`).
4. WHEN the admin submits a valid form, THE Admin_Portal SHALL send a `POST /api/v1/admin/users` request to the Core_Service.
5. WHEN the Core_Service returns a 201 response, THE Admin_Portal SHALL display a success toast notification and navigate to the newly created user's detail page.
6. IF the Core_Service returns a 409 response, THEN THE Admin_Portal SHALL display the "User with this email already exists" error on the email field.
7. IF the Core_Service returns a 422 response, THEN THE Admin_Portal SHALL display the validation error messages on the corresponding form fields.

### Requirement 12: Global Error Handling

**User Story:** As a system administrator, I want consistent error handling across the Admin_Portal, so that I always understand what went wrong and can take corrective action.

#### Acceptance Criteria

1. WHEN any API request returns a 401 response, THE Admin_Portal SHALL clear the stored tokens from the Shared_Store and redirect the user to the login page.
2. WHEN any API request returns a 403 response, THE Admin_Portal SHALL display an "Admin access required" error message using the Toast component from Shared_UI.
3. WHEN any API request returns a 503 response, THE Admin_Portal SHALL display a "Service temporarily unavailable. Please try again later." error message using the Toast component from Shared_UI.
4. WHEN a network error occurs (no response received), THE Admin_Portal SHALL display a "Network error. Please check your connection." error message using the Toast component from Shared_UI.
5. THE Admin_Portal SHALL wrap the root component tree in an ErrorBoundary that catches unhandled React rendering errors and displays a fallback UI with a "Reload" button.

### Requirement 13: Routing Configuration

**User Story:** As a system administrator, I want clear navigation between all Admin_Portal pages, so that I can move between features without confusion.

#### Acceptance Criteria

1. THE Admin_Portal SHALL use React Router v6 for client-side routing.
2. THE Admin_Portal SHALL define the `/login` route as a public route accessible without authentication.
3. THE Admin_Portal SHALL define all other routes (`/`, `/organizations`, `/organizations/:id`, `/users`, `/users/:id`) as protected routes wrapped by the Admin_Guard.
4. WHEN a user navigates to an undefined route, THE Admin_Portal SHALL redirect to the dashboard page (`/`).
5. THE Admin_Portal SHALL configure `historyApiFallback: true` in the Webpack dev server to support client-side routing on page refresh.
