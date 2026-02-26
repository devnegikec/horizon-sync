import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountSelector } from './AccountSelector';
import type { AccountListItem } from '../../types/account.types';

// Mock the useAccounts hook
vi.mock('../../hooks/useAccounts', () => ({
  useAccounts: vi.fn(() => ({
    accounts: [
      {
        id: '1',
        account_code: '1000',
        account_name: 'Cash',
        account_type: 'ASSET',
        parent_account_id: null,
        currency: 'USD',
        level: 0,
        is_group: false,
        is_active: true,
        created_at: '2024-01-01',
      },
      {
        id: '2',
        account_code: '2000',
        account_name: 'Accounts Payable',
        account_type: 'LIABILITY',
        parent_account_id: null,
        currency: 'USD',
        level: 0,
        is_group: false,
        is_active: true,
        created_at: '2024-01-01',
      },
      {
        id: '3',
        account_code: '1100',
        account_name: 'Bank Account',
        account_type: 'ASSET',
        parent_account_id: '1',
        currency: 'USD',
        level: 1,
        is_group: false,
        is_active: true,
        created_at: '2024-01-01',
      },
      {
        id: '4',
        account_code: '1200',
        account_name: 'Inactive Asset',
        account_type: 'ASSET',
        parent_account_id: null,
        currency: 'USD',
        level: 0,
        is_group: false,
        is_active: false,
        created_at: '2024-01-01',
      },
    ] as AccountListItem[],
    loading: false,
  })),
}));

describe('AccountSelector', () => {
  const mockOnValueChange = vi.fn();

  beforeEach(() => {
    mockOnValueChange.mockClear();
  });

  it('renders with label', () => {
    render(
      <AccountSelector
        value={null}
        onValueChange={mockOnValueChange}
        label="Select Account"
      />
    );

    expect(screen.getByText('Select Account')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(
      <AccountSelector
        value={null}
        onValueChange={mockOnValueChange}
        label="Account"
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('filters accounts by type', async () => {
    render(
      <AccountSelector
        value={null}
        onValueChange={mockOnValueChange}
        accountType="ASSET"
      />
    );

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText(/1000 - Cash/)).toBeInTheDocument();
      expect(screen.getByText(/1100 - Bank Account/)).toBeInTheDocument();
      expect(screen.queryByText(/2000 - Accounts Payable/)).not.toBeInTheDocument();
    });
  });

  it('excludes specified account', async () => {
    render(
      <AccountSelector
        value={null}
        onValueChange={mockOnValueChange}
        excludeAccountId="1"
      />
    );

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText(/1000 - Cash/)).not.toBeInTheDocument();
      expect(screen.getByText(/2000 - Accounts Payable/)).toBeInTheDocument();
    });
  });

  it('filters inactive accounts by default', async () => {
    render(
      <AccountSelector
        value={null}
        onValueChange={mockOnValueChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText(/1200 - Inactive Asset/)).not.toBeInTheDocument();
    });
  });

  it('shows inactive accounts when filterInactive is false', async () => {
    render(
      <AccountSelector
        value={null}
        onValueChange={mockOnValueChange}
        filterInactive={false}
      />
    );

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText(/1200 - Inactive Asset/)).toBeInTheDocument();
    });
  });

  it('calls onValueChange when account is selected', async () => {
    render(
      <AccountSelector
        value={null}
        onValueChange={mockOnValueChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    await waitFor(() => {
      const option = screen.getByText(/1000 - Cash/);
      userEvent.click(option);
    });

    await waitFor(() => {
      expect(mockOnValueChange).toHaveBeenCalledWith('1');
    });
  });

  it('calls onValueChange with null when "None" is selected', async () => {
    render(
      <AccountSelector
        value="1"
        onValueChange={mockOnValueChange}
        required={false}
      />
    );

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    await waitFor(() => {
      const noneOption = screen.getByText('None');
      userEvent.click(noneOption);
    });

    await waitFor(() => {
      expect(mockOnValueChange).toHaveBeenCalledWith(null);
    });
  });

  it('does not show "None" option when required', async () => {
    render(
      <AccountSelector
        value={null}
        onValueChange={mockOnValueChange}
        required
      />
    );

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText('None')).not.toBeInTheDocument();
    });
  });

  it('disables component when disabled prop is true', () => {
    render(
      <AccountSelector
        value={null}
        onValueChange={mockOnValueChange}
        disabled
      />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });
});
