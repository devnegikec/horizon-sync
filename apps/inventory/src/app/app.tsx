import * as React from 'react';

import { Routes, Route } from 'react-router-dom';

import { Toaster } from '@horizon-sync/ui/components';
import { ThemeProvider } from '@horizon-sync/ui/components/theme-provider';

import { InventoryManagement } from './components/inventory-management';
import PublicQRValidation from './pages/PublicQRValidation';

/**
 * Inventory remote entry.
 *
 * The view chrome (title, view switcher, content) lives in `InventoryManagement`
 * so this file stays routing + providers only. `InventoryManagement` renders a
 * `ManagementContainer`, which intentionally adds no page padding — the host
 * `DashboardLayout` in the platform app already supplies the `p-6` wrapper, and
 * this app is normally served as a remote inside it (`npm run dev:inventory`).
 */
export function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Public QR verification routes — no auth required */}
        <Route path="/g/:gtin/s/:serial/:timestamp" element={<PublicQRValidation />} />
        <Route path="/01/:gtin/21/:serial" element={<PublicQRValidation />} />
        {/* Main authenticated app */}
        <Route path="*" element={<InventoryManagement />} />
      </Routes>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
