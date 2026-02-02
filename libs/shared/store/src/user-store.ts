import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User, UserState } from './user-store.types';

const initialState = {
  user: null as User | null,
  accessToken: null as string | null,
  refreshToken: null as string | null,
  isAuthenticated: false,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken, isAuthenticated: true }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
      clearAuth: () => set(initialState),
    }),
    { name: 'horizon-user' }
  )
);
