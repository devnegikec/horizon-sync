# ManualReconciliationDialog Component

## Overview

The `ManualReconciliationDialog` component provides a user interface for manually matching bank transactions with journal entries. It supports both one-to-one and many-to-one reconciliation scenarios, allowing users to select multiple journal entries that sum to match a single bank transaction amount.

## Requirements Implemented

- **Requirement 7.3**: Allow selection of one bank transaction and one or more journal entries
- **Requirement 7.4**: Set reconciliation_type to "manual" when user confirms
- **Requirement 7.5**: Set reconciliation_status to "confirmed" when user confirms
- **Requirement 7.6**: Update bank transaction status to "reconciled" when user confirms
- **Requirement 7.7**: Set reconciled_at to current timestamp when user confirms
- **Requirement 7.8**: Store user identifier in reconciled_by when user confirms
- **Requirement 7.9**: Allow users to add notes or remarks to manual reconciliations
- **Requirement 7.10**: Prevent reconciliation of already reconciled transactions
- **Requirement 10.1**: Allow selection of multiple journal entries to match one bank transaction
- **Requirement 10.2**: Calculate sum of all selected journal entry amounts
- **Requirement 10.3**: Allow reconciliation when sum equals bank transaction amount
- **Requirement 10.4**: Display difference and prevent reconciliation when amounts don't match
- **Requirement 10.5**: Create multiple reconciliation records for many-to-one matches
- **Requirement 10.6**: Set reconciliation_type to "many_to_one" for all matches
- **Requirement 10.7**: Set reconciliation_status to "confirmed" for all matches
- **Requirement 10.8**: Update bank transaction status to "reconciled"
- **Requirement 10.9**: Display all linked journal entries

## Features

### 1. Bank Transaction Display
- Shows selected bank transaction details:
  - Date
  - Amount (with color coding: green for credit, red for debit)
  - Description
  - Reference number

### 2. Journal Entry Selection
- Displays list of available unreconciled journal entries
- Allows multi-select using checkboxes
- Shows entry details:
  - Date
  - Entry number
  - Reference
  - Account code and name
  - Amount
- Highlights selected entries with background color
- Shows count of selected entries in badge

### 3. Amount Matching
- Calculates sum of selected journal entries in real-time
- Displays bank transaction amount
- Shows difference between transaction and journal entries sum
- Visual indicators:
  - Green checkmark when amounts match (within 0.01 tolerance)
  - Red X when amounts don't match
- Alert messages:
  - Success alert when amounts match
  - Error alert when amounts don't match, showing the difference

### 4. Notes Field
- Optional textarea for adding notes or remarks
- Supports multi-line text input
- Disabled during submission

### 5. Validation
- Prevents confirmation when:
  - No journal entries selected
  - Amounts don't match (difference > 0.01)
  - Submission is in progress
- Shows error messages for validation failures

### 6. Confirmation
- Confirm button enabled only when amounts match
- Shows loading state during submission
- Calls onConfirm callback with:
  - Transaction ID
  - Array of selected journal entry IDs
  - Optional notes

## Props

```typescript
interface ManualReconciliationDialogProps {
    // Dialog open state
    open: boolean;
    
    // Callback to change dialog open state
    onOpenChange: (open: boolean) => void;
    
    // Selected bank transaction to reconcile
    selectedTransaction: UnreconciledTransaction | null;
    
    // List of available journal entries for matching
    availableJournalEntries: UnreconciledJournalEntry[];
    
    // Currency code for formatting amounts
    currency: string;
    
    // Callback when reconciliation is confirmed
    onConfirm: (
        transactionId: string,
        journalEntryIds: string[],
        notes?: string
    ) => Promise<void>;
}
```

## Usage Example

```typescript
import { ManualReconciliationDialog } from './ManualReconciliationDialog';
import { reconciliationService } from '../services/reconciliationService';

function ReconciliationWorkspace() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [journalEntries, setJournalEntries] = useState([]);

    const handleConfirmReconciliation = async (
        transactionId: string,
        journalEntryIds: string[],
        notes?: string
    ) => {
        await reconciliationService.createManualReconciliation({
            bank_transaction_id: transactionId,
            journal_entry_ids: journalEntryIds,
            notes: notes,
        });
        
        // Refresh data after reconciliation
        await loadData();
    };

    return (
        <>
            {/* Transaction list with click handler */}
            <TransactionList
                transactions={transactions}
                onTransactionClick={(transaction) => {
                    setSelectedTransaction(transaction);
                    setDialogOpen(true);
                }}
            />

            {/* Manual reconciliation dialog */}
            <ManualReconciliationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                selectedTransaction={selectedTransaction}
                availableJournalEntries={journalEntries}
                currency="USD"
                onConfirm={handleConfirmReconciliation}
            />
        </>
    );
}
```

## State Management

The component manages the following internal state:

- `selectedJournalEntryIds`: Set of selected journal entry IDs
- `notes`: User-entered notes text
- `isSubmitting`: Loading state during submission
- `error`: Error message to display

State is automatically reset when:
- Dialog is closed
- Dialog is opened with a different transaction
- Transaction prop changes

## Calculations

### Sum Calculation
```typescript
const selectedJournalEntriesSum = availableJournalEntries
    .filter(entry => selectedJournalEntryIds.has(entry.id))
    .reduce((sum, entry) => sum + entry.amount, 0);
```

### Difference Calculation
```typescript
const difference = Math.abs(selectedTransaction.transaction_amount) - selectedJournalEntriesSum;
```

### Match Validation
```typescript
const amountsMatch = Math.abs(difference) < 0.01; // 0.01 tolerance for floating point
```

## Styling

The component uses:
- Tailwind CSS utility classes
- shadcn/ui component library
- Responsive grid layouts
- Color-coded amounts (green for credit, red for debit)
- Visual feedback for selection and matching states

## Accessibility

- Proper label associations
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Semantic HTML structure

## Error Handling

The component handles errors at multiple levels:

1. **Validation Errors**: Shown inline before submission
2. **API Errors**: Caught from onConfirm callback and displayed
3. **State Errors**: Prevents invalid states through disabled buttons

## Performance Considerations

- Uses `useMemo` for expensive calculations (sum, difference, match status)
- Efficient Set operations for selection management
- Minimal re-renders through proper state management

## Testing Considerations

Key scenarios to test:

1. **One-to-One Reconciliation**: Select single journal entry matching transaction
2. **Many-to-One Reconciliation**: Select multiple journal entries summing to transaction
3. **Amount Mismatch**: Verify button disabled when amounts don't match
4. **Empty Selection**: Verify button disabled when no entries selected
5. **Notes Field**: Verify notes are passed to onConfirm callback
6. **Error Handling**: Verify error display when onConfirm fails
7. **State Reset**: Verify state clears when dialog closes

## Future Enhancements

Potential improvements:

1. **Smart Suggestions**: Highlight journal entries that might match
2. **Bulk Selection**: Add "Select All" or "Select Matching" buttons
3. **Search/Filter**: Add search functionality for journal entries
4. **History**: Show previous reconciliation attempts
5. **Undo**: Allow undoing recent reconciliations
6. **Multi-Currency**: Support exchange rate input for cross-currency reconciliation
