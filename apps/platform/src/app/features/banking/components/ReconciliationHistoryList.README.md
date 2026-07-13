# ReconciliationHistoryList Component

## Overview

The `ReconciliationHistoryList` component displays the complete history of bank reconciliations, including both active and undone reconciliations. It provides functionality to undo reconciliations with a confirmation dialog and detailed audit trail.

## Requirements

Implements requirements 17.1-17.10 from the Bank Integration specification:
- Display reconciliation history with status
- Show reconciliation_type, reconciled_by, reconciled_at
- Implement undo action with confirmation dialog
- Show undo history (rejected reconciliations)
- Prevent undoing reconciliations older than 90 days without elevated permissions
- Log undo actions with user identifier and timestamp

## Features

### Display Features
- **Reconciliation List**: Shows all reconciliations with detailed information
- **Status Badges**: Visual indicators for confirmed, rejected, and undone reconciliations
- **Type Badges**: Displays reconciliation type (Manual, Auto Exact, Auto Fuzzy, Many-to-One)
- **Transaction Details**: Shows bank transaction and journal entry information
- **Undo History**: Displays who undid a reconciliation, when, and why

### Undo Functionality
- **Undo Button**: Available only for active, confirmed reconciliations
- **Confirmation Dialog**: Requires user to provide a reason for undoing
- **90-Day Warning**: Shows warning for reconciliations older than 90 days
- **Audit Trail**: Logs all undo actions with timestamp and reason

### Filtering
- Filter by bank account
- Filter by date range
- Includes both active and rejected reconciliations

## Props

```typescript
interface ReconciliationHistoryListProps {
    bankAccountId?: string;        // Filter by specific bank account
    dateFrom?: string;              // Start date for filtering (ISO format)
    dateTo?: string;                // End date for filtering (ISO format)
    onReconciliationUndone?: () => void;  // Callback when reconciliation is undone
}
```

## Usage

### Basic Usage

```tsx
import { ReconciliationHistoryList } from './ReconciliationHistoryList';

function ReconciliationPage() {
    return (
        <ReconciliationHistoryList />
    );
}
```

### With Filters

```tsx
import { ReconciliationHistoryList } from './ReconciliationHistoryList';

function ReconciliationPage() {
    const handleUndone = () => {
        console.log('Reconciliation was undone');
        // Refresh other components
    };

    return (
        <ReconciliationHistoryList
            bankAccountId="bank-account-123"
            dateFrom="2024-01-01"
            dateTo="2024-01-31"
            onReconciliationUndone={handleUndone}
        />
    );
}
```

### In Reconciliation Workspace

```tsx
import { ReconciliationWorkspace } from './ReconciliationWorkspace';
import { ReconciliationHistoryList } from './ReconciliationHistoryList';

function ReconciliationDashboard() {
    const [selectedBankAccount, setSelectedBankAccount] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });

    const handleUndone = () => {
        // Refresh workspace data
        loadReconciliationData();
    };

    return (
        <div className="space-y-4">
            <ReconciliationWorkspace
                bankAccountId={selectedBankAccount}
                dateFrom={dateRange.from}
                dateTo={dateRange.to}
            />
            <ReconciliationHistoryList
                bankAccountId={selectedBankAccount}
                dateFrom={dateRange.from}
                dateTo={dateRange.to}
                onReconciliationUndone={handleUndone}
            />
        </div>
    );
}
```

## Component Structure

### Main Table Columns
1. **Date**: Reconciliation date
2. **Bank Transaction**: Transaction date, description, and reference
3. **Journal Entry**: Entry number and posting date
4. **Amount**: Transaction amount
5. **Type**: Reconciliation type badge
6. **Status**: Status badge (Confirmed/Undone)
7. **Reconciled By**: User who performed reconciliation or undo
8. **Actions**: Undo button (when applicable)

### Undo Dialog
- **Transaction Details**: Shows bank transaction and journal entry information
- **Reconciliation Metadata**: Type, reconciled by, reconciled at, notes
- **90-Day Warning**: Alert for old reconciliations
- **Reason Input**: Required text area for undo reason
- **Actions**: Cancel and Undo buttons

## Business Rules

### Undo Eligibility
A reconciliation can be undone if:
1. It is currently active (`is_active = true`)
2. Its status is "confirmed"
3. For reconciliations older than 90 days, elevated permissions are required (warning shown)

### Undo Process
When a reconciliation is undone:
1. Reconciliation status is updated to "rejected"
2. Bank transaction status reverts to "cleared"
3. `reconciled_at` and `reconciled_by` are set to null
4. Undo action is logged with user, timestamp, and reason
5. Original reconciliation record is preserved (not deleted)

## API Integration

The component uses the `reconciliationService` with the following methods:

```typescript
// Get reconciliation history
reconciliationService.getReconciliationHistory(
    bankAccountId?: string,
    dateFrom?: string,
    dateTo?: string,
    includeRejected: boolean = true
): Promise<ReconciliationHistory[]>

// Undo a reconciliation
reconciliationService.undoReconciliation(
    reconciliationId: string,
    request: { reason: string }
): Promise<void>
```

## Styling

The component uses:
- Shadcn UI components (Card, Table, Dialog, Badge, Button)
- Tailwind CSS for styling
- Lucide React icons (History, Undo2, CheckCircle, XCircle, AlertCircle)

### Status Colors
- **Confirmed**: Green badge with checkmark
- **Undone**: Red badge with X icon
- **Rejected**: Red badge with X icon

### Type Colors
- **Manual**: Default badge
- **Auto (Exact)**: Secondary badge
- **Auto (Fuzzy)**: Outline badge
- **Many-to-One**: Outline badge

## Error Handling

The component handles errors gracefully:
- Loading state with spinner
- Error alerts for API failures
- Empty state when no history exists
- Validation for required undo reason

## Accessibility

- Semantic HTML with proper table structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader friendly status badges
- Focus management in dialogs

## Testing

The component includes comprehensive tests:
- Rendering and display tests
- Undo dialog interaction tests
- API integration tests
- Error handling tests
- Filter functionality tests
- 90-day warning tests

Run tests:
```bash
npm test ReconciliationHistoryList.test.tsx
```

## Related Components

- `ReconciliationWorkspace`: Main reconciliation interface
- `SuggestedMatchesList`: Displays suggested matches
- `ManualReconciliationDialog`: Manual reconciliation interface

## Future Enhancements

1. **Elevated Permissions**: Implement actual permission checks for 90-day rule
2. **Bulk Undo**: Allow undoing multiple reconciliations at once
3. **Export**: Export history to CSV/PDF
4. **Advanced Filters**: Filter by type, status, user
5. **Pagination**: Handle large history datasets
6. **Search**: Search by transaction description or reference
