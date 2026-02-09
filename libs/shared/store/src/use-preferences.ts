import { useCallback } from 'react';

import { useUserStore, usePreferencesStore } from './user-store';
import type { UserPreferences } from './user-store.types';

/**
 * Custom hook to manage user preferences
 * Combines user preferences from the user object and local preferences store
 */
export function usePreferences() {
  const { user, updateUser } = useUserStore();
  const { preferences: localPreferences, setPreferences: setLocalPreferences } = usePreferencesStore();

  // Merge user preferences with local preferences (user preferences take priority)
  const preferences: UserPreferences = {
    ...localPreferences,
    ...user?.preferences,
  };

  const updatePreferences = useCallback(
    (newPreferences: Partial<UserPreferences>) => {
      // Update local preferences store (persisted)
      setLocalPreferences(newPreferences);
      
      // If user is logged in, also update user preferences
      if (user) {
        updateUser({
          preferences: { ...user.preferences, ...newPreferences },
        });
      }
    },
    [user, updateUser, setLocalPreferences]
  );

  const setTheme = useCallback(
    (theme: 'light' | 'dark' | 'system') => {
      updatePreferences({ theme });
    },
    [updatePreferences]
  );

  const setLanguage = useCallback(
    (language: string) => {
      updatePreferences({ language });
    },
    [updatePreferences]
  );

  const setTimezone = useCallback(
    (timezone: string) => {
      updatePreferences({ timezone });
    },
    [updatePreferences]
  );

  const updateNotificationSettings = useCallback(
    (notifications: Partial<UserPreferences['notifications']>) => {
      updatePreferences({
        notifications: { ...preferences.notifications, ...notifications },
      });
    },
    [updatePreferences, preferences.notifications]
  );

  const updateDashboardSettings = useCallback(
    (dashboard: Partial<UserPreferences['dashboard']>) => {
      updatePreferences({
        dashboard: { ...preferences.dashboard, ...dashboard },
      });
    },
    [updatePreferences, preferences.dashboard]
  );

  return {
    preferences,
    updatePreferences,
    setTheme,
    setLanguage,
    setTimezone,
    updateNotificationSettings,
    updateDashboardSettings,
  };
}