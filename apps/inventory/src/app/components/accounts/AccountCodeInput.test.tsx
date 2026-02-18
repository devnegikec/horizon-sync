import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountCodeInput } from './AccountCodeInput';

describe('AccountCodeInput', () => {
  const mockOnChange = vi.fn();
  const mockOnValidationChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnValidationChange.mockClear();
  });

  it('renders with label', () => {
    render(
      <AccountCodeInput
        value=""
        onChange={mockOnChange}
        label="Account Code"
      />
    );

    expect(screen.getByText('Account Code')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    render(
      <AccountCodeInput
        value=""
        onChange={mockOnChange}
        required
      />
    );

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('calls onChange when value changes', async () => {
    render(
      <AccountCodeInput
        value=""
        onChange={mockOnChange}
      />
    );

    const input = screen.getByRole('textbox');
    await userEvent.type(input, '1000');

    expect(mockOnChange).toHaveBeenCalledTimes(4); // Once per character
  });

  it('shows error for empty value after blur', async () => {
    render(
      <AccountCodeInput
        value=""
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.tab(); // Blur

    await waitFor(() => {
      expect(screen.getByText('Account code is required')).toBeInTheDocument();
    });
  });

  it('shows error for value exceeding max length', async () => {
    const longValue = 'A'.repeat(51);
    
    render(
      <AccountCodeInput
        value={longValue}
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.tab(); // Blur

    await waitFor(() => {
      expect(screen.getByText('Account code must not exceed 50 characters')).toBeInTheDocument();
    });
  });

  it('validates against format pattern', async () => {
    render(
      <AccountCodeInput
        value="INVALID"
        onChange={mockOnChange}
        formatPattern="^[0-9]{4}-[0-9]{2}$"
        onValidationChange={mockOnValidationChange}
      />
    );

    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.tab(); // Blur

    await waitFor(() => {
      expect(screen.getByText('Account code does not match the required format')).toBeInTheDocument();
    });
  });

  it('accepts valid format pattern', async () => {
    render(
      <AccountCodeInput
        value="1000-01"
        onChange={mockOnChange}
        formatPattern="^[0-9]{4}-[0-9]{2}$"
        onValidationChange={mockOnValidationChange}
      />
    );

    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.tab(); // Blur

    await waitFor(() => {
      expect(screen.queryByText('Account code does not match the required format')).not.toBeInTheDocument();
      expect(screen.getByText(/Format:/)).toBeInTheDocument();
    });
  });

  it('calls onValidationChange with validation state', async () => {
    const { rerender } = render(
      <AccountCodeInput
        value=""
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.tab(); // Blur to trigger validation

    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(false, 'Account code is required');
    });

    // Update with valid value
    rerender(
      <AccountCodeInput
        value="1000"
        onChange={mockOnChange}
        onValidationChange={mockOnValidationChange}
      />
    );

    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalledWith(true, undefined);
    });
  });

  it('disables input when disabled prop is true', () => {
    render(
      <AccountCodeInput
        value=""
        onChange={mockOnChange}
        disabled
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('respects custom maxLength', async () => {
    const value = 'A'.repeat(11);
    
    render(
      <AccountCodeInput
        value={value}
        onChange={mockOnChange}
        maxLength={10}
        onValidationChange={mockOnValidationChange}
      />
    );

    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.tab(); // Blur

    await waitFor(() => {
      expect(screen.getByText('Account code must not exceed 10 characters')).toBeInTheDocument();
    });
  });

  it('shows format hint when pattern is provided and valid', async () => {
    render(
      <AccountCodeInput
        value="1000-01"
        onChange={mockOnChange}
        formatPattern="^[0-9]{4}-[0-9]{2}$"
      />
    );

    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.tab(); // Blur

    await waitFor(() => {
      expect(screen.getByText(/Format: \^/)).toBeInTheDocument();
    });
  });
});
