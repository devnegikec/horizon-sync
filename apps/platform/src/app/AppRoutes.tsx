import * as React from 'react';

import { Route, Routes } from 'react-router-dom';

import { DashboardLayout, DashboardHome, AuthGuard, PublicRoute } from './components';
import { PlaceholderPage } from './components/PlaceholderPage';
import { RegisterPage, LoginPage, UserManagementPage, SubscriptionManagementPage, ForgotPasswordPage, ResetPasswordPage, OnBoarding } from './pages';

const Inventory = React.lazy(() => import('inventory/Module'));

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<PublicRouteWrapper element={<LoginPage />} />} />
      <Route path="/register" element={<PublicRouteWrapper element={<RegisterPage />} />} />
      <Route path="/forgot-password" element={<PublicRouteWrapper element={<ForgotPasswordPage />} />} />
      <Route path="/reset-password" element={<PublicRouteWrapper element={<ResetPasswordPage />} />} />
      <Route
        path="/onboarding"
        element={
          <AuthGuard>
            <OnBoarding />
          </AuthGuard>
        }
      />

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
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/subscriptions" element={<SubscriptionManagementPage />} />
          <Route path="/analytics" element={<AnalyticsPlaceholder />} />
          <Route path="/users" element={<UserManagementPage />} />
          <Route path="/reports" element={<ReportsPlaceholder />} />
          <Route path="/settings" element={<SettingsPlaceholder />} />
          <Route path="/help" element={<HelpPlaceholder />} />
        </Routes>
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
