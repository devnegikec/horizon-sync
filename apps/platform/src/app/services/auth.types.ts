export interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  password: string;
}

export interface UserType {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  avatar_url: string | null;
  user_type: string;
  status: string;
  is_active: boolean;
  email_verified: boolean;
  email_verified_at: string | null;
  last_login_at: string | null;
  last_login_ip: string | null;
  timezone: string;
  language: string;
  organization_id: string | null;
  job_title?: string;
  department?: string;
  bio?: string;
  preferences?: Record<string, unknown> | null;
  extra_data?: Record<string, unknown> | null;
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
