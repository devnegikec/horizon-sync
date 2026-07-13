import { Suspense } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';
import { Toaster } from '@horizon-sync/ui/components/ui/toaster';

import { AppRoutes } from './AppRoutes';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PermissionsProvider } from './contexts/PermissionsContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Suspense fallback={<AppLoading />}>
            <BrowserRouter>
              <PermissionsProvider>
                <AppRoutes />
                <Toaster />
              </PermissionsProvider>
            </BrowserRouter>
          </Suspense>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
