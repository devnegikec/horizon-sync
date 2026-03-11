# BankAccountDetail Component

## Overview

The `BankAccountDetail` component displays comprehensive bank account information with security features including field masking and permission-based access to sensitive data. It also provides a complete audit history timeline for compliance and tracking purposes.

## Features

### 1. Account Information Display
- Bank name and account holder details
- Masked sensitive fields (account number, IBAN)
- Banking identifiers (SWIFT, routing number, sort code, BSB, IFSC)
- Account metadata (currency, country, type, purpose)
- Branch information
- Status badges (Active/Inactive, Primary)

### 2. Security Features (Requirements 15.7-15.10)

#### Field Masking
- **Account Number Masking (Requirement 15.7)**: Shows only last 4 digits
  - Example: `•••• 7890` instead of `1234567890`
  
- **IBAN Masking (Requirement 15.8)**: Shows first 4 and last 4 characters
  - Example: `GB82************5432` instead of full IBAN

#### Permission-Based Unmasking (Requirement 15.9)
- "View Full Account Number" button with permission check
- Toggle between masked and unmasked view
- Permission dialog for unauthorized users

#### Audit Logging (Requirement 15.10)
- All unmasking actions are logged for audit trail
- Tracks who viewed sensitive information and when

### 3. Audit History Timeline (Requirement 18.9)

Displays complete change history including:
- Action type (created, updated, activated, deactivated)
- Timestamp of change
- User who made the change
- Reason for change (if provided)
- Old and new values comparison
- Color-coded badges for different action types

## Usage

```tsx
import { BankAccountDetail } from '@/features/banking/components';

function MyComponent() {
  return (
    <BankAccountDetail 
      accountId="account-uuid-here"
      onClose={() => console.log('Close clicked')}
    />
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `accountId` | `string` | Yes | UUID of the bank account to display |
| `onClose` | `() => void` | No | Callback function when close action is triggered |

## API Integration

The component uses two React Query hooks:

1. **`useBankAccount(accountId)`**
   - Fetches bank account details from `/api/bank-accounts/{id}`
   - Returns masked sensitive fields by default

2. **`useBankAccountHistory(accountId)`**
   - Fetches audit history from `/api/bank-accounts/{id}/history`
   - Returns chronological list of all changes

## Security Considerations

### Permission Check
The component includes a placeholder permission check function that should be replaced with actual backend authorization:

```typescript
const checkUnmaskPermission = (): boolean => {
  // TODO: Replace with actual permission check from user context
  // Example: return user.hasPermission('bank_account.view_sensitive')
  return true;
};
```

### Audit Logging
The unmasking action logging should be implemented to call the backend:

```typescript
const logUnmaskingAction = (accountId: string) => {
  // TODO: Implement actual audit logging to backend
  // Example: await auditService.logAction('unmask_account', { accountId });
};
```

## Styling

The component uses Tailwind CSS classes and shadcn/ui components for consistent styling:
- Card components for sections
- Badges for status indicators
- Icons from lucide-react
- Responsive grid layout for account details

## Accessibility

- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly

## Testing

See `BankAccountDetail.test.tsx` for unit tests covering:
- Loading states
- Account details rendering
- Field masking (Requirements 15.7, 15.8)
- Audit history display (Requirement 18.9)
- Error handling

## Requirements Mapping

| Requirement | Description | Implementation |
|-------------|-------------|----------------|
| 15.7 | Account number masking (last 4 digits) | `maskAccountNumber()` function |
| 15.8 | IBAN masking (first 4 + last 4) | `maskIBAN()` function |
| 15.9 | Unmasking requires permission | `checkUnmaskPermission()` + dialog |
| 15.10 | Unmasking logged in audit trail | `logUnmaskingAction()` |
| 18.9 | Display audit history timeline | `AuditHistoryEntry` component |

## Future Enhancements

1. Implement real backend permission check
2. Add audit logging API integration
3. Add export functionality for audit history
4. Add filtering/search for audit history
5. Add real-time updates via WebSocket
6. Add print-friendly view
