import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountTypeFilter, AccountTypeBadge, getAccountTypeBadgeColor } from './AccountTypeFilter';

describe('AccountTypeFilter', () => {
  const mockOnValueChange = vi.fn();

  beforeEach(() => {
    mockOnValueChange.mockClear();
  });

  it('renders with label', () => {
    render(
      <AccountTypeFilter
        value="ALL"
        onValueChange={mockOnValueChange}
        label="Account Type"
      />
    );

    expect(screen.getByText('Account Type')).toBeInTheDocument();
  });

  it('shows "All Types" option by default', async () => {
    render(
      <AccountTypeFilter
        value="ALL"
        onValueChange={mockOnValueChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('All Types')).toBeInTheDocument();
    });
  });

  it('hides "All Types" option when showAllOption is false', async () => {
    render(
      <AccountTypeFilter
        value="ASSET"
        onValueChange={mockOnValueChange}
        showAllOption={false}
      />
    );

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.queryByText('All Types')).not.toBeInTheDocument();
    });
  });

  it('displays all account types with descriptions', async () => {
    render(
      <AccountTypeFilter
        value="ALL"
        onValueChange={mockOnValueChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Asset')).toBeInTheDocument();
      expect(screen.getByText('Resources owned by the organization')).toBeInTheDocument();
      expect(screen.getByText('Liability')).toBeInTheDocument();
      expect(screen.getByText('Obligations owed to others')).toBeInTheDocument();
      expect(screen.getByText('Equity')).toBeInTheDocument();
      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('Expense')).toBeInTheDocument();
    });
  });

  it('calls onValueChange when type is selected', async () => {
    render(
      <AccountTypeFilter
        value="ALL"
        onValueChange={mockOnValueChange}
      />
    );

    const trigger = screen.getByRole('combobox');
    await userEvent.click(trigger);

    await waitFor(() => {
      const assetOption = screen.getByText('Asset');
      userEvent.click(assetOption);
    });

    await waitFor(() => {
      expect(mockOnValueChange).toHaveBeenCalledWith('ASSET');
    });
  });

  it('disables component when disabled prop is true', () => {
    render(
      <AccountTypeFilter
        value="ALL"
        onValueChange={mockOnValueChange}
        disabled
      />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });
});

describe('AccountTypeBadge', () => {
  it('renders badge for ASSET type', () => {
    render(<AccountTypeBadge accountType="ASSET" />);
    expect(screen.getByText('Asset')).toBeInTheDocument();
  });

  it('renders badge for LIABILITY type', () => {
    render(<AccountTypeBadge accountType="LIABILITY" />);
    expect(screen.getByText('Liability')).toBeInTheDocument();
  });

  it('renders badge for EQUITY type', () => {
    render(<AccountTypeBadge accountType="EQUITY" />);
    expect(screen.getByText('Equity')).toBeInTheDocument();
  });

  it('renders badge for REVENUE type', () => {
    render(<AccountTypeBadge accountType="REVENUE" />);
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders badge for EXPENSE type', () => {
    render(<AccountTypeBadge accountType="EXPENSE" />);
    expect(screen.getByText('Expense')).toBeInTheDocument();
  });

  it('applies correct color classes for each type', () => {
    const { container: assetContainer } = render(<AccountTypeBadge accountType="ASSET" />);
    expect(assetContainer.querySelector('.bg-blue-100')).toBeInTheDocument();

    const { container: liabilityContainer } = render(<AccountTypeBadge accountType="LIABILITY" />);
    expect(liabilityContainer.querySelector('.bg-red-100')).toBeInTheDocument();

    const { container: equityContainer } = render(<AccountTypeBadge accountType="EQUITY" />);
    expect(equityContainer.querySelector('.bg-purple-100')).toBeInTheDocument();

    const { container: revenueContainer } = render(<AccountTypeBadge accountType="REVENUE" />);
    expect(revenueContainer.querySelector('.bg-green-100')).toBeInTheDocument();

    const { container: expenseContainer } = render(<AccountTypeBadge accountType="EXPENSE" />);
    expect(expenseContainer.querySelector('.bg-orange-100')).toBeInTheDocument();
  });
});

describe('getAccountTypeBadgeColor', () => {
  it('returns correct color for ASSET', () => {
    expect(getAccountTypeBadgeColor('ASSET')).toContain('bg-blue-100');
  });

  it('returns correct color for LIABILITY', () => {
    expect(getAccountTypeBadgeColor('LIABILITY')).toContain('bg-red-100');
  });

  it('returns correct color for EQUITY', () => {
    expect(getAccountTypeBadgeColor('EQUITY')).toContain('bg-purple-100');
  });

  it('returns correct color for REVENUE', () => {
    expect(getAccountTypeBadgeColor('REVENUE')).toContain('bg-green-100');
  });

  it('returns correct color for EXPENSE', () => {
    expect(getAccountTypeBadgeColor('EXPENSE')).toContain('bg-orange-100');
  });
});
