# BankAccountList Component

## Overview

The `BankAccountList` component displays a table of bank accounts with filtering, search, and action capabilities. It implements the requirements from the bank integration spec, including proper masking of sensitive account information.

## Features

- **Display bank accounts** with masked sensitive fields (account numbers and IBANs)
- **Filter by status** (All, Active, Inactive)
- **Search** by bank name, account holder name, or account number
- **Actions** per account: View, Edit, Activate/Deactivate
- **Summary statistics** showing total accounts, active accounts, primary accounts, and currencies
- **Responsive design** with loading and error states

## Requirements Implemented

- **Requirement 2.1-2.12**: Display bank account fields (account_holder_name, bank_name, account_number, currency, status)
- **Requirement 15.7**: Account number masking (show last 4 digits)
- **Requirement 15.8**: IBAN masking (show first 4 and last 4 characters)

## Usage

### Basic Usage

```tsx
import { BankAccountList } from '@/features/banking/components/BankAccountList';

function MyPage() {
    return <BankAccountList />;
}
```

### With Callbacks

```tsx
import { BankAccountList } from '@/features/banking/components/BankAccountList';
import { BankAccount } from '@/features/banking/types';

function MyPage() {
    const handleView = (account: BankAccount) => {
        // Navigate to detail page or open modal
        console.log('Viewing account:', account);
    };

    const handleEdit = (account: BankAccount) => {
        // Navigate to edit page or open modal
        console.log('Editing account:', account);
    };

    return (
        <BankAccountList
            onView={handleView}
            onEdit={handleEdit}
        />
    );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onView` | `(account: BankAccount) => void` | No | Callback when user clicks "View" action |
| `onEdit` | `(account: BankAccount) => void` | No | Callback when user clicks "Edit" action |

## Data Fetching

The component uses the `useBankAccounts` hook to fetch bank accounts from the API. It automatically handles:
- Loading states
- Error states
- Empty states
- Filtering by active status

## Masking Implementation

### Account Number Masking (Requirement 15.7)

Account numbers are masked to show only the last 4 digits:

```
Original: 1234567890
Masked:   •••• 7890
```

### IBAN Masking (Requirement 15.8)

IBANs are masked to show only the first 4 and last 4 characters:

```
Original: GB82WEST12345698765432
Masked:   GB82**************5432
```

## Filtering

The component provides three filter buttons:
- **All**: Shows all bank accounts
- **Active**: Shows only active accounts
- **Inactive**: Shows only inactive accounts

The filter is applied at the API level through the `useBankAccounts` hook.

## Search

Users can search accounts by:
- Bank name
- Account holder name
- Account number

Search is performed client-side on the fetched data.

## Actions

Each account row has a dropdown menu with the following actions:

1. **View** (if `onView` prop provided): View account details
2. **Edit** (if `onEdit` prop provided): Edit account information
3. **Activate/Deactivate**: Toggle account status

## Summary Statistics

The component displays summary statistics at the bottom:
- **Total Accounts**: Number of accounts matching current filter
- **Active**: Number of active accounts
- **Primary**: Number of primary accounts
- **Currencies**: Number of unique currencies

## States

### Loading State
Shows animated skeleton placeholders while data is being fetched.

### Error State
Displays an error message if the API request fails.

### Empty State
Shows a message when no accounts are found, with different messages for:
- No accounts at all
- No accounts matching search term
- No accounts matching status filter

## Testing

The component includes comprehensive unit tests covering:
- Loading state rendering
- Account display with masked fields
- Status filtering
- Empty state
- Error state
- Action callbacks
- Summary statistics

Run tests with:
```bash
npm run test:platform -- --testFile=BankAccountList.test.tsx
```

## Dependencies

- `@tanstack/react-query`: For data fetching and caching
- `@horizon-sync/ui`: UI component library (Card, Table, Button, Badge, etc.)
- `lucide-react`: Icons

## Related Components

- `BankAccountCard`: Card-based view of bank accounts
- `BankAccountManager`: Full management interface with create/edit forms
- `CreateBankAccountForm`: Form for creating new bank accounts
- `EditBankAccountForm`: Form for editing existing bank accounts

## API Integration

The component integrates with the following backend endpoints:
- `GET /api/v1/bank-accounts`: Fetch all bank accounts
- `PUT /api/v1/bank-accounts/{id}/activate`: Activate account
- `PUT /api/v1/bank-accounts/{id}/deactivate`: Deactivate account

## Future Enhancements

Potential improvements for future iterations:
- Pagination for large account lists
- Sorting by column headers
- Bulk actions (activate/deactivate multiple accounts)
- Export to CSV/PDF
- Advanced filtering (by currency, bank name, etc.)
- Column customization
