import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, useSearchParams } from 'react-router-dom';
import { ResetPasswordForm } from '@platform/app/components/ResetPasswordForm';
import { AuthService } from '@platform/app/services/auth.service';

// Mock dependencies
jest.mock('@platform/app/services/auth.service');
jest.mock('../../../assets/ciphercode_logo.png', () => 'mock-logo.png');

const mockNavigate = jest.fn();
const mockSearchParams = new URLSearchParams();
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
});
