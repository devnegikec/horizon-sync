# Implementation Plan: Organization Settings Module

## Overview

This implementation plan breaks down the organization settings module into discrete, incremental coding tasks. Each task builds on previous work, with testing integrated throughout to catch errors early. The implementation follows a bottom-up approach: service layer → hooks → components → integration.

## Tasks

- [x] 1. Set up module structure and TypeScript types
  - Create directory structure: `apps/platform/src/app/features/organization/`
  - Create subdirectories: `components/`, `hooks/`, `services/`, `types/`
  - Create `organization.types.ts` with Organization, UpdateOrganizationRequest, and OrganizationResponse interfaces
  - Create currency constants array with supported currencies
  - _Requirements: 7.8, 4.7_

- [ ] 2. Implement organization service layer
  - [x] 2.1 Create OrganizationService class in `organization.service.ts`
    - Implement `getOrganization` method with GET request to `/api/v1/identity/organizations/{id}`
    - Implement `updateOrganization` method with PUT request to `/api/v1/identity/organizations/{id}`
    - Add proper error handling for network failures and HTTP errors
    - Use environment variable for API base URL
    - Include Authorization header with Bearer token in all requests
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 6.3_

  - [ ]\* 2.2 Write unit tests for OrganizationService
    - Test successful getOrganization call
    - Test successful updateOrganization call
    - Test network failure error handling
    - Test HTTP error response handling
    - Test Authorization header inclusion
    - _Requirements: 8.4, 8.5_

  - [ ]\* 2.3 Write property test for authorization header
    - **Property 9: Authorization Header Presence**
    - **Validates: Requirements 6.3**

- [ ] 3. Extend user store with organization state
  - [x] 3.1 Add organization state to user store
    - Add `organization: Organization | null` to UserState interface in `libs/shared/store/src/user-store.types.ts`
    - Add `setOrganization` action to store
    - Add `updateOrganization` action to store
    - Update store implementation in `libs/shared/store/src/user-store.ts`
    - _Requirements: 5.4, 5.5_

  - [ ]\* 3.2 Write unit tests for organization store actions
    - Test setOrganization action
    - Test updateOrganization action
    - Test organization state retrieval
    - _Requirements: 5.4, 5.5_

- [ ] 4. Implement useOrganization hook
  - [x] 4.1 Create useOrganization hook in `hooks/useOrganization.ts`
    - Implement state management for organization, loading, and error
    - Implement fetchOrganization function using OrganizationService
    - Add useEffect to fetch on mount when organizationId and accessToken are available
    - Store fetched organization in user store
    - Return organization, loading, error, and refetch function
    - _Requirements: 7.5, 1.1, 5.1_

  - [ ]\* 4.2 Write unit tests for useOrganization hook
    - Test successful data fetch
    - Test loading state
    - Test error state
    - Test refetch function
    - Test store update on successful fetch
    - _Requirements: 1.1, 1.4, 1.5, 5.1_

  - [ ]\* 4.3 Write property test for organization data storage
    - **Property 7: Organization Data Storage in State**
    - **Validates: Requirements 5.1**

- [ ] 5. Implement useUpdateOrganization hook
  - [x] 5.1 Create useUpdateOrganization hook in `hooks/useUpdateOrganization.ts`
    - Implement state management for loading and error
    - Implement updateOrganization function using OrganizationService
    - Update user store with new organization data on success
    - Return updateOrganization function, loading, and error
    - _Requirements: 7.6, 2.4, 5.2_

  - [ ]\* 5.2 Write unit tests for useUpdateOrganization hook
    - Test successful update
    - Test loading state during update
    - Test error state on failure
    - Test store update on success
    - _Requirements: 2.4, 2.5, 2.6, 5.2_

  - [ ]\* 5.3 Write property test for organization data updates
    - **Property 8: Organization Data Updates in State**
    - **Validates: Requirements 5.2**

- [x] 6. Checkpoint - Ensure service layer and hooks tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement OrganizationForm component
  - [x] 7.1 Create OrganizationForm component in `components/OrganizationForm.tsx`
    - Accept organization, onSave, onCancel, and isLoading props
    - Implement form state for name and display_name
    - Implement validation for required fields and length constraints
    - Display inline validation errors
    - Disable inputs during submission
    - Call onSave with validated data on submit
    - Call onCancel when cancel button is clicked
    - _Requirements: 7.4, 2.3, 2.7, 3.1, 3.2, 3.3, 3.4_

  - [ ]\* 7.2 Write unit tests for OrganizationForm
    - Test form rendering with initial data
    - Test validation for empty name
    - Test validation for name exceeding 100 characters
    - Test validation for display_name exceeding 100 characters
    - Test submit button enabled state with valid data
    - Test onSave callback with valid data
    - Test onCancel callback
    - Test disabled state during submission
    - _Requirements: 2.3, 2.7, 3.1, 3.2, 3.3, 3.4, 9.2_

  - [ ]\* 7.3 Write property test for field length validation
    - **Property 4: Field Length Validation**
    - **Validates: Requirements 3.2, 3.3**

  - [ ]\* 7.4 Write property test for valid form state
    - **Property 5: Valid Form State**
    - **Validates: Requirements 3.4**

  - [ ]\* 7.5 Write property test for form submission
    - **Property 3: Form Submission with Valid Data**
    - **Validates: Requirements 2.4**

- [ ] 8. Implement permission checking utility
  - [x] 8.1 Create hasPermission utility function
    - Create `utils/permissions.ts` file
    - Implement hasPermission function that checks user.permissions and user.role.permissions
    - Return boolean indicating if user has the specified permission
    - _Requirements: 2.1, 2.2, 6.5_

  - [ ]\* 8.2 Write unit tests for hasPermission utility
    - Test with user having direct permission
    - Test with user having role permission
    - Test with user having no permission
    - Test with null user
    - _Requirements: 2.1, 2.2_

- [ ] 9. Implement OrganizationSettings component
  - [x] 9.1 Create OrganizationSettings component in `components/OrganizationSettings.tsx`
    - Accept organizationId, accessToken, and canEdit props
    - Use useOrganization hook to fetch data
    - Implement state for isEditing and editedData
    - Display organization information in view mode (name, display_name, status, created_at)
    - Handle null display_name by showing only name
    - Display loading skeleton during fetch
    - Display error message with retry button on fetch failure
    - Show edit button when canEdit is true
    - Toggle to edit mode when edit button is clicked
    - Render OrganizationForm in edit mode
    - Use useUpdateOrganization hook for updates
    - Display success toast on successful update
    - Display error toast on update failure
    - Return to view mode after successful update
    - _Requirements: 7.2, 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.5, 2.6, 2.7_

  - [ ]\* 9.2 Write unit tests for OrganizationSettings
    - Test data fetch on mount
    - Test loading skeleton display
    - Test error message display
    - Test organization data display
    - Test null display_name handling
    - Test edit button visibility with permission
    - Test edit button hidden without permission
    - Test edit mode toggle
    - Test form rendering in edit mode
    - Test successful update flow
    - Test error handling on update
    - Test cancel flow
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.5, 2.6, 2.7_

  - [ ]\* 9.3 Write property test for organization data display
    - **Property 1: Organization Data Display Completeness**
    - **Validates: Requirements 1.2**

  - [ ]\* 9.4 Write property test for permission-based UI rendering
    - **Property 2: Permission-Based UI Rendering**
    - **Validates: Requirements 2.1, 4.3, 6.5**

- [ ] 10. Implement CurrencySettings component
  - [x] 10.1 Create CurrencySettings component in `components/CurrencySettings.tsx`
    - Accept organizationId, accessToken, currentSettings, and canEdit props
    - Extract currency from currentSettings or default to USD
    - Implement state for selectedCurrency and isUpdating
    - Display current currency in view mode
    - Display currency dropdown when canEdit is true
    - Populate dropdown with supported currencies (USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, SGD)
    - Use useUpdateOrganization hook for updates
    - Update organization settings with JSON format: {"currency": "CURRENCY_CODE"}
    - Display success toast on successful update
    - Display error toast and revert currency on update failure
    - _Requirements: 7.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]\* 10.2 Write unit tests for CurrencySettings
    - Test currency display from settings
    - Test default USD when no currency configured
    - Test dropdown visibility with permission
    - Test dropdown hidden without permission
    - Test supported currencies in dropdown
    - Test currency update flow
    - Test success notification
    - Test error notification and rollback
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 4.7_

  - [ ]\* 10.3 Write property test for currency settings format
    - **Property 6: Currency Settings Format**
    - **Validates: Requirements 4.4**

- [x] 11. Checkpoint - Ensure component tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Implement SettingsPage container
  - [x] 12.1 Create SettingsPage component in `pages/settings.tsx`
    - Use useAuth hook to get user, accessToken, and organization_id
    - Check authentication and redirect to login if not authenticated
    - Use hasPermission utility to check organization.update permission
    - Render page header with title "Settings" and description
    - Render OrganizationSettings component with organizationId, accessToken, and canEdit
    - Render CurrencySettings component with organizationId, accessToken, currentSettings, and canEdit
    - Implement responsive layout: single column on mobile, two-column grid on desktop
    - _Requirements: 7.1, 6.1, 6.2, 10.1, 10.2, 10.3_

  - [ ]\* 12.2 Write unit tests for SettingsPage
    - Test authentication check
    - Test redirect on unauthenticated access
    - Test permission check
    - Test component rendering
    - Test responsive layout on different screen sizes
    - _Requirements: 6.1, 6.2, 10.1, 10.2, 10.3_

- [ ] 13. Update AppRoutes to use SettingsPage
  - [x] 13.1 Replace SettingsPlaceholder with SettingsPage in AppRoutes.tsx
    - Import SettingsPage from pages/settings
    - Replace `<SettingsPlaceholder />` with `<SettingsPage />`
    - Remove SettingsPlaceholder component definition
    - _Requirements: 7.1_

- [ ] 14. Add authentication error handling
  - [x] 14.1 Implement 401 error handling in OrganizationService
    - Detect 401 responses in error handling
    - Throw specific AuthenticationError
    - _Requirements: 6.4_

  - [x] 14.2 Handle AuthenticationError in hooks
    - Catch AuthenticationError in useOrganization
    - Catch AuthenticationError in useUpdateOrganization
    - Trigger token refresh or redirect to login
    - _Requirements: 6.4_

  - [ ]\* 14.3 Write unit tests for authentication error handling
    - Test 401 error detection
    - Test token refresh trigger
    - Test redirect to login on refresh failure
    - _Requirements: 6.4_

- [ ] 15. Final integration and styling
  - [x] 15.1 Apply consistent styling using UI components
    - Use Card components from @horizon-sync/ui for layout
    - Use Button components for actions
    - Use Input and Label components for forms
    - Use Select component for currency dropdown
    - Use Toast component for notifications
    - Use Skeleton component for loading states
    - Match ProfilePage styling patterns
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 15.2 Test responsive design
    - Test mobile layout (single column)
    - Test tablet layout (responsive grid)
    - Test desktop layout (two-column grid)
    - Verify touch-friendly elements on mobile
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [x] 16. Final checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify test coverage meets goals (>80% for unit tests)
  - Ensure all 9 properties are implemented
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with minimum 100 iterations
- Unit tests validate specific examples, edge cases, and integration points
- Follow existing patterns from ProfilePage and auth service for consistency
- Use existing UI components from @horizon-sync/ui library
- Ensure proper TypeScript typing throughout
