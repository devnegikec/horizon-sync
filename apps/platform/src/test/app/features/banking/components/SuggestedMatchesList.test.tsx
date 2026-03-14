import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { SuggestedMatchesList } from './SuggestedMatchesList';
import { reconciliationService } from '../services/reconciliationService';
import { SuggestedMatch } from '../types';

// Mock the reconciliation service
jest.mock('../services/reconciliationService', () => ({
    reconciliationService: {
        getSuggestedMatches: jest.fn(),
        confirmSuggestedMatch: jest.fn(),
        rejectSuggestedMatch: jest.fn(),
    },
}));

const mockSuggestedMatches: SuggestedMatch[] = [
    {
        id: 'match-1',
        organization_id: 'org-1',
        bank_transaction_id: 'txn-1',
        journal_entry_id: 'je-1',
        reconciliation_type: 'auto_fuzzy',
        reconciliation_status: 'suggested',
        match_confidence: 0.95,
        bank_transaction: {
            id: 'txn-1',
            statement_date: '2024-01-15',
            transaction_amount: 1500.00,
            transaction_description: 'Customer Payment - INV-001',
            bank_reference: 'TXN-12345',
            transaction_type: 'credit',
        },
        journal_entry: {
            id: 'je-1',
            entry_no: 'JE-2024-001',
            posting_date: '2024-01-15',
            reference_id: 'INV-001',
            amount: 1500.00,
        },
        matching_criteria: {
            amount_match: true,
            date_match: true,
            date_difference_days: 0,
            reference_match: true,
        },
    },
    {
        id: 'match-2',
        organization_id: 'org-1',
        bank_transaction_id: 'txn-2',
        journal_entry_id: 'je-2',
        reconciliation_type: 'auto_fuzzy',
        reconciliation_status: 'suggested',
        match_confidence: 0.8,
        bank_transaction: {
            id: 'txn-2',
            statement_date: '2024-01-16',
            transaction_amount: 250.50,
            transaction_description: 'Office Supplies',
            bank_reference: 'TXN-12346',
            transaction_type: 'debit',
        },
        journal_entry: {
            id: 'je-2',
            entry_no: 'JE-2024-002',
            posting_date: '2024-01-14',
            reference_id: 'PO-123',
            amount: 250.50,
        },
        matching_criteria: {
            amount_match: true,
            date_match: true,
            date_difference_days: 2,
            reference_match: false,
        },
    },
];

describe('SuggestedMatchesList', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render loading state initially', () => {
        (reconciliationService.getSuggestedMatches as jest.Mock).mockImplementation(
            () => new Promise(() => {}) // Never resolves
        );

        render(<SuggestedMatchesList />);

        expect(screen.getByText('Loading suggested matches...')).toBeInTheDocument();
    });

    it('should display suggested matches when loaded', async () => {
        (reconciliationService.getSuggestedMatches as jest.Mock).mockResolvedValue(
            mockSuggestedMatches
        );

        render(<SuggestedMatchesList />);

        await waitFor(() => {
            expect(screen.getByText('Customer Payment - INV-001')).toBeInTheDocument();
            expect(screen.getByText('Office Supplies')).toBeInTheDocument();
        });

        // Check that confidence badges are displayed
        expect(screen.getByText(/High \(95%\)/)).toBeInTheDocument();
        expect(screen.getByText(/Medium \(80%\)/)).toBeInTheDocument();
    });

    it('should display matching criteria badges', async () => {
        (reconciliationService.getSuggestedMatches as jest.Mock).mockResolvedValue(
            mockSuggestedMatches
        );

        render(<SuggestedMatchesList />);

        await waitFor(() => {
            // First match has all criteria
            const amountBadges = screen.getAllByText('Amount');
            expect(amountBadges.length).toBeGreaterThan(0);

            const dateBadges = screen.getAllByText(/Date/);
            expect(dateBadges.length).toBeGreaterThan(0);

            const referenceBadges = screen.getAllByText('Reference');
            expect(referenceBadges.length).toBeGreaterThan(0);
        });
    });

    it('should display empty state when no matches', async () => {
        (reconciliationService.getSuggestedMatches as jest.Mock).mockResolvedValue([]);

        render(<SuggestedMatchesList />);

        await waitFor(() => {
            expect(screen.getByText('No suggested matches found')).toBeInTheDocument();
            expect(
                screen.getByText('Run auto-reconciliation to generate suggestions')
            ).toBeInTheDocument();
        });
    });

    it('should display error message on load failure', async () => {
        const errorMessage = 'Failed to load suggested matches';
        (reconciliationService.getSuggestedMatches as jest.Mock).mockRejectedValue(
            new Error(errorMessage)
        );

        render(<SuggestedMatchesList />);

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('should open confirm dialog when confirm button clicked', async () => {
        (reconciliationService.getSuggestedMatches as jest.Mock).mockResolvedValue(
            mockSuggestedMatches
        );

        render(<SuggestedMatchesList />);

        await waitFor(() => {
            expect(screen.getByText('Customer Payment - INV-001')).toBeInTheDocument();
        });

        const confirmButtons = screen.getAllByRole('button', { name: /Confirm/i });
        fireEvent.click(confirmButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Confirm Suggested Match')).toBeInTheDocument();
            expect(
                screen.getByText('Are you sure you want to confirm this reconciliation match?')
            ).toBeInTheDocument();
        });
    });

    it('should open reject dialog when reject button clicked', async () => {
        (reconciliationService.getSuggestedMatches as jest.Mock).mockResolvedValue(
            mockSuggestedMatches
        );

        render(<SuggestedMatchesList />);

        await waitFor(() => {
            expect(screen.getByText('Customer Payment - INV-001')).toBeInTheDocument();
        });

        const rejectButtons = screen.getAllByRole('button', { name: /Reject/i });
        fireEvent.click(rejectButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Reject Suggested Match')).toBeInTheDocument();
            expect(
                screen.getByText('Please provide a reason for rejecting this match.')
            ).toBeInTheDocument();
        });
    });

    it('should confirm match and remove from list', async () => {
        (reconciliationService.getSuggestedMatches as jest.Mock).mockResolvedValue(
            mockSuggestedMatches
        );
        (reconciliationService.confirmSuggestedMatch as jest.Mock).mockResolvedValue(undefined);

        const onMatchConfirmed = jest.fn();

        render(<SuggestedMatchesList onMatchConfirmed={onMatchConfirmed} />);

        await waitFor(() => {
            expect(screen.getByText('Customer Payment - INV-001')).toBeInTheDocument();
        });

        // Click confirm button
        const confirmButtons = screen.getAllByRole('button', { name: /Confirm/i });
        fireEvent.click(confirmButtons[0]);

        // Wait for dialog to open
        await waitFor(() => {
            expect(screen.getByText('Confirm Suggested Match')).toBeInTheDocument();
        });

        // Click confirm in dialog
        const dialogConfirmButton = screen.getByRole('button', { name: /Confirm Match/i });
        fireEvent.click(dialogConfirmButton);

        await waitFor(() => {
            expect(reconciliationService.confirmSuggestedMatch).toHaveBeenCalledWith(
                'match-1',
                undefined
            );
            expect(onMatchConfirmed).toHaveBeenCalled();
        });

        // Match should be removed from list
        await waitFor(() => {
            expect(screen.queryByText('Customer Payment - INV-001')).not.toBeInTheDocument();
        });
    });

    it('should reject match with reason', async () => {
        (reconciliationService.getSuggestedMatches as jest.Mock).mockResolvedValue(
            mockSuggestedMatches
        );
        (reconciliationService.rejectSuggestedMatch as jest.Mock).mockResolvedValue(undefined);

        const onMatchRejected = jest.fn();

        render(<SuggestedMatchesList onMatchRejected={onMatchRejected} />);

        await waitFor(() => {
            expect(screen.getByText('Customer Payment - INV-001')).toBeInTheDocument();
        });

        // Click reject button
        const rejectButtons = screen.getAllByRole('button', { name: /Reject/i });
        fireEvent.click(rejectButtons[0]);

        // Wait for dialog to open
        await waitFor(() => {
            expect(screen.getByText('Reject Suggested Match')).toBeInTheDocument();
        });

        // Enter reason
        const reasonTextarea = screen.getByPlaceholderText(
            'Explain why this match is incorrect...'
        );
        fireEvent.change(reasonTextarea, { target: { value: 'Incorrect transaction' } });

        // Click reject in dialog
        const dialogRejectButton = screen.getByRole('button', { name: /Reject Match/i });
        fireEvent.click(dialogRejectButton);

        await waitFor(() => {
            expect(reconciliationService.rejectSuggestedMatch).toHaveBeenCalledWith(
                'match-1',
                'Incorrect transaction'
            );
            expect(onMatchRejected).toHaveBeenCalled();
        });

        // Match should be removed from list
        await waitFor(() => {
            expect(screen.queryByText('Customer Payment - INV-001')).not.toBeInTheDocument();
        });
    });

    it('should disable reject button when reason is empty', async () => {
        (reconciliationService.getSuggestedMatches as jest.Mock).mockResolvedValue(
            mockSuggestedMatches
        );

        render(<SuggestedMatchesList />);

        await waitFor(() => {
            expect(screen.getByText('Customer Payment - INV-001')).toBeInTheDocument();
        });

        // Click reject button
        const rejectButtons = screen.getAllByRole('button', { name: /Reject/i });
        fireEvent.click(rejectButtons[0]);

        // Wait for dialog to open
        await waitFor(() => {
            expect(screen.getByText('Reject Suggested Match')).toBeInTheDocument();
        });

        // Reject button should be disabled
        const dialogRejectButton = screen.getByRole('button', { name: /Reject Match/i });
        expect(dialogRejectButton).toBeDisabled();
    });

    it('should filter matches by bank account', async () => {
        (reconciliationService.getSuggestedMatches as jest.Mock).mockResolvedValue(
            mockSuggestedMatches
        );

        render(<SuggestedMatchesList bankAccountId="bank-123" />);

        await waitFor(() => {
            expect(reconciliationService.getSuggestedMatches).toHaveBeenCalledWith(
                'bank-123',
                undefined,
                undefined
            );
        });
    });

    it('should filter matches by date range', async () => {
        (reconciliationService.getSuggestedMatches as jest.Mock).mockResolvedValue(
            mockSuggestedMatches
        );

        render(
            <SuggestedMatchesList
                bankAccountId="bank-123"
                dateFrom="2024-01-01"
                dateTo="2024-01-31"
            />
        );

        await waitFor(() => {
            expect(reconciliationService.getSuggestedMatches).toHaveBeenCalledWith(
                'bank-123',
                '2024-01-01',
                '2024-01-31'
            );
        });
    });
});
