import * as React from 'react';

import { Toaster } from '@horizon-sync/ui/components/ui/toaster';
import '@horizon-sync/ui/styles/globals.css';

import { AppRoutes } from './AppRoutes';
import { AppLoading } from './components/AppLoading';
import { AuthSessionRestore } from './components/auth/AuthSessionRestore';

export function App() {
  return (
    <React.Suspense fallback={<AppLoading />}>
      <AuthSessionRestore>
        <AppRoutes />
        <Toaster />
      </AuthSessionRestore>
    </React.Suspense>
  );
}

export default App;
