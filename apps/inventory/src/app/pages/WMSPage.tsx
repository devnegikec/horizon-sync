import * as React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';

import { WMSManagement } from '../components/wms';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export function WMSPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-background">
          <main className="container px-4 py-8">
            <WMSManagement />
          </main>
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default WMSPage;
