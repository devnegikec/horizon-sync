import { environment } from '../../environments/environment';

import {
  RegisterPayload,
  RegisterResponse,
  LoginPayload,
  LoginResponse,
  LogoutPayload,
  RefreshResponse,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  AcceptInvitationPayload,
  AcceptInvitationResponse,
  InvitationValidateResponse,
  ApiErrorResponse,
  UserType,
} from './auth.types';

const API_BASE_URL = environment.apiBaseUrl;

/**
 * Utility function to handle API errors consistently
 */
async function handleApiError(response: Response): Promise<never> {
  let message = '';

  try {
    const errorData: ApiErrorResponse = await response.json();

    // Handle different error response formats
    if (errorData?.detail?.message) {
      message = errorData.detail.message;
    } else if (typeof errorData === 'string') {
      message = errorData;
    } else if (errorData && typeof errorData === 'object') {
      // Handle validation errors or other structured errors
      const msg = (errorData as unknown as Record<string, unknown>).message || (errorData as unknown as Record<string, unknown>).detail;
      message = typeof msg === 'string' ? msg : '';
    }
  } catch {
    // JSON parsing failed (e.g., nginx HTML response for 502)
  }

  // If no message extracted from response body, use status-based friendly messages
  if (!message) {
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
      case 423:
        message = 'Your account has been locked. Please contact support.';
        break;
      case 429:
        message = 'Too many attempts. Please wait a moment and try again.';
        break;
      case 500:
        message = 'An unexpected server error occurred. Please try again later.';
        break;
      case 502:
      case 503:
      case 504:
        message = 'The service is temporarily unavailable. Please try again in a few moments.';
        break;
      default:
        message = 'Something went wrong. Please try again later.';
    }
  }

  throw new Error(message);
}

/**
 * Generic request helper to reduce boilerplate
 */
async function apiRequest<T>(
  endpoint: string,
  method: string,
  body?: unknown,
  token?: string,
  options?: { credentials?: RequestCredentials }
): Promise<T> {
  const url = `${API_BASE_URL}/api/v1${endpoint}`;

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
      credentials: options?.credentials ?? 'same-origin',
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
    if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message.includes('NetworkError'))) {
      throw new Error('Unable to connect to the server. Please check your internet connection or try again later.');
    }
    if (error instanceof Error) throw error;
    throw new Error('An unexpected error occurred. Please try again later.');
  }
}

/**
 * Login with credentials: 'include' so the backend can set HttpOnly cookies
 * (e.g. refresh token). Backend should set cookie expiry: 30 days if
 * remember_me is true, session cookie otherwise.
 * 
 * Note: Cookie security flags (HttpOnly, Secure, SameSite) are set by the backend.
 * Backend should set Secure=false in development (HTTP/localhost) and Secure=true in production (HTTPS).
 */
async function loginWithCredentials(payload: LoginPayload): Promise<LoginResponse> {
  const url = `${API_BASE_URL}/api/v1/identity/login`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });
  } catch {
    throw new Error('Unable to connect to the server. Please check your internet connection or try again later.');
  }

  if (!response.ok) {
    await handleApiError(response);
  }

  const data = (await response.json()) as LoginResponse;
  return data;
}

export class AuthService {
  static async register(payload: RegisterPayload): Promise<RegisterResponse> {
    return apiRequest<RegisterResponse>('/identity/register', 'POST', payload);
  }

  static async validateInvitationToken(token: string): Promise<InvitationValidateResponse> {
    return apiRequest<InvitationValidateResponse>(`/identity/invitations/validate/${encodeURIComponent(token)}`, 'GET');
  }

  static async acceptInvitation(payload: AcceptInvitationPayload): Promise<AcceptInvitationResponse> {
    return apiRequest<AcceptInvitationResponse>('/identity/invitations/accept', 'POST', payload);
  }

  /**
   * Login with credentials: 'include' so backend can set HttpOnly, Secure, SameSite=Lax
   * cookies. Send remember_me so backend can use persistent (30d) vs session cookie.
   */
  static async login(payload: LoginPayload): Promise<LoginResponse> {
    return loginWithCredentials(payload);
  }

  /**
   * Refresh access token using refresh token from body.
   * The refresh token must be provided either from the store or from a secure source.
   * Returns new access_token in body.
   * 
   * @param refreshToken - Refresh token to send in body (required).
   */
  static async refresh(refreshToken?: string): Promise<RefreshResponse> {
    const url = `${API_BASE_URL}/api/v1/identity/refresh`;

    // Prepare the request body with refresh_token
    const body: { refresh_token?: string } = {};
    if (refreshToken) {
      body.refresh_token = refreshToken;
    }

    console.log('Refresh request:', { url, hasRefreshToken: !!refreshToken });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });

    console.log('Refresh response status:', response.status);

    if (!response.ok) {
      const err = new Error('Session expired or invalid.');
      (err as Error & { status?: number }).status = response.status;
      throw err;
    }

    const data = await response.json();
    console.log('Refresh response data:', data);
    return data as RefreshResponse;
  }

  /**
   * Logout. Uses credentials: 'include' so backend can clear/invalidate
   * the refresh token cookie. Pass refresh_token in payload if backend expects it in body.
   */
  static async logout(payload: LogoutPayload = {}): Promise<void> {
    const body =
      payload?.refresh_token !== undefined ? payload : undefined;
    return apiRequest<void>('/identity/logout', 'POST', body, undefined, {
      credentials: 'include',
    });
  }

  static async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    return apiRequest<void>('/identity/forgot-password', 'POST', payload);
  }

  static async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    return apiRequest<void>('/identity/reset-password', 'POST', payload);
  }

  static async getUserProfile(token: string): Promise<UserType> {
    return apiRequest<UserType>('/identity/users/me', 'GET', undefined, token);
  }
}
