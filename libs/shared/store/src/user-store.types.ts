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
  email_verified?: boolean;
  timezone?: string;
  language?: string;
  organization_id?: string | null;
  job_title?: string;
  department?: string;
  bio?: string;
}

export interface UserState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (partial: Partial<User>) => void;
  clearAuth: () => void;
}
