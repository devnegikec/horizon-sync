import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  user_id: string;
  email: string;
  organization_id: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      login: (token: string, user: User) => {
        set({
          accessToken: token,
          user,
          isAuthenticated: true,
        });
      },
      logout: () => {
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        });
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
