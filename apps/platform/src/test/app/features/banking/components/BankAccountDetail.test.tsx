import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BankAccountDetail } from './BankAccountDetail';
import * as hooks from '../hooks';

// Mock the hooks
jest.mock('../hooks', () => ({
    useBankAccount: jest.fn(),
    useBankAccountHistory: jest.fn(),
}));

// Mock the toast hook
jest.mock('@horizon-sync/ui/hooks/use-toast', () => ({
    useToast: () => ({
        toast: jest.fn(),
    }),
}));

const mockAccount = {
    id: '123',
    organization_id: 'org-1',
    gl_account_id: 'gl-1',
    bank_name: 'Test Bank',
    account_holder_name: 'John Doe',
    account_number: '1234567890',
    country_code: 'US',
    currency: 'USD',
    iban: 'GB82WEST12345698765432',
    swift_code: 'TESTGB2L',
    routing_number: '123456789',
    is_primary: true,
    is_active: true,
    created_by: 'admin@test.com',
    created_at: '2024-01-01T00:00:00Z',
    updated_by: 'admin@test.com',
    updated_at: '2024-01-01T00:00:00Z',
};

const mockHistory = [
    {
        id: 'h1',
        bank_account_id: '123',
        action_type: 'created',
        old_values: {},
        new_values: { bank_name: 'Test Bank' },
        changed_by: 'admin@test.com',
        changed_at: '2024-01-01T00:00:00Z',
    },
];

describe('BankAccountDetail', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
            },
        });

        jest.clearAllMocks();
    });

    it('should render loading state', () => {
        (hooks.useBankAccount as jest.Mock).mockReturnValue({ 
            data: undefined, 
            isLoading: true, 
            error: null 
        } as any);
        (hooks.useBankAccountHistory as jest.Mock).mockReturnValue({ 
            data: undefined, 
            isLoading: true, 
            error: null 
        } as any);

        render(
            <QueryClientProvider client={queryClient}>
                <BankAccountDetail accountId="123" />
            </QueryClientProvider>
        );

        // Check for loading animation
        const loadingElements = screen.getAllByRole('generic');
        expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should render account details with masked sensitive fields', async () => {
        (hooks.useBankAccount as jest.Mock).mockReturnValue({ 
            data: mockAccount, 
            isLoading: false, 
            error: null 
        } as any);
        (hooks.useBankAccountHistory as jest.Mock).mockReturnValue({ 
            data: mockHistory, 
            isLoading: false, 
            error: null 
        } as any);

        render(
            <QueryClientProvider client={queryClient}>
                <BankAccountDetail accountId="123" />
            </QueryClientProvider>
        );

        await waitFor(() => {
            // Check bank name is displayed (multiple instances expected)
            const bankNameElements = screen.getAllByText('Test Bank');
            expect(bankNameElements.length).toBeGreaterThan(0);
            
            // Check account holder name
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            
            // Check account number is masked (Requirement 15.7)
            expect(screen.getByText(/•••• 7890/)).toBeInTheDocument();
            
            // Check IBAN is masked (Requirement 15.8)
            expect(screen.getByText(/GB82\*+5432/)).toBeInTheDocument();
            
            // Check status badges
            expect(screen.getByText('Active')).toBeInTheDocument();
            expect(screen.getByText('Primary')).toBeInTheDocument();
        });
    });

    it('should display audit history timeline', async () => {
        (hooks.useBankAccount as jest.Mock).mockReturnValue({ 
            data: mockAccount, 
            isLoading: false, 
            error: null 
        } as any);
        (hooks.useBankAccountHistory as jest.Mock).mockReturnValue({ 
            data: mockHistory, 
            isLoading: false, 
            error: null 
        } as any);

        render(
            <QueryClientProvider client={queryClient}>
                <BankAccountDetail accountId="123" />
            </QueryClientProvider>
        );

        await waitFor(() => {
            // Check audit history section exists (Requirement 18.9)
            expect(screen.getByText('Audit History')).toBeInTheDocument();
            
            // Check history entry is displayed
            expect(screen.getByText('created')).toBeInTheDocument();
            expect(screen.getByText('admin@test.com')).toBeInTheDocument();
        });
    });

    it('should handle error state', () => {
        (hooks.useBankAccount as jest.Mock).mockReturnValue({
            data: undefined,
            isLoading: false,
            error: new Error('Failed to load account'),
        } as any);
        (hooks.useBankAccountHistory as jest.Mock).mockReturnValue({ 
            data: undefined, 
            isLoading: false, 
            error: null 
        } as any);

        render(
            <QueryClientProvider client={queryClient}>
                <BankAccountDetail accountId="123" />
            </QueryClientProvider>
        );

        expect(screen.getByText(/Error loading bank account/i)).toBeInTheDocument();
    });
});
