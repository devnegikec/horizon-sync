import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReconciliationHistoryList } from './ReconciliationHistoryList';
import { reconciliationService } from '../services/reconciliationService';
import { ReconciliationHistory } from '../types';

// Mock the reconciliation service
jest.mock('../services/reconciliationService', () => ({
    reconciliationService: {
        getReconciliationHistory: jest.fn(),
        undoReconciliation: jest.fn(),
    },
}));

describe('ReconciliationHistoryList', () => {
    const mockHistory: ReconciliationHistory[] = [
        {
            id: 'rec-1',
            organization_id: 'org-1',
            bank_transaction_id: 'txn-1',
            journal_entry_id: 'je-1',
            reconciliation_type: 'manual',
            reconciliation_status: 'confirmed',
            match_confidence: 1.0,
            reconciled_by: 'john.doe@example.com',
            reconciled_at: '2024-01-15T10:30:00Z',
            notes: 'Manual reconciliation',
            is_active: true,
            bank_transaction: {
                id: 'txn-1',
                statement_date: '2024-01-15',
                transaction_amount: 1500.00,
                transaction_description: 'Customer Payment',
                bank_reference: 'REF-001',
                transaction_type: 'credit',
            },
            journal_entry: {
                id: 'je-1',
                entry_no: 'JE-2024-001',
                posting_date: '2024-01-15',
                reference_id: 'INV-001',
                amount: 1500.00,
            },
        },
        {
            id: 'rec-2',
            organization_id: 'org-1',
            bank_transaction_id: 'txn-2',
            journal_entry_id: 'je-2',
            reconciliation_type: 'auto_exact',
            reconciliation_status: 'confirmed',
            match_confidence: 1.0,
            reconciled_by: 'system',
            reconciled_at: '2024-01-16T14:20:00Z',
            is_active: false,
            undone_by: 'jane.smith@example.com',
            undone_at: '2024-01-17T09:00:00Z',
            undo_reason: 'Incorrect match',
            bank_transaction: {
                id: 'txn-2',
                statement_date: '2024-01-16',
                transaction_amount: 2500.00,
                transaction_description: 'Wire Transfer',
                bank_reference: 'REF-002',
                transaction_type: 'credit',
            },
            journal_entry: {
                id: 'je-2',
                entry_no: 'JE-2024-002',
                posting_date: '2024-01-16',
                reference_id: 'INV-002',
                amount: 2500.00,
            },
        },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render loading state initially', () => {
        (reconciliationService.getReconciliationHistory as jest.Mock).mockImplementation(
            () => new Promise(() => {}) // Never resolves
        );

        render(<ReconciliationHistoryList />);

        expect(screen.getByText('Loading reconciliation history...')).toBeInTheDocument();
    });

    it('should display reconciliation history', async () => {
        (reconciliationService.getReconciliationHistory as jest.Mock).mockResolvedValue(mockHistory);

        render(<ReconciliationHistoryList />);

        await waitFor(() => {
            expect(screen.getByText('JE-2024-001')).toBeInTheDocument();
            expect(screen.getByText('JE-2024-002')).toBeInTheDocument();
        });

        // Check that amounts are displayed
        expect(screen.getByText('$1,500.00')).toBeInTheDocument();
        expect(screen.getByText('$2,500.00')).toBeInTheDocument();

        // Check reconciliation types
        expect(screen.getByText('Manual')).toBeInTheDocument();
        expect(screen.getByText('Auto (Exact)')).toBeInTheDocument();

        // Check reconciled by
        expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
        expect(screen.getByText('system')).toBeInTheDocument();
    });

    it('should display undo history', async () => {
        (reconciliationService.getReconciliationHistory as jest.Mock).mockResolvedValue(mockHistory);

        render(<ReconciliationHistoryList />);

        await waitFor(() => {
            expect(screen.getByText('Undone by: jane.smith@example.com')).toBeInTheDocument();
            expect(screen.getByText('Reason: Incorrect match')).toBeInTheDocument();
        });
    });

    it('should show undo button only for active confirmed reconciliations', async () => {
        (reconciliationService.getReconciliationHistory as jest.Mock).mockResolvedValue(mockHistory);

        render(<ReconciliationHistoryList />);

        await waitFor(() => {
            const undoButtons = screen.getAllByRole('button', { name: /undo/i });
            // Only one undo button should be visible (for the active reconciliation)
            expect(undoButtons).toHaveLength(1);
        });
    });

    it('should open undo confirmation dialog when undo button is clicked', async () => {
        const user = userEvent.setup();
        (reconciliationService.getReconciliationHistory as jest.Mock).mockResolvedValue(mockHistory);

        render(<ReconciliationHistoryList />);

        await waitFor(() => {
            expect(screen.getByText('JE-2024-001')).toBeInTheDocument();
        });

        const undoButton = screen.getByRole('button', { name: /undo/i });
        await user.click(undoButton);

        // Check dialog is open
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Undo Reconciliation')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to undo this reconciliation/i)).toBeInTheDocument();
    });

    it('should display reconciliation details in undo dialog', async () => {
        const user = userEvent.setup();
        (reconciliationService.getReconciliationHistory as jest.Mock).mockResolvedValue(mockHistory);

        render(<ReconciliationHistoryList />);

        await waitFor(() => {
            expect(screen.getByText('JE-2024-001')).toBeInTheDocument();
        });

        const undoButton = screen.getByRole('button', { name: /undo/i });
        await user.click(undoButton);

        const dialog = screen.getByRole('dialog');
        
        // Check transaction details are shown
        expect(within(dialog).getByText('Customer Payment')).toBeInTheDocument();
        expect(within(dialog).getByText('REF-001')).toBeInTheDocument();
        expect(within(dialog).getByText('Manual reconciliation')).toBeInTheDocument();
    });

    it('should require reason when undoing reconciliation', async () => {
        const user = userEvent.setup();
        (reconciliationService.getReconciliationHistory as jest.Mock).mockResolvedValue(mockHistory);

        render(<ReconciliationHistoryList />);

        await waitFor(() => {
            expect(screen.getByText('JE-2024-001')).toBeInTheDocument();
        });

        const undoButton = screen.getByRole('button', { name: /undo/i });
        await user.click(undoButton);

        const dialog = screen.getByRole('dialog');
        const confirmButton = within(dialog).getByRole('button', { name: /undo reconciliation/i });

        // Button should be disabled without reason
        expect(confirmButton).toBeDisabled();

        // Enter reason
        const reasonInput = within(dialog).getByPlaceholderText(/Explain why this reconciliation needs to be undone/i);
        await user.type(reasonInput, 'Wrong transaction matched');

        // Button should now be enabled
        expect(confirmButton).toBeEnabled();
    });

    it('should call undoReconciliation service when confirmed', async () => {
        const user = userEvent.setup();
        const mockOnUndone = jest.fn();
        (reconciliationService.getReconciliationHistory as jest.Mock).mockResolvedValue(mockHistory);
        (reconciliationService.undoReconciliation as jest.Mock).mockResolvedValue(undefined);

        render(<ReconciliationHistoryList onReconciliationUndone={mockOnUndone} />);

        await waitFor(() => {
            expect(screen.getByText('JE-2024-001')).toBeInTheDocument();
        });

        const undoButton = screen.getByRole('button', { name: /undo/i });
        await user.click(undoButton);

        const dialog = screen.getByRole('dialog');
        const reasonInput = within(dialog).getByPlaceholderText(/Explain why this reconciliation needs to be undone/i);
        await user.type(reasonInput, 'Wrong transaction matched');

        const confirmButton = within(dialog).getByRole('button', { name: /undo reconciliation/i });
        await user.click(confirmButton);

        await waitFor(() => {
            expect(reconciliationService.undoReconciliation).toHaveBeenCalledWith(
                'rec-1',
                { reason: 'Wrong transaction matched' }
            );
        });

        // Should reload history and call callback
        expect(reconciliationService.getReconciliationHistory).toHaveBeenCalledTimes(2);
        expect(mockOnUndone).toHaveBeenCalled();
    });

    it('should display error message when undo fails', async () => {
        const user = userEvent.setup();
        (reconciliationService.getReconciliationHistory as jest.Mock).mockResolvedValue(mockHistory);
        (reconciliationService.undoReconciliation as jest.Mock).mockRejectedValue(
            new Error('Cannot undo reconciliation older than 90 days')
        );

        render(<ReconciliationHistoryList />);

        await waitFor(() => {
            expect(screen.getByText('JE-2024-001')).toBeInTheDocument();
        });

        const undoButton = screen.getByRole('button', { name: /undo/i });
        await user.click(undoButton);

        const dialog = screen.getByRole('dialog');
        const reasonInput = within(dialog).getByPlaceholderText(/Explain why this reconciliation needs to be undone/i);
        await user.type(reasonInput, 'Wrong transaction matched');

        const confirmButton = within(dialog).getByRole('button', { name: /undo reconciliation/i });
        await user.click(confirmButton);

        await waitFor(() => {
            expect(screen.getByText(/Cannot undo reconciliation older than 90 days/i)).toBeInTheDocument();
        });
    });

    it('should show warning for reconciliations older than 90 days', async () => {
        const user = userEvent.setup();
        const oldReconciliation: ReconciliationHistory = {
            ...mockHistory[0],
            reconciled_at: '2023-10-01T10:30:00Z', // More than 90 days ago
        };
        
        (reconciliationService.getReconciliationHistory as jest.Mock).mockResolvedValue([oldReconciliation]);

        render(<ReconciliationHistoryList />);

        await waitFor(() => {
            expect(screen.getByText('JE-2024-001')).toBeInTheDocument();
        });

        const undoButton = screen.getByRole('button', { name: /undo/i });
        await user.click(undoButton);

        const dialog = screen.getByRole('dialog');
        
        // Should show warning about old reconciliation
        expect(within(dialog).getByText(/This reconciliation is older than 90 days/i)).toBeInTheDocument();
    });

    it('should display empty state when no history', async () => {
        (reconciliationService.getReconciliationHistory as jest.Mock).mockResolvedValue([]);

        render(<ReconciliationHistoryList />);

        await waitFor(() => {
            expect(screen.getByText('No reconciliation history found')).toBeInTheDocument();
            expect(screen.getByText('Reconciliations will appear here once created')).toBeInTheDocument();
        });
    });

    it('should filter history by bank account', async () => {
        (reconciliationService.getReconciliationHistory as jest.Mock).mockResolvedValue(mockHistory);

        render(<ReconciliationHistoryList bankAccountId="bank-123" />);

        await waitFor(() => {
            expect(reconciliationService.getReconciliationHistory).toHaveBeenCalledWith(
                'bank-123',
                undefined,
                undefined,
                true
            );
        });
    });

    it('should filter history by date range', async () => {
        (reconciliationService.getReconciliationHistory as jest.Mock).mockResolvedValue(mockHistory);

        render(
            <ReconciliationHistoryList 
                dateFrom="2024-01-01" 
                dateTo="2024-01-31" 
            />
        );

        await waitFor(() => {
            expect(reconciliationService.getReconciliationHistory).toHaveBeenCalledWith(
                undefined,
                '2024-01-01',
                '2024-01-31',
                true
            );
        });
    });

    it('should close dialog when cancel is clicked', async () => {
        const user = userEvent.setup();
        (reconciliationService.getReconciliationHistory as jest.Mock).mockResolvedValue(mockHistory);

        render(<ReconciliationHistoryList />);

        await waitFor(() => {
            expect(screen.getByText('JE-2024-001')).toBeInTheDocument();
        });

        const undoButton = screen.getByRole('button', { name: /undo/i });
        await user.click(undoButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        });
    });
});
