import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import '@testing-library/jest-dom';
import { InvoiceManagementFilters } from '../../../../app/components/invoices/InvoiceManagementFilters';
import type { InvoiceFilters } from '../../../../app/components/invoices/InvoiceManagementFilters';

describe('InvoiceManagementFilters', () => {
  const mockSetFilters = jest.fn();
  const defaultFilters: InvoiceFilters = {
    search: '',
    status: 'all',
  };

  it('renders search input with correct placeholder', () => {
    render(
      <InvoiceManagementFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        tableInstance={null}
      />
    );

    expect(screen.getByPlaceholderText('Search by invoice #, customer...')).toBeInTheDocument();
  });

  it('renders status dropdown with all status options', () => {
    render(
      <InvoiceManagementFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        tableInstance={null}
      />
    );

    const statusTrigger = screen.getByRole('combobox');
    fireEvent.click(statusTrigger);

    // Check that all status options are available - use getAllByText for duplicates
    expect(screen.getAllByText('All Status').length).toBeGreaterThan(0);
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Submitted')).toBeInTheDocument();
    expect(screen.getByText('Paid')).toBeInTheDocument();
    expect(screen.getByText('Partially Paid')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('calls setFilters when status is changed', () => {
    render(
      <InvoiceManagementFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        tableInstance={null}
      />
    );

    const statusTrigger = screen.getByRole('combobox');
    fireEvent.click(statusTrigger);
    
    const draftOption = screen.getByText('Draft');
    fireEvent.click(draftOption);

    expect(mockSetFilters).toHaveBeenCalled();
  });

  it('calls setFilters when search input changes', async () => {
    render(
      <InvoiceManagementFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        tableInstance={null}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search by invoice #, customer...');
    
    // Type in the search input
    fireEvent.change(searchInput, { target: { value: 'INV-001' } });

    // SearchInput component handles debouncing internally
    await waitFor(
      () => {
        expect(mockSetFilters).toHaveBeenCalled();
      },
      { timeout: 500 }
    );
  });

  it('renders date range inputs', () => {
    render(
      <InvoiceManagementFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        tableInstance={null}
      />
    );

    expect(screen.getByLabelText('Posting Date From')).toBeInTheDocument();
    expect(screen.getByLabelText('Posting Date To')).toBeInTheDocument();
  });

  it('calls setFilters when date from is changed', () => {
    render(
      <InvoiceManagementFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        tableInstance={null}
      />
    );

    const dateFromInput = screen.getByLabelText('Posting Date From');
    fireEvent.change(dateFromInput, { target: { value: '2024-01-01' } });

    expect(mockSetFilters).toHaveBeenCalled();
  });

  it('calls setFilters when date to is changed', () => {
    render(
      <InvoiceManagementFilters
        filters={defaultFilters}
        setFilters={mockSetFilters}
        tableInstance={null}
      />
    );

    const dateToInput = screen.getByLabelText('Posting Date To');
    fireEvent.change(dateToInput, { target: { value: '2024-12-31' } });

    expect(mockSetFilters).toHaveBeenCalled();
  });

  it('displays current filter values', () => {
    const filtersWithValues: InvoiceFilters = {
      search: 'INV-001',
      status: 'paid',
      date_from: '2024-01-01',
      date_to: '2024-12-31',
    };

    render(
      <InvoiceManagementFilters
        filters={filtersWithValues}
        setFilters={mockSetFilters}
        tableInstance={null}
      />
    );

    const dateFromInput = screen.getByLabelText('Posting Date From') as HTMLInputElement;
    const dateToInput = screen.getByLabelText('Posting Date To') as HTMLInputElement;

    expect(dateFromInput.value).toBe('2024-01-01');
    expect(dateToInput.value).toBe('2024-12-31');
  });
});
