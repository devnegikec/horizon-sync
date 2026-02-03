import { environment } from '../../environments/environment';

import {
  RegisterPayload,
  RegisterResponse,
  LoginPayload,
  LoginResponse,
  LogoutPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  ApiErrorResponse,
} from './auth.types';

const API_BASE_URL = environment.apiBaseUrl;

/**
 * Utility function to handle API errors consistently
 */
async function handleApiError(response: Response): Promise<never> {
  let message = `HTTP error! status: ${response.status}`;
  try {
    const errorData: ApiErrorResponse = await response.json();
    message = errorData?.detail?.message || message;
  } catch {
    // Fallback to default message if JSON parsing fails
  }
  throw new Error(message);
}

/**
 * Generic request helper to reduce boilerplate
 */
async function apiRequest<T>(endpoint: string, method: string, body?: unknown): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error('An unexpected error occurred');
  }
}

export class AuthService {
  static async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>('/identity/register', 'POST', payload);
  }

  static async login(payload: LoginPayload): Promise<LoginResponse> {
    return apiRequest<LoginResponse>('/identity/login', 'POST', payload);
  }

  static async logout(payload: LogoutPayload): Promise<void> {
    return apiRequest<void>('/identity/logout', 'POST', payload);
  }

  static async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    return apiRequest<void>('/identity/forgot-password', 'POST', payload);
  }

  static async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    return apiRequest<void>('/identity/reset-password', 'POST', payload);
  }
}
