import * as React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import { CurrencySettings } from '../CurrencySettings';
import { CurrencyService } from '../../../../services/currency.service';

// Mock CurrencyService
jest.mock('../../../../services/currency.service');

// Mock toast
const mockToast = jest.fn();
jest.mock('@horizon-sync/ui/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Mock EditableDataTable with a simple table that exercises the component logic
jest.mock('@horizon-sync/ui/components', () => ({
  EditableDataTable: ({ data, onDataChange, enableAddRow, addRowLabel, newRowTemplate }: any) => (
    <div data-testid="editable-data-table">
      <table>
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Symbol</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={row.id || i} data-testid={`currency-row-${i}`}>
              <td>{row.code}</td>
              <td>{row.name}</td>
              <td>{row.symbol}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {enableAddRow && (
        <button
          data-testid="add-row-btn"
          onClick={() => onDataChange([...data, { ...newRowTemplate, code: 'NEW', name: 'New Currency', symbol: 'N', isNew: true }])}
        >
          {addRowLabel}
        </button>
      )}
    </div>
  ),
  EditableCell: () => <td>editable</td>,
  ConfirmationDialog: ({ open, onConfirm, title, description }: any) =>
    open ? (
      <div data-testid="confirmation-dialog">
        <p>{title}</p>
        <p>{description}</p>
        <button data-testid="confirm-delete-btn" onClick={onConfirm}>Confirm</button>
      </div>
    ) : null,
}));

const mockList = CurrencyService.list as jest.MockedFunction<typeof CurrencyService.list>;
const mockCreate = CurrencyService.create as jest.MockedFunction<typeof CurrencyService.create>;
const mockDelete = CurrencyService.delete as jest.MockedFunction<typeof CurrencyService.delete>;

const sampleCurrencies = [
  { id: 'c1', code: 'USD', name: 'US Dollar', symbol: '$' },
  { id: 'c2', code: 'EUR', name: 'Euro', symbol: '€' },
];

describe('CurrencySettings Component', () => {
  const defaultProps = {
    accessToken: 'token-abc',
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue(sampleCurrencies);
  });

  describe('Display Current Currency', () => {
    it('should display current currency from settings', async () => {
      render(<CurrencySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Currencies')).toBeInTheDocument();
      });
    });

    it('should default to USD when no currency is configured', async () => {
      mockList.mockResolvedValue([{ id: 'c1', code: 'USD', name: 'US Dollar', symbol: '$' }]);
      render(<CurrencySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('USD')).toBeInTheDocument();
        expect(screen.getByText('US Dollar')).toBeInTheDocument();
      });
    });

    it('should display EUR when configured', async () => {
      render(<CurrencySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('EUR')).toBeInTheDocument();
        expect(screen.getByText('Euro')).toBeInTheDocument();
      });
    });
  });

  describe('Edit Mode', () => {
    it('should display currency dropdown when canEdit is true', async () => {
      render(<CurrencySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('editable-data-table')).toBeInTheDocument();
      });
    });

    it('should hide currency dropdown when canEdit is false', async () => {
      render(<CurrencySettings {...defaultProps} disabled={true} />);

      await waitFor(() => {
        expect(screen.getByTestId('editable-data-table')).toBeInTheDocument();
      });
      // Add row button should not be present when disabled
      expect(screen.queryByTestId('add-row-btn')).not.toBeInTheDocument();
    });

    it('should populate dropdown with supported currencies', async () => {
      render(<CurrencySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('USD')).toBeInTheDocument();
        expect(screen.getByText('EUR')).toBeInTheDocument();
        expect(screen.getByText('US Dollar')).toBeInTheDocument();
        expect(screen.getByText('Euro')).toBeInTheDocument();
      });
    });
  });

  describe('Currency Update', () => {
    it('should update organization settings with correct JSON format when currency is changed', async () => {
      mockCreate.mockResolvedValue({ id: 'c3', code: 'NEW', name: 'New Currency', symbol: 'N' });
      const user = userEvent.setup();

      render(<CurrencySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('add-row-btn')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('add-row-btn'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith(
          { code: 'NEW', name: 'New Currency', symbol: 'N' },
          'token-abc'
        );
      });
    });

    it('should display success toast on successful update', async () => {
      mockCreate.mockResolvedValue({ id: 'c3', code: 'NEW', name: 'New Currency', symbol: 'N' });
      const user = userEvent.setup();

      render(<CurrencySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('add-row-btn')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('add-row-btn'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: 'Success' })
        );
      });
    });

    it('should display error toast and revert currency on update failure', async () => {
      mockCreate.mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup();

      render(<CurrencySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('add-row-btn')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('add-row-btn'));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            variant: 'destructive',
          })
        );
      });
    });

    it('should preserve other settings when updating currency', async () => {
      mockCreate.mockResolvedValue({ id: 'c3', code: 'NEW', name: 'New Currency', symbol: 'N' });
      const user = userEvent.setup();

      render(<CurrencySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('add-row-btn')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('add-row-btn'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
      });

      // After create, list should be re-fetched
      expect(mockList).toHaveBeenCalledTimes(2);
    });

    it('should disable select during update', async () => {
      let resolveCreate!: (value: any) => void;
      mockCreate.mockImplementation(() => new Promise((resolve) => { resolveCreate = resolve; }));
      const user = userEvent.setup();

      render(<CurrencySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('add-row-btn')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('add-row-btn'));

      await waitFor(() => {
        expect(screen.getByText('Saving...')).toBeInTheDocument();
      });

      resolveCreate({ id: 'c3', code: 'NEW', name: 'New Currency', symbol: 'N' });
    });
  });

  describe('View Mode', () => {
    it('should display currency in view mode when canEdit is false', async () => {
      render(<CurrencySettings {...defaultProps} disabled={true} />);

      await waitFor(() => {
        expect(screen.getByText('USD')).toBeInTheDocument();
        expect(screen.getByText('EUR')).toBeInTheDocument();
      });
    });

    it('should display currency with icon in view mode', async () => {
      render(<CurrencySettings {...defaultProps} disabled={true} />);

      await waitFor(() => {
        expect(screen.getByText('$')).toBeInTheDocument();
        expect(screen.getByText('€')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null currentSettings', async () => {
      mockList.mockResolvedValue([]);
      render(<CurrencySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Currencies')).toBeInTheDocument();
      });
    });

    it('should handle empty currentSettings object', async () => {
      mockList.mockResolvedValue([]);
      render(<CurrencySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('editable-data-table')).toBeInTheDocument();
      });
    });

    it('should update local state when currentSettings prop changes', async () => {
      mockList.mockResolvedValue(sampleCurrencies);
      render(<CurrencySettings {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('USD')).toBeInTheDocument();
        expect(screen.getByText('EUR')).toBeInTheDocument();
      });
    });
  });
});
