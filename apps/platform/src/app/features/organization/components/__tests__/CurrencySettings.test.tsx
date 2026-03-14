import * as React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { CurrencySettings } from '../CurrencySettings';

// Mock dependencies
jest.mock('../../hooks/useUpdateOrganization');
jest.mock('@horizon-sync/ui/hooks/use-toast');

const mockUpdateOrganization = jest.fn();
const mockToast = jest.fn();

// Setup mocks
beforeEach(() => {
  jest.clearAllMocks();

  const { useUpdateOrganization } = require('../../hooks/useUpdateOrganization');
  useUpdateOrganization.mockReturnValue({
    updateOrganization: mockUpdateOrganization,
    loading: false,
    error: null,
  });

  const { useToast } = require('@horizon-sync/ui/hooks/use-toast');
  useToast.mockReturnValue({
    toast: mockToast,
  });
});

describe('CurrencySettings Component', () => {
  const defaultProps = {
    organizationId: 'org-123',
    accessToken: 'token-abc',
    currentSettings: { currency: 'USD' },
    canEdit: true,
  };

  describe('Display Current Currency', () => {
    it('should display current currency from settings', () => {
      render(<CurrencySettings {...defaultProps} />);

      expect(screen.getByText('Currency Settings')).toBeInTheDocument();
      expect(screen.getByText('Preferred Currency')).toBeInTheDocument();
    });

    it('should default to USD when no currency is configured', () => {
      render(<CurrencySettings {...defaultProps} currentSettings={null} />);

      // The select should have USD as the default value
      const select = screen.getByRole('combobox');
      expect(select).toHaveTextContent('US Dollar');
    });

    it('should display EUR when configured', () => {
      render(<CurrencySettings {...defaultProps} currentSettings={{ currency: 'EUR' }} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveTextContent('Euro');
    });
  });

  describe('Edit Mode', () => {
    it('should display currency dropdown when canEdit is true', () => {
      render(<CurrencySettings {...defaultProps} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Preferred Currency')).toBeInTheDocument();
    });

    it('should hide currency dropdown when canEdit is false', () => {
      render(<CurrencySettings {...defaultProps} canEdit={false} />);

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
      // Should display in view mode instead
      expect(screen.getByText('$ US Dollar (USD)')).toBeInTheDocument();
    });

    it('should populate dropdown with supported currencies', async () => {
      const user = userEvent.setup();
      render(<CurrencySettings {...defaultProps} />);

      const select = screen.getByRole('combobox');
      await user.click(select);

      // Wait for dropdown to open and check for currencies
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /US Dollar/ })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Euro/ })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /British Pound/ })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Japanese Yen/ })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Australian Dollar/ })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Canadian Dollar/ })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Swiss Franc/ })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Chinese Yuan/ })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Indian Rupee/ })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: /Singapore Dollar/ })).toBeInTheDocument();
      });
    });
  });

  describe('Currency Update', () => {
    it('should update organization settings with correct JSON format when currency is changed', async () => {
      const user = userEvent.setup();
      mockUpdateOrganization.mockResolvedValue({});

      render(<CurrencySettings {...defaultProps} />);

      const select = screen.getByRole('combobox');
      await user.click(select);

      // Select EUR
      const eurOption = await screen.findByRole('option', { name: /Euro/ });
      await user.click(eurOption);

      await waitFor(() => {
        expect(mockUpdateOrganization).toHaveBeenCalledWith(
          'org-123',
          {
            settings: {
              currency: 'EUR',
            },
          },
          'token-abc'
        );
      });
    });

    it('should display success toast on successful update', async () => {
      const user = userEvent.setup();
      mockUpdateOrganization.mockResolvedValue({});

      render(<CurrencySettings {...defaultProps} />);

      const select = screen.getByRole('combobox');
      await user.click(select);

      const gbpOption = await screen.findByRole('option', { name: /British Pound/ });
      await user.click(gbpOption);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Currency updated successfully',
        });
      });
    });

    it('should display error toast and revert currency on update failure', async () => {
      const user = userEvent.setup();
      const error = new Error('Network error');
      mockUpdateOrganization.mockRejectedValue(error);

      render(<CurrencySettings {...defaultProps} currentSettings={{ currency: 'USD' }} />);

      const select = screen.getByRole('combobox');
      await user.click(select);

      const jpyOption = await screen.findByRole('option', { name: /Japanese Yen/ });
      await user.click(jpyOption);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Network error',
          variant: 'destructive',
        });
      });

      // Currency should revert to USD
      await waitFor(() => {
        expect(select).toHaveTextContent('US Dollar');
      });
    });

    it('should preserve other settings when updating currency', async () => {
      const user = userEvent.setup();
      mockUpdateOrganization.mockResolvedValue({});

      const settingsWithOtherData = {
        currency: 'USD',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
      };

      render(<CurrencySettings {...defaultProps} currentSettings={settingsWithOtherData} />);

      const select = screen.getByRole('combobox');
      await user.click(select);

      const cadOption = await screen.findByRole('option', { name: /Canadian Dollar/ });
      await user.click(cadOption);

      await waitFor(() => {
        expect(mockUpdateOrganization).toHaveBeenCalledWith(
          'org-123',
          {
            settings: {
              currency: 'CAD',
              timezone: 'America/New_York',
              dateFormat: 'MM/DD/YYYY',
            },
          },
          'token-abc'
        );
      });
    });

    it('should disable select during update', async () => {
      const user = userEvent.setup();
      let resolveUpdate: () => void;
      const updatePromise = new Promise<void>((resolve) => {
        resolveUpdate = resolve;
      });
      mockUpdateOrganization.mockReturnValue(updatePromise);

      render(<CurrencySettings {...defaultProps} />);

      const select = screen.getByRole('combobox');
      await user.click(select);

      const eurOption = await screen.findByRole('option', { name: /Euro/ });
      await user.click(eurOption);

      // Select should be disabled during update
      await waitFor(() => {
        expect(screen.getByText('Updating currency...')).toBeInTheDocument();
      });

      // Resolve the update
      if (resolveUpdate) {
        resolveUpdate();
      }
    });
  });

  describe('View Mode', () => {
    it('should display currency in view mode when canEdit is false', () => {
      render(<CurrencySettings {...defaultProps} canEdit={false} currentSettings={{ currency: 'GBP' }} />);

      expect(screen.getByText('£ British Pound (GBP)')).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('should display currency with icon in view mode', () => {
      render(<CurrencySettings {...defaultProps} canEdit={false} />);

      expect(screen.getByText('Preferred Currency')).toBeInTheDocument();
      expect(screen.getByText('$ US Dollar (USD)')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null currentSettings', () => {
      render(<CurrencySettings {...defaultProps} currentSettings={null} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveTextContent('US Dollar');
    });

    it('should handle empty currentSettings object', () => {
      render(<CurrencySettings {...defaultProps} currentSettings={{}} />);

      const select = screen.getByRole('combobox');
      expect(select).toHaveTextContent('US Dollar');
    });

    it('should update local state when currentSettings prop changes', () => {
      const { rerender } = render(<CurrencySettings {...defaultProps} currentSettings={{ currency: 'USD' }} />);

      let select = screen.getByRole('combobox');
      expect(select).toHaveTextContent('US Dollar');

      // Update props
      rerender(<CurrencySettings {...defaultProps} currentSettings={{ currency: 'EUR' }} />);

      select = screen.getByRole('combobox');
      expect(select).toHaveTextContent('Euro');
    });
  });
});
