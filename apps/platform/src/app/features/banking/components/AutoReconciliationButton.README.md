# AutoReconciliationButton Component

## Overview

The `AutoReconciliationButton` component triggers the auto-reconciliation process and displays the results. It shows a progress indicator while running and then displays a summary of matches found (exact, fuzzy, and many-to-one).

## Requirements

**Validates: Requirements 8.1-8.10, 9.1-9.10, 10.10**

- Triggers auto-reconciliation for a specific bank account and date range
- Shows progress indicator during execution
- Displays results summary with match type breakdown
- Shows exact matches (auto-confirmed)
- Shows fuzzy matches (suggested, requiring manual confirmation)
- Shows many-to-one matches (suggested, requiring manual confirmation)
- Displays success rate and next steps

## Props

```typescript
interface AutoReconciliationButtonProps {
    bankAccountId: string;        // Bank account to reconcile
    dateFrom: string;              // Start date (YYYY-MM-DD)
    dateTo: string;                // End date (YYYY-MM-DD)
    onComplete?: () => void;       // Callback when reconciliation completes
    disabled?: boolean;            // Disable the button
}
```

## Usage

```tsx
import { AutoReconciliationButton } from './AutoReconciliationButton';

function ReconciliationPage() {
    const [bankAccountId, setBankAccountId] = useState('');
    const [dateFrom, setDateFrom] = useState('2024-01-01');
    const [dateTo, setDateTo] = useState('2024-01-31');

    const handleComplete = () => {
        console.log('Auto-reconciliation completed');
        // Refresh data, show notifications, etc.
    };

    return (
        <AutoReconciliationButton
            bankAccountId={bankAccountId}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onComplete={handleComplete}
        />
    );
}
```

## Features

### 1. Auto-Reconciliation Execution

- Calls the backend auto-reconciliation service
- Processes unreconciled transactions within the date range
- Applies exact match, fuzzy match, and many-to-one algorithms

### 2. Progress Indicator

- Shows loading spinner while reconciliation is running
- Disables button during execution to prevent duplicate runs
- Displays "Running Auto-Reconciliation..." text

### 3. Results Dialog

The results dialog displays:

- **Total Processed**: Number of transactions analyzed
- **Total Reconciled**: Number of transactions automatically reconciled
- **Exact Matches**: Transactions with perfect matches (auto-confirmed)
- **Fuzzy Matches**: Probable matches requiring manual confirmation
- **Many-to-One Matches**: Multiple journal entries matching one transaction
- **Success Rate**: Percentage of transactions automatically reconciled

### 4. Match Type Breakdown

Each match type is displayed with:
- Icon and color coding
- Count badge
- Description of what the match type means

**Exact Matches** (Green):
- Amount, date, and reference all match exactly
- Automatically confirmed (status: "confirmed")
- Transaction status updated to "reconciled"

**Fuzzy Matches** (Yellow):
- Amount matches exactly
- Date within 3 days
- Reference partial match (optional)
- Status: "suggested" (requires manual confirmation)

**Many-to-One Matches** (Purple):
- Multiple journal entries sum to one transaction amount
- Within 7-day date range
- Status: "suggested" (requires manual confirmation)

### 5. Next Steps Guidance

If there are suggested matches (fuzzy or many-to-one), the dialog shows:
- Alert with next steps
- Guidance to review suggested matches
- Instructions to confirm or reject suggestions

## Auto-Reconciliation Algorithm

The backend service applies three matching strategies:

### 1. Exact Match (Requirements 8.1-8.10)

```
Match Criteria:
- transaction_amount == journal_entry.amount
- statement_date == posting_date
- bank_reference == reference_id

Result:
- reconciliation_type: "auto_exact"
- reconciliation_status: "confirmed"
- match_confidence: 1.0
- Transaction status: "reconciled"
```

### 2. Fuzzy Match (Requirements 9.1-9.10)

```
Match Criteria:
- transaction_amount == journal_entry.amount (required)
- statement_date within 3 days of posting_date
- bank_reference partial match with reference_id (optional)

Confidence Calculation:
- Amount + Date: 0.8
- Amount + Date + Reference: 0.95

Result:
- reconciliation_type: "auto_fuzzy"
- reconciliation_status: "suggested"
- match_confidence: 0.8 or 0.95
- Transaction status: unchanged (remains "cleared")
```

### 3. Many-to-One Match (Requirement 10.10)

```
Match Criteria:
- Sum of multiple journal entries == transaction_amount
- All journal entries within 7 days of transaction date
- Tolerance: 0.01

Result:
- reconciliation_type: "many_to_one"
- reconciliation_status: "suggested"
- Multiple reconciliation records created
- Transaction status: unchanged (remains "cleared")
```

## Error Handling

The component handles errors gracefully:

- Network errors: Displays error alert below button
- API errors: Shows error message from backend
- Validation errors: Button disabled if required props missing

## Integration

### With ReconciliationWorkspace

```tsx
<ReconciliationWorkspace>
    <AutoReconciliationButton
        bankAccountId={selectedBankAccountId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onComplete={handleRefresh}
    />
</ReconciliationWorkspace>
```

### With SuggestedMatchesList

After auto-reconciliation completes, suggested matches appear in the `SuggestedMatchesList` component:

```tsx
<AutoReconciliationButton
    bankAccountId={bankAccountId}
    dateFrom={dateFrom}
    dateTo={dateTo}
    onComplete={() => {
        // Refresh suggested matches list
        loadSuggestedMatches();
    }}
/>

<SuggestedMatchesList
    bankAccountId={bankAccountId}
    dateFrom={dateFrom}
    dateTo={dateTo}
/>
```

## API Endpoint

The component calls:

```
POST /api/v1/reconciliations/auto-run

Request Body:
{
    "bank_account_id": "uuid",
    "date_from": "2024-01-01",
    "date_to": "2024-01-31"
}

Response:
{
    "exact_matches": 15,
    "fuzzy_matches": 8,
    "many_to_one_matches": 2,
    "total_processed": 50,
    "total_reconciled": 15
}
```

## Styling

The component uses:
- Tailwind CSS for styling
- shadcn/ui components (Button, Dialog, Badge, Alert)
- Color coding for match types:
  - Green: Exact matches (confirmed)
  - Yellow: Fuzzy matches (suggested)
  - Purple: Many-to-one matches (suggested)
  - Blue: Total processed
  - Green gradient: Success rate

## Accessibility

- Button has proper disabled state
- Loading state with spinner and text
- Dialog with proper ARIA labels
- Keyboard navigation support
- Screen reader friendly descriptions

## Testing

See `AutoReconciliationButton.test.tsx` for unit tests covering:
- Button click triggers auto-reconciliation
- Progress indicator displays during execution
- Results dialog shows correct data
- Error handling displays error messages
- Callback invoked on completion
- Button disabled when required props missing
