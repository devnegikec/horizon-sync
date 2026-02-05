// Example usage of the new preferences system
import React from 'react';

import { usePreferences } from '../use-preferences';
import { useUserStore } from '../user-store';
import { DevToolsStatus } from '../components/DevToolsStatus';

export function PreferencesExample() {
  const { user } = useUserStore();
  const { 
    preferences, 
    setTheme, 
    setLanguage, 
    updateNotificationSettings,
    updateDashboardSettings 
  } = usePreferences();

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">User Preferences & DevTools</h2>
      
      {/* DevTools Status */}
      <DevToolsStatus />
      
      {/* Current user info */}
      <div className="bg-gray-100 p-3 rounded">
        <h3 className="font-semibold">Current User:</h3>
        <p>Email: {user?.email || 'Not logged in'}</p>
        <p>Name: {user?.first_name} {user?.last_name}</p>
      </div>

      {/* Theme Settings */}
      <div className="space-y-2">
        <h3 className="font-semibold">Theme Settings</h3>
        <p>Current theme: {preferences.theme}</p>
        <div className="space-x-2">
          <button 
            onClick={() => setTheme('light')}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            Light
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className="px-3 py-1 bg-gray-800 text-white rounded"
          >
            Dark
          </button>
          <button 
            onClick={() => setTheme('system')}
            className="px-3 py-1 bg-green-500 text-white rounded"
          >
            System
          </button>
        </div>
      </div>

      {/* Language Settings */}
      <div className="space-y-2">
        <h3 className="font-semibold">Language Settings</h3>
        <p>Current language: {preferences.language}</p>
        <select 
          value={preferences.language} 
          onChange={(e) => setLanguage(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
        </select>
      </div>

      {/* Notification Settings */}
      <div className="space-y-2">
        <h3 className="font-semibold">Notification Settings</h3>
        <div className="space-y-1">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.notifications?.email || false}
              onChange={(e) => updateNotificationSettings({ email: e.target.checked })}
            />
            <span>Email notifications</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.notifications?.push || false}
              onChange={(e) => updateNotificationSettings({ push: e.target.checked })}
            />
            <span>Push notifications</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.notifications?.sms || false}
              onChange={(e) => updateNotificationSettings({ sms: e.target.checked })}
            />
            <span>SMS notifications</span>
          </label>
        </div>
      </div>

      {/* Dashboard Settings */}
      <div className="space-y-2">
        <h3 className="font-semibold">Dashboard Settings</h3>
        <p>Layout: {preferences.dashboard?.layout}</p>
        <select 
          value={preferences.dashboard?.layout || 'default'} 
          onChange={(e) => updateDashboardSettings({ layout: e.target.value })}
          className="border rounded px-2 py-1"
        >
          <option value="default">Default</option>
          <option value="compact">Compact</option>
          <option value="expanded">Expanded</option>
        </select>
      </div>

      {/* Raw preferences data for debugging */}
      <div className="bg-gray-100 p-3 rounded">
        <h3 className="font-semibold">Raw Preferences Data:</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(preferences, null, 2)}
        </pre>
      </div>

      {/* User extra data example */}
      {user?.extra_data && (
        <div className="bg-blue-100 p-3 rounded">
          <h3 className="font-semibold">User Extra Data:</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(user.extra_data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}