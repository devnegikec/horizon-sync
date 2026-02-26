import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SystemConfiguration } from './SystemConfiguration';

// Mock store (required for accountApi calls and AccountSelector)
vi.mock('@horizon-sync/store', () => ({
  useUserStore: vi.fn(() => ({ accessToken: 'fake-token' })),
}));

// Mock account API so component can load and save without real backend
vi.mock('../../utility/api/accounts', () => ({
  accountApi: {
    getDefaultAccounts: vi.fn().mockResolvedValue([]),
    updateDefaultAccounts: vi.fn().mockResolvedValue({
      updated: [],
      errors: [],
      success_count: 0,
      error_count: 0,
    }),
    list: vi.fn().mockResolvedValue({
      chart_of_accounts: [],
      pagination: { page: 1, page_size: 20, total: 0 },
    }),
  },
}));

describe('SystemConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders System Configuration card with title and description', () => {
    render(<SystemConfiguration />);

    expect(screen.getByText(/system configuration/i)).toBeInTheDocument();
    expect(
      screen.getByText(/chart of accounts and default account settings/i)
    ).toBeInTheDocument();
  });

  it('renders Default Accounts section with heading and description', () => {
    render(<SystemConfiguration />);

    expect(screen.getByRole('heading', { name: /default accounts/i, level: 3 })).toBeInTheDocument();
    expect(
      screen.getByText(/set which ledger accounts are used for payments and journal entries/i)
    ).toBeInTheDocument();
  });

  it('renders Save defaults button', () => {
    render(<SystemConfiguration />);

    const saveButton = screen.getByRole('button', { name: /save defaults/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('renders default account types: Accounts Receivable, Cash, Bank, Checks Received, Accounts Payable', () => {
    render(<SystemConfiguration />);

    expect(screen.getByText(/accounts receivable/i)).toBeInTheDocument();
    expect(screen.getByText(/cash/i)).toBeInTheDocument();
    expect(screen.getByText(/bank/i)).toBeInTheDocument();
    expect(screen.getByText(/checks received/i)).toBeInTheDocument();
    expect(screen.getByText(/accounts payable/i)).toBeInTheDocument();
  });

  it('renders account selectors for each default account type', () => {
    render(<SystemConfiguration />);

    // Placeholders for the AccountSelector components (each "Select account for X")
    expect(screen.getByText(/select account for accounts receivable/i)).toBeInTheDocument();
    expect(screen.getByText(/select account for cash/i)).toBeInTheDocument();
    expect(screen.getByText(/select account for bank/i)).toBeInTheDocument();
    expect(screen.getByText(/select account for checks received/i)).toBeInTheDocument();
    expect(screen.getByText(/select account for accounts payable/i)).toBeInTheDocument();
  });

  it('does not show the old placeholder "Configuration settings are coming soon"', () => {
    render(<SystemConfiguration />);

    expect(screen.queryByText(/configuration settings are coming soon/i)).not.toBeInTheDocument();
  });
});
