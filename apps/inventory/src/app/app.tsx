import * as React from 'react';

import { Routes, Route } from 'react-router-dom';

import { useUserStore } from '@horizon-sync/store';
import { Toaster } from '@horizon-sync/ui/components';
import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';

import { InventoryManagement } from './components/inventory-management';
import PublicQRValidation from './pages/PublicQRValidation';

/**
 * Defense in depth. Inside the platform the `/inventory` route is already wrapped
 * in `AuthGuard` + `PermissionGuard`, but this remote can also be loaded on its
 * own (its dev server), where nothing else would stop the inventory UI from
 * rendering for an anonymous visitor. Every request needs the bearer token from
 * the shared store, so there is nothing meaningful to render without one.
 */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const accessToken = useUserStore((s) => s.accessToken);
  if (!accessToken) return null;
  return <>{children}</>;
}

/**
 * Inventory remote entry.
 *
 * The view chrome (title, view switcher, content) lives in `InventoryManagement`
 * so this file stays routing + providers only. `InventoryManagement` renders a
 * `ManagementContainer`, which intentionally adds no page padding — the host
 * `DashboardLayout` in the platform app already supplies the padding, and this
 * app is normally served as a remote inside it (`npm run dev:inventory`).
 */
export function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Public QR verification routes — no auth required */}
        <Route path="/g/:gtin/s/:serial/:timestamp" element={<PublicQRValidation />} />
        <Route path="/01/:gtin/21/:serial" element={<PublicQRValidation />} />
        {/* Main authenticated app */}
        <Route path="*" element={<RequireAuth><InventoryManagement /></RequireAuth>} />
      </Routes>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
