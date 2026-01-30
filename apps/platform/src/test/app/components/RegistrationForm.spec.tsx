import * as React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

import { RegistrationForm } from '@platform/app/components/RegistrationForm';
import { useAuth } from '@platform/app/hooks';
import { AuthService } from '@platform/app/services/auth.service';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

// Mock dependencies
jest.mock('@platform/app/services/auth.service');
jest.mock('@platform/app/hooks', () => ({
  useAuth: jest.fn(),
}));
jest.mock('@horizon-sync/ui/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));
jest.mock('../../../assets/ciphercode_logo.png', () => 'mock-logo.png');

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('RegistrationForm', () => {
  const mockLogin = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ login: mockLogin });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
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
        <RegistrationForm />
      </BrowserRouter>
    );
  };

  const fillForm = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/phone/i), '9008750493');
    await user.type(screen.getByLabelText(/^password/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!');
  };

  it('1. should render registration form with all required fields', () => {
    renderForm();
    expect(screen.getByText('Create your account')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('2. should show validation errors when submitting an empty form', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderForm();
    
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/first name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/last name must be at least 2 characters/i)).toBeInTheDocument();
    });
  });

  it('3. should show error when passwords do not match', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    renderForm();

    await user.type(screen.getByLabelText(/^password/i), 'Password123!');
    await user.type(screen.getByLabelText(/confirm password/i), 'Different123!');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('4. should call AuthService.register and login on successful submission', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockResponse = {
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
      user: { id: 'user-123', email: 'john@example.com' }
    };
    (AuthService.register as jest.Mock).mockResolvedValue(mockResponse);

    renderForm();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(AuthService.register).toHaveBeenCalled();
      expect(mockLogin).toHaveBeenCalledWith('fake-access-token', 'fake-refresh-token', {
        user_id: 'user-123',
        email: 'john@example.com',
        organization_id: '',
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Registration successful!',
        description: 'Your account has been created successfully.',
      });
    });
  });

  it('5. should display API error message on failure', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const errorMessage = 'Email already exists';
    (AuthService.register as jest.Mock).mockRejectedValue(new Error(errorMessage));

    renderForm();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Registration failed',
        description: errorMessage,
      });
    });
  });
});
