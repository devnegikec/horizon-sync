import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionImportDialog } from './TransactionImportDialog';
import { useTransactionImport } from '../hooks/useTransactionImport';

// Mock the useTransactionImport hook
jest.mock('../hooks/useTransactionImport');

const mockImportTransactions = jest.fn();
const mockOnOpenChange = jest.fn();
const mockOnImportComplete = jest.fn();

describe('TransactionImportDialog', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (useTransactionImport as jest.Mock).mockReturnValue({
            importTransactions: mockImportTransactions,
        });
    });

    it('renders dialog when open', () => {
        render(
            <TransactionImportDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
            />
        );

        expect(screen.getByText('Import Bank Transactions')).toBeInTheDocument();
        expect(screen.getByText(/Upload a CSV, PDF, or MT940 file/)).toBeInTheDocument();
    });

    it('does not render dialog when closed', () => {
        render(
            <TransactionImportDialog
                open={false}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
            />
        );

        expect(screen.queryByText('Import Bank Transactions')).not.toBeInTheDocument();
    });

    it('detects CSV format from file extension', () => {
        render(
            <TransactionImportDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
            />
        );

        const file = new File(['date,amount,description,reference,type'], 'transactions.csv', {
            type: 'text/csv',
        });

        const input = screen.getByLabelText('Select File') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByText('CSV')).toBeInTheDocument();
        expect(screen.getByText('CSV Format Requirements')).toBeInTheDocument();
    });

    it('detects PDF format from file extension', () => {
        render(
            <TransactionImportDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
            />
        );

        const file = new File(['PDF content'], 'statement.pdf', {
            type: 'application/pdf',
        });

        const input = screen.getByLabelText('Select File') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByText('PDF')).toBeInTheDocument();
        expect(screen.getByText('PDF Format Requirements')).toBeInTheDocument();
    });

    it('detects MT940 format from file extension', () => {
        render(
            <TransactionImportDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
            />
        );

        const file = new File(['MT940 content'], 'statement.mt940', {
            type: 'text/plain',
        });

        const input = screen.getByLabelText('Select File') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByText('MT940')).toBeInTheDocument();
        expect(screen.getByText('MT940 Format Requirements')).toBeInTheDocument();
    });

    it('enables import button when file is selected', () => {
        render(
            <TransactionImportDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
            />
        );

        const importButton = screen.getByRole('button', { name: /Import Transactions/i });
        expect(importButton).toBeDisabled();

        const file = new File(['date,amount,description,reference,type'], 'transactions.csv', {
            type: 'text/csv',
        });

        const input = screen.getByLabelText('Select File') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        expect(importButton).not.toBeDisabled();
    });

    it('calls importTransactions with correct parameters', async () => {
        mockImportTransactions.mockResolvedValue({
            imported_count: 10,
            skipped_count: 2,
            failed_count: 0,
            errors: [],
            warnings: ['2 duplicates skipped'],
            batch_id: 'batch-123',
        });

        render(
            <TransactionImportDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
            />
        );

        const file = new File(['date,amount,description,reference,type'], 'transactions.csv', {
            type: 'text/csv',
        });

        const input = screen.getByLabelText('Select File') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        const importButton = screen.getByRole('button', { name: /Import Transactions/i });
        fireEvent.click(importButton);

        await waitFor(() => {
            expect(mockImportTransactions).toHaveBeenCalledWith(file, 'csv', false);
        });
    });

    it('displays import summary after successful import', async () => {
        mockImportTransactions.mockResolvedValue({
            imported_count: 10,
            skipped_count: 2,
            failed_count: 1,
            errors: ['Row 5: Invalid date format'],
            warnings: ['2 duplicates skipped'],
            batch_id: 'batch-123',
        });

        render(
            <TransactionImportDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
            />
        );

        const file = new File(['date,amount,description,reference,type'], 'transactions.csv', {
            type: 'text/csv',
        });

        const input = screen.getByLabelText('Select File') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        const importButton = screen.getByRole('button', { name: /Import Transactions/i });
        fireEvent.click(importButton);

        await waitFor(() => {
            expect(screen.getByText('10')).toBeInTheDocument(); // Imported count
            expect(screen.getByText('2')).toBeInTheDocument(); // Skipped count
            expect(screen.getByText('1')).toBeInTheDocument(); // Failed count
            expect(screen.getByText('Row 5: Invalid date format')).toBeInTheDocument();
            expect(screen.getByText(/2 duplicates skipped/)).toBeInTheDocument();
        });
    });

    it('handles force import option', async () => {
        mockImportTransactions.mockResolvedValue({
            imported_count: 12,
            skipped_count: 0,
            failed_count: 0,
            errors: [],
            warnings: [],
            batch_id: 'batch-123',
        });

        render(
            <TransactionImportDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
            />
        );

        const file = new File(['date,amount,description,reference,type'], 'transactions.csv', {
            type: 'text/csv',
        });

        const input = screen.getByLabelText('Select File') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        const forceImportCheckbox = screen.getByLabelText('Force Import Duplicates');
        fireEvent.click(forceImportCheckbox);

        const importButton = screen.getByRole('button', { name: /Import Transactions/i });
        fireEvent.click(importButton);

        await waitFor(() => {
            expect(mockImportTransactions).toHaveBeenCalledWith(file, 'csv', true);
        });
    });

    it('displays error message on import failure', async () => {
        mockImportTransactions.mockRejectedValue(new Error('Network error'));

        render(
            <TransactionImportDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
            />
        );

        const file = new File(['date,amount,description,reference,type'], 'transactions.csv', {
            type: 'text/csv',
        });

        const input = screen.getByLabelText('Select File') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        const importButton = screen.getByRole('button', { name: /Import Transactions/i });
        fireEvent.click(importButton);

        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument();
        });
    });

    it('calls onImportComplete callback on successful import', async () => {
        mockImportTransactions.mockResolvedValue({
            imported_count: 10,
            skipped_count: 0,
            failed_count: 0,
            errors: [],
            warnings: [],
            batch_id: 'batch-123',
        });

        render(
            <TransactionImportDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
                onImportComplete={mockOnImportComplete}
            />
        );

        const file = new File(['date,amount,description,reference,type'], 'transactions.csv', {
            type: 'text/csv',
        });

        const input = screen.getByLabelText('Select File') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        const importButton = screen.getByRole('button', { name: /Import Transactions/i });
        fireEvent.click(importButton);

        await waitFor(() => {
            expect(mockOnImportComplete).toHaveBeenCalled();
        });
    });

    it('resets state when dialog is closed', () => {
        const { rerender } = render(
            <TransactionImportDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
            />
        );

        const file = new File(['date,amount,description,reference,type'], 'transactions.csv', {
            type: 'text/csv',
        });

        const input = screen.getByLabelText('Select File') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        expect(screen.getByText('CSV')).toBeInTheDocument();

        // Close dialog
        rerender(
            <TransactionImportDialog
                open={false}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
            />
        );

        // Reopen dialog
        rerender(
            <TransactionImportDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                bankAccountId="test-account-id"
            />
        );

        // State should be reset
        expect(screen.queryByText('CSV')).not.toBeInTheDocument();
    });
});
