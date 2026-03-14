import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReconciliationReport } from './ReconciliationReport';
import { reconciliationService } from '../services/reconciliationService';
import { ReconciliationReportData } from '../types';

// Mock the reconciliation service
jest.mock('../services/reconciliationService', () => ({
    reconciliationService: {
        getReconciliationReport: jest.fn(),
        exportReportToCSV: jest.fn(),
        exportReportToPDF: jest.fn(),
    },
}));

// Mock data
const mockReportData: ReconciliationReportData = {
    bank_account_id: 'account-123',
    bank_account_name: 'Test Bank Account',
    date_from: '2024-01-01',
    date_to: '2024-01-31',
    generated_at: '2024-01-31T12:00:00Z',
    generated_by: 'test-user',
    summary: {
        total_imported: 10,
        total_reconciled: 6,
        total_unreconciled: 4,
        total_amount_imported: 10000.00,
        total_amount_reconciled: 6000.00,
        total_amount_unreconciled: 4000.00,
    },
    transactions: [
        {
            id: 'txn-1',
            statement_date: '2024-01-15',
            transaction_amount: 1500.00,
            transaction_description: 'Customer Payment',
            bank_reference: 'TXN-001',
            transaction_status: 'reconciled',
            transaction_type: 'credit',
            matched_journal_entry: {
                id: 'je-1',
                entry_no: 'JE-001',
                posting_date: '2024-01-15',
                reference_id: 'REF-001',
            },
        },
        {
            id: 'txn-2',
            statement_date: '2024-01-16',
            transaction_amount: 250.50,
            transaction_description: 'Office Supplies',
            bank_reference: 'TXN-002',
            transaction_status: 'cleared',
            transaction_type: 'debit',
        },
        {
            id: 'txn-3',
            statement_date: '2024-01-17',
            transaction_amount: 500.00,
            transaction_description: 'Pending Payment',
            bank_reference: 'TXN-003',
            transaction_status: 'pending',
            transaction_type: 'credit',
        },
    ],
};

describe('ReconciliationReport', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Rendering', () => {
        it('should render the component with filters', () => {
            render(<ReconciliationReport />);
            
            expect(screen.getByText('Reconciliation Report')).toBeInTheDocument();
            expect(screen.getByText('Filters')).toBeInTheDocument();
            expect(screen.getByLabelText('From Date')).toBeInTheDocument();
            expect(screen.getByLabelText('To Date')).toBeInTheDocument();
            expect(screen.getByLabelText('Status')).toBeInTheDocument();
        });

        it('should render with pre-selected bank account', () => {
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            // Bank account input should not be visible when pre-selected
            expect(screen.queryByPlaceholderText('Bank Account ID')).not.toBeInTheDocument();
        });

        it('should show bank account input when not pre-selected', () => {
            render(<ReconciliationReport />);
            
            expect(screen.getByPlaceholderText('Bank Account ID')).toBeInTheDocument();
        });
    });

    describe('Filter Interactions', () => {
        it('should update date from filter', () => {
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            const dateFromInput = screen.getByLabelText('From Date');
            fireEvent.change(dateFromInput, { target: { value: '2024-01-01' } });
            
            expect(dateFromInput).toHaveValue('2024-01-01');
        });

        it('should update date to filter', () => {
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            const dateToInput = screen.getByLabelText('To Date');
            fireEvent.change(dateToInput, { target: { value: '2024-01-31' } });
            
            expect(dateToInput).toHaveValue('2024-01-31');
        });

        it('should disable generate button when required filters are missing', () => {
            render(<ReconciliationReport />);
            
            const generateButton = screen.getByText('Generate Report');
            expect(generateButton).toBeDisabled();
        });
    });

    describe('Report Generation', () => {
        it('should load report data when filters are complete', async () => {
            (reconciliationService.getReconciliationReport as jest.Mock).mockResolvedValue(mockReportData);
            
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            // Set date filters
            const dateFromInput = screen.getByLabelText('From Date');
            const dateToInput = screen.getByLabelText('To Date');
            
            fireEvent.change(dateFromInput, { target: { value: '2024-01-01' } });
            fireEvent.change(dateToInput, { target: { value: '2024-01-31' } });
            
            // Wait for report to load
            await waitFor(() => {
                expect(reconciliationService.getReconciliationReport).toHaveBeenCalledWith({
                    bank_account_id: 'account-123',
                    date_from: '2024-01-01',
                    date_to: '2024-01-31',
                    status: 'all',
                });
            });
        });

        it('should display report data after loading', async () => {
            (reconciliationService.getReconciliationReport as jest.Mock).mockResolvedValue(mockReportData);
            
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            // Set date filters
            fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2024-01-01' } });
            fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '2024-01-31' } });
            
            // Wait for report to load
            await waitFor(() => {
                expect(screen.getByText('Test Bank Account')).toBeInTheDocument();
            });
            
            // Check summary
            expect(screen.getByText('10')).toBeInTheDocument(); // total_imported
            expect(screen.getByText('6')).toBeInTheDocument(); // total_reconciled
            expect(screen.getByText('4')).toBeInTheDocument(); // total_unreconciled
        });

        it('should display error message on API failure', async () => {
            (reconciliationService.getReconciliationReport as jest.Mock).mockRejectedValue(
                new Error('API Error')
            );
            
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            // Set date filters
            fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2024-01-01' } });
            fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '2024-01-31' } });
            
            // Wait for error to appear
            await waitFor(() => {
                expect(screen.getByText(/API Error/i)).toBeInTheDocument();
            });
        });
    });

    describe('Transaction Display', () => {
        beforeEach(async () => {
            (reconciliationService.getReconciliationReport as jest.Mock).mockResolvedValue(mockReportData);
        });

        it('should group transactions by status', async () => {
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2024-01-01' } });
            fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '2024-01-31' } });
            
            await waitFor(() => {
                expect(screen.getByText(/Reconciled Transactions/i)).toBeInTheDocument();
                expect(screen.getByText(/Cleared Transactions/i)).toBeInTheDocument();
                expect(screen.getByText(/Pending Transactions/i)).toBeInTheDocument();
            });
        });

        it('should display transaction details correctly', async () => {
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2024-01-01' } });
            fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '2024-01-31' } });
            
            await waitFor(() => {
                expect(screen.getByText('Customer Payment')).toBeInTheDocument();
                expect(screen.getByText('TXN-001')).toBeInTheDocument();
                expect(screen.getByText('JE-001')).toBeInTheDocument();
            });
        });

        it('should show matched journal entry for reconciled transactions', async () => {
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2024-01-01' } });
            fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '2024-01-31' } });
            
            await waitFor(() => {
                expect(screen.getByText('JE-001')).toBeInTheDocument();
            });
        });
    });

    describe('Export Functionality', () => {
        beforeEach(async () => {
            (reconciliationService.getReconciliationReport as jest.Mock).mockResolvedValue(mockReportData);
            
            // Mock Blob and URL.createObjectURL
            global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
            global.URL.revokeObjectURL = jest.fn();
        });

        it('should export to CSV when CSV button is clicked', async () => {
            const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
            (reconciliationService.exportReportToCSV as jest.Mock).mockResolvedValue(mockBlob);
            
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2024-01-01' } });
            fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '2024-01-31' } });
            
            await waitFor(() => {
                expect(screen.getByText('Test Bank Account')).toBeInTheDocument();
            });
            
            const csvButton = screen.getByText('Export CSV');
            fireEvent.click(csvButton);
            
            await waitFor(() => {
                expect(reconciliationService.exportReportToCSV).toHaveBeenCalled();
            });
        });

        it('should export to PDF when PDF button is clicked', async () => {
            const mockBlob = new Blob(['pdf data'], { type: 'application/pdf' });
            (reconciliationService.exportReportToPDF as jest.Mock).mockResolvedValue(mockBlob);
            
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2024-01-01' } });
            fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '2024-01-31' } });
            
            await waitFor(() => {
                expect(screen.getByText('Test Bank Account')).toBeInTheDocument();
            });
            
            const pdfButton = screen.getByText('Export PDF');
            fireEvent.click(pdfButton);
            
            await waitFor(() => {
                expect(reconciliationService.exportReportToPDF).toHaveBeenCalled();
            });
        });

        it('should show loading state during export', async () => {
            const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
            (reconciliationService.exportReportToCSV as jest.Mock).mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve(mockBlob), 100))
            );
            
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2024-01-01' } });
            fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '2024-01-31' } });
            
            await waitFor(() => {
                expect(screen.getByText('Test Bank Account')).toBeInTheDocument();
            });
            
            const csvButton = screen.getByText('Export CSV');
            fireEvent.click(csvButton);
            
            // Should show loading state
            expect(screen.getByText('Export CSV').closest('button')).toBeDisabled();
        });
    });

    describe('Summary Display', () => {
        beforeEach(async () => {
            (reconciliationService.getReconciliationReport as jest.Mock).mockResolvedValue(mockReportData);
        });

        it('should display summary statistics', async () => {
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2024-01-01' } });
            fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '2024-01-31' } });
            
            await waitFor(() => {
                expect(screen.getByText('Total Imported')).toBeInTheDocument();
                expect(screen.getByText('Total Reconciled')).toBeInTheDocument();
                expect(screen.getByText('Total Unreconciled')).toBeInTheDocument();
            });
        });

        it('should format currency amounts correctly', async () => {
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2024-01-01' } });
            fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '2024-01-31' } });
            
            await waitFor(() => {
                expect(screen.getByText(/\$10,000\.00/)).toBeInTheDocument();
                expect(screen.getByText(/\$6,000\.00/)).toBeInTheDocument();
                expect(screen.getByText(/\$4,000\.00/)).toBeInTheDocument();
            });
        });
    });

    describe('Report Metadata', () => {
        beforeEach(async () => {
            (reconciliationService.getReconciliationReport as jest.Mock).mockResolvedValue(mockReportData);
        });

        it('should display report generation timestamp', async () => {
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2024-01-01' } });
            fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '2024-01-31' } });
            
            await waitFor(() => {
                expect(screen.getByText(/Generated:/)).toBeInTheDocument();
            });
        });

        it('should display user who generated the report', async () => {
            render(<ReconciliationReport bankAccountId="account-123" />);
            
            fireEvent.change(screen.getByLabelText('From Date'), { target: { value: '2024-01-01' } });
            fireEvent.change(screen.getByLabelText('To Date'), { target: { value: '2024-01-31' } });
            
            await waitFor(() => {
                expect(screen.getByText(/test-user/)).toBeInTheDocument();
            });
        });
    });
});
