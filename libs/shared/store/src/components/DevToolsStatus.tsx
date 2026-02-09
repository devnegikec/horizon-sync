import React from 'react';

import { getDevToolsInfo } from '../devtools';
import { useUserStore, usePreferencesStore } from '../user-store';

export function DevToolsStatus() {
  const devToolsInfo = getDevToolsInfo();
  const { user, isAuthenticated } = useUserStore();
  const { preferences } = usePreferencesStore();

  const triggerUserAction = () => {
    const { updateUser } = useUserStore.getState();
    updateUser({
      extra_data: {
        ...user?.extra_data,
        devToolsTest: new Date().toISOString(),
        randomValue: Math.random(),
      },
    });
  };

  const triggerPreferencesAction = () => {
    const { setPreferences } = usePreferencesStore.getState();
    setPreferences({
      theme: preferences.theme === 'dark' ? 'light' : 'dark',
    });
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h3 className="text-lg font-semibold mb-3">Redux DevTools Status</h3>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div 
            className={`w-3 h-3 rounded-full ${
              devToolsInfo.available ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className={devToolsInfo.available ? 'text-green-700' : 'text-red-700'}>
            {devToolsInfo.message}
          </span>
        </div>

        {!devToolsInfo.available && (
          <div className="text-sm text-gray-600">
            <p>To install Redux DevTools:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>
                <a 
                  href={devToolsInfo.installUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Install Redux DevTools Extension
                </a>
              </li>
              <li>Refresh this page</li>
              <li>Open DevTools (F12) → Redux tab</li>
            </ol>
          </div>
        )}

        {devToolsInfo.available && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              DevTools is active! Open your browser DevTools (F12) and look for the &quot;Redux&quot; tab.
            </p>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Test Actions:</p>
              <div className="flex space-x-2">
                <button
                  onClick={triggerUserAction}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  disabled={!isAuthenticated}
                >
                  Update User Data
                </button>
                <button
                  onClick={triggerPreferencesAction}
                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  Toggle Theme
                </button>
              </div>
              {!isAuthenticated && (
                <p className="text-xs text-gray-500">
                  (User actions require authentication)
                </p>
              )}
            </div>

            <div className="text-xs text-gray-500 mt-3">
              <p><strong>Stores available:</strong></p>
              <ul className="list-disc list-inside">
                <li>user-store (tokens hidden for security)</li>
                <li>preferences-store</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}