export interface AdminProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string | null;
  user_type: 'system_admin';
  organization_id: string | null;
  permissions: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    display_name: string | null;
    user_type: string;
  };
}

export interface RefreshResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}
