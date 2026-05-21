import * as React from 'react';

import { Route, Routes } from 'react-router-dom';

import { DashboardLayout, DashboardHome, AuthGuard, PublicRoute } from './components';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PermissionGuard } from './components/PermissionGuard';
import { PlaceholderPage } from './components/PlaceholderPage';
import BankingRoutes from './features/banking/BankingRoutes';
import { RegisterPage, LoginPage, AcceptInvitationPage, UserManagementPage, SubscriptionManagementPage, ForgotPasswordPage, ResetPasswordPage, OnBoarding, ProfilePage, RoleManagementPage, SettingsPage } from './pages';
import { PublicQRValidation } from './pages/PublicQRValidation';
import { AppLoading } from './components/AppLoading';

const Inventory = React.lazy(() => import('inventory/Module'));
const RevenuePage = React.lazy(() => import('inventory/RevenuePage'));
const SourcingPage = React.lazy(() => import('inventory/SourcingPage'));
const BooksPage = React.lazy(() => import('inventory/BooksPage'));
const TaxChargesPage = React.lazy(() => import('inventory/TaxChargesPage'));
const PaymentsPage = React.lazy(() => import('inventory/PaymentsPage'));
const QSealPage = React.lazy(() => import('inventory/QSealPage'));
const WMSPage = React.lazy(() => import('inventory/WMSPage'));

export function AppRoutes() {
  return (
    <Routes>
      {/* Public QR verification - no auth required, local component */}
      <Route path="/g/:gtin/s/:serial/:timestamp" element={<PublicQRValidation />} />

      {/* Public routes */}
      <Route path="/login" element={<PublicRouteWrapper element={<LoginPage />} />} />
      <Route path="/register" element={<PublicRouteWrapper element={<RegisterPage />} />} />
      <Route path="/accept-invitation" element={<PublicRouteWrapper element={<AcceptInvitationPage />} />} />
      <Route path="/forgot-password" element={<PublicRouteWrapper element={<ForgotPasswordPage />} />} />
      <Route path="/reset-password" element={<PublicRouteWrapper element={<ResetPasswordPage />} />} />
      <Route path="/onboarding"
        element={
          <AuthGuard>
            <OnBoarding />
          </AuthGuard>
        } />

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
          {/* Always accessible to authenticated users */}
          <Route path="/" element={<React.Suspense fallback={<AppLoading message="Loading dashboard..." />}><DashboardHome /></React.Suspense>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/help" element={<HelpPlaceholder />} />

          {/* Identity management */}
          <Route path="/users" element={
            <PermissionGuard required={['user.read', 'user.manage', 'user.*', '*.*']}>
              <UserManagementPage />
            </PermissionGuard>
          } />
          <Route path="/roles" element={
            <PermissionGuard required={['role.read', 'role.manage', 'role.*', '*.*']}>
              <RoleManagementPage />
            </PermissionGuard>
          } />

          {/* Sales & Orders */}
          <Route path="/revenue" element={
            <PermissionGuard required={['invoice.read', 'sales_order.read', 'invoice.*', 'sales_order.*', '*.*']}>
              <React.Suspense fallback={<AppLoading message="Loading revenue..." />}><RevenuePage /></React.Suspense>
            </PermissionGuard>
          } />

          {/* Procurement */}
          <Route path="/sourcing" element={
            <PermissionGuard required={['purchase_order.read', 'supplier.read', 'purchase_order.*', 'supplier.*', '*.*']}>
              <SourcingPage />
            </PermissionGuard>
          } />

          {/* Inventory */}
          <Route path="/inventory" element={
            <PermissionGuard required={['item.read', 'item.*', '*.*']}>
              <React.Suspense fallback={<AppLoading message="Loading inventory..." />}><Inventory /></React.Suspense>
            </PermissionGuard>
          } />
          <Route path="/wms" element={
            <PermissionGuard required={['warehouse.read', 'stock_entry.read', 'warehouse.*', '*.*']}>
              <React.Suspense fallback={<AppLoading message="Loading WMS..." />}><WMSPage /></React.Suspense>
            </PermissionGuard>
          } />

          {/* Accounting */}
          <Route path="/books" element={
            <PermissionGuard required={['chart_of_account.read', 'chart_of_account.*', '*.*']}>
              <BooksPage />
            </PermissionGuard>
          } />
          <Route path="/payments" element={
            <PermissionGuard required={['payment.read', 'payment.*', '*.*']}>
              <PaymentsPage />
            </PermissionGuard>
          } />
          <Route path="/tax-charges" element={
            <PermissionGuard required={['chart_of_account.read', 'chart_of_account.*', '*.*']}>
              <React.Suspense fallback={<AppLoading message="Loading tax & charges..." />}><TaxChargesPage /></React.Suspense>
            </PermissionGuard>
          } />

          {/* Subscriptions & Settings — accessible to org admins / owners */}
          <Route path="/subscriptions" element={
            <PermissionGuard required={['subscription.read', 'subscription.*', 'org.read', 'org.*', '*.*']}>
              <SubscriptionManagementPage />
            </PermissionGuard>
          } />
          <Route path="/settings/*" element={
            <PermissionGuard required={['org.read', 'org.*', '*.*']}>
              <SettingsPage />
            </PermissionGuard>
          } />

          {/* QSeal — accessible to all authenticated users (public product verification) */}
          <Route path="/qseal" element={<React.Suspense fallback={<AppLoading message="Loading QSeal..." />}><QSealPage /></React.Suspense>} />

          {/* Analytics & Reports */}
          <Route path="/analytics" element={
            <PermissionGuard required={['report.read', 'analytics.read', '*.*']}>
              <AnalyticsPlaceholder />
            </PermissionGuard>
          } />
          <Route path="/reports" element={
            <PermissionGuard required={['report.read', 'report.*', '*.*']}>
              <ReportsPlaceholder />
            </PermissionGuard>
          } />
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

function HelpPlaceholder() {
  return <PlaceholderPage title="Help Center" description="Get help and support" />;
}
