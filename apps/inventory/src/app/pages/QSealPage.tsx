import * as React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';

import { QSealManagement } from '../components/qseal';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export function QSealPage() {
  // The host DashboardLayout already provides page padding for this screen.
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <QSealManagement />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default QSealPage;
