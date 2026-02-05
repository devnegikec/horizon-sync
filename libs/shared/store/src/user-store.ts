import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { User, UserState, UserPreferences, PreferencesState } from './user-store.types';

const initialState = {
  user: null as User | null,
  accessToken: null as string | null,
  refreshToken: null as string | null,
  isAuthenticated: false,
};

const defaultPreferences: UserPreferences = {
  theme: 'system',
  notifications: {
    email: true,
    push: true,
    sms: false,
  },
  dashboard: {
    layout: 'default',
    widgets: [],
  },
};

// User store - NOT persisted for security reasons
export const useUserStore = create<UserState>()((set) => ({
  ...initialState,
  setAuth: (user, accessToken, refreshToken) => 
    set({ user, accessToken, refreshToken, isAuthenticated: true }),
  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
  updatePreferences: (preferences) =>
    set((state) => ({
      user: state.user 
        ? { 
            ...state.user, 
            preferences: { ...state.user.preferences, ...preferences } 
          } 
        : null,
    })),
  clearAuth: () => set(initialState),
}));

// Preferences store - CAN be persisted safely (no sensitive data)
export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      preferences: defaultPreferences,
      setPreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        })),
      resetPreferences: () => set({ preferences: defaultPreferences }),
    }),
    { 
      name: 'horizon-preferences',
      // Only persist non-sensitive preference data
      partialize: (state) => ({ preferences: state.preferences }),
    },
  ),
);
