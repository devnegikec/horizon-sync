import * as React from 'react';

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { LoginForm } from '../../../app/components/auth/LoginForm';
import { useAuth } from '../../../app/hooks';
import { AuthService } from '../../../app/services/auth.service';

jest.mock('../../../app/services/auth.service');
jest.mock('../../../app/hooks');
jest.mock('../../../assets/ciphercode_logo.png', () => 'mock-logo.png');

describe('LoginForm', () => {
  const mockLogin = jest.fn();
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    display_name: 'John Doe',
    phone: '1234567890',
    avatar_url: null,
    user_type: 'admin',
    status: 'active',
    is_active: true,
    email_verified: true,
    email_verified_at: '2023-01-01T00:00:00Z',
    last_login_at: '2023-01-01T00:00:00Z',
    last_login_ip: '127.0.0.1',
    timezone: 'UTC',
    language: 'en',
    organization_id: 'org-123',
    created_at: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({ login: mockLogin });
  });

  const renderLoginForm = () => {
    return render(
      <BrowserRouter future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}>
        <Routes>
          <Route path="/" element={<LoginForm />} />
          <Route path="/forgot-password" element={<div>Forgot Password Page</div>} />
        </Routes>
      </BrowserRouter>,
    );
  };

  describe('Rendering', () => {
    it('should render the login form successfully', () => {
      renderLoginForm();
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account to continue')).toBeInTheDocument();
    });

    it('should render email input field', () => {
      renderLoginForm();
      const emailInput = screen.getByPlaceholderText('john.doe@company.com') as HTMLInputElement;
      expect(emailInput).toBeInTheDocument();
      expect(emailInput.type).toBe('email');
    });

    it('should render password input field', () => {
      renderLoginForm();
      const passwordInput = screen.getByPlaceholderText('••••••••') as HTMLInputElement;
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput.type).toBe('password');
    });

    it('should render sign in button', () => {
      renderLoginForm();
      const signInButton = screen.getByRole('button', { name: /sign in/i });
      expect(signInButton).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      renderLoginForm();
      const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    it('should render sign up link', () => {
      renderLoginForm();
      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink).toHaveAttribute('href', '/register');
    });

    it('should render terms and privacy links', () => {
      renderLoginForm();
      expect(screen.getByRole('link', { name: /terms & conditions/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /privacy policy/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should prevent form submission when email field is invalid', async () => {
      const user = userEvent.setup();
      (AuthService.login as jest.Mock).mockClear();
      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'Password123');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(AuthService.login).not.toHaveBeenCalled();
      });
    });

    it('should prevent submission when password is empty', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      await user.type(emailInput, 'test@example.com');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should accept valid email and password combination', async () => {
      const user = userEvent.setup();
      (AuthService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        user_id: 'user-123',
        email: 'test@example.com',
        organization_id: 'org-123',
      });

      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'MyPassword123');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalled();
      });
    });
  });

  describe('Login Functionality', () => {
    it('should call AuthService.login with correct payload on form submission', async () => {
      const user = userEvent.setup();
      (AuthService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        user_id: 'user-123',
        email: 'test@example.com',
        organization_id: 'org-123',
      });

      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test@1234');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'Test@1234',
        });
      });
    });

    it('should call login hook with correct user data on successful login', async () => {
      const user = userEvent.setup();
      (AuthService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        user_id: 'user-123',
        email: 'test@example.com',
        organization_id: 'org-123',
      });

      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test@1234');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test-token', 'test-refresh-token', expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
          organization_id: 'org-123',
        }));
      });
    });

    it('should display success message on successful login', async () => {
      const user = userEvent.setup();
      (AuthService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        user_id: 'user-123',
        email: 'test@example.com',
        organization_id: 'org-123',
      });

      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test@1234');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Login successful!')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display "Invalid email or password" error message when server responds with 401', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid email or password';
      (AuthService.login as jest.Mock).mockRejectedValue(new Error(errorMessage));

      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'WrongPassword');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display "Account locked" error message when server responds with 423', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Account has been locked due to multiple failed login attempts. Please try again later or contact support.';
      (AuthService.login as jest.Mock).mockRejectedValue(new Error(errorMessage));

      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

      await user.type(emailInput, 'locked@example.com');
      await user.type(passwordInput, 'Password123');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error message for non-Error exceptions', async () => {
      const user = userEvent.setup();
      (AuthService.login as jest.Mock).mockRejectedValue('Some error');

      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test@1234');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('An unexpected error occurred. Please try again.')).toBeInTheDocument();
      });
    });

    it('should clear previous error messages when resubmitting form', async () => {
      const user = userEvent.setup();
      (AuthService.login as jest.Mock).mockRejectedValueOnce(new Error('Login failed')).mockResolvedValueOnce({
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        user_id: 'user-123',
        email: 'test@example.com',
        organization_id: 'org-123',
      });

      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test@1234');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });

      // Clear the input and try again
      await user.clear(emailInput);
      await user.clear(passwordInput);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test@1234');
      await user.click(signInButton);

      await waitFor(() => {
        expect(screen.queryByText('Login failed')).not.toBeInTheDocument();
        expect(screen.getByText('Login successful!')).toBeInTheDocument();
      });
    });
  });

  describe('UI Behavior', () => {
    it('should disable sign in button while submitting', async () => {
      const user = userEvent.setup();
      (AuthService.login as jest.Mock).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)));

      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test@1234');

      const signInButton = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement;
      await user.click(signInButton);

      expect(signInButton).toBeDisabled();
    });

    it('should show loading state with spinner while submitting', async () => {
      const user = userEvent.setup();
      (AuthService.login as jest.Mock).mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 500)));

      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test@1234');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      expect(screen.getByText('Signing in...')).toBeInTheDocument();
    });

    it('should re-enable sign in button after submission completes', async () => {
      const user = userEvent.setup();
      (AuthService.login as jest.Mock).mockResolvedValue({
        user: mockUser,
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        user_id: 'user-123',
        email: 'test@example.com',
        organization_id: 'org-123',
      });

      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Test@1234');

      const signInButton = screen.getByRole('button', { name: /sign in/i }) as HTMLButtonElement;
      await user.click(signInButton);

      await waitFor(() => {
        expect(signInButton).not.toBeDisabled();
      });
    });
  });

  describe('Input Handling', () => {
    it('should allow entering email address', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com') as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should allow entering password', async () => {
      const user = userEvent.setup();
      renderLoginForm();

      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0] as HTMLInputElement;
      await user.type(passwordInput, 'MySecurePassword123');

      expect(passwordInput.value).toBe('MySecurePassword123');
    });

    it('should accept valid email formats', async () => {
      const user = userEvent.setup();
      (AuthService.login as jest.Mock).mockResolvedValue({
        access_token: 'test-token',
        refresh_token: 'test-refresh-token',
        user_id: 'user-123',
        email: 'user.name+tag@example.co.uk',
        organization_id: 'org-123',
      });

      renderLoginForm();

      const emailInput = screen.getByPlaceholderText('john.doe@company.com');
      const passwordInput = screen.getAllByPlaceholderText('••••••••')[0];

      await user.type(emailInput, 'user.name+tag@example.co.uk');
      await user.type(passwordInput, 'Test@1234');

      const signInButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(signInButton);

      await waitFor(() => {
        expect(AuthService.login).toHaveBeenCalledWith({
          email: 'user.name+tag@example.co.uk',
          password: 'Test@1234',
        });
      });
    });
  });
});
