import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ReconciliationWorkspace } from './ReconciliationWorkspace';
import { reconciliationService } from '../services/reconciliationService';
import * as hooks from '../hooks';

// Mock the hooks
jest.mock('../hooks', () => ({
    useBankAccounts: jest.fn(),
}));

// Mock the reconciliation service
jest.mock('../services/reconciliationService', () => ({
    reconciliationService: {
        getUnreconciledTransactions: jest.fn(),
        getUnreconciledJournalEntries: jest.fn(),
        getBankAccountBalance: jest.fn(),
    },
}));

describe('ReconciliationWorkspace', () => {
    const mockBankAccounts = [
        {
            id: 'bank-1',
            organization_id: 'org-1',
            gl_account_id: 'gl-1',
            bank_name: 'Test Bank',
            account_holder_name: 'Test Holder',
            account_number: '1234567890',
            country_code: 'US',
            currency: 'USD',
            is_primary: true,
            is_active: true,
            created_by: 'user-1',
            created_at: '2024-01-01T00:00:00Z',
            updated_by: 'user-1',
            updated_at: '2024-01-01T00:00:00Z',
        },
    ];

    const mockTransactions = [
        {
            id: 'txn-1',
            organization_id: 'org-1',
            bank_account_id: 'bank-1',
            statement_date: '2024-01-15',
            transaction_amount: 1500.0,
            transaction_description: 'Customer Payment',
            bank_reference: 'TXN-001',
            transaction_status: 'cleared' as const,
            transaction_type: 'credit' as const,
            imported_at: '2024-01-15T10:00:00Z',
            is_duplicate: false,
        },
    ];

    const mockJournalEntries = [
        {
            id: 'je-1',
            organization_id: 'org-1',
            entry_no: 'JE-001',
            posting_date: '2024-01-15',
            reference_id: 'INV-001',
            description: 'Invoice Payment',
            amount: 1500.0,
            account_id: 'gl-1',
            account_code: '1000',
            account_name: 'Bank Account',
        },
    ];

    const mockBalance = {
        bank_account_id: 'bank-1',
        bank_account_name: 'Test Bank',
        gl_account_id: 'gl-1',
        gl_account_name: 'Bank Account',
        currency: 'USD',
        bank_balance: 10000.0,
        gl_balance: 9500.0,
        unreconciled_amount: 500.0,
        unreconciled_transaction_count: 5,
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup default mock implementations
        (hooks.useBankAccounts as jest.Mock).mockReturnValue({
            data: mockBankAccounts,
            isLoading: false,
            error: null,
        });

        (reconciliationService.getUnreconciledTransactions as jest.Mock).mockResolvedValue(
            mockTransactions
        );
        (reconciliationService.getUnreconciledJournalEntries as jest.Mock).mockResolvedValue(
            mockJournalEntries
        );
        (reconciliationService.getBankAccountBalance as jest.Mock).mockResolvedValue(mockBalance);
    });

    it('renders the component with title', () => {
        render(<ReconciliationWorkspace />);
        expect(screen.getByText('Bank Reconciliation')).toBeInTheDocument();
    });

    it('displays bank account selector', () => {
        render(<ReconciliationWorkspace />);
        expect(screen.getByLabelText('Bank Account')).toBeInTheDocument();
    });

    it('displays date range filters', () => {
        render(<ReconciliationWorkspace />);
        expect(screen.getByLabelText('Date From')).toBeInTheDocument();
        expect(screen.getByLabelText('Date To')).toBeInTheDocument();
    });

    it('displays refresh button', () => {
        render(<ReconciliationWorkspace />);
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
    });

    it('loads and displays balance summary', async () => {
        render(<ReconciliationWorkspace />);

        await waitFor(() => {
            expect(screen.getByText('Balance Summary')).toBeInTheDocument();
        });

        // Check balance values are displayed
        await waitFor(() => {
            expect(screen.getByText('Bank Balance')).toBeInTheDocument();
            expect(screen.getByText('GL Balance')).toBeInTheDocument();
            expect(screen.getByText('Unreconciled Amount')).toBeInTheDocument();
            expect(screen.getByText('Unreconciled Items')).toBeInTheDocument();
        });
    });

    it('loads and displays unreconciled transactions', async () => {
        render(<ReconciliationWorkspace />);

        await waitFor(() => {
            expect(screen.getByText('Unreconciled Transactions')).toBeInTheDocument();
        });

        // Check transaction is displayed
        await waitFor(() => {
            expect(screen.getByText('Customer Payment')).toBeInTheDocument();
            expect(screen.getByText('TXN-001')).toBeInTheDocument();
        });
    });

    it('loads and displays unreconciled journal entries', async () => {
        render(<ReconciliationWorkspace />);

        await waitFor(() => {
            expect(screen.getByText('Unreconciled Journal Entries')).toBeInTheDocument();
        });

        // Check journal entry is displayed
        await waitFor(() => {
            expect(screen.getByText('JE-001')).toBeInTheDocument();
            expect(screen.getByText('INV-001')).toBeInTheDocument();
        });
    });

    it('displays loading state for transactions', () => {
        (reconciliationService.getUnreconciledTransactions as jest.Mock).mockImplementation(
            () => new Promise(() => {}) // Never resolves
        );

        render(<ReconciliationWorkspace />);

        expect(screen.getByText('Loading transactions...')).toBeInTheDocument();
    });

    it('displays loading state for journal entries', async () => {
        (reconciliationService.getUnreconciledJournalEntries as jest.Mock).mockImplementation(
            () => new Promise(() => {}) // Never resolves
        );

        render(<ReconciliationWorkspace />);

        // Wait for the loading state to appear
        await waitFor(() => {
            expect(screen.queryByText('Loading journal entries...')).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('displays error message when API fails', async () => {
        const errorMessage = 'Failed to load data';
        (reconciliationService.getUnreconciledTransactions as jest.Mock).mockRejectedValue(
            new Error(errorMessage)
        );

        render(<ReconciliationWorkspace />);

        await waitFor(() => {
            expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
        });
    });

    it('displays empty state when no transactions found', async () => {
        (reconciliationService.getUnreconciledTransactions as jest.Mock).mockResolvedValue([]);

        render(<ReconciliationWorkspace />);

        await waitFor(() => {
            expect(screen.getByText('No unreconciled transactions found')).toBeInTheDocument();
        });
    });

    it('displays empty state when no journal entries found', async () => {
        (reconciliationService.getUnreconciledJournalEntries as jest.Mock).mockResolvedValue([]);

        render(<ReconciliationWorkspace />);

        await waitFor(() => {
            expect(screen.getByText('No unreconciled journal entries found')).toBeInTheDocument();
        });
    });

    it('formats currency correctly', async () => {
        render(<ReconciliationWorkspace />);

        await waitFor(() => {
            // Check that currency is formatted (should contain $ symbol)
            const balanceElements = screen.getAllByText(/\$/);
            expect(balanceElements.length).toBeGreaterThan(0);
        });
    });

    it('formats dates correctly', async () => {
        render(<ReconciliationWorkspace />);

        await waitFor(() => {
            // Check that date is formatted (should contain month name)
            const dateElements = screen.getAllByText(/Jan/);
            expect(dateElements.length).toBeGreaterThan(0);
        });
    });

    it('displays transaction type with correct color coding', async () => {
        render(<ReconciliationWorkspace />);

        await waitFor(() => {
            const creditAmount = screen.getByText(/\+/);
            expect(creditAmount).toHaveClass('text-green-600');
        });
    });

    it('calls API with correct parameters when filters change', async () => {
        render(<ReconciliationWorkspace />);

        await waitFor(() => {
            expect(reconciliationService.getUnreconciledTransactions).toHaveBeenCalledWith(
                'bank-1',
                expect.any(String),
                expect.any(String)
            );
        });
    });
});
