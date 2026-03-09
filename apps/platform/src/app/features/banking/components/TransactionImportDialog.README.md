# TransactionImportDialog Component

## Overview

The `TransactionImportDialog` component provides a user interface for importing bank transactions from CSV, PDF, or MT940 files. It implements requirements 11.1-11.17, 12.1-12.11, and 20.1-20.8 from the bank integration specification.

## Features

### File Upload Support
- **CSV Files**: Standard comma-separated values format
- **PDF Files**: Bank statement PDFs with text extraction
- **MT940 Files**: SWIFT standard format for European banking

### Import Validation
- Validates file format and required columns
- Displays format-specific instructions
- Shows validation errors with row and column details
- Real-time feedback during import process

### Duplicate Detection
- Automatically detects duplicate transactions
- Shows duplicate warnings with counts
- Option to force import duplicates with flag
- Skips duplicates by default

### Import Summary
- Displays imported, skipped, and failed counts
- Visual progress indicator
- Color-coded status cards (green/yellow/red)
- Detailed error and warning messages
- Batch ID for tracking imports

## Usage

```tsx
import { TransactionImportDialog } from '@/features/banking/components';

function BankAccountPage() {
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const bankAccountId = 'your-bank-account-id';

    const handleImportComplete = () => {
        // Refresh transaction list or show success message
        console.log('Import completed successfully');
    };

    return (
        <>
            <Button onClick={() => setImportDialogOpen(true)}>
                Import Transactions
            </Button>

            <TransactionImportDialog
                open={importDialogOpen}
                onOpenChange={setImportDialogOpen}
                bankAccountId={bankAccountId}
                onImportComplete={handleImportComplete}
            />
        </>
    );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `open` | `boolean` | Yes | Controls dialog visibility |
| `onOpenChange` | `(open: boolean) => void` | Yes | Callback when dialog open state changes |
| `bankAccountId` | `string` | Yes | ID of the bank account to import transactions into |
| `onImportComplete` | `() => void` | No | Callback fired when import completes successfully |

## File Format Requirements

### CSV Format

Required columns:
- `date`: Transaction date in YYYY-MM-DD format
- `amount`: Transaction amount (numeric with up to 2 decimals)
- `description`: Transaction description (up to 500 characters)
- `reference`: Bank reference or transaction ID
- `type`: Transaction type (either "debit" or "credit")

Example:
```csv
date,amount,description,reference,type
2024-01-15,1500.00,Customer Payment - INV-001,TXN-12345,credit
2024-01-16,-250.50,Office Supplies,TXN-12346,debit
```

### PDF Format

Requirements:
- Standard bank statement format
- Text must be extractable (not scanned images)
- Supports multi-page statements
- Transaction type detected from amount sign or column position

### MT940 Format

SWIFT standard format with:
- `:60F:` - Opening balance
- `:61:` - Transaction statement
- `:86:` - Transaction details
- `:62F:` - Closing balance

## Import Process

1. **File Selection**: User selects a file (CSV, PDF, or MT940)
2. **Format Detection**: Component automatically detects format from file extension
3. **Instructions Display**: Shows format-specific requirements and examples
4. **Duplicate Options**: User can choose to force import duplicates
5. **Upload**: File is uploaded to backend API
6. **Validation**: Backend validates file format and data
7. **Import**: Transactions are created with status "cleared"
8. **Summary**: Component displays import results with counts and errors

## Duplicate Detection

Transactions are considered duplicates if they match on:
- Bank account ID
- Statement date
- Transaction amount
- Bank reference

By default, duplicates are skipped. Enable "Force Import Duplicates" to import them with `is_duplicate` flag set to true.

## Error Handling

The component displays three types of messages:

### Validation Errors (Red Alert)
- Missing required columns
- Invalid date format
- Invalid amount format
- Invalid transaction type
- Row and column details included

### Duplicate Warnings (Yellow Alert)
- Number of duplicates detected
- Option to force import
- List of duplicate references

### Import Errors (Red Alert)
- File upload failures
- API errors
- Network errors

## API Integration

The component uses the `useTransactionImport` hook which calls:

- `POST /api/v1/bank-accounts/{id}/import/csv`
- `POST /api/v1/bank-accounts/{id}/import/pdf`
- `POST /api/v1/bank-accounts/{id}/import/mt940`

Query parameters:
- `force_import`: boolean (default: false)

Response format:
```typescript
{
    imported_count: number;
    skipped_count: number;
    failed_count: number;
    errors: string[];
    warnings: string[];
    batch_id: string;
}
```

## Styling

The component uses:
- Shadcn UI components (Dialog, Button, Alert, Progress, Badge, Checkbox)
- Lucide React icons
- Tailwind CSS for styling
- Dark mode support

## Accessibility

- Proper ARIA labels on form controls
- Keyboard navigation support
- Screen reader friendly error messages
- Focus management in dialog

## Requirements Mapping

### Requirements 11.1-11.17 (CSV and PDF Import)
- ✅ 11.1: CSV file upload with required columns
- ✅ 11.2: PDF file upload support
- ✅ 11.3: Column validation
- ✅ 11.4: Date format validation (ISO 8601)
- ✅ 11.5: Amount format validation
- ✅ 11.6: Type validation (debit/credit)
- ✅ 11.7-11.10: PDF text extraction and parsing
- ✅ 11.11: Transaction creation with "cleared" status
- ✅ 11.12: Error messages with row/column details
- ✅ 11.13-11.14: Duplicate detection and skipping
- ✅ 11.15: Import summary with counts
- ✅ 11.16-11.17: Multi-page PDF support

### Requirements 12.1-12.11 (MT940 Import)
- ✅ 12.1: MT940 file upload
- ✅ 12.2-12.5: MT940 parsing (opening balance, transactions, details, closing balance)
- ✅ 12.6-12.9: Field extraction
- ✅ 12.10: Transaction creation
- ✅ 12.11: Error messages

### Requirements 20.1-20.8 (Duplicate Detection)
- ✅ 20.1-20.3: Duplicate detection logic
- ✅ 20.4: Skip duplicates by default
- ✅ 20.5: Log duplicate warnings
- ✅ 20.6: Duplicate count in summary
- ✅ 20.7: Force import option
- ✅ 20.8: Duplicate flag on forced imports

## Testing

To test the component:

1. **CSV Import**: Upload a valid CSV file and verify transactions are imported
2. **PDF Import**: Upload a bank statement PDF and verify parsing
3. **MT940 Import**: Upload an MT940 file and verify SWIFT parsing
4. **Validation Errors**: Upload invalid files and verify error messages
5. **Duplicate Detection**: Import same file twice and verify duplicates are skipped
6. **Force Import**: Enable force import and verify duplicates are imported with flag
7. **Error Handling**: Test with network errors and API failures

## Future Enhancements

- Drag and drop file upload
- Preview transactions before import
- Batch import multiple files
- Import history and rollback
- Custom field mapping for CSV
- Support for additional bank statement formats
