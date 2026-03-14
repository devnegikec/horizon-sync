# ReconciliationWorkspace Component

## Overview

The `ReconciliationWorkspace` component is the main reconciliation interface for the Bank Integration module. It provides a two-panel layout for viewing and reconciling bank transactions with journal entries.

## Features

### Display Components
- **Two-Panel Layout**: 
  - Left panel: Unreconciled bank transactions
  - Right panel: Unreconciled journal entries
- **Date Range Filter**: Filter transactions and journal entries by date range
- **Bank Account Selector**: Select which bank account to reconcile
- **Balance Summary**: Display bank balance, GL balance, and unreconciled amount

### Requirements Implemented
- **Requirement 7.1**: Display list of unreconciled bank transactions with status "cleared"
- **Requirement 7.2**: Display list of unreconciled journal entries within a date range
- **Requirement 14.8**: Calculate and display bank balance from bank_transactions
- **Requirement 14.9**: Calculate and display GL balance from journal_entries and unreconciled amount

## Usage

```tsx
import { ReconciliationWorkspace } from './features/banking/components/ReconciliationWorkspace';

function ReconciliationPage() {
  return (
    <div className="container mx-auto p-6">
      <ReconciliationWorkspace />
    </div>
  );
}
```

## Component Structure

### State Management
- `selectedBankAccountId`: Currently selected bank account
- `dateFrom`: Start date for filtering
- `dateTo`: End date for filtering
- `transactions`: List of unreconciled bank transactions
- `journalEntries`: List of unreconciled journal entries
- `balance`: Balance summary information

### Data Loading
The component automatically loads data when:
1. A bank account is selected
2. Date range is changed
3. User clicks the Refresh button

### API Endpoints Used
- `GET /api/v1/reconciliations/unreconciled-transactions`: Fetch unreconciled transactions
- `GET /api/v1/reconciliations/unreconciled-journal-entries`: Fetch unreconciled journal entries
- `GET /api/v1/bank-accounts/{id}/balance`: Fetch balance information

## Balance Summary

The balance summary displays four key metrics:

1. **Bank Balance**: Total balance calculated from bank transactions (cleared + reconciled)
2. **GL Balance**: Total balance calculated from journal entries
3. **Unreconciled Amount**: Difference between bank balance and GL balance
4. **Unreconciled Items**: Count of unreconciled transactions

## Transaction Display

### Bank Transactions Table
- **Date**: Statement date of the transaction
- **Description**: Transaction description
- **Reference**: Bank reference number
- **Amount**: Transaction amount (color-coded: green for credits, red for debits)

### Journal Entries Table
- **Date**: Posting date of the journal entry
- **Entry No**: Journal entry number (displayed as badge)
- **Reference**: Journal entry reference ID
- **Amount**: Entry amount

## Styling

The component uses:
- Tailwind CSS for styling
- shadcn/ui components (Card, Table, Select, Input, Button, Badge, Alert)
- Lucide React icons (RefreshCw, Loader2, AlertCircle)

## Error Handling

The component displays error messages in an Alert component when:
- API requests fail
- Selected bank account is not found
- Network errors occur

## Loading States

Loading indicators are shown for:
- Bank accounts list
- Unreconciled transactions
- Unreconciled journal entries
- Balance information

## Future Enhancements

The following features will be added in subsequent tasks:
- Transaction selection for manual reconciliation
- Drag-and-drop reconciliation
- Suggested matches display
- Auto-reconciliation trigger
- Reconciliation history view
- Export functionality

## Dependencies

- React hooks (useState, useEffect)
- shadcn/ui components
- Lucide React icons
- Custom hooks: `useBankAccounts`
- Services: `reconciliationService`
- Types: Banking types from `../types`

## Testing

Unit tests should cover:
- Component rendering with different states
- Filter changes and data loading
- Error handling
- Balance calculations display
- Transaction and journal entry list rendering

## Related Components

- `BankAccountList`: Lists all bank accounts
- `TransactionList`: Lists bank transactions
- `ManualReconciliationDialog`: (To be implemented) Manual reconciliation interface
- `SuggestedMatchesList`: (To be implemented) Auto-reconciliation suggestions
