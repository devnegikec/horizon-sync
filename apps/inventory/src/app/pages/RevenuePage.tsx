import * as React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';
import { Toaster } from '@horizon-sync/ui/components/ui/toaster';

import { RevenueManagement } from '../components/revenue';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export function RevenuePage() {
  // No page-padding wrapper here on purpose: the host `DashboardLayout` already
  // renders page content inside a `p-6` container. Adding `container px-4 py-8`
  // here double-padded Revenue and made it look inset compared to sibling
  // screens such as User Management or WMS.
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RevenueManagement />
      </ThemeProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default RevenuePage;
