export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  phone: string;
  avatar_url: string | null;
  user_type: string
  status: string;
  email_verified: boolean;
  timezone: string;
  lenguage: string;
  organization_id: string | null;
}

export interface UserState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (partial: Partial<Pick<User, 'email' | 'first_name' | 'last_name' | 'phone'>>) => void;
  clearAuth: () => void;
}
