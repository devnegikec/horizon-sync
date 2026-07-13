# ReconciliationReport Component

## Overview

The `ReconciliationReport` component displays a comprehensive reconciliation report with filtering, grouping, and export capabilities. It shows all transactions with their reconciliation status and allows exporting to CSV and PDF formats.

## Features

- **Filtering**: Filter by bank account, date range, and transaction status
- **Summary Statistics**: Display total imported, reconciled, and unreconciled transactions with amounts
- **Grouped Display**: Transactions are grouped by status (reconciled, cleared, pending, void)
- **Export Options**: Export report to CSV or PDF format
- **Report Metadata**: Shows report generation timestamp and user who generated it
- **Matched Journal Entries**: Displays linked journal entries for reconciled transactions

## Props

```typescript
interface ReconciliationReportProps {
    bankAccountId?: string;  // Optional: Pre-select a bank account
}
```

## Usage

### Basic Usage

```tsx
import { ReconciliationReport } from './ReconciliationReport';

function ReportPage() {
    return <ReconciliationReport />;
}
```

### With Pre-selected Bank Account

```tsx
import { ReconciliationReport } from './ReconciliationReport';

function BankAccountReportPage() {
    const bankAccountId = 'account-uuid-here';
    
    return <ReconciliationReport bankAccountId={bankAccountId} />;
}
```

## Report Structure

### Filters
- **Bank Account**: Select the bank account to report on (required)
- **Date Range**: From and To dates (required)
- **Status**: Filter by transaction status (all, reconciled, cleared, pending, void)

### Summary Section
Displays three key metrics:
1. **Total Imported**: Count and total amount of all imported transactions
2. **Total Reconciled**: Count and total amount of reconciled transactions
3. **Total Unreconciled**: Count and total amount of unreconciled transactions

### Transaction Groups
Transactions are displayed in separate tables grouped by status:
- **Reconciled Transactions**: Transactions that have been matched to journal entries
- **Cleared Transactions**: Transactions imported but not yet reconciled
- **Pending Transactions**: Transactions awaiting clearance
- **Void Transactions**: Cancelled or voided transactions

### Transaction Columns
Each transaction displays:
- **Date**: Statement date
- **Description**: Transaction description
- **Reference**: Bank reference number
- **Amount**: Transaction amount with debit/credit indicator
- **Status**: Current transaction status with color-coded badge
- **Matched Journal Entry**: Linked journal entry number and date (for reconciled transactions)

## Export Functionality

### CSV Export
- Downloads a CSV file with all filtered transactions
- Filename format: `reconciliation-report-YYYY-MM-DD.csv`
- Includes all transaction details and summary information

### PDF Export
- Downloads a formatted PDF report
- Filename format: `reconciliation-report-YYYY-MM-DD.pdf`
- Includes summary, grouped transactions, and report metadata

## API Integration

The component uses the `reconciliationService` to interact with the backend:

### Endpoints Used
- `GET /reconciliations/report` - Fetch report data
- `GET /reconciliations/report/export/csv` - Export to CSV
- `GET /reconciliations/report/export/pdf` - Export to PDF

### Data Flow
1. User sets filters (bank account, date range, status)
2. Component calls `getReconciliationReport()` with filters
3. Backend returns report data with summary and transactions
4. Component groups transactions by status and displays them
5. User can export to CSV or PDF using export buttons

## Styling

The component uses:
- **shadcn/ui** components for consistent styling
- **Tailwind CSS** for layout and spacing
- **Lucide React** icons for visual elements
- **Color coding**: 
  - Green for credits and reconciled items
  - Red for debits
  - Orange for unreconciled items
  - Status-specific badge colors

## Error Handling

- Displays error messages in a destructive-styled alert
- Handles API errors gracefully
- Shows loading states during data fetching and export operations
- Validates required filters before allowing report generation

## Requirements Validation

This component validates the following requirements from the spec:

- **16.1**: Display reconciliation report with filters (bank_account, date_range, status)
- **16.2**: Show transaction list with columns: date, amount, description, status, matched_journal_entry
- **16.3**: Display summary: total_imported, total_reconciled, total_unreconciled
- **16.4**: Group transactions by status
- **16.5**: Implement export buttons (CSV, PDF)
- **16.6**: Show report generation timestamp and generated_by

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly labels
- Color contrast compliance
- Loading states with aria-live regions

## Performance Considerations

- Efficient grouping of transactions using filter operations
- Lazy loading of report data (only when filters are complete)
- Optimized re-renders using React hooks
- Blob URLs properly cleaned up after downloads

## Future Enhancements

- Add pagination for large transaction lists
- Support for multiple bank accounts in one report
- Custom date range presets (last 30 days, last quarter, etc.)
- Print functionality
- Email report functionality
- Scheduled report generation
- Report templates and customization
