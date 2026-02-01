import * as React from 'react';

import { Toaster } from '@horizon-sync/ui/components/ui/toaster';
import '@horizon-sync/ui/styles/globals.css';

import { AppRoutes } from './AppRoutes';
import { AppLoading } from './components/AppLoading';

export function App() {
  return (
    <React.Suspense fallback={<AppLoading />}>
      <AppRoutes />
      <Toaster />
    </React.Suspense>
  );
}

export default App;
