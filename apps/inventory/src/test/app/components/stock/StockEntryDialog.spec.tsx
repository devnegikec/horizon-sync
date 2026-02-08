import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as React from 'react';
import { StockEntryDialog } from '../../../../app/components/stock/StockEntryDialog';
import { useStockEntryMutations } from '../../../../app/hooks/useStock';
import type { StockEntry } from '../../../../app/types/stock.types';

// Mock the hook
jest.mock('../../../../app/hooks/useStock', () => ({
  useStockEntryMutations: jest.fn(),
}));

// Mock UI components from @horizon-sync/ui
jest.mock('@horizon-sync/ui/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@horizon-sync/ui/components/ui/button', () => ({
  Button: ({ children, onClick, type, disabled, variant }: any) => (
    <button onClick={onClick} type={type} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

jest.mock('@horizon-sync/ui/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, type, id }: any) => (
    <input
      id={id}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      type={type}
      data-testid={id || placeholder}
    />
  ),
}));

jest.mock('@horizon-sync/ui/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
}));

jest.mock('@horizon-sync/ui/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select-mock">
      <select value={value} onChange={(e) => onValueChange(e.target.value)}>
        {children}
      </select>
    </div>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <>{placeholder}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
}));

jest.mock('@horizon-sync/ui/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, id }: any) => (
    <textarea id={id} value={value} onChange={onChange} placeholder={placeholder} data-testid={id} />
  ),
}));

jest.mock('lucide-react', () => ({
  Loader2: () => <span data-testid="loader" />,
  FileText: () => <span data-testid="file-text" />,
  Plus: () => <span data-testid="plus" />,
  Trash2: () => <span data-testid="trash" />,
}));

describe('StockEntryDialog', () => {
  const mockCreateEntry = jest.fn();
  const mockUpdateEntry = jest.fn();
  const mockOnOpenChange = jest.fn();
  const mockOnCreated = jest.fn();
  const mockOnUpdated = jest.fn();

  const mockWarehouses = [
    { id: 'wh-1', name: 'Main Warehouse', code: 'MWH' },
    { id: 'wh-2', name: 'Secondary Warehouse', code: 'SWH' },
  ];

  const mockItems = [
    { id: 'item-1', item_name: 'Item 1', item_code: 'I1' },
    { id: 'item-2', item_name: 'Item 2', item_code: 'I2' },
  ];

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    warehouses: mockWarehouses as any,
    items: mockItems as any,
    onCreated: mockOnCreated,
    onUpdated: mockOnUpdated,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useStockEntryMutations as jest.Mock).mockReturnValue({
      createEntry: mockCreateEntry,
      updateEntry: mockUpdateEntry,
      loading: false,
      error: null,
    });
  });

  it('should render create mode correctly', () => {
    render(<StockEntryDialog {...defaultProps} />);

    expect(screen.getByText('Create Stock Entry')).toBeTruthy();
    expect(screen.getByText('Create a new stock entry for transfers, receipts, or issues')).toBeTruthy();
    expect(screen.getByText('Create Entry')).toBeTruthy();
  });

  it('should render edit mode correctly', () => {
    const mockEntry: StockEntry = {
      id: 'entry-1',
      stock_entry_no: 'SE-001',
      stock_entry_type: 'material_receipt',
      posting_date: '2024-01-15T00:00:00Z',
      status: 'draft',
      remarks: 'Test remarks',
      items: [
        { item_id: 'item-1', qty: 10, basic_rate: 100 },
      ],
      created_at: '2024-01-15T00:00:00Z',
    };

    render(<StockEntryDialog {...defaultProps} entry={mockEntry} />);

    expect(screen.getByText('Edit Stock Entry')).toBeTruthy();
    expect(screen.getByDisplayValue('SE-001')).toBeTruthy();
    expect(screen.getByDisplayValue('Test remarks')).toBeTruthy();
    expect(screen.getByText('Save Changes')).toBeTruthy();
  });

  it('should handle form input changes', () => {
    render(<StockEntryDialog {...defaultProps} />);

    const remarksInput = screen.getByTestId('remarks');
    fireEvent.change(remarksInput, { target: { value: 'New remarks' } });
    expect((remarksInput as HTMLTextAreaElement).value).toBe('New remarks');

    const entryNoInput = screen.getByTestId('stock_entry_no');
    fireEvent.change(entryNoInput, { target: { value: 'SE-999' } });
    expect((entryNoInput as HTMLInputElement).value).toBe('SE-999');
  });

  it('should add a new line item', () => {
    render(<StockEntryDialog {...defaultProps} />);

    // Initially 1 line item (based on component logic)
    const initialTrashIcons = screen.getAllByTestId('trash');
    expect(initialTrashIcons.length).toBe(1);

    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);

    const updatedTrashIcons = screen.getAllByTestId('trash');
    expect(updatedTrashIcons.length).toBe(2);
  });

  it('should remove a line item', () => {
    render(<StockEntryDialog {...defaultProps} />);

    // Add an item first so we have 2
    fireEvent.click(screen.getByText('Add Item'));
    expect(screen.getAllByTestId('trash').length).toBe(2);

    // Remove the first item
    const removeButtons = screen.getAllByTestId('trash');
    fireEvent.click(removeButtons[0].parentElement!);

    expect(screen.getAllByTestId('trash').length).toBe(1);
  });

  it('should not remove the last line item', () => {
    render(<StockEntryDialog {...defaultProps} />);

    const removeButton = screen.getByTestId('trash').parentElement!;
    fireEvent.click(removeButton);

    // Should still have 1 item
    expect(screen.getAllByTestId('trash').length).toBe(1);
  });

  it('should call createEntry on submit in create mode', async () => {
    mockCreateEntry.mockResolvedValueOnce({ id: 'new-id' });
    render(<StockEntryDialog {...defaultProps} />);

    // Fill required fields
    fireEvent.change(screen.getByTestId('remarks'), { target: { value: 'Test remark' } });

    // Submit form
    const submitButton = screen.getByText('Create Entry');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateEntry).toHaveBeenCalled();
      expect(mockOnCreated).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should call updateEntry on submit in edit mode', async () => {
    const mockEntry: StockEntry = {
      id: 'entry-1',
      stock_entry_no: 'SE-001',
      stock_entry_type: 'material_receipt',
      posting_date: '2024-01-15T00:00:00Z',
      status: 'draft',
      created_at: '2024-01-15T00:00:00Z',
      items: [{ item_id: 'item-1', qty: 5, basic_rate: 10 }]
    };

    mockUpdateEntry.mockResolvedValueOnce({ ...mockEntry, remarks: 'Updated' });
    render(<StockEntryDialog {...defaultProps} entry={mockEntry} />);

    fireEvent.change(screen.getByTestId('remarks'), { target: { value: 'Updated' } });

    const submitButton = screen.getByText('Save Changes');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateEntry).toHaveBeenCalledWith('entry-1', expect.any(Object));
      expect(mockOnUpdated).toHaveBeenCalled();
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('should display error message on failure', async () => {
    const errorMessage = 'Failed to create entry';
    mockCreateEntry.mockRejectedValueOnce(new Error(errorMessage));
    
    render(<StockEntryDialog {...defaultProps} />);

    const submitButton = screen.getByText('Create Entry');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeTruthy();
    });
  });

  it('should show loading state during submission', () => {
    (useStockEntryMutations as jest.Mock).mockReturnValue({
      createEntry: mockCreateEntry,
      updateEntry: mockUpdateEntry,
      loading: true,
      error: null,
    });

    render(<StockEntryDialog {...defaultProps} />);

    expect(screen.getByTestId('loader')).toBeTruthy();
    expect(screen.getByText('Creating...')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeDisabled();
  });
});
