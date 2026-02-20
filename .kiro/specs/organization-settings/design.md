# Design Document: Organization Settings Module

## Overview

The organization settings module is a frontend feature that enables users to view and manage their organization's information and configuration. The module follows a modular architecture with separate components for different concerns, uses React hooks for data fetching and state management, and integrates with the existing Zustand user store for application-wide state.

The module consists of:

- A main settings page that serves as the container
- Separate components for organization information display and currency configuration
- Custom React hooks for data fetching and updates
- A service layer for API communication
- TypeScript types for type safety

## Architecture

### Component Hierarchy

```
SettingsPage (Container)
├── OrganizationSettings (Display & Edit)
│   └── OrganizationForm (Edit Mode)
└── CurrencySettings (Currency Configuration)
```

### Data Flow

```
User Action → Component → Hook → Service → API
                ↓
            User Store (Zustand)
                ↓
        Other Components (Access)
```

### State Management

The module uses two levels of state management:

1. **Local Component State**: For UI-specific state (edit mode, form values, loading states)
2. **Global Application State**: For organization data stored in Zustand user store

### File Structure

```
apps/platform/src/app/
├── pages/
│   └── settings.tsx                    # Main settings page
├── features/
│   └── organization/
│       ├── components/
│       │   ├── OrganizationSettings.tsx    # Organization info display
│       │   ├── OrganizationForm.tsx        # Edit form
│       │   └── CurrencySettings.tsx        # Currency configuration
│       ├── hooks/
│       │   ├── useOrganization.ts          # Fetch organization data
│       │   └── useUpdateOrganization.ts    # Update organization
│       ├── services/
│       │   └── organization.service.ts     # API service layer
│       └── types/
│           └── organization.types.ts       # TypeScript types
```

## Components and Interfaces

### 1. SettingsPage Component

**Purpose**: Main container component that renders the settings page layout.

**Props**: None (uses hooks internally)

**Responsibilities**:

- Render page header with title and description
- Render OrganizationSettings component
- Render CurrencySettings component
- Handle responsive layout

**Interface**:

```typescript
export function SettingsPage(): JSX.Element;
```

### 2. OrganizationSettings Component

**Purpose**: Display organization information and provide edit functionality.

**Props**:

```typescript
interface OrganizationSettingsProps {
  organizationId: string;
  accessToken: string;
  canEdit: boolean;
}
```

**State**:

```typescript
{
  isEditing: boolean;
  editedData: Partial<Organization> | null;
}
```

**Responsibilities**:

- Fetch and display organization data using useOrganization hook
- Toggle between view and edit modes
- Render OrganizationForm when in edit mode
- Handle edit button visibility based on permissions
- Display loading skeleton during data fetch
- Display error messages on fetch failure

### 3. OrganizationForm Component

**Purpose**: Editable form for updating organization details.

**Props**:

```typescript
interface OrganizationFormProps {
  organization: Organization;
  onSave: (data: UpdateOrganizationRequest) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}
```

**State**:

```typescript
{
  formData: {
    name: string;
    display_name: string | null;
  };
  errors: {
    name?: string;
    display_name?: string;
  };
}
```

**Responsibilities**:

- Render form inputs for organization name and display name
- Validate form inputs on change and submit
- Call onSave callback with validated data
- Call onCancel callback when cancel button is clicked
- Display validation errors inline
- Disable inputs during submission

**Validation Rules**:

- Name: Required, max 100 characters
- Display Name: Optional, max 100 characters

### 4. CurrencySettings Component

**Purpose**: Display and manage organization currency configuration.

**Props**:

```typescript
interface CurrencySettingsProps {
  organizationId: string;
  accessToken: string;
  currentSettings: Record<string, any> | null;
  canEdit: boolean;
}
```

**State**:

```typescript
{
  selectedCurrency: string;
  isUpdating: boolean;
}
```

**Responsibilities**:

- Display current currency setting
- Render currency dropdown when user has edit permission
- Update organization settings when currency is changed
- Display success/error notifications
- Revert to previous currency on update failure

**Supported Currencies**:

```typescript
const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
];
```

## Data Models

### Organization Type

```typescript
interface Organization {
  id: string;
  name: string;
  display_name: string | null;
  status: 'active' | 'inactive' | 'suspended';
  is_active: boolean;
  settings: Record<string, any> | null;
  extra_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
```

### Update Organization Request

```typescript
interface UpdateOrganizationRequest {
  name?: string;
  display_name?: string | null;
  settings?: Record<string, any>;
}
```

### Organization Response

```typescript
interface OrganizationResponse {
  id: string;
  name: string;
  display_name: string | null;
  status: 'active' | 'inactive' | 'suspended';
  is_active: boolean;
  settings: Record<string, any> | null;
  extra_data: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}
```

### Currency Settings

```typescript
interface CurrencySettings {
  currency: string; // ISO 4217 currency code
}
```

## Hooks

### useOrganization Hook

**Purpose**: Fetch organization data from the API.

**Signature**:

```typescript
function useOrganization(
  organizationId: string | null,
  accessToken: string | null,
): {
  organization: Organization | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};
```

**Behavior**:

- Fetches organization data on mount if organizationId and accessToken are provided
- Returns loading state while fetching
- Returns error message if fetch fails
- Provides refetch function to manually trigger data fetch
- Uses useEffect to fetch data when dependencies change

**Implementation Details**:

```typescript
const useOrganization = (organizationId: string | null, accessToken: string | null) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = async () => {
    if (!organizationId || !accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await OrganizationService.getOrganization(organizationId, accessToken);
      setOrganization(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organization');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [organizationId, accessToken]);

  return { organization, loading, error, refetch: fetchOrganization };
};
```

### useUpdateOrganization Hook

**Purpose**: Update organization data via the API.

**Signature**:

```typescript
function useUpdateOrganization(): {
  updateOrganization: (organizationId: string, data: UpdateOrganizationRequest, accessToken: string) => Promise<Organization>;
  loading: boolean;
  error: string | null;
};
```

**Behavior**:

- Provides updateOrganization function that calls the API
- Returns loading state during update
- Returns error message if update fails
- Returns updated organization data on success
- Updates user store with new organization data

**Implementation Details**:

```typescript
const useUpdateOrganization = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { updateUser } = useUserStore();

  const updateOrganization = async (organizationId: string, data: UpdateOrganizationRequest, accessToken: string): Promise<Organization> => {
    setLoading(true);
    setError(null);

    try {
      const updated = await OrganizationService.updateOrganization(organizationId, data, accessToken);

      // Update user store with new organization data
      updateUser({ organization: updated });

      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update organization';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateOrganization, loading, error };
};
```

## Service Layer

### OrganizationService

**Purpose**: Handle all API communication related to organizations.

**Methods**:

#### getOrganization

```typescript
static async getOrganization(
  organizationId: string,
  accessToken: string
): Promise<Organization>
```

**Behavior**:

- Makes GET request to `/api/v1/identity/organizations/{id}`
- Includes Authorization header with Bearer token
- Returns organization data on success
- Throws error with descriptive message on failure

#### updateOrganization

```typescript
static async updateOrganization(
  organizationId: string,
  data: UpdateOrganizationRequest,
  accessToken: string
): Promise<Organization>
```

**Behavior**:

- Makes PUT request to `/api/v1/identity/organizations/{id}`
- Includes Authorization header with Bearer token
- Sends update data in request body
- Returns updated organization data on success
- Throws error with descriptive message on failure

**Implementation Pattern**:

```typescript
class OrganizationService {
  private static getHeaders(accessToken: string) {
    return {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  static async getOrganization(organizationId: string, accessToken: string): Promise<Organization> {
    const response = await fetch(`${API_BASE_URL}/api/v1/identity/organizations/${organizationId}`, {
      method: 'GET',
      headers: this.getHeaders(accessToken),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch organization: ${response.statusText}`);
    }

    return response.json();
  }

  static async updateOrganization(organizationId: string, data: UpdateOrganizationRequest, accessToken: string): Promise<Organization> {
    const response = await fetch(`${API_BASE_URL}/api/v1/identity/organizations/${organizationId}`, {
      method: 'PUT',
      headers: this.getHeaders(accessToken),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update organization: ${response.statusText}`);
    }

    return response.json();
  }
}
```

## User Store Extension

The existing user store needs to be extended to store organization data.

### New State Properties

```typescript
interface UserState {
  // ... existing properties
  organization: Organization | null;
}
```

### New Actions

```typescript
interface UserState {
  // ... existing actions
  setOrganization: (organization: Organization) => void;
  updateOrganization: (partial: Partial<Organization>) => void;
}
```

### Implementation

```typescript
export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        // ... existing state
        organization: null,

        // ... existing actions

        setOrganization: (organization) => set({ organization }, false, 'setOrganization'),

        updateOrganization: (partial) =>
          set(
            (state) => ({
              organization: state.organization ? { ...state.organization, ...partial } : null,
            }),
            false,
            'updateOrganization',
          ),
      }),
      {
        name: 'horizon-auth',
        partialize: (state) => ({
          refreshToken: state.refreshToken,
          // Don't persist organization data for security
        }),
      },
    ),
    {
      name: 'user-store',
      enabled: isDevToolsEnabled(),
    },
  ),
);
```

## Permission Checking

### Permission Structure

Permissions are checked from the user object in the store:

```typescript
// User has permissions array or role with permissions
user.permissions; // string[] or undefined
user.role?.permissions; // string[] or undefined
```

### Permission Check Function

```typescript
function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;

  // Check direct permissions
  if (user.permissions?.includes(permission)) {
    return true;
  }

  // Check role permissions
  if (user.role?.permissions?.includes(permission)) {
    return true;
  }

  return false;
}
```

### Usage in Components

```typescript
const { user } = useAuth();
const canEdit = hasPermission(user, 'organization.update');

// Pass to components
<OrganizationSettings canEdit={canEdit} />
<CurrencySettings canEdit={canEdit} />
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Organization Data Display Completeness

_For any_ valid organization object retrieved from the API, when rendered by the OrganizationSettings component, the displayed output should contain the organization name, display name (if not null), status, and creation date.

**Validates: Requirements 1.2**

### Property 2: Permission-Based UI Rendering

_For any_ user with the organization.update permission, the OrganizationSettings and CurrencySettings components should display edit controls (edit button and currency dropdown), and for any user without this permission, these controls should be hidden.

**Validates: Requirements 2.1, 4.3, 6.5**

### Property 3: Form Submission with Valid Data

_For any_ valid organization form data (name and display_name within length constraints), when the form is submitted, a PUT request should be made to the API with the correct organization ID and data payload.

**Validates: Requirements 2.4**

### Property 4: Field Length Validation

_For any_ string input to the organization name or display_name fields, if the length exceeds 100 characters, the form validation should prevent submission and display an error message.

**Validates: Requirements 3.2, 3.3**

### Property 5: Valid Form State

_For any_ form state where all required fields (organization name) are non-empty and all fields are within length constraints, the submit button should be enabled.

**Validates: Requirements 3.4**

### Property 6: Currency Settings Format

_For any_ supported currency code selected by the user, when the currency update is submitted, the organization's settings field should be updated with the JSON format: `{"currency": "CURRENCY_CODE"}`.

**Validates: Requirements 4.4**

### Property 7: Organization Data Storage in State

_For any_ organization object successfully fetched from the API, the complete organization object should be stored in the User_Store and be retrievable from the store.

**Validates: Requirements 5.1**

### Property 8: Organization Data Updates in State

_For any_ organization update operation that succeeds, the updated organization data should be reflected in the User_Store.

**Validates: Requirements 5.2**

### Property 9: Authorization Header Presence

_For any_ API request made by the OrganizationService, the request should include an Authorization header with the Bearer token format.

**Validates: Requirements 6.3**

## Error Handling

### Error Scenarios

1. **Network Failure**
   - Display user-friendly error message
   - Provide retry button
   - Log error details for debugging

2. **API Error Responses**
   - Parse error response from API
   - Display specific error message to user
   - Handle different HTTP status codes appropriately

3. **Authentication Errors (401)**
   - Trigger token refresh flow
   - Redirect to login if refresh fails
   - Preserve user's intended action for after re-authentication

4. **Authorization Errors (403)**
   - Display "Permission denied" message
   - Hide edit controls
   - Suggest contacting administrator

5. **Validation Errors**
   - Display inline validation errors
   - Prevent form submission
   - Highlight invalid fields

6. **State Update Failures**
   - Revert to previous state
   - Display error notification
   - Log error for debugging

### Error Handling Implementation

```typescript
// Service layer error handling
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    if (response.status === 401) {
      // Trigger token refresh
      throw new AuthenticationError('Token expired');
    }

    if (response.status === 403) {
      throw new AuthorizationError('Permission denied');
    }

    const errorData = await response.json();
    throw new ApiError(errorData.message || 'Request failed');
  }

  return response.json();
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle authentication error
  } else if (error instanceof AuthorizationError) {
    // Handle authorization error
  } else if (error instanceof TypeError) {
    // Network error
    throw new NetworkError('Network request failed');
  } else {
    throw error;
  }
}
```

## Testing Strategy

The organization settings module will be tested using a dual testing approach that combines unit tests for specific scenarios and property-based tests for universal properties.

### Unit Testing

Unit tests will focus on:

1. **Specific Examples**
   - Settings page loads and fetches organization data (Requirement 1.1)
   - Loading skeleton displays during data fetch (Requirement 1.4)
   - Error message displays on fetch failure (Requirement 1.5)
   - Edit button click displays form (Requirement 2.3)
   - Success notification on update (Requirement 2.5)
   - Error notification on update failure (Requirement 2.6)
   - Cancel button discards changes (Requirement 2.7)
   - Currency display on page load (Requirement 4.1)
   - Success notification on currency update (Requirement 4.5)
   - Error notification and rollback on currency update failure (Requirement 4.6)
   - Supported currencies list (Requirement 4.7)
   - Authentication check on page load (Requirement 6.1)
   - Redirect on unauthenticated access (Requirement 6.2)
   - 401 error handling and token refresh (Requirement 6.4)
   - Environment variable usage for API base URL (Requirement 8.3)
   - Network failure error handling (Requirement 8.4)
   - HTTP error response handling (Requirement 8.5)
   - Loading state during update (Requirement 9.2)
   - Mobile layout (Requirement 10.1)
   - Tablet layout (Requirement 10.2)
   - Desktop layout (Requirement 10.3)

2. **Edge Cases**
   - Null display_name handling (Requirement 1.3)
   - Empty organization name validation (Requirement 3.1)
   - Missing currency configuration defaults to USD (Requirement 4.2)

3. **Integration Points**
   - Component interaction with hooks
   - Hook interaction with service layer
   - Service layer interaction with API
   - State updates in User_Store

### Property-Based Testing

Property-based tests will verify universal properties across many generated inputs. Each test will run a minimum of 100 iterations with randomized data.

**Test Configuration**:

- Library: fast-check (for TypeScript/JavaScript)
- Minimum iterations: 100 per property
- Each test tagged with: **Feature: organization-settings, Property {number}: {property_text}**

**Properties to Test**:

1. **Property 1: Organization Data Display Completeness**
   - Generate random organization objects
   - Render OrganizationSettings component
   - Verify all required fields are present in output
   - Tag: **Feature: organization-settings, Property 1: Organization Data Display Completeness**

2. **Property 2: Permission-Based UI Rendering**
   - Generate random users with and without organization.update permission
   - Render components with different users
   - Verify edit controls visibility matches permission
   - Tag: **Feature: organization-settings, Property 2: Permission-Based UI Rendering**

3. **Property 3: Form Submission with Valid Data**
   - Generate random valid form data
   - Submit form
   - Verify PUT request is made with correct data
   - Tag: **Feature: organization-settings, Property 3: Form Submission with Valid Data**

4. **Property 4: Field Length Validation**
   - Generate random strings of various lengths (including > 100 chars)
   - Submit form with generated strings
   - Verify validation prevents submission for strings > 100 chars
   - Tag: **Feature: organization-settings, Property 4: Field Length Validation**

5. **Property 5: Valid Form State**
   - Generate random valid form data
   - Update form fields
   - Verify submit button is enabled
   - Tag: **Feature: organization-settings, Property 5: Valid Form State**

6. **Property 6: Currency Settings Format**
   - Generate random currency selections from supported list
   - Submit currency update
   - Verify settings field has correct JSON format
   - Tag: **Feature: organization-settings, Property 6: Currency Settings Format**

7. **Property 7: Organization Data Storage in State**
   - Generate random organization objects
   - Fetch organization data
   - Verify data is stored in User_Store
   - Tag: **Feature: organization-settings, Property 7: Organization Data Storage in State**

8. **Property 8: Organization Data Updates in State**
   - Generate random organization updates
   - Update organization
   - Verify User_Store reflects updates
   - Tag: **Feature: organization-settings, Property 8: Organization Data Updates in State**

9. **Property 9: Authorization Header Presence**
   - Generate random API requests
   - Make requests through OrganizationService
   - Verify Authorization header is present
   - Tag: **Feature: organization-settings, Property 9: Authorization Header Presence**

### Test Organization

```
apps/platform/src/app/features/organization/
├── __tests__/
│   ├── components/
│   │   ├── OrganizationSettings.test.tsx
│   │   ├── OrganizationForm.test.tsx
│   │   └── CurrencySettings.test.tsx
│   ├── hooks/
│   │   ├── useOrganization.test.ts
│   │   └── useUpdateOrganization.test.ts
│   ├── services/
│   │   └── organization.service.test.ts
│   └── properties/
│       ├── display-completeness.property.test.ts
│       ├── permission-rendering.property.test.ts
│       ├── form-submission.property.test.ts
│       ├── field-validation.property.test.ts
│       ├── form-state.property.test.ts
│       ├── currency-format.property.test.ts
│       ├── state-storage.property.test.ts
│       ├── state-updates.property.test.ts
│       └── auth-header.property.test.ts
```

### Testing Tools

- **Test Framework**: Jest (already configured in the project)
- **React Testing**: React Testing Library
- **Property-Based Testing**: fast-check
- **Mocking**: MSW (Mock Service Worker) for API mocking
- **Coverage**: Jest coverage reports

### Coverage Goals

- Unit test coverage: > 80%
- Property test coverage: All 9 properties implemented
- Integration test coverage: All component interactions tested
- Edge case coverage: All identified edge cases tested
