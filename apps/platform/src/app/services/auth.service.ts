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
  UserType,
} from './auth.types';

const API_BASE_URL = environment.apiBaseUrl;

/**
 * Utility function to handle API errors consistently
 */
async function handleApiError(response: Response): Promise<never> {
  let message = `HTTP error! status: ${response.status}`;
  
  try {
    const errorData: ApiErrorResponse = await response.json();
    
    // Handle different error response formats
    if (errorData?.detail?.message) {
      message = errorData.detail.message;
    } else if (typeof errorData === 'string') {
      message = errorData;
    } else if (errorData && typeof errorData === 'object') {
      // Handle validation errors or other structured errors
      message = JSON.stringify(errorData);
    }
  } catch {
    // If JSON parsing fails, use status-based messages
    switch (response.status) {
      case 400:
        message = 'Invalid request. Please check your input and try again.';
        break;
      case 401:
        message = 'Authentication failed. Please check your credentials.';
        break;
      case 403:
        message = 'Access denied. You do not have permission to perform this action.';
        break;
      case 404:
        message = 'The requested resource was not found.';
        break;
      case 409:
        message = 'A user with this email already exists.';
        break;
      case 422:
        message = 'Validation error. Please check your input.';
        break;
      case 500:
        message = 'Server error. Please try again later.';
        break;
      default:
        message = `HTTP error! status: ${response.status}`;
    }
  }
  
  throw new Error(message);
}

/**
 * Generic request helper to reduce boilerplate
 */
async function apiRequest<T>(endpoint: string, method: string, body?: unknown, token?: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`Making ${method} request to:`, url);
  if (body) {
    console.log('Request body:', body);
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
      await handleApiError(response);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const responseData = await response.json();
    console.log('Response data:', responseData);
    
    return responseData;
  } catch (error) {
    console.error('API request error:', error);
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

  static async getUserProfile(token: string): Promise<UserType> {
    return apiRequest<UserType>('/identity/profile', 'GET', undefined, token);
  }
}
