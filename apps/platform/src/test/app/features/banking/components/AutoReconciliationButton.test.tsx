import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AutoReconciliationButton } from './AutoReconciliationButton';
import { reconciliationService } from '../services/reconciliationService';

// Mock the reconciliation service
jest.mock('../services/reconciliationService', () => ({
    reconciliationService: {
        runAutoReconciliation: jest.fn(),
    },
}));

const mockReconciliationService = reconciliationService as jest.Mocked<typeof reconciliationService>;

describe('AutoReconciliationButton', () => {
    const mockProps = {
        bankAccountId: 'bank-account-123',
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31',
        onComplete: jest.fn(),
    };

    const mockResult = {
        exact_matches: 15,
        fuzzy_matches: 8,
        many_to_one_matches: 2,
        total_processed: 50,
        total_reconciled: 15,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the button with correct text', () => {
        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        expect(button).toBeInTheDocument();
    });

    it('disables button when disabled prop is true', () => {
        render(<AutoReconciliationButton {...mockProps} disabled={true} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        expect(button).toBeDisabled();
    });

    it('disables button when required props are missing', () => {
        render(
            <AutoReconciliationButton
                bankAccountId=""
                dateFrom={mockProps.dateFrom}
                dateTo={mockProps.dateTo}
            />
        );
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        expect(button).toBeDisabled();
    });

    it('shows loading state when running auto-reconciliation', async () => {
        mockReconciliationService.runAutoReconciliation.mockImplementation(
            () => new Promise(() => {}) // Never resolves to keep loading state
        );

        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/running auto-reconciliation/i)).toBeInTheDocument();
        });
    });

    it('calls runAutoReconciliation with correct parameters', async () => {
        mockReconciliationService.runAutoReconciliation.mockResolvedValue(mockResult);

        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(reconciliationService.runAutoReconciliation).toHaveBeenCalledWith(
                mockProps.bankAccountId,
                mockProps.dateFrom,
                mockProps.dateTo
            );
        });
    });

    it('displays results dialog after successful reconciliation', async () => {
        mockReconciliationService.runAutoReconciliation.mockResolvedValue(mockResult);

        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/auto-reconciliation complete/i)).toBeInTheDocument();
        });

        // Check if results are displayed
        expect(screen.getByText('50')).toBeInTheDocument(); // Total processed
        expect(screen.getByText('15')).toBeInTheDocument(); // Total reconciled
    });

    it('displays exact matches count in results', async () => {
        mockReconciliationService.runAutoReconciliation.mockResolvedValue(mockResult);

        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/exact matches/i)).toBeInTheDocument();
        });

        // Find the badge with exact matches count
        const badges = screen.getAllByText('15');
        expect(badges.length).toBeGreaterThan(0);
    });

    it('displays fuzzy matches count in results', async () => {
        mockReconciliationService.runAutoReconciliation.mockResolvedValue(mockResult);

        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/fuzzy matches/i)).toBeInTheDocument();
        });

        expect(screen.getByText('8')).toBeInTheDocument();
    });

    it('displays many-to-one matches count in results', async () => {
        mockReconciliationService.runAutoReconciliation.mockResolvedValue(mockResult);

        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/many-to-one matches/i)).toBeInTheDocument();
        });

        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('displays success rate in results', async () => {
        mockReconciliationService.runAutoReconciliation.mockResolvedValue(mockResult);

        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/success rate/i)).toBeInTheDocument();
        });

        // Success rate should be 15/50 = 30%
        expect(screen.getByText('30%')).toBeInTheDocument();
    });

    it('shows next steps alert when there are suggested matches', async () => {
        mockReconciliationService.runAutoReconciliation.mockResolvedValue(mockResult);

        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/next steps/i)).toBeInTheDocument();
        });

        expect(screen.getByText(/review the suggested matches/i)).toBeInTheDocument();
    });

    it('does not show next steps alert when there are no suggested matches', async () => {
        const resultWithNoSuggestions = {
            exact_matches: 15,
            fuzzy_matches: 0,
            many_to_one_matches: 0,
            total_processed: 15,
            total_reconciled: 15,
        };

        mockReconciliationService.runAutoReconciliation.mockResolvedValue(
            resultWithNoSuggestions
        );

        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/auto-reconciliation complete/i)).toBeInTheDocument();
        });

        expect(screen.queryByText(/next steps/i)).not.toBeInTheDocument();
    });

    it('calls onComplete callback after successful reconciliation', async () => {
        mockReconciliationService.runAutoReconciliation.mockResolvedValue(mockResult);

        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(mockProps.onComplete).toHaveBeenCalled();
        });
    });

    it('displays error message when reconciliation fails', async () => {
        const errorMessage = 'Failed to run auto-reconciliation';
        mockReconciliationService.runAutoReconciliation.mockRejectedValue(
            new Error(errorMessage)
        );

        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(errorMessage)).toBeInTheDocument();
        });
    });

    it('closes results dialog when close button is clicked', async () => {
        mockReconciliationService.runAutoReconciliation.mockResolvedValue(mockResult);

        render(<AutoReconciliationButton {...mockProps} />);
        
        const runButton = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(runButton);

        await waitFor(() => {
            expect(screen.getByText(/auto-reconciliation complete/i)).toBeInTheDocument();
        });

        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        await waitFor(() => {
            expect(screen.queryByText(/auto-reconciliation complete/i)).not.toBeInTheDocument();
        });
    });

    it('handles zero total processed gracefully', async () => {
        const emptyResult = {
            exact_matches: 0,
            fuzzy_matches: 0,
            many_to_one_matches: 0,
            total_processed: 0,
            total_reconciled: 0,
        };

        mockReconciliationService.runAutoReconciliation.mockResolvedValue(emptyResult);

        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText(/auto-reconciliation complete/i)).toBeInTheDocument();
        });

        // Should not show success rate when total_processed is 0
        expect(screen.queryByText(/success rate/i)).not.toBeInTheDocument();
    });

    it('re-enables button after reconciliation completes', async () => {
        mockReconciliationService.runAutoReconciliation.mockResolvedValue(mockResult);

        render(<AutoReconciliationButton {...mockProps} />);
        
        const button = screen.getByRole('button', { name: /run auto-reconciliation/i });
        fireEvent.click(button);

        // Button should be disabled during execution
        await waitFor(() => {
            expect(button).toBeDisabled();
        });

        // Wait for completion
        await waitFor(() => {
            expect(screen.getByText(/auto-reconciliation complete/i)).toBeInTheDocument();
        });

        // Close dialog
        const closeButton = screen.getByRole('button', { name: /close/i });
        fireEvent.click(closeButton);

        // Button should be enabled again
        await waitFor(() => {
            expect(button).not.toBeDisabled();
        });
    });
});
