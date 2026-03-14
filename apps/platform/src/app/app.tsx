import * as React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { Toaster } from '@horizon-sync/ui/components/ui/toaster';
import '@horizon-sync/ui/styles/globals.css';

import { AppRoutes } from './AppRoutes';
import { AppLoading } from './components/AppLoading';
import { AuthSessionRestore } from './components/auth/AuthSessionRestore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { queryClient } from './features/search/config/queryClient';

export function App() {
  // Log build info for deployment verification (check via browser console)
  React.useEffect(() => {
    const buildInfo = {
      buildId: process.env.NX_BUILD_ID || 'dev',
      buildTimestamp: process.env.NX_BUILD_TIMESTAMP || 'dev',
      gitHash: process.env.NX_GIT_HASH || 'dev',
    };
    (window as any).__HORIZON_BUILD__ = buildInfo;
    console.log('%c[Horizon Build]', 'color: #4caf50; font-weight: bold', buildInfo);
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <React.Suspense fallback={<AppLoading />}>
          <AuthSessionRestore>
            <AppRoutes />
            <Toaster />
          </AuthSessionRestore>
        </React.Suspense>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
