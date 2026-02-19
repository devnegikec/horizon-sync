import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

import { isDevToolsEnabled } from './devtools';
import type { User, UserState, UserPreferences, PreferencesState, Organization } from './user-store.types';

const initialState = {
  user: null as User | null,
  organization: null as Organization | null,
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

// User store - Partially persisted (only refreshToken for session restoration)
// Note: We persist refreshToken to enable session restoration after page reload
// This is a trade-off between security and UX. For maximum security, use HttpOnly cookies.
export const useUserStore = create<UserState>()(
  devtools(
    persist(
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
        setOrganization: (organization) => 
          set({ organization }, false, 'setOrganization'),
        updateOrganization: (partial) =>
          set((state) => ({
            organization: state.organization ? { ...state.organization, ...partial } : null,
          }), false, 'updateOrganization'),
        clearAuth: () => set(initialState, false, 'clearAuth'),
      }),
      {
        name: 'horizon-auth',
        // Only persist refreshToken for session restoration
        // accessToken and user data are kept in memory only for security
        partialize: (state) => ({ 
          refreshToken: state.refreshToken,
        }),
      }
    ),
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
