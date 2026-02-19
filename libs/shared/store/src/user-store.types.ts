export interface Organization {
  id: string;
  name: string;
  display_name: string | null;
  status: 'active' | 'inactive' | 'suspended';
  is_active: boolean;
  settings: Record<string, unknown> | null;
  extra_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  permissions?: string[];
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  phone: string;
  avatar_url?: string | null;
  user_type?: string;
  status?: string;
  is_active?: boolean;
  email_verified?: boolean;
  email_verified_at?: string | null;
  last_login_at?: string | null;
  last_login_ip?: string | null;
  timezone?: string;
  language?: string;
  organization_id?: string | null;
  job_title?: string;
  department?: string;
  bio?: string;
  preferences?: Record<string, unknown> | null;
  extra_data?: Record<string, unknown> | null;
  permissions?: string[];
  role?: Role;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  dashboard?: {
    layout?: string;
    widgets?: string[];
  };
  [key: string]: unknown;
}

export interface UserState {
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (partial: Partial<User>) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setOrganization: (organization: Organization) => void;
  updateOrganization: (partial: Partial<Organization>) => void;
  clearAuth: () => void;
}

export interface PreferencesState {
  preferences: UserPreferences;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  resetPreferences: () => void;
}
