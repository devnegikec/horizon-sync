import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LineItemTable } from '../../../../app/components/quotations/LineItemTable';
import type { QuotationLineItemCreate } from '../../../../app/types/quotation.types';

// Mock the user store
const mockAccessToken = 'test-token';
jest.mock('@horizon-sync/store', () => ({
  useUserStore: jest.fn((selector) => {
    const state = { accessToken: mockAccessToken };
    return selector(state);
  }),
}));

// Mock the item API
jest.mock('../../../../app/utility/api', () => ({
  itemApi: {
    list: jest.fn(() =>
      Promise.resolve({
        items: [
          { id: 'item-1', item_name: 'Product A', item_sku: 'SKU-A' },
          { id: 'item-2', item_name: 'Product B', item_sku: 'SKU-B' },
          { id: 'item-3', item_name: 'Product C' },
        ],
      })
    ),
  },
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe('LineItemTable', () => {
  const mockItems: QuotationLineItemCreate[] = [
    {
      item_id: 'item-1',
      qty: 5,
      uom: 'pcs',
      rate: 100,
      amount: 500,
      sort_order: 1,
    },
    {
      item_id: 'item-2',
      qty: 10,
      uom: 'kg',
      rate: 50,
      amount: 500,
      sort_order: 2,
    },
  ];

  const mockOnItemsChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Editable mode', () => {
    it('should render line items with editable fields', async () => {
      renderWithQueryClient(
        <LineItemTable
          items={mockItems}
          onItemsChange={mockOnItemsChange}
          readonly={false}
        />
      );

      expect(screen.getByText('Line Items')).toBeTruthy();
      expect(screen.getByText('Add Item')).toBeTruthy();
      expect(screen.getByText('Item #1')).toBeTruthy();
      expect(screen.getByText('Item #2')).toBeTruthy();
    });

    it('should add a new line item when Add Item button is clicked', async () => {
      renderWithQueryClient(
        <LineItemTable
          items={mockItems}
          onItemsChange={mockOnItemsChange}
          readonly={false}
        />
      );

      const addButton = screen.getByText('Add Item');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockOnItemsChange).toHaveBeenCalledWith([
          ...mockItems,
          {
            item_id: '',
            qty: 1,
            uom: 'pcs',
            rate: 0,
            amount: 0,
            sort_order: 3,
          },
        ]);
      });
    });

    it('should remove a line item when delete button is clicked', async () => {
      renderWithQueryClient(
        <LineItemTable
          items={mockItems}
          onItemsChange={mockOnItemsChange}
          readonly={false}
        />
      );

      // Find all delete buttons (Trash2 icons)
      const deleteButtons = screen.getAllByRole('button').filter((btn) => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-trash-2');
      });

      expect(deleteButtons.length).toBeGreaterThan(0);
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockOnItemsChange).toHaveBeenCalledWith([
          {
            ...mockItems[1],
            sort_order: 1,
          },
        ]);
      });
    });

    it('should not remove the last line item', async () => {
      const singleItem = [mockItems[0]];
      renderWithQueryClient(
        <LineItemTable
          items={singleItem}
          onItemsChange={mockOnItemsChange}
          readonly={false}
        />
      );

      // Try to find delete button - should not exist for single item
      const deleteButtons = screen.getAllByRole('button').filter((btn) => {
        const svg = btn.querySelector('svg');
        return svg?.classList.contains('lucide-trash-2');
      });

      expect(deleteButtons.length).toBe(0);
    });

    it('should update quantity and recalculate amount', async () => {
      renderWithQueryClient(
        <LineItemTable
          items={mockItems}
          onItemsChange={mockOnItemsChange}
          readonly={false}
        />
      );

      const quantityInputs = screen.getAllByRole('spinbutton');
      const firstQuantityInput = quantityInputs[0] as HTMLInputElement;

      fireEvent.change(firstQuantityInput, { target: { value: '10' } });

      await waitFor(() => {
        expect(mockOnItemsChange).toHaveBeenCalledWith([
          {
            ...mockItems[0],
            qty: 10,
            amount: 1000, // 10 * 100
          },
          mockItems[1],
        ]);
      });
    });

    it('should update rate and recalculate amount', async () => {
      renderWithQueryClient(
        <LineItemTable
          items={mockItems}
          onItemsChange={mockOnItemsChange}
          readonly={false}
        />
      );

      // Get all number inputs (quantity and rate)
      const numberInputs = screen.getAllByRole('spinbutton');
      // Rate is the second input for each item (index 1 for first item)
      const firstRateInput = numberInputs[1] as HTMLInputElement;

      fireEvent.change(firstRateInput, { target: { value: '200' } });

      await waitFor(() => {
        expect(mockOnItemsChange).toHaveBeenCalledWith([
          {
            ...mockItems[0],
            rate: 200,
            amount: 1000, // 5 * 200
          },
          mockItems[1],
        ]);
      });
    });

    it('should update UOM field', async () => {
      renderWithQueryClient(
        <LineItemTable
          items={mockItems}
          onItemsChange={mockOnItemsChange}
          readonly={false}
        />
      );

      // Get all text inputs (UOM inputs)
      const textInputs = screen.getAllByRole('textbox');
      const firstUomInput = textInputs[0] as HTMLInputElement;

      fireEvent.change(firstUomInput, { target: { value: 'ltr' } });

      await waitFor(() => {
        expect(mockOnItemsChange).toHaveBeenCalledWith([
          {
            ...mockItems[0],
            uom: 'ltr',
          },
          mockItems[1],
        ]);
      });
    });

    it('should disable all controls when disabled prop is true', async () => {
      renderWithQueryClient(
        <LineItemTable
          items={mockItems}
          onItemsChange={mockOnItemsChange}
          readonly={false}
          disabled={true}
        />
      );

      const addButton = screen.getByText('Add Item');
      expect(addButton.hasAttribute('disabled')).toBe(true);

      const numberInputs = screen.getAllByRole('spinbutton');
      numberInputs.forEach((input) => {
        expect(input.hasAttribute('disabled')).toBe(true);
      });

      const textInputs = screen.getAllByRole('textbox');
      textInputs.forEach((input) => {
        expect(input.hasAttribute('disabled')).toBe(true);
      });
    });
  });

  describe('Readonly mode', () => {
    it('should render line items in readonly table format', () => {
      renderWithQueryClient(
        <LineItemTable
          items={mockItems}
          onItemsChange={mockOnItemsChange}
          readonly={true}
        />
      );

      // Check for table headers
      expect(screen.getByText('#')).toBeTruthy();
      expect(screen.getByText('Item')).toBeTruthy();
      expect(screen.getByText('Quantity')).toBeTruthy();
      expect(screen.getByText('UOM')).toBeTruthy();
      expect(screen.getByText('Rate')).toBeTruthy();
      expect(screen.getByText('Amount')).toBeTruthy();

      // Check that Add Item button is not present
      expect(screen.queryByText('Add Item')).toBeNull();
    });

    it('should display line item data in readonly table', () => {
      renderWithQueryClient(
        <LineItemTable
          items={mockItems}
          onItemsChange={mockOnItemsChange}
          readonly={true}
        />
      );

      // Check first item data
      expect(screen.getByText('1')).toBeTruthy();
      expect(screen.getByText('item-1')).toBeTruthy();
      expect(screen.getByText('5')).toBeTruthy();
      expect(screen.getByText('pcs')).toBeTruthy();
      expect(screen.getByText('100.00')).toBeTruthy();
      
      // Check for amounts (there are two with 500.00)
      const amounts = screen.getAllByText('500.00');
      expect(amounts.length).toBe(2);

      // Check second item data
      expect(screen.getByText('2')).toBeTruthy();
      expect(screen.getByText('item-2')).toBeTruthy();
      expect(screen.getByText('10')).toBeTruthy();
      expect(screen.getByText('kg')).toBeTruthy();
      expect(screen.getByText('50.00')).toBeTruthy();
    });

    it('should not have any editable inputs in readonly mode', () => {
      renderWithQueryClient(
        <LineItemTable
          items={mockItems}
          onItemsChange={mockOnItemsChange}
          readonly={true}
        />
      );

      const inputs = screen.queryAllByRole('textbox');
      const numberInputs = screen.queryAllByRole('spinbutton');

      expect(inputs.length).toBe(0);
      expect(numberInputs.length).toBe(0);
    });
  });

  describe('Empty state', () => {
    it('should handle empty items array', () => {
      renderWithQueryClient(
        <LineItemTable
          items={[]}
          onItemsChange={mockOnItemsChange}
          readonly={false}
        />
      );

      expect(screen.getByText('Line Items')).toBeTruthy();
      expect(screen.getByText('Add Item')).toBeTruthy();
    });

    it('should render empty readonly table', () => {
      renderWithQueryClient(
        <LineItemTable
          items={[]}
          onItemsChange={mockOnItemsChange}
          readonly={true}
        />
      );

      // Table headers should still be present
      expect(screen.getByText('#')).toBeTruthy();
      expect(screen.getByText('Item')).toBeTruthy();
    });
  });

  describe('Amount calculation', () => {
    it('should display calculated amount correctly', () => {
      const itemsWithCalculatedAmount: QuotationLineItemCreate[] = [
        {
          item_id: 'item-1',
          qty: 7.5,
          uom: 'pcs',
          rate: 123.45,
          amount: 925.875,
          sort_order: 1,
        },
      ];

      renderWithQueryClient(
        <LineItemTable
          items={itemsWithCalculatedAmount}
          onItemsChange={mockOnItemsChange}
          readonly={true}
        />
      );

      expect(screen.getByText('925.88')).toBeTruthy();
    });

    it('should handle zero values', () => {
      const itemsWithZero: QuotationLineItemCreate[] = [
        {
          item_id: 'item-1',
          qty: 0,
          uom: 'pcs',
          rate: 100,
          amount: 0,
          sort_order: 1,
        },
      ];

      renderWithQueryClient(
        <LineItemTable
          items={itemsWithZero}
          onItemsChange={mockOnItemsChange}
          readonly={true}
        />
      );

      expect(screen.getByText('0.00')).toBeTruthy();
    });
  });
});
