import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { AuthService } from '../services/auth.service';

interface User {
  user_id: string;
  email: string;
  organization_id: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      login: (token: string, refreshToken: string, user: User) => {
        set({
          accessToken: token,
          refreshToken,
          user,
          isAuthenticated: true,
        });
      },
      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await AuthService.logout({ refresh_token: refreshToken });
          }
        } catch (error) {
          console.error('Logout service failed:', error);
        } finally {
          set({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
          });
        }
      },
      setUser: (user: User) => {
        set({ user });
      },
    }),
    {
      name: 'horizon-auth',
    }
  )
);

export function useAuth() {
  return useAuthStore();
}
