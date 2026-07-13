# TransactionList Component

## Overview

The `TransactionList` component displays a paginated, filterable list of bank transactions for a specific bank account. It implements requirements 3.1-3.11 from the bank integration specification.

## Features

### Display Fields (Requirements 3.1-3.11)
- **Statement Date**: Transaction date from bank statement
- **Amount**: Transaction amount with color coding (red for debits, green for credits)
- **Description**: Transaction description text
- **Reference**: Bank reference number
- **Status**: Transaction status badge (pending, cleared, reconciled, void)
- **Type**: Transaction type with icon (debit/credit)

### Filtering Capabilities
- **Status Filter**: Filter by transaction status (pending, cleared, reconciled, void)
- **Type Filter**: Filter by transaction type (debit, credit)
- **Date Range**: Filter by date range (from/to dates)
- **Search**: Search in description or reference fields

### Sorting
- Transactions are sorted by date (most recent first) by default
- Amount sorting available through backend API

### Duplicate Detection
- Transactions marked as duplicates are highlighted with yellow background
- Warning icon displayed for duplicate transactions
- Implements requirement 20.1-20.8 for duplicate detection

### Pagination
- Page size: 20 transactions per page
- Navigation controls (Previous/Next)
- Page indicator showing current page and total pages
- Total count display

## Usage

```tsx
import { TransactionList } from '@/features/banking/components/TransactionList';

function BankAccountPage() {
    const bankAccountId = 'account-uuid';
    
    return (
        <div>
            <TransactionList bankAccountId={bankAccountId} />
        </div>
    );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `bankAccountId` | `string` | Yes | UUID of the bank account to display transactions for |

## API Integration

The component uses the `useBankTransactions` hook which calls:
- **Endpoint**: `GET /api/v1/bank-accounts/{id}/transactions`
- **Query Parameters**:
  - `page`: Page number (1-based)
  - `page_size`: Number of items per page
  - `status`: Filter by status
  - `transaction_type`: Filter by type
  - `date_from`: Filter from date (YYYY-MM-DD)
  - `date_to`: Filter to date (YYYY-MM-DD)
  - `search`: Search term

## Styling

The component uses:
- Shadcn UI components (Card, Table, Badge, Select, Input, Button)
- Lucide React icons
- Tailwind CSS for styling
- Color coding:
  - Red text for debit amounts
  - Green text for credit amounts
  - Yellow background for duplicate transactions
  - Status-specific badge colors

## Testing

Run tests with:
```bash
npm test TransactionList.test.tsx
```

Test coverage includes:
- Rendering transaction list with data
- Duplicate transaction highlighting
- Empty state display
- Error handling
- Filter controls rendering

## Related Components

- `BankAccountDetail`: Parent component that may include transaction list
- `TransactionImportDialog`: Component for importing transactions
- `ReconciliationWorkspace`: Component for reconciling transactions

## Requirements Mapping

This component implements the following requirements:
- **3.1-3.11**: Bank transaction fields and display
- **20.1-20.8**: Duplicate transaction detection and flagging

## Future Enhancements

- Bulk selection for reconciliation
- Export to CSV/PDF
- Transaction detail modal
- Inline editing for descriptions
- Advanced sorting options
- Column customization
