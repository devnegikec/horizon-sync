import * as React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useSearchParams } from 'react-router-dom';

import { ResetPasswordForm } from '@platform/app/components';
import { AuthService } from '@platform/app/services/auth.service';

// Mock dependencies
jest.mock('@platform/app/services/auth.service');
jest.mock('../../../assets/ciphercode_logo.png', () => 'mock-logo.png');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: jest.fn(),
}));

describe('ResetPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useSearchParams as jest.Mock).mockReturnValue([new URLSearchParams('token=test-token'), jest.fn()]);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderForm = () => {
    return render(
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ResetPasswordForm />
      </BrowserRouter>
    );
  };

  it('1. should show invalid link state if token is missing', () => {
    (useSearchParams as jest.Mock).mockReturnValue([new URLSearchParams(''), jest.fn()]);
    renderForm();
    expect(screen.getByText('Invalid Link')).toBeInTheDocument();
    expect(screen.getByText(/the password reset link is invalid or has expired/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /request new link/i })).toBeInTheDocument();
  });

  it('2. should render reset password form when token is present', () => {
    renderForm();
    expect(screen.getByText('Reset Password', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('3. should show validation error when passwords do not match', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderForm();
    
    await user.type(screen.getByLabelText(/^new password/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm new password/i), 'Mismatch123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('4. should call AuthService.resetPassword and navigate to login on success', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    (AuthService.resetPassword as jest.Mock).mockResolvedValue({});

    renderForm();
    await user.type(screen.getByLabelText(/^new password/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm new password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(AuthService.resetPassword).toHaveBeenCalledWith({
        token: 'test-token',
        new_password: 'Password123!',
      });
      expect(screen.getByText(/password has been reset successfully/i)).toBeInTheDocument();
    });

    jest.advanceTimersByTime(2000);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('5. should display API error message on failure', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const errorMessage = 'Token expired';
    (AuthService.resetPassword as jest.Mock).mockRejectedValue(new Error(errorMessage));

    renderForm();
    await user.type(screen.getByLabelText(/^new password/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm new password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('6. should display generic error message when error is not an Error instance', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    (AuthService.resetPassword as jest.Mock).mockRejectedValue('Unexpected error');

    renderForm();
    await user.type(screen.getByLabelText(/^new password/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm new password/i), 'Password123!');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
    });
  });

  it('7. should navigate to forgot-password page when Request New Link button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    (useSearchParams as jest.Mock).mockReturnValue([new URLSearchParams(''), jest.fn()]);
    
    renderForm();
    const requestNewLinkButton = screen.getByRole('button', { name: /request new link/i });
    await user.click(requestNewLinkButton);

    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('8. should show password validation error for invalid password format', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderForm();
    
    await user.type(screen.getByLabelText(/^new password/i), 'weak');
    await user.type(screen.getByLabelText(/confirm new password/i), 'weak');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });

  it('9. should show error message when token becomes missing during submission', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    // Use a flag to control token value - returns 'test-token' during render, null during submit
    let shouldReturnToken = true;
    const mockGet = jest.fn((key: string) => {
      if (key === 'token') {
        return shouldReturnToken ? 'test-token' : null;
      }
      return null;
    });
    
    const mockSearchParams = {
      get: mockGet,
      has: jest.fn(),
      getAll: jest.fn(),
      keys: jest.fn(),
      values: jest.fn(),
      entries: jest.fn(),
      forEach: jest.fn(),
      append: jest.fn(),
      delete: jest.fn(),
      set: jest.fn(),
      sort: jest.fn(),
      toString: jest.fn(),
    };
    
    (useSearchParams as jest.Mock).mockReturnValue([mockSearchParams as unknown as URLSearchParams, jest.fn()]);
    
    renderForm();
    
    // Fill in the form while token is still 'test-token'
    await user.type(screen.getByLabelText(/^new password/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm new password/i), 'Password123!');
    
    // Now simulate the token becoming missing
    shouldReturnToken = false;
    
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText('Reset token is missing. Please request a new password reset link.')).toBeInTheDocument();
    });
    
    // Verify get was called for 'token'
    expect(mockGet).toHaveBeenCalledWith('token');
  });
});
