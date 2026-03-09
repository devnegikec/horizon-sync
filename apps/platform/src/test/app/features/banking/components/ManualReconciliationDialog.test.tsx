import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ManualReconciliationDialog } from './ManualReconciliationDialog';
import { UnreconciledTransaction, UnreconciledJournalEntry } from '../types';

describe('ManualReconciliationDialog', () => {
    const mockTransaction: UnreconciledTransaction = {
        id: 'txn-1',
        organization_id: 'org-1',
        bank_account_id: 'bank-1',
        statement_date: '2024-01-15',
        transaction_amount: 1500.00,
        transaction_description: 'Customer Payment',
        bank_reference: 'TXN-12345',
        transaction_status: 'cleared',
        transaction_type: 'credit',
        imported_at: '2024-01-15T10:00:00Z',
    };

    const mockJournalEntries: UnreconciledJournalEntry[] = [
        {
            id: 'je-1',
            organization_id: 'org-1',
            entry_no: 'JE-001',
            posting_date: '2024-01-15',
            reference_id: 'INV-001',
            description: 'Invoice Payment',
            amount: 1000.00,
            account_id: 'acc-1',
            account_code: '1100',
            account_name: 'Accounts Receivable',
        },
        {
            id: 'je-2',
            organization_id: 'org-1',
            entry_no: 'JE-002',
            posting_date: '2024-01-15',
            reference_id: 'INV-002',
            description: 'Invoice Payment',
            amount: 500.00,
            account_id: 'acc-1',
            account_code: '1100',
            account_name: 'Accounts Receivable',
        },
    ];

    const mockOnConfirm = jest.fn();
    const mockOnOpenChange = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders dialog with transaction details', () => {
        render(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        expect(screen.getByText('Manual Reconciliation')).toBeInTheDocument();
        expect(screen.getByText('Customer Payment')).toBeInTheDocument();
        expect(screen.getByText('TXN-12345')).toBeInTheDocument();
    });

    it('displays available journal entries', () => {
        render(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        expect(screen.getByText('JE-001')).toBeInTheDocument();
        expect(screen.getByText('JE-002')).toBeInTheDocument();
        expect(screen.getByText('INV-001')).toBeInTheDocument();
        expect(screen.getByText('INV-002')).toBeInTheDocument();
    });

    it('allows selecting journal entries', () => {
        render(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        
        // Select first journal entry
        fireEvent.click(checkboxes[0]);
        
        // Verify selection count badge updates
        expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('calculates sum of selected journal entries', () => {
        render(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        
        // Select both journal entries
        fireEvent.click(checkboxes[0]);
        fireEvent.click(checkboxes[1]);
        
        // Verify sum is displayed (1000 + 500 = 1500)
        expect(screen.getByText(/\$1,500\.00/)).toBeInTheDocument();
    });

    it('shows match indicator when amounts match', () => {
        render(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        
        // Select both journal entries (sum = 1500, matches transaction)
        fireEvent.click(checkboxes[0]);
        fireEvent.click(checkboxes[1]);
        
        // Verify match message
        expect(screen.getByText(/Amounts match/)).toBeInTheDocument();
    });

    it('shows difference when amounts do not match', () => {
        render(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        
        // Select only first journal entry (sum = 1000, difference = 500)
        fireEvent.click(checkboxes[0]);
        
        // Verify difference message
        expect(screen.getByText(/Amounts do not match/)).toBeInTheDocument();
        expect(screen.getByText(/\$500\.00/)).toBeInTheDocument();
    });

    it('disables confirm button when amounts do not match', () => {
        render(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        const confirmButton = screen.getByRole('button', { name: /Confirm Reconciliation/ });
        
        // Select only first journal entry (amounts don't match)
        fireEvent.click(checkboxes[0]);
        
        // Verify button is disabled
        expect(confirmButton).toBeDisabled();
    });

    it('enables confirm button when amounts match', () => {
        render(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        const confirmButton = screen.getByRole('button', { name: /Confirm Reconciliation/ });
        
        // Select both journal entries (amounts match)
        fireEvent.click(checkboxes[0]);
        fireEvent.click(checkboxes[1]);
        
        // Verify button is enabled
        expect(confirmButton).not.toBeDisabled();
    });

    it('calls onConfirm with correct parameters', async () => {
        mockOnConfirm.mockResolvedValue(undefined);

        render(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        const confirmButton = screen.getByRole('button', { name: /Confirm Reconciliation/ });
        
        // Select both journal entries
        fireEvent.click(checkboxes[0]);
        fireEvent.click(checkboxes[1]);
        
        // Click confirm
        fireEvent.click(confirmButton);
        
        await waitFor(() => {
            expect(mockOnConfirm).toHaveBeenCalledWith(
                'txn-1',
                expect.arrayContaining(['je-1', 'je-2']),
                undefined
            );
        });
    });

    it('includes notes when provided', async () => {
        mockOnConfirm.mockResolvedValue(undefined);

        render(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        const notesTextarea = screen.getByPlaceholderText(/Add any notes/);
        const confirmButton = screen.getByRole('button', { name: /Confirm Reconciliation/ });
        
        // Select both journal entries
        fireEvent.click(checkboxes[0]);
        fireEvent.click(checkboxes[1]);
        
        // Add notes
        fireEvent.change(notesTextarea, { target: { value: 'Test reconciliation notes' } });
        
        // Click confirm
        fireEvent.click(confirmButton);
        
        await waitFor(() => {
            expect(mockOnConfirm).toHaveBeenCalledWith(
                'txn-1',
                expect.arrayContaining(['je-1', 'je-2']),
                'Test reconciliation notes'
            );
        });
    });

    it('displays error when onConfirm fails', async () => {
        mockOnConfirm.mockRejectedValue(new Error('Reconciliation failed'));

        render(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        const confirmButton = screen.getByRole('button', { name: /Confirm Reconciliation/ });
        
        // Select both journal entries
        fireEvent.click(checkboxes[0]);
        fireEvent.click(checkboxes[1]);
        
        // Click confirm
        fireEvent.click(confirmButton);
        
        await waitFor(() => {
            expect(screen.getByText('Reconciliation failed')).toBeInTheDocument();
        });
    });

    it('shows message when no journal entries available', () => {
        render(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={[]}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        expect(screen.getByText(/No unreconciled journal entries available/)).toBeInTheDocument();
    });

    it('resets state when dialog closes', () => {
        const { rerender } = render(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        const notesTextarea = screen.getByPlaceholderText(/Add any notes/);
        
        // Select entries and add notes
        fireEvent.click(checkboxes[0]);
        fireEvent.change(notesTextarea, { target: { value: 'Test notes' } });
        
        // Close dialog
        rerender(
            <ManualReconciliationDialog
                open={false}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        // Reopen dialog
        rerender(
            <ManualReconciliationDialog
                open={true}
                onOpenChange={mockOnOpenChange}
                selectedTransaction={mockTransaction}
                availableJournalEntries={mockJournalEntries}
                currency="USD"
                onConfirm={mockOnConfirm}
            />
        );

        // Verify state is reset
        expect(screen.getByText('0 selected')).toBeInTheDocument();
    });
});
