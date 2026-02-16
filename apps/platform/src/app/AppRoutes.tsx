import * as React from 'react';

import { Route, Routes } from 'react-router-dom';

import { DashboardLayout, DashboardHome, AuthGuard, PublicRoute } from './components';
import { PlaceholderPage } from './components/PlaceholderPage';
import { RegisterPage, LoginPage, UserManagementPage, SubscriptionManagementPage, ForgotPasswordPage, ResetPasswordPage, OnBoarding, ProfilePage, RoleManagementPage } from './pages';
import { ErrorBoundary } from './components/ErrorBoundary';

const Inventory = React.lazy(() => 
  import('inventory/Module').catch((err) => {
    console.error('Failed to load Inventory module:', err);
    return { default: () => <ModuleLoadError moduleName="Inventory" error={err} /> };
  })
);

const RevenuePage = React.lazy(() => 
  import('inventory/RevenuePage').catch((err) => {
    console.error('Failed to load RevenuePage module:', err);
    return { default: () => <ModuleLoadError moduleName="Revenue" error={err} /> };
  })
);

const SourcingPage = React.lazy(() => 
  import('inventory/SourcingPage').catch((err) => {
    console.error('Failed to load SourcingPage module:', err);
    return { default: () => <ModuleLoadError moduleName="Sourcing" error={err} /> };
  })
);

const BooksPage = React.lazy(() => 
  import('inventory/BooksPage').catch((err) => {
    console.error('Failed to load BooksPage module:', err);
    return { default: () => <ModuleLoadError moduleName="Books" error={err} /> };
  })
);

function ModuleLoadError({ moduleName, error }: { moduleName: string; error: any }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Failed to load {moduleName} module
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          The {moduleName} module could not be loaded. This might be because the inventory service is not running.
        </p>
        <details className="text-left">
          <summary className="cursor-pointer text-sm text-gray-700 hover:text-gray-900">
            Error details
          </summary>
          <pre className="mt-2 p-3 bg-gray-50 rounded text-xs text-red-600 overflow-auto">
            {error?.message || String(error)}
          </pre>
        </details>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRouteWrapper element={<LoginPage />} />} />
      <Route path="/register" element={<PublicRouteWrapper element={<RegisterPage />} />} />
      <Route path="/forgot-password" element={<PublicRouteWrapper element={<ForgotPasswordPage />} />} />
      <Route path="/reset-password" element={<PublicRouteWrapper element={<ResetPasswordPage />} />} />
      <Route path="/onboarding"
        element={
          <AuthGuard>
            <OnBoarding />
          </AuthGuard>
        }/>

      {/* Protected routes */}
      <Route path="/*" element={<ProtectedRouteWrapper />} />
    </Routes>
  );
}

function PublicRouteWrapper({ element }: { element: React.ReactNode }) {
  return <PublicRoute>{element}</PublicRoute>;
}

function ProtectedRouteWrapper() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/revenue" element={<RevenuePage />} />
            <Route path="/sourcing" element={<SourcingPage />} />
            <Route path="/books" element={<BooksPage />} />
            <Route path="/subscriptions" element={<SubscriptionManagementPage />} />
            <Route path="/analytics" element={<AnalyticsPlaceholder />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="/roles" element={<RoleManagementPage />} />
            <Route path="/reports" element={<ReportsPlaceholder />} />
            <Route path="/settings" element={<SettingsPlaceholder />} />
            <Route path="/help" element={<HelpPlaceholder />} />
          </Routes>
        </ErrorBoundary>
      </DashboardLayout>
    </AuthGuard>
  );
}

function AnalyticsPlaceholder() {
  return <PlaceholderPage title="Analytics" description="View detailed analytics and insights" />;
}

function ReportsPlaceholder() {
  return <PlaceholderPage title="Reports" description="Generate and view reports" />;
}

function SettingsPlaceholder() {
  return <PlaceholderPage title="Settings" description="Configure your platform settings" />;
}

function HelpPlaceholder() {
  return <PlaceholderPage title="Help Center" description="Get help and support" />;
}
