import { environment } from '../../environments/environment';

export interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
}

export interface UserType {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  id: string;
  display_name: string;
  user_type: string;
  status: string;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface RegisterResponse {
  user: UserType;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: string;
  email: string;
  organization_id: string;
  message?: string;
}

export interface LogoutPayload {
  refresh_token: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
}

export interface ApiError {
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  detail: {
    message: string;
    status_code: number;
    code: string;
  };
}

const API_BASE_URL = environment.apiBaseUrl;

/**
 * Utility function to handle API errors consistently
 * @param response - The fetch response object
 * @returns Promise that throws an error with the server message
 */
async function handleApiError(response: Response): Promise<never> {
  try {
    const errorData: ApiErrorResponse = await response.json();
    const message = errorData?.detail?.message || `HTTP error! status: ${response.status}`;
    throw new Error(message);
  } catch (parseError) {
    // If the error is already an Error (from the throw above), re-throw it
    if (
      parseError instanceof Error &&
      parseError.message !== `HTTP error! status: ${response.status}`
    ) {
      throw parseError;
    }
    // If JSON parsing fails, throw a generic error
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

export class AuthService {
  static async register(payload: RegisterPayload): Promise<RegisterResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      const data: RegisterResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during registration');
    }
  }

  static async login(payload: LoginPayload): Promise<LoginResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      const data: LoginResponse = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during login');
    }
  }

  static async logout(payload: LogoutPayload): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        await handleApiError(response);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during logout');
    }
  }

  static async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        await handleApiError(response);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during forgot password request');
    }
  }

  static async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/identity/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        await handleApiError(response);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred during password reset');
    }
  }
}
