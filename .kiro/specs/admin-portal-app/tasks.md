# Implementation Plan: Admin Portal App

## Overview

Build the Admin Portal as a standalone Nx React app at `apps/admin` (port 4300) with TypeScript, Webpack + Babel, TanStack React Query, React Hook Form + Zod, and the shared `@horizon-sync/ui` and `@horizon-sync/store` libraries. Tasks are ordered so each produces a testable increment.

## Tasks

- [ ] 1. Scaffold Nx application and configure build tooling
  - [ ] 1.1 Create `apps/admin/project.json` with build (Webpack + Babel), serve (port 4300), lint, and test targets — NO Module Federation
    - Use `@nx/webpack:webpack` executor with `compiler: "babel"` for build
    - Use `@nx/webpack:dev-server` executor for serve (NOT `module-federation-dev-server`)
    - _Requirements: 1.1, 1.2, 1.3, 1.7_
  - [ ] 1.2 Create `apps/admin/webpack.config.ts` with dotenv + DefinePlugin for `NX_API_BASE_URL` and `NX_API_CORE_URL`, `historyApiFallback: true`, port 4300
    - Load `.env` from workspace root via `dotenv`
    - Inject env vars using `webpack.DefinePlugin`
    - _Requirements: 1.4, 13.5_
  - [ ] 1.3 Create supporting config files: `.babelrc`, `tsconfig.json`, `tsconfig.app.json`, `postcss.config.js`, `tailwind.config.js`, `eslint.config.mjs`, `jest.config.cts`
    - _Requirements: 1.1, 1.2_
  - [ ] 1.4 Create `src/index.html`, `src/main.tsx`, `src/styles.css` (importing `@horizon-sync/ui/styles/globals.css`), and `src/environments/environment.ts` + `environment.prod.ts`
    - `environment.ts` resolves `apiBaseUrl` (default `http://localhost:8000`) and `apiCoreUrl` (default `http://localhost:8001`)
    - _Requirements: 1.4, 1.5, 1.6_

- [ ] 2. Checkpoint — Verify app scaffolding
  - Ensure the project builds and serves without errors. Ask the user if questions arise.

- [ ] 3. Set up TypeScript types and API services
  - [ ] 3.1 Create `src/app/types/` with all TypeScript interfaces: `AdminProfile`, `LoginPayload`, `LoginResponse`, `DashboardOverview`, `ActivityLogItem`, `DashboardFilters`, organization types (`AdminOrgListItem`, `AdminOrgDetailResponse`, `AdminOrgCreate`, `AdminOrgUpdate`, `AdminOrgFilters`, `AdminOrgListResponse`), user types (`AdminUserListItem`, `AdminUserDetailResponse`, `AdminUserCreate`, `AdminUserUpdate`, `AdminUserFilters`, `AdminUserListResponse`), and `PaginationMeta`
    - _Requirements: 2.1, 5.2, 6.2, 7.2, 8.5, 9.2, 10.2, 11.4_
  - [ ] 3.2 Create `AdminAuthService` at `src/app/services/admin-auth.service.ts` with `login`, `refresh`, `getAdminProfile`, `logout` methods using `environment.apiBaseUrl` and Bearer token from `useUserStore`
    - _Requirements: 2.1, 3.2_
  - [ ] 3.3 Create `AdminDashboardService` at `src/app/services/admin-dashboard.service.ts` with `getOverview(filters?)` method using `environment.apiCoreUrl`
    - _Requirements: 5.2_
  - [ ] 3.4 Create `AdminOrganizationService` at `src/app/services/admin-organization.service.ts` with `list`, `getById`, `create`, `update` methods using `environment.apiCoreUrl`
    - _Requirements: 6.2, 7.2, 7.7, 8.5_
  - [ ] 3.5 Create `AdminUserService` at `src/app/services/admin-user.service.ts` with `list`, `getById`, `create`, `update` methods using `environment.apiCoreUrl`
    - _Requirements: 9.2, 10.2, 10.7, 11.4_

- [ ] 4. Implement global error handling and ErrorBoundary
  - [ ] 4.1 Implement global error handling in each service's `request()` helper: 401 clears tokens + redirects to `/login`, 403 shows "Admin access required" toast, 503 shows "Service temporarily unavailable" toast, network error shows "Network error" toast
    - _Requirements: 12.1, 12.2, 12.3, 12.4_
  - [ ] 4.2 Create `ErrorBoundary` component at `src/app/components/ErrorBoundary.tsx` that catches unhandled React errors and shows fallback UI with a "Reload" button
    - _Requirements: 12.5_
  - [ ]\* 4.3 Write property test for global error handler (Property 10)
    - **Property 10: Global error handler produces correct message**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

- [ ] 5. Implement authentication: AdminGuard, login page, and React Query hooks
  - [ ] 5.1 Create `useAdminProfile` React Query hook at `src/app/hooks/useAdminProfile.ts` using `AdminAuthService.getAdminProfile`
    - _Requirements: 2.1, 2.2_
  - [ ] 5.2 Create `AdminGuard` component at `src/app/components/auth/AdminGuard.tsx` — fetches admin profile, shows loading indicator while pending, renders children on `system_admin` confirmation, redirects to `/login` on 401, shows "Admin access required" + 3s redirect on 403
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  - [ ] 5.3 Create `PublicRoute` component that redirects authenticated System_Admin users to `/`
    - _Requirements: 3.5_
  - [ ] 5.4 Create `LoginPage` at `src/app/pages/LoginPage.tsx` with React Hook Form + Zod (`loginSchema`), "Horizon Sync Admin" branding with violet/fuchsia gradient logo, loading state on submit button, error message display from API
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6_
  - [ ]\* 5.5 Write property test for AdminGuard blocking behavior (Property 11)
    - **Property 11: AdminGuard blocks rendering until admin confirmed**
    - **Validates: Requirements 2.6, 13.3**
  - [ ]\* 5.6 Write property test for login token storage (Property 12)
    - **Property 12: Login success stores tokens**
    - **Validates: Requirements 3.2**
  - [ ]\* 5.7 Write property test for login failure error display (Property 13)
    - **Property 13: Login failure displays API error**
    - **Validates: Requirements 3.3**

- [ ] 6. Implement routing and app shell
  - [ ] 6.1 Create `AppRoutes.tsx` at `src/app/AppRoutes.tsx` with React Router v6: `/login` as public route, all other routes (`/`, `/organizations`, `/organizations/:id`, `/users`, `/users/:id`) wrapped by `AdminGuard` + `DashboardLayout`, catch-all redirects to `/`
    - _Requirements: 13.1, 13.2, 13.3, 13.4_
  - [ ] 6.2 Create root `App` component at `src/app/app.tsx` composing ErrorBoundary → QueryClientProvider → Suspense → BrowserRouter → AppRoutes → Toaster
    - _Requirements: 4.8, 12.5_
  - [ ]\* 6.3 Write property test for undefined route redirect (Property 16)
    - **Property 16: Undefined route redirects to dashboard**
    - **Validates: Requirements 13.4**

- [ ] 7. Checkpoint — Verify auth flow and routing
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement DashboardLayout with sidebar and topbar
  - [ ] 8.1 Create `AdminSidebar` at `src/app/components/Sidebar.tsx` with "Horizon Sync Admin" branding, main nav items (Dashboard, Organizations, Users with Lucide icons), bottom nav items (Settings, Help), active item highlighting with violet/fuchsia gradient, collapsible behavior
    - _Requirements: 4.2, 4.3, 4.4, 4.5_
  - [ ] 8.2 Create `AdminTopbar` at `src/app/components/Topbar.tsx` displaying admin display name (fallback to `first_name + last_name`), logout action, mobile sidebar toggle
    - _Requirements: 4.6, 4.7_
  - [ ] 8.3 Create `DashboardLayout` at `src/app/components/DashboardLayout.tsx` composing sidebar + topbar + main content area, with ThemeProvider and TooltipProvider from Shared_UI, mobile drawer for viewport < 768px
    - _Requirements: 4.1, 4.7, 4.8_
  - [ ]\* 8.4 Write property test for display name resolution (Property 1)
    - **Property 1: Display name resolution**
    - **Validates: Requirements 4.6, 10.3**

- [ ] 9. Implement Dashboard page
  - [ ] 9.1 Create `useDashboardOverview` React Query hook at `src/app/hooks/useDashboardOverview.ts` with query key `['dashboard-overview', filters]`
    - _Requirements: 5.2_
  - [ ] 9.2 Create `DashboardPage` at `src/app/pages/DashboardPage.tsx` with metric cards (org: total/active/on_trial, user: total/active, revenue: total_invoiced/total_outstanding/total_received formatted via `parseFloat().toLocaleString()`), recent activity table (action, resource_type with "—" for null, ip_address with "—" for null, created_at), date range filter inputs, skeleton loading states, error state with retry button
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_
  - [ ]\* 9.3 Write property test for decimal string formatting (Property 3)
    - **Property 3: Decimal string formatting**
    - **Validates: Requirements 5.5, 7.3**
  - [ ]\* 9.4 Write property test for null fields rendering as dash (Property 2)
    - **Property 2: Null fields render as dash**
    - **Validates: Requirements 5.6, 7.5, 10.4**
  - [ ]\* 9.5 Write property test for dashboard metrics rendering (Property 4)
    - **Property 4: Dashboard metrics rendering**
    - **Validates: Requirements 5.3, 5.4**

- [ ] 10. Checkpoint — Verify dashboard and layout
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement Organization list page
  - [ ] 11.1 Create `useOrganizations` React Query hook at `src/app/hooks/useOrganizations.ts` with query key `['organizations', filters]`
    - _Requirements: 6.2_
  - [ ] 11.2 Create `OrganizationsPage` at `src/app/pages/OrganizationsPage.tsx` with paginated Table (name, slug, status, organization_type, created_at), SearchInput for name/slug filtering, Select for status filter, pagination controls (current page, total pages, next/prev), "Create Organization" button, clickable rows navigating to `/organizations/{id}`, TableSkeleton loading state, EmptyState for empty list
    - Filter/search changes reset pagination to page 1
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10, 6.11_
  - [ ]\* 11.3 Write property test for filter change resetting pagination (Property 8)
    - **Property 8: Filter change resets pagination**
    - **Validates: Requirements 6.6, 9.6**
  - [ ]\* 11.4 Write property test for pagination controls (Property 9)
    - **Property 9: Pagination controls reflect metadata**
    - **Validates: Requirements 6.7, 9.7**

- [ ] 12. Implement Organization detail and edit page
  - [ ] 12.1 Create `useOrganization` and `useUpdateOrganization` React Query hooks at `src/app/hooks/useOrganization.ts`
    - _Requirements: 7.2, 7.7_
  - [ ] 12.2 Create `OrganizationDetailPage` at `src/app/pages/OrganizationDetailPage.tsx` with summary cards (user_count, invoice_count, payment_total formatted), all organization fields displayed ("—" for null values), "Edit" button opening edit form with slug as read-only, ConfirmationDialog when status changed to "suspended", 404 error handling
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_

- [ ] 13. Implement Organization creation
  - [ ] 13.1 Create `useCreateOrganization` mutation hook at `src/app/hooks/useCreateOrganization.ts`
    - _Requirements: 8.5_
  - [ ] 13.2 Create organization creation form (inline or separate component) with React Hook Form + Zod (`orgCreateSchema`): required `name` and `slug`, slug validation (`^[a-z0-9-]+$`), optional fields (display_name, description, email, phone, website, organization_type, industry, base_currency, status, country), success toast + navigate to detail on 201, 409 error on slug field, 422 error mapping to form fields
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_
  - [ ]\* 13.3 Write property test for slug validation (Property 5)
    - **Property 5: Slug validation**
    - **Validates: Requirements 8.3**
  - [ ]\* 13.4 Write property test for required field validation (Property 6)
    - **Property 6: Required field validation**
    - **Validates: Requirements 8.2, 11.2**
  - [ ]\* 13.5 Write property test for API validation error mapping (Property 7)
    - **Property 7: API validation error mapping**
    - **Validates: Requirements 8.8, 11.7**

- [ ] 14. Checkpoint — Verify organization CRUD
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Implement User list page
  - [ ] 15.1 Create `useUsers` React Query hook at `src/app/hooks/useUsers.ts` with query key `['users', filters]`
    - _Requirements: 9.2_
  - [ ] 15.2 Create `UsersPage` at `src/app/pages/UsersPage.tsx` with paginated Table (email, first_name, last_name, roles, user_type, is_active, organization_name, created_at), SearchInput for email/phone/name filtering, Select for active status filter, pagination controls, "Create User" button, clickable rows navigating to `/users/{id}`, TableSkeleton loading state, EmptyState for empty list
    - Filter/search changes reset pagination to page 1
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11_

- [ ] 16. Implement User detail and edit page
  - [ ] 16.1 Create `useUser` and `useUpdateUser` React Query hooks at `src/app/hooks/useUser.ts`
    - _Requirements: 10.2, 10.7_
  - [ ] 16.2 Create `UserDetailPage` at `src/app/pages/UserDetailPage.tsx` with all user fields (display_name fallback to first_name + last_name, "—" for null), Badge for is_active (green=active, red=inactive), "Edit" button opening edit form with email as read-only, roles multi-select (system_admin, org_admin, user) replacing entire array, ConfirmationDialog when is_active set to false, 404 error handling
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11_
  - [ ]\* 16.3 Write property test for active status Badge variant (Property 14)
    - **Property 14: Active status Badge variant**
    - **Validates: Requirements 10.5**
  - [ ]\* 16.4 Write property test for roles array replacement (Property 15)
    - **Property 15: Roles array replacement on submit**
    - **Validates: Requirements 10.8**

- [ ] 17. Implement User creation
  - [ ] 17.1 Create `useCreateUser` mutation hook at `src/app/hooks/useCreateUser.ts`
    - _Requirements: 11.4_
  - [ ] 17.2 Create user creation form with React Hook Form + Zod (`userCreateSchema`): required `email`, `password`, `first_name`, `last_name`, `organization_id`, optional fields (roles multi-select, phone, user_type), success toast + navigate to detail on 201, 409 error on email field, 422 error mapping to form fields
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 18. Final checkpoint — Verify all features and tests
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (Properties 1–16)
- Unit tests validate specific examples and edge cases
- All code uses TypeScript, React 19, TanStack React Query, React Hook Form + Zod, and shared libs `@horizon-sync/ui` + `@horizon-sync/store`
