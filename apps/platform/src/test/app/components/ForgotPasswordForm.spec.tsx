import * as React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ForgotPasswordForm } from '@platform/app/components/ForgotPasswordForm';
import { AuthService } from '@platform/app/services/auth.service';

// Mock dependencies
jest.mock('@platform/app/services/auth.service');
jest.mock('../../../assets/ciphercode_logo.png', () => 'mock-logo.png');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ForgotPasswordForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderForm = () => {
    return render(
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <ForgotPasswordForm />
      </BrowserRouter>
    );
  };

  it('1. should render forgot password form successfully', () => {
    renderForm();
    expect(screen.getByText('Forgot Password', { selector: 'div' })).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset link/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to login/i })).toBeInTheDocument();
  });

  it('2. should show validation error for invalid email', async () => {
    renderForm();
    
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('3. should call AuthService.forgotPassword and show success message', async () => {
    const user = userEvent.setup();
    (AuthService.forgotPassword as jest.Mock).mockResolvedValue({});

    renderForm();
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(AuthService.forgotPassword).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(screen.getByText(/if an account exists with that email, we have sent a password reset link/i)).toBeInTheDocument();
    });
  });

  it('4. should display API error message on failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Service unavailable';
    (AuthService.forgotPassword as jest.Mock).mockRejectedValue(new Error(errorMessage));

    renderForm();
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('5. should navigate to login page when "Back to login" is clicked', async () => {
    const user = userEvent.setup();
    renderForm();
    
    await user.click(screen.getByRole('button', { name: /back to login/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
