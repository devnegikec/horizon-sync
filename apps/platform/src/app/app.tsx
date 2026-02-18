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
