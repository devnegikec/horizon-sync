import * as React from 'react';
import { Route, Routes } from 'react-router-dom';
import '@horizon-sync/ui/styles/globals.css';
import { DashboardLayout, DashboardHome } from './components';
import { RegisterPage } from './pages/register';
import { LoginPage } from './pages/login';

const Inventory = React.lazy(() => import('inventory/Module'));

export function App() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <Routes>
        {/* Public routes without dashboard layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes with dashboard layout */}
        <Route
          path="/*"
          element={
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<DashboardHome />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route
                  path="/analytics"
                  element={
                    <PlaceholderPage
                      title="Analytics"
                      description="View detailed analytics and insights"
                    />
                  }
                />
                <Route
                  path="/users"
                  element={
                    <PlaceholderPage
                      title="Users"
                      description="Manage platform users and permissions"
                    />
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <PlaceholderPage
                      title="Reports"
                      description="Generate and view reports"
                    />
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <PlaceholderPage
                      title="Settings"
                      description="Configure your platform settings"
                    />
                  }
                />
                <Route
                  path="/help"
                  element={
                    <PlaceholderPage
                      title="Help Center"
                      description="Get help and support"
                    />
                  }
                />
              </Routes>
            </DashboardLayout>
          }
        />
      </Routes>
    </React.Suspense>
  );
}

// Placeholder component for routes that don't have content yet
function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mb-6">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500" />
      </div>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground text-center max-w-md">{description}</p>
      <p className="text-sm text-muted-foreground mt-4">
        This page is under construction
      </p>
    </div>
  );
}

export default App;
