import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

import { isDevToolsEnabled } from './devtools';
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
export const useUserStore = create<UserState>()(
  devtools(
    (set) => ({
      ...initialState,
      setAuth: (user, accessToken, refreshToken) => 
        set({ user, accessToken, refreshToken, isAuthenticated: true }, false, 'setAuth'),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        }), false, 'updateUser'),
      updatePreferences: (preferences) =>
        set((state) => ({
          user: state.user 
            ? { 
                ...state.user, 
                preferences: { ...state.user.preferences, ...preferences } 
              } 
            : null,
        }), false, 'updatePreferences'),
      clearAuth: () => set(initialState, false, 'clearAuth'),
    }),
    {
      name: 'user-store',
      enabled: isDevToolsEnabled(),
    }
  )
);

// Preferences store - CAN be persisted safely (no sensitive data)
export const usePreferencesStore = create<PreferencesState>()(
  devtools(
    persist(
      (set) => ({
        preferences: defaultPreferences,
        setPreferences: (newPreferences) =>
          set((state) => ({
            preferences: { ...state.preferences, ...newPreferences },
          }), false, 'setPreferences'),
        resetPreferences: () => set({ preferences: defaultPreferences }, false, 'resetPreferences'),
      }),
      { 
        name: 'horizon-preferences',
        // Only persist non-sensitive preference data
        partialize: (state) => ({ preferences: state.preferences }),
      },
    ),
    {
      name: 'preferences-store',
      enabled: isDevToolsEnabled(),
    }
  )
);
