import * as React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';

import { QSealManagement } from '../components/qseal';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export function QSealPage() {
  // No page-padding wrapper here on purpose: the host `DashboardLayout` already
  // renders page content inside a `p-6` container. Adding `container px-4 py-8`
  // here double-padded QSeal and made it look inset compared to sibling screens
  // such as User Management or WMS.
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <QSealManagement />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default QSealPage;
