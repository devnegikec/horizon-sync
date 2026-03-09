import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TransactionList } from './TransactionList';
import { transactionService } from '../services';

// Mock the transaction service
jest.mock('../services', () => ({
    transactionService: {
        getBankTransactions: jest.fn(),
    },
}));

const mockTransactionService = transactionService as jest.Mocked<typeof transactionService>;

describe('TransactionList', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });
        jest.clearAllMocks();
    });

    const renderComponent = (bankAccountId: string) => {
        return render(
            <QueryClientProvider client={queryClient}>
                <TransactionList bankAccountId={bankAccountId} />
            </QueryClientProvider>
        );
    };

    it('renders transaction list with data', async () => {
        const mockData = {
            items: [
                {
                    id: '1',
                    organization_id: 'org-1',
                    bank_account_id: 'account-1',
                    statement_date: '2024-01-15',
                    transaction_amount: 1500.00,
                    transaction_description: 'Customer Payment',
                    bank_reference: 'TXN-001',
                    transaction_status: 'cleared' as const,
                    transaction_type: 'credit' as const,
                    imported_at: '2024-01-15T10:00:00Z',
                    is_duplicate: false,
                },
                {
                    id: '2',
                    organization_id: 'org-1',
                    bank_account_id: 'account-1',
                    statement_date: '2024-01-16',
                    transaction_amount: 250.50,
                    transaction_description: 'Office Supplies',
                    bank_reference: 'TXN-002',
                    transaction_status: 'reconciled' as const,
                    transaction_type: 'debit' as const,
                    imported_at: '2024-01-16T10:00:00Z',
                    is_duplicate: false,
                },
            ],
            total: 2,
            page: 1,
            page_size: 20,
            total_pages: 1,
        };

        mockTransactionService.getBankTransactions.mockResolvedValue(mockData);

        renderComponent('account-1');

        await waitFor(() => {
            expect(screen.getByText('Customer Payment')).toBeInTheDocument();
            expect(screen.getByText('Office Supplies')).toBeInTheDocument();
        });

        expect(screen.getByText('TXN-001')).toBeInTheDocument();
        expect(screen.getByText('TXN-002')).toBeInTheDocument();
    });

    it('displays duplicate warning for duplicate transactions', async () => {
        const mockData = {
            items: [
                {
                    id: '1',
                    organization_id: 'org-1',
                    bank_account_id: 'account-1',
                    statement_date: '2024-01-15',
                    transaction_amount: 1500.00,
                    transaction_description: 'Duplicate Transaction',
                    bank_reference: 'TXN-001',
                    transaction_status: 'cleared' as const,
                    transaction_type: 'credit' as const,
                    imported_at: '2024-01-15T10:00:00Z',
                    is_duplicate: true,
                },
            ],
            total: 1,
            page: 1,
            page_size: 20,
            total_pages: 1,
        };

        mockTransactionService.getBankTransactions.mockResolvedValue(mockData);

        renderComponent('account-1');

        await waitFor(() => {
            expect(screen.getByText('Duplicate Transaction')).toBeInTheDocument();
        });

        // Check for duplicate warning icon (AlertTriangle)
        const row = screen.getByText('Duplicate Transaction').closest('tr');
        expect(row).toHaveClass('bg-yellow-50');
    });

    it('shows empty state when no transactions', async () => {
        const mockData = {
            items: [],
            total: 0,
            page: 1,
            page_size: 20,
            total_pages: 0,
        };

        mockTransactionService.getBankTransactions.mockResolvedValue(mockData);

        renderComponent('account-1');

        await waitFor(() => {
            expect(screen.getByText('No transactions found')).toBeInTheDocument();
        });
    });

    it('displays error message on API failure', async () => {
        mockTransactionService.getBankTransactions.mockRejectedValue(
            new Error('Failed to fetch transactions')
        );

        renderComponent('account-1');

        await waitFor(() => {
            expect(screen.getByText(/Error loading transactions/)).toBeInTheDocument();
        });
    });

    it('renders filter controls', () => {
        mockTransactionService.getBankTransactions.mockResolvedValue({
            items: [],
            total: 0,
            page: 1,
            page_size: 20,
            total_pages: 0,
        });

        renderComponent('account-1');

        // Check for filter elements
        expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
    });
});
